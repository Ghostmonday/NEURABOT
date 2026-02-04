import { LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { EventLogEntry } from "./app-events";
import type { AppViewState } from "./app-view-state";
import type { DevicePairingList } from "./controllers/devices";
import type { ExecApprovalRequest } from "./controllers/exec-approval";
import type { ExecApprovalsFile, ExecApprovalsSnapshot } from "./controllers/exec-approvals";
import type { SkillMessage } from "./controllers/skills";
import type { GatewayBrowserClient, GatewayHelloOk } from "./gateway";
import type { ResolvedTheme, ThemeMode } from "./theme";
import type {
  AgentIdentityResult,
  AgentsFilesListResult,
  AgentsListResult,
  ChannelsStatusSnapshot,
  ConfigSnapshot,
  ConfigUiHints,
  CronJob,
  CronRunLogEntry,
  CronStatus,
  HealthSnapshot,
  LogEntry,
  LogLevel,
  NostrProfile,
  PresenceEntry,
  SessionsListResult,
  SkillStatusReport,
  StatusSummary,
} from "./types";
import type { NostrProfileFormState } from "./views/channels.nostr-profile-form";
import {
  handleChannelConfigReload as handleChannelConfigReloadInternal,
  handleChannelConfigSave as handleChannelConfigSaveInternal,
  handleNostrProfileCancel as handleNostrProfileCancelInternal,
  handleNostrProfileEdit as handleNostrProfileEditInternal,
  handleNostrProfileFieldChange as handleNostrProfileFieldChangeInternal,
  handleNostrProfileImport as handleNostrProfileImportInternal,
  handleNostrProfileSave as handleNostrProfileSaveInternal,
  handleNostrProfileToggleAdvanced as handleNostrProfileToggleAdvancedInternal,
  handleWhatsAppLogout as handleWhatsAppLogoutInternal,
  handleWhatsAppStart as handleWhatsAppStartInternal,
  handleWhatsAppWait as handleWhatsAppWaitInternal,
} from "./app-channels";
import {
  handleAbortChat as handleAbortChatInternal,
  handleSendChat as handleSendChatInternal,
  removeQueuedMessage as removeQueuedMessageInternal,
} from "./app-chat";
import { DEFAULT_CRON_FORM, DEFAULT_LOG_LEVEL_FILTERS } from "./app-defaults";
import { connectGateway as connectGatewayInternal } from "./app-gateway";
import {
  handleConnected,
  handleDisconnected,
  handleFirstUpdated,
  handleUpdated,
} from "./app-lifecycle";
import { renderApp } from "./app-render";
import {
  exportLogs as exportLogsInternal,
  handleChatScroll as handleChatScrollInternal,
  handleLogsScroll as handleLogsScrollInternal,
  resetChatScroll as resetChatScrollInternal,
  scheduleChatScroll as scheduleChatScrollInternal,
} from "./app-scroll";
import {
  applySettings as applySettingsInternal,
  loadCron as loadCronInternal,
  loadOverview as loadOverviewInternal,
  onPopState as onPopStateInternal,
  setTab as setTabInternal,
  setTheme as setThemeInternal,
} from "./app-settings";
import {
  resetToolStream as resetToolStreamInternal,
  type ToolStreamEntry,
} from "./app-tool-stream";
import { resolveInjectedAssistantIdentity } from "./assistant-identity";
import { loadAgents } from "./controllers/agents";
import { loadAssistantIdentity as loadAssistantIdentityInternal } from "./controllers/assistant-identity";
import { loadChannels } from "./controllers/channels";
import { loadConfig } from "./controllers/config";
import { loadLogs } from "./controllers/logs";
import { loadSessions } from "./controllers/sessions";
import { loadSkills } from "./controllers/skills";
import { TAB_GROUPS, titleForTab, type Tab } from "./navigation";
import { loadSettings, type UiSettings } from "./storage";
import { type ChatAttachment, type ChatQueueItem, type CronFormState } from "./ui-types";

declare global {
  interface Window {
    __OPENCLAW_CONTROL_UI_BASE_PATH__?: string;
  }
}

const injectedAssistantIdentity = resolveInjectedAssistantIdentity();

function resolveOnboardingMode(): boolean {
  if (!window.location.search) {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("onboarding");
  if (!raw) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

@customElement("openclaw-app")
export class OpenClawApp extends LitElement {
  @state() settings: UiSettings = loadSettings();
  @state() password = "";
  @state() tab: Tab = "chat";
  @state() onboarding = resolveOnboardingMode();
  @state() connected = false;
  @state() connectionState: "connected" | "reconnecting" | "disconnected" = "disconnected";
  @state() theme: ThemeMode = this.settings.theme ?? "system";
  @state() themeResolved: ResolvedTheme = "dark";
  @state() hello: GatewayHelloOk | null = null;
  @state() lastError: string | null = null;
  @state() eventLog: EventLogEntry[] = [];
  @state() toasts: Array<{
    id: string;
    type: "success" | "error" | "info" | "loading";
    message: string;
    createdAt: number;
  }> = [];
  private lastErrorToastId: string | null = null;
  private errorToastDebounceTimer: number | null = null;
  private toastTimers = new Map<string, number>();
  private eventLogBuffer: EventLogEntry[] = [];
  private toolStreamSyncTimer: number | null = null;
  private sidebarCloseTimer: number | null = null;

  @state() assistantName = injectedAssistantIdentity.name;
  @state() assistantAvatar = injectedAssistantIdentity.avatar;
  @state() assistantAgentId = injectedAssistantIdentity.agentId ?? null;

  @state() sessionKey = this.settings.sessionKey;
  @state() chatLoading = false;
  @state() chatSending = false;
  @state() chatMessage = "";
  @state() chatMessages: unknown[] = [];
  @state() chatToolMessages: unknown[] = [];
  @state() chatStream: string | null = null;
  @state() chatStreamStartedAt: number | null = null;
  @state() chatRunId: string | null = null;
  @state() compactionStatus: import("./app-tool-stream").CompactionStatus | null = null;
  @state() chatAvatarUrl: string | null = null;
  @state() chatThinkingLevel: string | null = null;
  @state() chatQueue: ChatQueueItem[] = [];
  @state() chatAttachments: ChatAttachment[] = [];
  // Sidebar state for tool output viewing
  @state() sidebarOpen = false;
  @state() sidebarContent: string | null = null;
  @state() sidebarError: string | null = null;
  @state() splitRatio = this.settings.splitRatio;

  @state() nodesLoading = false;
  @state() nodes: Array<Record<string, unknown>> = [];
  @state() devicesLoading = false;
  @state() devicesError: string | null = null;
  @state() devicesList: DevicePairingList | null = null;
  @state() execApprovalsLoading = false;
  @state() execApprovalsSaving = false;
  @state() execApprovalsDirty = false;
  @state() execApprovalsSnapshot: ExecApprovalsSnapshot | null = null;
  @state() execApprovalsForm: ExecApprovalsFile | null = null;
  @state() execApprovalsSelectedAgent: string | null = null;
  @state() execApprovalsTarget: "gateway" | "node" = "gateway";
  @state() execApprovalsTargetNodeId: string | null = null;
  @state() execApprovalQueue: ExecApprovalRequest[] = [];
  @state() execApprovalBusy = false;
  @state() execApprovalError: string | null = null;
  @state() pendingGatewayUrl: string | null = null;

  @state() configLoading = false;
  @state() configRaw = "{\n}\n";
  @state() configRawOriginal = "";
  @state() configValid: boolean | null = null;
  @state() configIssues: unknown[] = [];
  @state() configSaving = false;
  @state() configApplying = false;
  @state() updateRunning = false;
  @state() applySessionKey = this.settings.lastActiveSessionKey;
  @state() configSnapshot: ConfigSnapshot | null = null;
  @state() configSchema: unknown = null;
  @state() configSchemaVersion: string | null = null;
  @state() configSchemaLoading = false;
  @state() configUiHints: ConfigUiHints = {};
  @state() configForm: Record<string, unknown> | null = null;
  @state() configFormOriginal: Record<string, unknown> | null = null;
  @state() configFormDirty = false;
  @state() configFormMode: "form" | "raw" = "form";
  @state() configSearchQuery = "";
  @state() configActiveSection: string | null = null;
  @state() configActiveSubsection: string | null = null;

  @state() channelsLoading = false;
  @state() channelsSnapshot: ChannelsStatusSnapshot | null = null;
  @state() channelsError: string | null = null;
  @state() channelsLastSuccess: number | null = null;
  @state() whatsappLoginMessage: string | null = null;
  @state() whatsappLoginQrDataUrl: string | null = null;
  @state() whatsappLoginConnected: boolean | null = null;
  @state() whatsappBusy = false;
  @state() nostrProfileFormState: NostrProfileFormState | null = null;
  @state() nostrProfileAccountId: string | null = null;

  @state() presenceLoading = false;
  @state() presenceEntries: PresenceEntry[] = [];
  @state() presenceError: string | null = null;
  @state() presenceStatus: string | null = null;

  @state() agentsLoading = false;
  @state() agentsList: AgentsListResult | null = null;
  @state() agentsError: string | null = null;
  @state() agentsSelectedId: string | null = null;
  @state() agentsPanel: "overview" | "files" | "tools" | "skills" | "channels" | "cron" =
    "overview";
  @state() agentFilesLoading = false;
  @state() agentFilesError: string | null = null;
  @state() agentFilesList: AgentsFilesListResult | null = null;
  @state() agentFileContents: Record<string, string> = {};
  @state() agentFileDrafts: Record<string, string> = {};
  @state() agentFileActive: string | null = null;
  @state() agentFileSaving = false;
  @state() agentIdentityLoading = false;
  @state() agentIdentityError: string | null = null;
  @state() agentIdentityById: Record<string, AgentIdentityResult> = {};
  @state() agentSkillsLoading = false;
  @state() agentSkillsError: string | null = null;
  @state() agentSkillsReport: SkillStatusReport | null = null;
  @state() agentSkillsAgentId: string | null = null;

  @state() sessionsLoading = false;
  @state() sessionsResult: SessionsListResult | null = null;
  @state() sessionsError: string | null = null;
  @state() sessionsFilterActive = "";
  @state() sessionsFilterLimit = "120";
  @state() sessionsFilterText = "";
  @state() sessionsIncludeGlobal = true;
  @state() sessionsIncludeUnknown = false;

  @state() cronLoading = false;
  @state() cronJobs: CronJob[] = [];
  @state() cronStatus: CronStatus | null = null;
  @state() cronError: string | null = null;
  @state() cronForm: CronFormState = { ...DEFAULT_CRON_FORM };
  @state() cronRunsJobId: string | null = null;
  @state() cronRuns: CronRunLogEntry[] = [];
  @state() cronBusy = false;

  @state() skillsLoading = false;
  @state() skillsReport: SkillStatusReport | null = null;
  @state() skillsError: string | null = null;
  @state() skillsFilter = "";
  @state() skillEdits: Record<string, string> = {};
  @state() skillsBusyKey: string | null = null;
  @state() skillMessages: Record<string, SkillMessage> = {};

  @state() debugLoading = false;
  @state() debugStatus: StatusSummary | null = null;
  @state() debugHealth: HealthSnapshot | null = null;
  @state() debugModels: unknown[] = [];
  @state() debugHeartbeat: unknown = null;
  @state() debugCallMethod = "";
  @state() debugCallParams = "{}";
  @state() debugCallResult: string | null = null;
  @state() debugCallError: string | null = null;

  @state() logsLoading = false;
  @state() logsError: string | null = null;
  @state() logsFile: string | null = null;
  @state() logsEntries: LogEntry[] = [];
  @state() logsFilterText = "";
  @state() logsLevelFilters: Record<LogLevel, boolean> = {
    ...DEFAULT_LOG_LEVEL_FILTERS,
  };
  @state() logsAutoFollow = true;
  @state() logsTruncated = false;
  @state() logsCursor: number | null = null;
  @state() logsLastFetchAt: number | null = null;
  @state() logsLimit = 500;
  @state() logsMaxBytes = 250_000;
  @state() logsAtBottom = true;

  client: GatewayBrowserClient | null = null;
  private chatScrollFrame: number | null = null;
  private chatScrollTimeout: number | null = null;
  private chatHasAutoScrolled = false;
  private chatUserNearBottom = true;
  @state() chatNewMessagesBelow = false;
  private nodesPollInterval: number | null = null;
  private logsPollInterval: number | null = null;
  private debugPollInterval: number | null = null;
  private logsScrollFrame: number | null = null;
  private toolStreamById = new Map<string, ToolStreamEntry>();
  private toolStreamOrder: string[] = [];
  refreshSessionsAfterChat = new Set<string>();
  basePath = "";
  private popStateHandler = () =>
    onPopStateInternal(this as unknown as Parameters<typeof onPopStateInternal>[0]);
  private themeMedia: MediaQueryList | null = null;
  private themeMediaHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private topbarObserver: ResizeObserver | null = null;
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  @state() shortcutsHelpOpen = false;
  @state() commandPaletteOpen = false;
  @state() commandPaletteQuery = "";

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    handleConnected(this as unknown as Parameters<typeof handleConnected>[0]);
    this.setupKeyboardShortcuts();
  }

  protected firstUpdated() {
    handleFirstUpdated(this as unknown as Parameters<typeof handleFirstUpdated>[0]);
  }

  disconnectedCallback() {
    this.teardownKeyboardShortcuts();
    handleDisconnected(this as unknown as Parameters<typeof handleDisconnected>[0]);
    super.disconnectedCallback();
  }

  protected updated(changed: Map<PropertyKey, unknown>) {
    handleUpdated(this as unknown as Parameters<typeof handleUpdated>[0], changed);

    // Show toast when lastError changes (debounced)
    if (changed.has("lastError")) {
      const newError = this.lastError;
      if (newError && newError !== this.lastErrorToastId) {
        if (this.errorToastDebounceTimer !== null) {
          window.clearTimeout(this.errorToastDebounceTimer);
        }
        this.errorToastDebounceTimer = window.setTimeout(() => {
          this.lastErrorToastId = newError;
          this.showToast("error", newError);
          this.errorToastDebounceTimer = null;
        }, 300);
      } else if (!newError) {
        this.lastErrorToastId = null;
        if (this.errorToastDebounceTimer !== null) {
          window.clearTimeout(this.errorToastDebounceTimer);
          this.errorToastDebounceTimer = null;
        }
      }
    }
  }

  connect() {
    connectGatewayInternal(this as unknown as Parameters<typeof connectGatewayInternal>[0]);
  }

  handleChatScroll(event: Event) {
    handleChatScrollInternal(
      this as unknown as Parameters<typeof handleChatScrollInternal>[0],
      event,
    );
  }

  handleLogsScroll(event: Event) {
    handleLogsScrollInternal(
      this as unknown as Parameters<typeof handleLogsScrollInternal>[0],
      event,
    );
  }

  exportLogs(lines: string[], label: string) {
    exportLogsInternal(lines, label);
  }

  resetToolStream() {
    resetToolStreamInternal(this as unknown as Parameters<typeof resetToolStreamInternal>[0]);
  }

  resetChatScroll() {
    resetChatScrollInternal(this as unknown as Parameters<typeof resetChatScrollInternal>[0]);
  }

  scrollToBottom() {
    resetChatScrollInternal(this as unknown as Parameters<typeof resetChatScrollInternal>[0]);
    scheduleChatScrollInternal(
      this as unknown as Parameters<typeof scheduleChatScrollInternal>[0],
      true,
    );
  }

  async loadAssistantIdentity() {
    await loadAssistantIdentityInternal(this);
  }

  applySettings(next: UiSettings) {
    applySettingsInternal(this as unknown as Parameters<typeof applySettingsInternal>[0], next);
  }

  setTab(next: Tab) {
    setTabInternal(this as unknown as Parameters<typeof setTabInternal>[0], next);
  }

  setTheme(next: ThemeMode, context?: Parameters<typeof setThemeInternal>[2]) {
    setThemeInternal(this as unknown as Parameters<typeof setThemeInternal>[0], next, context);
  }

  async loadOverview() {
    await loadOverviewInternal(this as unknown as Parameters<typeof loadOverviewInternal>[0]);
  }

  async loadCron() {
    await loadCronInternal(this as unknown as Parameters<typeof loadCronInternal>[0]);
  }

  async handleAbortChat() {
    await handleAbortChatInternal(this as unknown as Parameters<typeof handleAbortChatInternal>[0]);
  }

  removeQueuedMessage(id: string) {
    removeQueuedMessageInternal(
      this as unknown as Parameters<typeof removeQueuedMessageInternal>[0],
      id,
    );
  }

  async handleSendChat(
    messageOverride?: string,
    opts?: Parameters<typeof handleSendChatInternal>[2],
  ) {
    await handleSendChatInternal(
      this as unknown as Parameters<typeof handleSendChatInternal>[0],
      messageOverride,
      opts,
    );
  }

  async handleWhatsAppStart(force: boolean) {
    await handleWhatsAppStartInternal(this, force);
  }

  async handleWhatsAppWait() {
    await handleWhatsAppWaitInternal(this);
  }

  async handleWhatsAppLogout() {
    await handleWhatsAppLogoutInternal(this);
  }

  async handleChannelConfigSave() {
    await handleChannelConfigSaveInternal(this);
  }

  async handleChannelConfigReload() {
    await handleChannelConfigReloadInternal(this);
  }

  handleNostrProfileEdit(accountId: string, profile: NostrProfile | null) {
    handleNostrProfileEditInternal(this, accountId, profile);
  }

  handleNostrProfileCancel() {
    handleNostrProfileCancelInternal(this);
  }

  handleNostrProfileFieldChange(field: keyof NostrProfile, value: string) {
    handleNostrProfileFieldChangeInternal(this, field, value);
  }

  async handleNostrProfileSave() {
    await handleNostrProfileSaveInternal(this);
  }

  async handleNostrProfileImport() {
    await handleNostrProfileImportInternal(this);
  }

  handleNostrProfileToggleAdvanced() {
    handleNostrProfileToggleAdvancedInternal(this);
  }

  async handleExecApprovalDecision(decision: "allow-once" | "allow-always" | "deny") {
    const active = this.execApprovalQueue[0];
    if (!active || !this.client || this.execApprovalBusy) {
      return;
    }
    this.execApprovalBusy = true;
    this.execApprovalError = null;
    try {
      await this.client.request("exec.approval.resolve", {
        id: active.id,
        decision,
      });
      this.execApprovalQueue = this.execApprovalQueue.filter((entry) => entry.id !== active.id);
    } catch (err) {
      this.execApprovalError = `Exec approval failed: ${String(err)}`;
    } finally {
      this.execApprovalBusy = false;
    }
  }

  handleGatewayUrlConfirm() {
    const nextGatewayUrl = this.pendingGatewayUrl;
    if (!nextGatewayUrl) {
      return;
    }
    this.pendingGatewayUrl = null;
    applySettingsInternal(this as unknown as Parameters<typeof applySettingsInternal>[0], {
      ...this.settings,
      gatewayUrl: nextGatewayUrl,
    });
    this.connect();
  }

  handleGatewayUrlCancel() {
    this.pendingGatewayUrl = null;
  }

  // Sidebar handlers for tool output viewing
  handleOpenSidebar(content: string) {
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
      this.sidebarCloseTimer = null;
    }
    this.sidebarContent = content;
    this.sidebarError = null;
    this.sidebarOpen = true;
  }

  handleCloseSidebar() {
    this.sidebarOpen = false;
    // Clear content after transition
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
    }
    this.sidebarCloseTimer = window.setTimeout(() => {
      if (this.sidebarOpen) {
        return;
      }
      this.sidebarContent = null;
      this.sidebarError = null;
      this.sidebarCloseTimer = null;
    }, 200);
  }

  handleSplitRatioChange(ratio: number) {
    const newRatio = Math.max(0.4, Math.min(0.7, ratio));
    this.splitRatio = newRatio;
    this.applySettings({ ...this.settings, splitRatio: newRatio });
  }

  showToast(type: "success" | "error" | "info" | "loading", message: string) {
    const id = generateUUID();
    const createdAt = Date.now();
    this.toasts = [...this.toasts.slice(-2), { id, type, message, createdAt }]; // Max 3 visible

    // Auto-dismiss timers
    if (type === "success") {
      const timer = window.setTimeout(() => this.dismissToast(id), 5000);
      this.toastTimers.set(id, timer);
    } else if (type === "error") {
      const timer = window.setTimeout(() => this.dismissToast(id), 8000);
      this.toastTimers.set(id, timer);
    }
    // loading and info are indefinite (no auto-dismiss)
  }

  dismissToast(id: string) {
    const timer = this.toastTimers.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      this.toastTimers.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private setupKeyboardShortcuts() {
    this.keyboardHandler = (e: KeyboardEvent) => {
      // Ignore if focus is in text input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Alt+1..9: Switch to tab by index
      if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const allTabs: Tab[] = [];
          for (const group of TAB_GROUPS) {
            allTabs.push(...group.tabs);
          }
          const tabIndex = num - 1;
          if (tabIndex < allTabs.length) {
            this.setTab(allTabs[tabIndex]);
          }
          return;
        }
      }

      // Ctrl+[/Ctrl+]: Previous/next tab
      if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        if (e.key === "[" || e.key === "]") {
          e.preventDefault();
          const allTabs: Tab[] = [];
          for (const group of TAB_GROUPS) {
            allTabs.push(...group.tabs);
          }
          const currentIndex = allTabs.indexOf(this.tab);
          if (currentIndex === -1) {
            return;
          }
          const direction = e.key === "[" ? -1 : 1;
          const nextIndex = (currentIndex + direction + allTabs.length) % allTabs.length;
          this.setTab(allTabs[nextIndex]);
          return;
        }
      }

      // r: Refresh current view
      if (e.key === "r" && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        if (this.tab === "overview") {
          void this.loadOverview();
        } else if (this.tab === "channels") {
          void loadChannels(this as unknown as Parameters<typeof loadChannels>[0], false);
        } else if (this.tab === "sessions") {
          void loadSessions(this as unknown as Parameters<typeof loadSessions>[0]);
        } else if (this.tab === "logs") {
          void loadLogs(this as unknown as Parameters<typeof loadLogs>[0]);
        } else if (this.tab === "skills") {
          void loadSkills(this as unknown as Parameters<typeof loadSkills>[0]);
        } else if (this.tab === "agents") {
          void loadAgents(this as unknown as Parameters<typeof loadAgents>[0]);
        } else if (this.tab === "config") {
          void loadConfig(this as unknown as Parameters<typeof loadConfig>[0]);
        }
        return;
      }

      // Cmd/Ctrl+Shift+K: Open command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key === "K") {
        e.preventDefault();
        this.commandPaletteOpen = true;
        this.commandPaletteQuery = "";
        // Focus will be handled in render
        return;
      }

      // Esc: Close sidebar/modals/help/palette
      if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        if (this.commandPaletteOpen) {
          e.preventDefault();
          this.commandPaletteOpen = false;
          this.commandPaletteQuery = "";
          if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
          }
          return;
        }
        if (this.shortcutsHelpOpen) {
          e.preventDefault();
          this.shortcutsHelpOpen = false;
          if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
          }
          return;
        }
        if (this.sidebarOpen) {
          e.preventDefault();
          this.handleCloseSidebar();
          return;
        }
        return;
      }

      // Ctrl+/ or Ctrl+Shift+F: Focus search field
      if (
        (e.ctrlKey && !e.altKey && !e.metaKey && e.key === "/") ||
        (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && e.key === "F")
      ) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="Filter"]',
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Shift+/: Show shortcuts help
      if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && e.key === "/") {
        e.preventDefault();
        if (!this.shortcutsHelpOpen) {
          this.lastFocusedElement = document.activeElement as HTMLElement;
        }
        this.shortcutsHelpOpen = !this.shortcutsHelpOpen;
        return;
      }
    };
    document.addEventListener("keydown", this.keyboardHandler);
  }

  private teardownKeyboardShortcuts() {
    if (this.keyboardHandler) {
      document.removeEventListener("keydown", this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  getCommandPaletteCommands(): Array<{
    id: string;
    label: string;
    keywords: string[];
    action: () => void;
  }> {
    const allTabs: Tab[] = [];
    for (const group of TAB_GROUPS) {
      allTabs.push(...group.tabs);
    }

    const commands: Array<{ id: string; label: string; keywords: string[]; action: () => void }> =
      [];

    // Tab navigation
    for (const tab of allTabs) {
      commands.push({
        id: `tab-${tab}`,
        label: `Go to ${titleForTab(tab)}`,
        keywords: [tab, titleForTab(tab).toLowerCase()],
        action: () => {
          this.setTab(tab);
          this.commandPaletteOpen = false;
        },
      });
    }

    // Refresh current view
    commands.push({
      id: "refresh",
      label: "Refresh current view",
      keywords: ["refresh", "reload"],
      action: () => {
        if (this.tab === "overview") {
          void this.loadOverview();
        } else if (this.tab === "channels") {
          void loadChannels(this as unknown as Parameters<typeof loadChannels>[0], false);
        } else if (this.tab === "sessions") {
          void loadSessions(this as unknown as Parameters<typeof loadSessions>[0]);
        } else if (this.tab === "logs") {
          void loadLogs(this as unknown as Parameters<typeof loadLogs>[0]);
        } else if (this.tab === "skills") {
          void loadSkills(this as unknown as Parameters<typeof loadSkills>[0]);
        } else if (this.tab === "agents") {
          void loadAgents(this as unknown as Parameters<typeof loadAgents>[0]);
        } else if (this.tab === "config") {
          void loadConfig(this as unknown as Parameters<typeof loadConfig>[0]);
        }
        this.commandPaletteOpen = false;
      },
    });

    // Toggle theme
    commands.push({
      id: "toggle-theme",
      label: `Switch to ${this.themeResolved === "dark" ? "light" : "dark"} theme`,
      keywords: ["theme", "dark", "light", "toggle"],
      action: () => {
        this.setTheme(this.themeResolved === "dark" ? "light" : "dark");
        this.commandPaletteOpen = false;
      },
    });

    // Toggle focus mode
    commands.push({
      id: "toggle-focus",
      label: `${this.settings.chatFocusMode ? "Disable" : "Enable"} focus mode`,
      keywords: ["focus", "mode"],
      action: () => {
        this.applySettings({
          ...this.settings,
          chatFocusMode: !this.settings.chatFocusMode,
        });
        this.commandPaletteOpen = false;
      },
    });

    // New session (if in chat)
    if (this.tab === "chat") {
      commands.push({
        id: "new-session",
        label: "New chat session",
        keywords: ["new", "session", "chat"],
        action: () => {
          this.sessionKey = `session-${Date.now()}`;
          this.chatMessage = "";
          this.resetToolStream();
          this.applySettings({
            ...this.settings,
            sessionKey: this.sessionKey,
            lastActiveSessionKey: this.sessionKey,
          });
          void this.loadAssistantIdentity();
          this.commandPaletteOpen = false;
        },
      });
    }

    return commands;
  }

  render() {
    return renderApp(this as unknown as AppViewState);
  }
}
