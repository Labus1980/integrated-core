import {
  Invitation,
  Inviter,
  Registerer,
  RegistererState,
  Session,
  SessionState,
  URI,
  UserAgent,
  UserAgentDelegate,
  UserAgentOptions
} from "sip.js";
import { TinyEmitter } from "tiny-emitter";

/**
 * Generates a unique UUID v4 identifier.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export type CallState =
  | "idle"
  | "registering"
  | "connecting"
  | "ringing"
  | "incoming"
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
   * Ignored if infiniteReconnect is enabled.
   */
  maxRegisterRetries?: number;
  /**
   * Enable infinite reconnection attempts.
   * When enabled, the client will keep trying to reconnect indefinitely.
   * Defaults to true for better connection reliability.
   */
  infiniteReconnect?: boolean;
  /**
   * Keep-alive interval in milliseconds for maintaining the connection.
   * Sends periodic keep-alive messages to prevent connection timeout.
   * Defaults to 30000ms (30 seconds). Set to 0 to disable.
   */
  keepAliveInterval?: number;
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
  iceState?: RTCIceConnectionState;
  /** Selected candidate pair RTT in milliseconds (when available). */
  rttMs?: number;
  /** Audio bytes sent/received for the active stream. */
  bytesSent?: number;
  bytesReceived?: number;
  /** Active preferred language for the call. */
  language?: string;
}

export interface IceEvent {
  state: RTCIceConnectionState;
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

export interface IncomingCallEvent {
  callId?: string;
  from?: string;
  to?: string;
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
  incomingCall: IncomingCallEvent;
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

type SessionWithPeer = Session & {
  sessionDescriptionHandler?: any;
};

export class CodexSipClient {
  private readonly emitter = new TypedEmitter<EventMap>();
  private readonly config: SipClientConfig;
  private readonly userAgentOptions: UserAgentOptions;
  private readonly languageHeader = "X-Lang";

  private userAgent?: UserAgent;
  private registerer?: Registerer;
  private currentSession?: SessionWithPeer;
  private remoteAudio?: HTMLAudioElement;
  private pendingInvitation?: Invitation;

  private currentState: CallState = "idle";
  private preferredLanguage: string;
  private registerAttempt = 0;
  private registerRetryTimer?: ReturnType<typeof setTimeout>;
  private registerBackoffMs = 1_000;
  private metricsTimer?: ReturnType<typeof setInterval>;
  private keepAliveTimer?: ReturnType<typeof setInterval>;
  private activeCallId?: string;
  private muted = false;
  private speakerMuted = false;
  private isRegistering = false;

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

    // Start keep-alive timer if enabled (default: 30 seconds)
    const keepAliveInterval = config.keepAliveInterval ?? 30_000;
    if (keepAliveInterval > 0) {
      this.startKeepAlive(keepAliveInterval);
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
    // Prevent multiple simultaneous registration attempts
    if (this.isRegistering) {
      this.emit("log", {
        level: "debug",
        message: "Registration already in progress, skipping duplicate request",
      });
      return;
    }

    // Check if already registered
    if (this.registerer?.state === RegistererState.Registered) {
      this.emit("log", {
        level: "debug",
        message: "Already registered, skipping registration",
      });
      return;
    }

    this.isRegistering = true;
    const ua = await this.ensureUserAgent();
    if (!this.registerer) {
      this.registerer = new Registerer(ua);
      this.registerer.stateChange.addListener((state: RegistererState) => {
        this.handleRegistererStateChange(state);
      });
    }

    this.clearRegisterTimer();
    this.registerAttempt += 1;
    this.emit("registration", { state: "registering", attempt: this.registerAttempt });
    this.setState("registering");

    try {
      // Start user agent if not connected
      if (!ua.isConnected()) {
        this.emit("log", {
          level: "debug",
          message: "Transport not connected, starting user agent",
        });
        await ua.start();

        // Wait for transport to connect (with timeout)
        await this.waitForTransportConnection(ua, 5000);
      }

      await this.registerer.register();
    } catch (error) {
      this.isRegistering = false;
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
    this.isRegistering = false;
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

    // Ensure transport is connected before attempting call
    if (!ua.isConnected()) {
      this.emit("log", {
        level: "debug",
        message: "Transport not connected, starting user agent before call",
      });

      try {
        await ua.start();
        await this.waitForTransportConnection(ua, 5000);
      } catch (error) {
        this.emit("log", {
          level: "error",
          message: "Failed to establish transport connection",
          error: error instanceof Error ? error : new Error(String(error)),
        });
        throw new Error("Cannot start call: transport connection failed");
      }
    }

    // Ensure we're registered before making a call
    if (!this.registerer || this.registerer.state !== RegistererState.Registered) {
      await this.register();

      // Wait for registration to complete
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Registration timeout"));
        }, 10000); // 10 second timeout

        const checkRegistration = () => {
          if (this.registerer?.state === RegistererState.Registered) {
            clearTimeout(timeout);
            resolve();
          } else if (this.registerer?.state === RegistererState.Terminated) {
            clearTimeout(timeout);
            reject(new Error("Registration failed"));
          }
        };

        // Check immediately in case already registered
        checkRegistration();

        // Listen for state changes
        const stateListener = () => checkRegistration();
        this.registerer?.stateChange.addListener(stateListener);

        // Clean up listener when done
        Promise.race([
          new Promise((r) => setTimeout(r, 10000)),
          new Promise((r) => {
            if (this.registerer?.state === RegistererState.Registered) r(undefined);
          }),
        ]).finally(() => {
          this.registerer?.stateChange.removeListener(stateListener);
        });
      });
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
    this.currentSession.stateChange.addListener((state: SessionState) => this.handleSessionStateChange(state));
    this.hookSessionDelegates(this.currentSession);
    this.setState("connecting");
    this.emit("log", { level: "info", message: "Outbound INVITE sent", context: { target: target.toString() } });

    try {
      // Generate a unique call ID for this session
      this.activeCallId = generateUUID();
      const response = await inviter.invite();
      this.emit("log", {
        level: "info",
        message: "Call initiated with unique ID",
        context: { callId: this.activeCallId, target: target.toString() }
      });
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

  async acceptIncomingCall(options?: { language?: string }) {
    if (!this.pendingInvitation) {
      throw new Error("No incoming call to accept");
    }

    const invitation = this.pendingInvitation;
    this.pendingInvitation = undefined;

    const lang = options?.language || this.preferredLanguage || this.config.defaultLanguage;
    this.preferredLanguage = lang;
    this.emit("language", { language: this.preferredLanguage });

    const answerHeaders = [`${this.languageHeader}: ${lang}`];

    this.currentSession = invitation as SessionWithPeer;
    this.currentSession.stateChange.addListener((state: SessionState) => this.handleSessionStateChange(state));
    this.hookSessionDelegates(this.currentSession);

    try {
      await invitation.accept({
        sessionDescriptionHandlerOptions: this.buildSessionDescriptionHandlerOptions(),
        extraHeaders: answerHeaders,
      });
      this.emit("log", { level: "info", message: "Incoming call accepted" });
    } catch (error) {
      this.setState("error", error instanceof Error ? error.message : "Failed to accept call");
      this.emit("log", {
        level: "error",
        message: "Failed to accept incoming call",
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  async rejectIncomingCall(reason?: string) {
    if (!this.pendingInvitation) {
      throw new Error("No incoming call to reject");
    }

    try {
      await this.pendingInvitation.reject({ statusCode: 486 });
      this.emit("log", { level: "info", message: "Incoming call rejected" });
    } catch (error) {
      this.emit("log", {
        level: "warn",
        message: "Error rejecting incoming call",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    } finally {
      this.pendingInvitation = undefined;
      this.activeCallId = undefined;
      this.setState("idle", reason || "rejected");
    }
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

  /**
   * Gets the local MediaStream from the current session
   * Used for in-band DTMF generation
   */
  getLocalMediaStream(): MediaStream | null {
    if (!this.currentSession) {
      return null;
    }

    try {
      const handler = this.currentSession.sessionDescriptionHandler as unknown as {
        peerConnection?: RTCPeerConnection;
      } | undefined;

      const peer = handler?.peerConnection;
      if (!peer) {
        return null;
      }

      // Get the local stream from senders
      const audioSender = peer.getSenders().find(sender => sender.track?.kind === 'audio');
      if (!audioSender || !audioSender.track) {
        return null;
      }

      // Create a MediaStream with the local audio track
      const stream = new MediaStream([audioSender.track]);
      return stream;
    } catch (error) {
      this.emit("log", {
        level: "warn",
        message: "Failed to get local MediaStream",
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return null;
    }
  }

  async sendDtmf(tone: string) {
    if (!this.currentSession) {
      throw new Error("No active session to send DTMF");
    }

    // Log current session state for debugging
    this.emit("log", {
      level: "debug",
      message: "Attempting to send DTMF",
      context: {
        tone,
        sessionState: this.currentSession.state
      },
    });

    try {
      // Get the peer connection and audio sender
      const handler = this.currentSession.sessionDescriptionHandler as unknown as { peerConnection?: RTCPeerConnection } | undefined;
      const peer = handler?.peerConnection;

      if (!peer) {
        this.emit("log", {
          level: "warn",
          message: "No peer connection available, using SIP INFO",
        });
      } else {
        // Find the audio sender
        const audioSender = peer.getSenders().find(sender => sender.track?.kind === 'audio');

        // Log sender state for debugging
        this.emit("log", {
          level: "debug",
          message: "Audio sender status",
          context: {
            hasSender: !!audioSender,
            hasTrack: !!audioSender?.track,
            trackState: audioSender?.track?.readyState,
            hasDtmf: !!audioSender?.dtmf,
            canInsertDTMF: audioSender?.dtmf?.canInsertDTMF
          },
        });

        // Try insertDTMF first (standard WebRTC method)
        if (audioSender?.dtmf?.canInsertDTMF) {
          try {
            // Use WebRTC standard method
            // Duration: 100ms (recommended), gap: 70ms (recommended)
            audioSender.dtmf.insertDTMF(tone, 100, 70);

            this.emit("dtmf", { tone });
            this.emit("log", {
              level: "info",
              message: "DTMF sent via insertDTMF",
              context: { tone, method: "insertDTMF" },
            });
            return;
          } catch (insertError) {
            this.emit("log", {
              level: "warn",
              message: "insertDTMF failed, falling back to SIP INFO",
              context: { tone },
              error: insertError instanceof Error ? insertError : new Error(String(insertError)),
            });
          }
        }
      }

      // Use SIP INFO method (for Jambonz/PSTN compatibility)
      // Note: Jambonz may ignore SIP INFO - use in-band audio instead
      this.emit("log", {
        level: "info",
        message: "Using SIP INFO method for DTMF (may not work with Jambonz)",
        context: { tone },
      });

      await this.currentSession.info({
        requestOptions: {
          body: {
            contentDisposition: "render",
            contentType: "application/dtmf-relay",
            content: `Signal=${tone}\r\nDuration=160`
          },
        },
      });

      this.emit("dtmf", { tone });
      this.emit("log", {
        level: "info",
        message: "DTMF sent via SIP INFO",
        context: { tone, method: "SIP INFO" },
      });

    } catch (error) {
      this.emit("log", {
        level: "error",
        message: "Failed to send DTMF via all methods",
        context: { tone },
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // Don't throw - just log the error
      // Some applications may not support DTMF at all
      console.error("DTMF send failed:", error);
    }
  }

  /**
   * Check the current connection state and force reconnect if needed.
   * Useful for checking connection after page visibility changes.
   */
  async checkConnection(): Promise<boolean> {
    if (!this.userAgent) {
      this.emit("log", {
        level: "debug",
        message: "No user agent exists, attempting to register",
      });
      try {
        await this.register();
        return true;
      } catch (error) {
        return false;
      }
    }

    const isConnected = this.userAgent.isConnected();
    const isRegistered = this.registerer?.state === RegistererState.Registered;

    this.emit("log", {
      level: "debug",
      message: "Connection check",
      context: {
        isConnected,
        isRegistered,
        transportState: this.userAgent.transport?.state,
      },
    });

    if (!isConnected || !isRegistered) {
      this.emit("log", {
        level: "info",
        message: "Connection lost, attempting to reconnect",
      });
      try {
        if (!isConnected && this.userAgent) {
          await this.userAgent.start();
        }
        if (!isRegistered) {
          await this.register();
        }
        return true;
      } catch (error) {
        this.emit("log", {
          level: "error",
          message: "Failed to reconnect",
          error: error instanceof Error ? error : new Error(String(error)),
        });
        return false;
      }
    }

    return true;
  }

  destroy() {
    this.clearMetricsTimer();
    this.clearRegisterTimer();
    this.clearKeepAliveTimer();
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
        this.emit("log", {
          level: "info",
          message: "Transport connected successfully",
          context: { wssServer: this.config.wssServer },
        });
        // Only retry registration if we were attempting and not currently registered
        const shouldRetry =
          this.registerAttempt > 0 &&
          this.registerAttempt <= (this.config.maxRegisterRetries ?? DEFAULT_MAX_REGISTER_RETRIES) &&
          !this.isRegistering &&
          this.registerer?.state !== RegistererState.Registered;

        if (shouldRetry) {
          this.emit("log", {
            level: "debug",
            message: "Retrying registration after transport reconnection",
          });
          this.scheduleRegisterRetry(0);
        }
      },
      onDisconnect: (error?: Error) => {
        this.emit("log", {
          level: "warn",
          message: "Transport disconnected",
          context: {
            wssServer: this.config.wssServer,
            error: error?.message,
            registrationState: this.registerer?.state,
          },
        });

        // Mark as not registering to allow retry
        this.isRegistering = false;

        // Check if infinite reconnect is enabled (default: true)
        const infiniteReconnect = this.config.infiniteReconnect ?? true;
        const maxRetries = this.config.maxRegisterRetries ?? DEFAULT_MAX_REGISTER_RETRIES;

        // Schedule retry based on configuration
        if (infiniteReconnect || this.registerAttempt < maxRetries) {
          this.emit("log", {
            level: "debug",
            message: "Scheduling registration retry after disconnect",
            context: {
              infiniteReconnect,
              currentAttempt: this.registerAttempt
            }
          });
          this.scheduleRegisterRetry();
        } else {
          this.emit("log", {
            level: "error",
            message: "Max registration retries exceeded, not scheduling retry",
            context: {
              maxRetries,
              currentAttempt: this.registerAttempt
            }
          });
        }
      },
      onInvite: (invitation: Invitation) => {
        // Store pending invitation for user to accept/reject
        this.pendingInvitation = invitation;
        // Generate a unique call ID for this incoming session
        this.activeCallId = generateUUID();

        const from = invitation.remoteIdentity?.displayName || invitation.remoteIdentity?.uri?.user || "Unknown";
        const to = invitation.request.to?.uri?.user || "";

        this.setState("incoming");
        this.emit("incomingCall", {
          callId: this.activeCallId,
          from,
          to,
        });
        this.emit("log", {
          level: "info",
          message: "Incoming call received",
          context: { from, to, callId: this.activeCallId }
        });
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
        this.isRegistering = false;
        this.emit("registration", { state: "registered", attempt: this.registerAttempt });
        this.registerAttempt = 0;
        this.registerBackoffMs = 1_000;
        if (this.currentState === "registering") {
          this.setState("idle");
        }
        break;
      case RegistererState.Unregistered:
        this.isRegistering = false;
        this.emit("registration", { state: "unregistered" });
        break;
      case RegistererState.Terminated:
        this.isRegistering = false;
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
        void (session as any).terminate?.();
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
    // Enable infinite reconnect by default (can be disabled via config)
    const infiniteReconnect = this.config.infiniteReconnect ?? true;
    const maxRetries = this.config.maxRegisterRetries ?? DEFAULT_MAX_REGISTER_RETRIES;

    // Only check max retries if infinite reconnect is disabled
    if (!infiniteReconnect && this.registerAttempt >= maxRetries) {
      this.emit("registration", {
        state: "failed",
        attempt: this.registerAttempt,
        reason: "max retry reached",
      });
      this.emit("log", {
        level: "error",
        message: "Max registration retries reached, reconnection stopped",
        context: {
          maxRetries,
          attempt: this.registerAttempt
        },
      });
      return;
    }

    const delay = delayMs ?? Math.min(this.registerBackoffMs, 30_000);
    this.registerBackoffMs = Math.min(this.registerBackoffMs * 2, 60_000);

    this.emit("reconnecting", {
      attempt: this.registerAttempt + 1,
      delayMs: delay,
    });

    this.emit("log", {
      level: "info",
      message: infiniteReconnect
        ? "Scheduling reconnection attempt (infinite mode)"
        : `Scheduling reconnection attempt ${this.registerAttempt + 1}/${maxRetries}`,
      context: {
        attempt: this.registerAttempt + 1,
        delayMs: delay,
        infiniteReconnect
      },
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

  /**
   * Start keep-alive mechanism to maintain WebSocket connection
   */
  private startKeepAlive(interval: number) {
    this.clearKeepAliveTimer();

    this.emit("log", {
      level: "debug",
      message: "Starting keep-alive mechanism",
      context: { intervalMs: interval },
    });

    this.keepAliveTimer = setInterval(() => {
      void this.checkConnection().catch((error) => {
        this.emit("log", {
          level: "warn",
          message: "Keep-alive check failed",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    }, interval);
  }

  private clearKeepAliveTimer() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = undefined;
    }
  }

  private emit<TKey extends keyof EventMap>(event: TKey, payload: EventMap[TKey]) {
    this.emitter.emit(event, payload);
  }

  /**
   * Wait for transport to establish connection with timeout
   */
  private async waitForTransportConnection(ua: UserAgent, timeoutMs: number): Promise<void> {
    if (ua.isConnected()) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Transport connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onDisconnect = (error?: Error) => {
        cleanup();
        reject(error || new Error("Transport disconnected during connection attempt"));
      };

      const cleanup = () => {
        clearTimeout(timeout);
        if (ua.delegate) {
          const delegate = ua.delegate as any;
          if (delegate.onConnect === onConnect) {
            delete delegate.onConnect;
          }
          if (delegate.onDisconnect === onDisconnect) {
            delete delegate.onDisconnect;
          }
          // Restore original delegate
          ua.delegate = this.buildUserAgentDelegate();
        }
      };

      // Check if already connected
      if (ua.isConnected()) {
        cleanup();
        resolve();
        return;
      }

      // Temporarily override delegate to listen for connection
      const currentDelegate = ua.delegate || {};
      ua.delegate = {
        ...currentDelegate,
        onConnect,
        onDisconnect,
      };
    });
  }
}

export type CodexSipConfig = SipClientConfig;
