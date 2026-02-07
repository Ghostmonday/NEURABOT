//! NEURABOT Watchdog - Standalone process monitor
//! Monitors the Node.js gateway process and restarts it if it crashes

use clap::Parser;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::{Duration, Instant};
use tracing::{error, info, warn};

#[derive(Parser, Debug)]
#[command(name = "neurabot-watchdog")]
#[command(author = "NEURABOT")]
#[command(version = "0.1.0")]
#[command(about = "NEURABOT standalone watchdog process monitor")]
struct Args {
    /// Path to the Node.js gateway executable
    #[arg(short, long, default_value = "dist/gateway.js")]
    executable: PathBuf,

    /// Heartbeat URL to ping
    #[arg(long)]
    heartbeat_url: Option<String>,

    /// Heartbeat interval in seconds
    #[arg(long, default_value = "30")]
    heartbeat_interval: u64,

    /// Watch directory for file changes
    #[arg(long)]
    watch_dir: Option<PathBuf>,

    /// Restart on file changes
    #[arg(long, default_value = "false")]
    restart_on_change: bool,

    /// Maximum restarts per minute (safety throttle)
    #[arg(long, default_value = "5")]
    max_restarts_per_minute: u32,
}

struct WatchdogState {
    process: Option<std::process::Child>,
    last_restart: Instant,
    restart_count: u32,
    max_restarts: u32,
}

impl WatchdogState {
    fn new(max_restarts: u32) -> Self {
        Self {
            process: None,
            last_restart: Instant::now(),
            restart_count: 0,
            max_restarts,
        }
    }

    fn can_restart(&mut self) -> bool {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_restart);

        if elapsed > Duration::from_secs(60) {
            // Reset counter every minute
            self.restart_count = 0;
            self.last_restart = now;
        }

        self.restart_count += 1;
        self.restart_count <= self.max_restarts
    }

    fn start_process(&mut self, executable: &PathBuf) -> Result<(), String> {
        info!(?executable, "Starting gateway process");

        let child = Command::new("node")
            .arg(executable)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| format!("Failed to start process: {}", e))?;

        info!(pid = child.id(), "Gateway process started");
        self.process = Some(child);
        Ok(())
    }

    fn stop_process(&mut self) {
        if let Some(ref mut child) = self.process {
            let pid = child.id();
            info!(pid, "Stopping gateway process");

            // Send SIGTERM on unix
            #[cfg(unix)]
            {
                unsafe {
                    libc::kill(pid as i32, libc::SIGTERM);
                }
            }

            // Wait for graceful shutdown, then force kill after 5s
            match child.try_wait() {
                Ok(Some(status)) => {
                    info!(pid, ?status, "Process already exited");
                }
                _ => {
                    std::thread::sleep(Duration::from_secs(5));
                    if let Err(e) = child.kill() {
                        warn!(pid, %e, "Failed to kill process (may have already exited)");
                    }
                    let _ = child.wait();
                }
            }
            self.process = None;
            info!("Gateway process stopped");
        }
    }

    /// Check if the child process is still running.
    /// `try_wait` requires `&mut self` on `Child`, so this takes `&mut self`.
    fn is_running(&mut self) -> bool {
        match self.process {
            Some(ref mut child) => match child.try_wait() {
                Ok(Some(_status)) => {
                    // Process exited — clear the handle
                    self.process = None;
                    false
                }
                Ok(None) => true,    // still running
                Err(_) => false,     // error checking — assume dead
            },
            None => false,
        }
    }
}

async fn run_heartbeat(url: String, interval_secs: u64) {
    let client = reqwest::Client::new();
    let mut interval = tokio::time::interval(Duration::from_secs(interval_secs));

    loop {
        interval.tick().await;
        match client.get(&url).send().await {
            Ok(resp) if resp.status().is_success() => {
                info!("Heartbeat OK");
            }
            Ok(resp) => {
                warn!(status = %resp.status(), "Heartbeat returned non-success");
            }
            Err(e) => {
                error!(%e, "Heartbeat failed");
            }
        }
    }
}

fn setup_file_watcher(
    watch_dir: PathBuf,
    restart_tx: mpsc::Sender<()>,
) -> Result<RecommendedWatcher, String> {
    // notify v6: event handler closure, not channel-based
    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                info!(?event.paths, "File change detected");
                let _ = restart_tx.send(());
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(&watch_dir, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;

    Ok(watcher)
}

#[tokio::main]
async fn main() -> Result<(), String> {
    // Structured logging via tracing
    tracing_subscriber::fmt::init();

    let args = Args::parse();

    info!(?args.executable, "NEURABOT Watchdog starting");

    let mut state = WatchdogState::new(args.max_restarts_per_minute);
    let (restart_tx, restart_rx) = mpsc::channel();

    // Keep watcher alive for the duration of main — dropping it stops watching
    let _watcher = if let Some(ref watch_dir) = args.watch_dir {
        info!(?watch_dir, "Starting file watcher");
        match setup_file_watcher(watch_dir.clone(), restart_tx.clone()) {
            Ok(w) => {
                info!("File watcher started");
                Some(w)
            }
            Err(e) => {
                error!(%e, "Failed to start file watcher");
                None
            }
        }
    } else {
        None
    };

    // Start heartbeat if configured
    if let Some(ref heartbeat_url) = args.heartbeat_url {
        info!(%heartbeat_url, "Starting heartbeat");
        let url = heartbeat_url.clone();
        tokio::spawn(run_heartbeat(url, args.heartbeat_interval));
    }

    // Initial start
    if let Err(e) = state.start_process(&args.executable) {
        error!(%e, "Failed initial process start");
    }

    // Main supervision loop
    loop {
        // Check for restart signals from file watcher (non-blocking)
        if let Ok(()) = restart_rx.try_recv() {
            if args.restart_on_change {
                info!("Restarting due to file change");
                state.stop_process();
                if let Err(e) = state.start_process(&args.executable) {
                    error!(%e, "Failed to restart after file change");
                }
            }
        }

        // Check if process is still alive
        if !state.is_running() {
            warn!("Gateway process not running");
            if state.can_restart() {
                info!("Attempting restart");
                if let Err(e) = state.start_process(&args.executable) {
                    error!(%e, "Restart failed");
                }
            } else {
                warn!(
                    max = state.max_restarts,
                    "Too many restarts this minute, backing off"
                );
                tokio::time::sleep(Duration::from_secs(10)).await;
            }
        }

        // Poll interval — check every second
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}
