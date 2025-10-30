import {
  Inviter,
  Registerer,
  RegistererState,
  Session,
  SessionState,
  TransportError,
  URI,
  UserAgent,
  UserAgentDelegate,
  UserAgentOptions
} from "sip.js";
import { TinyEmitter } from "tiny-emitter";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type CallState =
  | "idle"
  | "registering"
  | "connecting"
  | "ringing"
  | "connected"
  | "ended"
  | "error";

export interface SipClientConfig {
  domain: string;
  wssServer: string;
  username: string;
  password: string;
  targetUri: string;
  /**
   * ICE server entries passed to the underlying RTCPeerConnection.
   */
  iceServers: RTCIceServer[];
  /**
   * Default language used in the X-Lang header.
   */
  defaultLanguage: string;
  fallbackLanguage: string;
  /**
   * Maximum number of registration retry attempts before giving up.
   * Defaults to 5 attempts.
   */
  maxRegisterRetries?: number;
  /**
   * Optional metrics reporter invoked with every metrics payload.
   */
  onMetrics?: (metrics: MetricsEvent) => void | Promise<void>;
  /**
   * Optional log sink invoked for every log event emitted by the client.
   */
  onLog?: (entry: LogEvent) => void;
  /**
   * Optional additional SIP headers appended to the INVITE request.
   */
  extraHeaders?: string[];
}

export interface RegistrationEvent {
  state: "registering" | "registered" | "unregistered" | "failed";
  attempt?: number;
  reason?: string;
}

export interface CallStateEvent {
  state: CallState;
  reason?: string;
  causeCode?: number;
  callId?: string;
}

export interface MetricsEvent {
  ts: number;
  callId?: string;
  /** Current ICE connection state as reported by RTCPeerConnection. */
  iceState?: RTCPeerConnectionState;
  /** Selected candidate pair RTT in milliseconds (when available). */
  rttMs?: number;
  /** Audio bytes sent/received for the active stream. */
  bytesSent?: number;
  bytesReceived?: number;
  /** Active preferred language for the call. */
  language?: string;
}

export interface IceEvent {
  state: RTCPeerConnectionState;
}

export interface LogEvent {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface DtmfEvent {
  tone: string;
}

export interface ReconnectEvent {
  attempt: number;
  delayMs: number;
}

export interface LanguageChangeEvent {
  language: string;
}

type EventMap = {
  registration: RegistrationEvent;
  call: CallStateEvent;
  metrics: MetricsEvent;
  log: LogEvent;
  ice: IceEvent;
  dtmf: DtmfEvent;
  reconnecting: ReconnectEvent;
  language: LanguageChangeEvent;
};

class TypedEmitter<TEvents extends Record<string, unknown>> {
  private emitter = new TinyEmitter();

  on<TKey extends keyof TEvents>(event: TKey, handler: (payload: TEvents[TKey]) => void) {
    this.emitter.on(event as string, handler as any);
  }

  once<TKey extends keyof TEvents>(event: TKey, handler: (payload: TEvents[TKey]) => void) {
    this.emitter.once(event as string, handler as any);
  }

  off<TKey extends keyof TEvents>(event: TKey, handler: (payload: TEvents[TKey]) => void) {
    this.emitter.off(event as string, handler as any);
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]) {
    this.emitter.emit(event as string, payload);
  }
}

const DEFAULT_MAX_REGISTER_RETRIES = 5;

interface SessionWithPeer extends Session {
  sessionDescriptionHandler?: {
    peerConnection?: RTCPeerConnection;
  };
}

export class CodexSipClient {
  private readonly emitter = new TypedEmitter<EventMap>();
  private readonly config: SipClientConfig;
  private readonly userAgentOptions: UserAgentOptions;
  private readonly languageHeader = "X-Lang";

  private userAgent?: UserAgent;
  private registerer?: Registerer;
  private currentSession?: SessionWithPeer;
  private remoteAudio?: HTMLAudioElement;

  private currentState: CallState = "idle";
  private preferredLanguage: string;
  private registerAttempt = 0;
  private registerRetryTimer?: ReturnType<typeof setTimeout>;
  private registerBackoffMs = 1_000;
  private metricsTimer?: ReturnType<typeof setInterval>;
  private activeCallId?: string;
  private muted = false;
  private speakerMuted = false;

  constructor(config: SipClientConfig) {
    this.config = config;
    this.preferredLanguage = config.defaultLanguage;
    this.userAgentOptions = this.createUserAgentOptions(config);

    if (config.onLog) {
      this.on("log", config.onLog);
    }
    if (config.onMetrics) {
      this.on("metrics", config.onMetrics);
    }
  }

  on<TKey extends keyof EventMap>(event: TKey, handler: (payload: EventMap[TKey]) => void) {
    this.emitter.on(event, handler);
  }

  off<TKey extends keyof EventMap>(event: TKey, handler: (payload: EventMap[TKey]) => void) {
    this.emitter.off(event, handler);
  }

  once<TKey extends keyof EventMap>(event: TKey, handler: (payload: EventMap[TKey]) => void) {
    this.emitter.once(event, handler);
  }

  get state(): CallState {
    return this.currentState;
  }

  get language(): string {
    return this.preferredLanguage;
  }

  setLanguage(language: string) {
    this.preferredLanguage = language || this.config.defaultLanguage;
    this.emit("language", { language: this.preferredLanguage });
  }

  setRemoteAudioElement(element: HTMLAudioElement) {
    this.remoteAudio = element;
    if (this.currentSession) {
      this.attachRemoteAudio(this.currentSession);
    }
  }

  async register(): Promise<void> {
    const ua = await this.ensureUserAgent();
    if (!this.registerer) {
      this.registerer = new Registerer(ua);
      this.registerer.stateChange.addListener((state) => {
        this.handleRegistererStateChange(state);
      });
    }

    this.clearRegisterTimer();
    this.registerAttempt += 1;
    this.emit("registration", { state: "registering", attempt: this.registerAttempt });
    this.setState("registering");

    try {
      await ua.start();
      await this.registerer.register();
    } catch (error) {
      this.emit("registration", {
        state: "failed",
        attempt: this.registerAttempt,
        reason: error instanceof Error ? error.message : "registration failed",
      });
      this.emit("log", {
        level: "error",
        message: "SIP registration failed",
        context: { attempt: this.registerAttempt },
        error: error instanceof Error ? error : new Error(String(error)),
      });
      this.scheduleRegisterRetry();
      throw error;
    }
  }

  async unregister() {
    this.clearRegisterTimer();
    if (this.registerer) {
      try {
        await this.registerer.unregister();
      } catch (error) {
        this.emit("log", {
          level: "warn",
          message: "Failed to unregister",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
    if (this.userAgent) {
      await this.userAgent.stop();
    }
    this.registerAttempt = 0;
    this.setState("idle");
    this.emit("registration", { state: "unregistered" });
  }

  async startCall(options?: { language?: string; extraHeaders?: string[]; targetUri?: string }) {
    const lang = options?.language || this.preferredLanguage || this.config.defaultLanguage;
    this.preferredLanguage = lang;
    this.emit("language", { language: this.preferredLanguage });

    const ua = await this.ensureUserAgent();
    if (!ua.isConnected()) {
      await ua.start();
    }

    if (!this.registerer) {
      await this.register();
    }

    const target = this.resolveTargetUri(options?.targetUri || this.config.targetUri);
    if (!target) {
      throw new Error("Unable to parse target SIP URI");
    }

    const inviteHeaders = [...(this.config.extraHeaders || [])];
    inviteHeaders.push(`${this.languageHeader}: ${lang}`);
    if (options?.extraHeaders) {
      inviteHeaders.push(...options.extraHeaders);
    }

    const inviter = new Inviter(ua, target, {
      earlyMedia: true,
      extraHeaders: inviteHeaders,
      sessionDescriptionHandlerOptions: this.buildSessionDescriptionHandlerOptions(),
    });

    this.currentSession = inviter as SessionWithPeer;
    this.currentSession.stateChange.addListener((state) => this.handleSessionStateChange(state));
    this.hookSessionDelegates(this.currentSession);
    this.setState("connecting");
    this.emit("log", { level: "info", message: "Outbound INVITE sent", context: { target: target.toString() } });

    try {
      const response = await inviter.invite();
      this.activeCallId = inviter.request.callId;
      if (response && "statusCode" in response && response.statusCode === 180) {
        this.setState("ringing");
      }
    } catch (error) {
      this.setState("error", error instanceof Error ? error.message : "INVITE failed");
      this.emit("log", {
        level: "error",
        message: "INVITE failed",
        context: { target: target.toString() },
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  async hangup(reason?: string) {
    if (this.currentSession) {
      try {
        await this.currentSession.bye();
      } catch (error) {
        this.emit("log", {
          level: "warn",
          message: "Error sending BYE",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
    this.terminateSession(reason || "hangup");
  }

  async mute() {
    this.muted = true;
    this.applyMuteState();
  }

  async unmute() {
    this.muted = false;
    this.applyMuteState();
  }

  setSpeakerMuted(muted: boolean) {
    this.speakerMuted = muted;
    if (this.remoteAudio) {
      this.remoteAudio.muted = muted;
    }
  }

  async sendDtmf(tone: string) {
    if (!this.currentSession) {
      throw new Error("No active session to send DTMF");
    }
    const body = `Signal=${tone}\r\nDuration=160`;
    try {
      await this.currentSession.info({
        requestOptions: {
          body,
          extraHeaders: ["Content-Type: application/dtmf-relay"],
        },
      });
      this.emit("dtmf", { tone });
    } catch (error) {
      this.emit("log", {
        level: "warn",
        message: "Failed to send DTMF",
        context: { tone },
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  destroy() {
    this.clearMetricsTimer();
    this.clearRegisterTimer();
    const registererStateChange = this.registerer?.stateChange as unknown as { removeAllListeners?: () => void } | undefined;
    registererStateChange?.removeAllListeners?.();
    const sessionStateChange = this.currentSession?.stateChange as unknown as { removeAllListeners?: () => void } | undefined;
    sessionStateChange?.removeAllListeners?.();
    this.currentSession = undefined;
    void this.unregister();
  }

  private async ensureUserAgent(): Promise<UserAgent> {
    if (this.userAgent) {
      return this.userAgent;
    }

    const options = this.userAgentOptions;
    const userAgent = new UserAgent(options);
    userAgent.delegate = this.buildUserAgentDelegate();
    this.userAgent = userAgent;
    return userAgent;
  }

  private buildUserAgentDelegate(): UserAgentDelegate {
    return {
      onConnect: () => {
        this.emit("log", { level: "info", message: "Transport connected" });
        if (this.registerAttempt > 0 && this.registerAttempt <= (this.config.maxRegisterRetries ?? DEFAULT_MAX_REGISTER_RETRIES)) {
          this.scheduleRegisterRetry(0);
        }
      },
      onDisconnect: (error?: TransportError) => {
        this.emit("log", {
          level: "warn",
          message: "Transport disconnected",
          context: error ? { message: error.message } : undefined,
        });
        this.scheduleRegisterRetry();
      },
      onInvite: (invitation) => {
        // Inbound calls are currently not supported by the widget.
        invitation.reject({ statusCode: 486 });
        this.emit("log", { level: "warn", message: "Inbound INVITE rejected" });
      },
    };
  }

  private createUserAgentOptions(config: SipClientConfig): UserAgentOptions {
    const uri = UserAgent.makeURI(`sip:${config.username}@${config.domain}`);
    if (!uri) {
      throw new Error("Invalid SIP URI configuration");
    }

    return {
      uri,
      authorizationUsername: config.username,
      authorizationPassword: config.password,
      transportOptions: {
        server: config.wssServer,
      },
      sessionDescriptionHandlerFactoryOptions: this.buildSessionDescriptionHandlerOptions(),
      logConfiguration: false,
    } satisfies UserAgentOptions;
  }

  private buildSessionDescriptionHandlerOptions() {
    return {
      constraints: {
        audio: true,
        video: false,
      },
      peerConnectionConfiguration: {
        iceServers: this.config.iceServers,
      },
    };
  }

  private resolveTargetUri(value: string): URI | undefined {
    const uri = UserAgent.makeURI(value);
    if (uri) {
      return uri;
    }
    if (!value.includes("sip:")) {
      return UserAgent.makeURI(`sip:${value}`);
    }
    return undefined;
  }

  private handleRegistererStateChange(state: RegistererState) {
    switch (state) {
      case RegistererState.Registered:
        this.emit("registration", { state: "registered", attempt: this.registerAttempt });
        this.registerAttempt = 0;
        this.registerBackoffMs = 1_000;
        if (this.currentState === "registering") {
          this.setState("idle");
        }
        break;
      case RegistererState.Unregistered:
        this.emit("registration", { state: "unregistered" });
        break;
      case RegistererState.Terminated:
        this.emit("registration", { state: "failed", reason: "terminated" });
        this.scheduleRegisterRetry();
        break;
      default:
        break;
    }
  }

  private handleSessionStateChange(state: SessionState) {
    switch (state) {
      case SessionState.Initial:
        this.setState("connecting");
        break;
      case SessionState.Establishing:
        this.setState("connecting");
        break;
      case SessionState.Established:
        this.setState("connected");
        if (this.currentSession) {
          this.attachRemoteAudio(this.currentSession);
          this.startMetricsObserver(this.currentSession);
          this.applyMuteState();
          if (this.remoteAudio) {
            this.remoteAudio.muted = this.speakerMuted;
          }
        }
        break;
      case SessionState.Terminated:
        this.terminateSession("terminated");
        break;
      default:
        break;
    }
  }

  private hookSessionDelegates(session: SessionWithPeer) {
    const delegate: any = {
      onBye: () => {
        this.emit("log", { level: "info", message: "Remote party hung up" });
        this.terminateSession("remote hangup");
      },
      onInvite: () => {
        this.emit("log", { level: "debug", message: "Re-INVITE received" });
      },
      onInfo: (info: any) => {
        const body: string = info?.request?.body ?? "";
        const toneMatch = body.match(/Signal=([0-9#\*A-D])/i);
        if (toneMatch) {
          this.emit("dtmf", { tone: toneMatch[1] });
        }
        if (typeof info?.accept === "function") {
          info.accept();
        }
      },
      onSessionDescriptionHandler: () => {
        this.attachRemoteAudio(session);
      },
    };

    (session as any).delegate = delegate;
  }

  private attachRemoteAudio(session: SessionWithPeer) {
    if (!this.remoteAudio) {
      return;
    }
    const handler = session.sessionDescriptionHandler as unknown as { peerConnection?: RTCPeerConnection } | undefined;
    const peer = handler?.peerConnection;
    if (!peer) {
      return;
    }

    const remoteStream = new MediaStream();
    peer.getReceivers().forEach((receiver) => {
      if (receiver.track) {
        remoteStream.addTrack(receiver.track);
      }
    });
    this.remoteAudio.srcObject = remoteStream;
    void this.remoteAudio.play().catch(() => {
      this.emit("log", { level: "warn", message: "Autoplay failed; awaiting user interaction" });
    });

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      this.emit("ice", { state });
      this.emit("metrics", {
        ts: Date.now(),
        callId: this.activeCallId,
        iceState: state,
        language: this.preferredLanguage,
      });
      if (state === "failed" || state === "disconnected") {
        this.emit("log", {
          level: "warn",
          message: "ICE connection degraded",
          context: { state },
        });
      }
    };
  }

  private startMetricsObserver(session: SessionWithPeer) {
    this.clearMetricsTimer();
    const handler = session.sessionDescriptionHandler as unknown as { peerConnection?: RTCPeerConnection } | undefined;
    const peer = handler?.peerConnection;
    if (!peer) {
      return;
    }

    this.metricsTimer = setInterval(async () => {
      try {
        const stats = await peer.getStats();
        let rtt: number | undefined;
        let bytesSent: number | undefined;
        let bytesReceived: number | undefined;

        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.state === "succeeded" && report.currentRoundTripTime !== undefined) {
            rtt = Math.round(report.currentRoundTripTime * 1000);
          }
          if (report.type === "outbound-rtp" && report.kind === "audio") {
            bytesSent = report.bytesSent ?? bytesSent;
          }
          if (report.type === "inbound-rtp" && report.kind === "audio") {
            bytesReceived = report.bytesReceived ?? bytesReceived;
          }
        });

        this.emit("metrics", {
          ts: Date.now(),
          callId: this.activeCallId,
          iceState: peer.iceConnectionState,
          rttMs: rtt,
          bytesSent,
          bytesReceived,
          language: this.preferredLanguage,
        });
      } catch (error) {
        this.emit("log", {
          level: "debug",
          message: "Failed to gather WebRTC stats",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }, 5_000);
  }

  private applyMuteState() {
    if (!this.currentSession) {
      return;
    }
    const handler = this.currentSession.sessionDescriptionHandler as unknown as { peerConnection?: RTCPeerConnection } | undefined;
    const peer = handler?.peerConnection;
    if (!peer) {
      return;
    }

    peer.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "audio") {
        sender.track.enabled = !this.muted;
      }
    });
  }

  private terminateSession(reason: string) {
    this.clearMetricsTimer();
    const session = this.currentSession;
    if (session) {
      const stateChange = session.stateChange as unknown as { removeAllListeners?: () => void } | undefined;
      stateChange?.removeAllListeners?.();
      (session as any).delegate = undefined;
      if (session.state !== SessionState.Terminated) {
        void session.terminate();
      }
    }
    this.currentSession = undefined;
    this.activeCallId = undefined;
    this.setState(reason === "remote hangup" ? "ended" : "idle", reason);
  }

  private setState(state: CallState, reason?: string) {
    this.currentState = state;
    this.emit("call", {
      state,
      reason,
      callId: this.activeCallId,
    });
  }

  private scheduleRegisterRetry(delayMs?: number) {
    const maxRetries = this.config.maxRegisterRetries ?? DEFAULT_MAX_REGISTER_RETRIES;
    if (this.registerAttempt >= maxRetries) {
      this.emit("registration", {
        state: "failed",
        attempt: this.registerAttempt,
        reason: "max retry reached",
      });
      return;
    }

    const delay = delayMs ?? Math.min(this.registerBackoffMs, 30_000);
    this.registerBackoffMs = Math.min(this.registerBackoffMs * 2, 60_000);

    this.emit("reconnecting", {
      attempt: this.registerAttempt + 1,
      delayMs: delay,
    });

    this.clearRegisterTimer();
    this.registerRetryTimer = setTimeout(() => {
      void this.register();
    }, delay);
  }

  private clearRegisterTimer() {
    if (this.registerRetryTimer) {
      clearTimeout(this.registerRetryTimer);
      this.registerRetryTimer = undefined;
    }
  }

  private clearMetricsTimer() {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }
  }

  private emit<TKey extends keyof EventMap>(event: TKey, payload: EventMap[TKey]) {
    this.emitter.emit(event, payload);
  }
}

export type {
  SipClientConfig as CodexSipConfig,
  RegistrationEvent,
  CallStateEvent,
  MetricsEvent,
  LogEvent,
  IceEvent,
  DtmfEvent,
  ReconnectEvent,
  LanguageChangeEvent,
};
