// NEURABOT Core Native Modules
// High-performance Rust bindings for Node.js via napi-rs

use napi_derive::napi;

// Priority calculation module
mod priority;
pub use priority::calculate_priority;

// Secret detection module
mod secrets;
pub use secrets::detect_secrets;

// MIME detection module
mod mime;
pub use mime::{detect_mime, get_file_extension, is_audio_file_name};

// Media parsing module
mod media_parse;
pub use media_parse::split_media_from_output;

// Self-modify checklist module
mod checklist;
pub use checklist::{check_boundary, check_syntax, compute_diff_ratio};

/// Initialize the native module
#[napi::module_init]
fn init() {
    // Module initialization code if needed
}

/// Test function to verify the module loads correctly
#[napi]
pub fn hello() -> String {
    "Hello from NEURABOT core-native!".to_string()
}

/// Get module version
#[napi]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
