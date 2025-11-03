export const floatingWidgetStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --codex-font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  /* ===== Color Themes ===== */
  .codex-floating-voice-widget--dark {
    --codex-gradient-start: #667EEA;
    --codex-gradient-end: #764BA2;
    --codex-primary: #0066FF;
    --codex-primary-light: #00A3FF;
    --codex-surface: #1a1a2e;
    --codex-surface-elevated: #16213e;
    --codex-text: #ffffff;
    --codex-text-muted: #a0a0b8;
    --codex-border: rgba(255, 255, 255, 0.1);
    --codex-success: #10B981;
    --codex-danger: #EF4444;
    --codex-shadow: rgba(0, 0, 0, 0.3);
  }

  .codex-floating-voice-widget--light {
    --codex-gradient-start: #667EEA;
    --codex-gradient-end: #764BA2;
    --codex-primary: #0066FF;
    --codex-primary-light: #00A3FF;
    --codex-surface: #ffffff;
    --codex-surface-elevated: #f8f9fa;
    --codex-text: #1a1a2e;
    --codex-text-muted: #6c757d;
    --codex-border: rgba(0, 0, 0, 0.1);
    --codex-success: #10B981;
    --codex-danger: #EF4444;
    --codex-shadow: rgba(0, 0, 0, 0.15);
  }

  /* ===== Animations ===== */
  @keyframes codex-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.15);
      opacity: 0.4;
    }
  }

  @keyframes codex-fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes codex-slide-up {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* ===== Main Widget Container ===== */
  .codex-floating-voice-widget {
    position: fixed;
    z-index: 999999;
    font-family: var(--codex-font-family);
    pointer-events: none;
  }

  .codex-floating-voice-widget--bottom-right {
    bottom: 24px;
    right: 24px;
  }

  .codex-floating-voice-widget--bottom-left {
    bottom: 24px;
    left: 24px;
  }

  .codex-floating-voice-widget--top-right {
    top: 24px;
    right: 24px;
  }

  .codex-floating-voice-widget--top-left {
    top: 24px;
    left: 24px;
  }

  .codex-floating-voice-widget > * {
    pointer-events: auto;
  }

  /* ===== Floating Button ===== */
  .codex-floating-button {
    position: relative;
    background: linear-gradient(135deg, var(--codex-gradient-start), var(--codex-gradient-end));
    border: none;
    border-radius: 50px;
    padding: 14px 28px;
    color: var(--codex-text);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    box-shadow: 0 8px 24px var(--codex-shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: visible;
  }

  .codex-floating-button:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 12px 32px var(--codex-shadow);
  }

  .codex-floating-button:active {
    transform: translateY(0) scale(0.98);
  }

  .codex-floating-button__content {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    z-index: 2;
  }

  .codex-floating-button__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .codex-floating-button__text {
    white-space: nowrap;
  }

  .codex-floating-button__pulse {
    position: absolute;
    inset: -4px;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--codex-gradient-start), var(--codex-gradient-end));
    animation: codex-pulse 2s ease-in-out infinite;
    z-index: 1;
    pointer-events: none;
  }

  .codex-floating-button[data-pulsing="false"] .codex-floating-button__pulse {
    display: none;
  }

  /* ===== Expanded Panel ===== */
  .codex-floating-voice-widget__panel {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 360px;
    max-width: calc(100vw - 48px);
    background: var(--codex-surface);
    border-radius: 20px;
    box-shadow: 0 20px 60px var(--codex-shadow);
    overflow: hidden;
    animation: codex-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .codex-floating-voice-widget--bottom-left .codex-floating-voice-widget__panel {
    left: 0;
    right: auto;
  }

  .codex-floating-voice-widget--top-right .codex-floating-voice-widget__panel,
  .codex-floating-voice-widget--top-left .codex-floating-voice-widget__panel {
    bottom: auto;
    top: 80px;
  }

  .codex-floating-voice-widget__panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    background: linear-gradient(135deg, var(--codex-gradient-start), var(--codex-gradient-end));
    color: white;
  }

  .codex-floating-voice-widget__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .codex-floating-voice-widget__close {
    background: transparent;
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .codex-floating-voice-widget__close:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .codex-floating-voice-widget__close svg {
    width: 20px;
    height: 20px;
  }

  .codex-floating-voice-widget__panel-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ===== Status Display ===== */
  .codex-floating-voice-widget__status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--codex-surface-elevated);
    border-radius: 12px;
  }

  .codex-floating-voice-widget__status-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--codex-text);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .codex-floating-voice-widget__duration {
    font-size: 16px;
    font-weight: 600;
    color: var(--codex-success);
    font-variant-numeric: tabular-nums;
  }

  /* ===== Audio Visualizer ===== */
  .codex-audio-visualizer {
    padding: 20px;
    background: var(--codex-surface-elevated);
    border-radius: 12px;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .codex-audio-visualizer__bars {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 60px;
  }

  .codex-audio-visualizer__bar {
    width: 4px;
    background: linear-gradient(180deg, var(--codex-gradient-start), var(--codex-gradient-end));
    border-radius: 2px;
    transition: height 0.1s ease-out;
  }

  /* ===== Language Selector ===== */
  .codex-language-selector {
    position: relative;
  }

  .codex-language-selector__select {
    width: 100%;
    padding: 14px 16px;
    background: var(--codex-surface-elevated);
    color: var(--codex-text);
    border: 1px solid var(--codex-border);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
  }

  .codex-language-selector__select:hover {
    border-color: var(--codex-primary);
  }

  .codex-language-selector__select:focus {
    outline: none;
    border-color: var(--codex-primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .codex-language-selector__display {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .codex-language-selector__flag {
    font-size: 20px;
  }

  /* ===== Controls ===== */
  .codex-floating-voice-widget__controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .codex-floating-voice-widget__control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px;
    background: var(--codex-surface-elevated);
    border: 2px solid var(--codex-border);
    border-radius: 12px;
    color: var(--codex-text);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .codex-floating-voice-widget__control-btn:hover {
    background: var(--codex-primary);
    border-color: var(--codex-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .codex-floating-voice-widget__control-btn:active {
    transform: translateY(0);
  }

  .codex-floating-voice-widget__control-btn svg {
    width: 18px;
    height: 18px;
  }

  .codex-floating-voice-widget__control-btn--active {
    background: var(--codex-primary);
    border-color: var(--codex-primary);
    color: white;
  }

  .codex-floating-voice-widget__control-btn--danger {
    background: var(--codex-danger);
    border-color: var(--codex-danger);
    color: white;
  }

  .codex-floating-voice-widget__control-btn--danger:hover {
    background: #dc2626;
    border-color: #dc2626;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .codex-floating-voice-widget__control-btn--success {
    background: var(--codex-success);
    border-color: var(--codex-success);
    color: white;
  }

  .codex-floating-voice-widget__control-btn--success:hover {
    background: #059669;
    border-color: #059669;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  /* ===== Incoming Call ===== */
  .codex-floating-voice-widget__incoming-call {
    padding: 16px;
    background: var(--codex-surface-elevated);
    border-radius: 12px;
    border: 2px solid var(--codex-success);
    animation: codex-pulse 2s ease-in-out infinite;
  }

  .codex-floating-voice-widget__incoming-from {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--codex-text);
    text-align: center;
  }

  /* ===== Application Selector ===== */
  .codex-floating-voice-widget__application-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .codex-floating-voice-widget__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--codex-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .codex-floating-voice-widget__select {
    width: 100%;
    padding: 14px 16px;
    background: var(--codex-surface-elevated);
    color: var(--codex-text);
    border: 1px solid var(--codex-border);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0a0b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
  }

  .codex-floating-voice-widget__select:hover {
    border-color: var(--codex-primary);
  }

  .codex-floating-voice-widget__select:focus {
    outline: none;
    border-color: var(--codex-primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .codex-floating-voice-widget__select option {
    background: var(--codex-surface-elevated);
    color: var(--codex-text);
    padding: 8px;
  }

  /* ===== Mobile Responsive ===== */
  @media (max-width: 768px) {
    .codex-floating-voice-widget--bottom-right,
    .codex-floating-voice-widget--bottom-left {
      bottom: 16px;
      left: 16px;
      right: 16px;
    }

    .codex-floating-button {
      width: 100%;
      justify-content: center;
    }

    .codex-floating-voice-widget__panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-width: 100%;
      border-radius: 20px 20px 0 0;
      max-height: 90vh;
      overflow-y: auto;
    }

    .codex-floating-voice-widget--top-right .codex-floating-voice-widget__panel,
    .codex-floating-voice-widget--top-left .codex-floating-voice-widget__panel {
      top: 0;
      border-radius: 0 0 20px 20px;
    }
  }

  /* ===== Accessibility ===== */
  @media (prefers-reduced-motion: reduce) {
    .codex-floating-button__pulse,
    .codex-audio-visualizer__bar {
      animation: none !important;
      transition: none !important;
    }
  }

  /* Touch-friendly for mobile */
  @media (hover: none) and (pointer: coarse) {
    .codex-floating-button,
    .codex-floating-voice-widget__control-btn,
    .codex-floating-voice-widget__close {
      min-height: 44px;
      min-width: 44px;
    }
  }
`;
