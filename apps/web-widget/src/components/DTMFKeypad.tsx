import { useState } from "react";
import clsx from "clsx";
import { playDtmfTone } from "../utils/dtmfAudio";

interface DTMFKey {
  digit: string;
  letters: string;
}

const DTMF_KEYS: DTMFKey[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

interface DTMFKeypadProps {
  onKeyPress: (tone: string) => void;
  theme?: "light" | "dark";
  disabled?: boolean;
}

export const DTMFKeypad = ({ onKeyPress, theme = "dark", disabled = false }: DTMFKeypadProps) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleKeyPress = (digit: string) => {
    if (disabled) return;

    setActiveKey(digit);

    // Play DTMF audio tone locally
    playDtmfTone(digit, 100, 0.3);

    // Send DTMF to remote party
    onKeyPress(digit);

    // Vibration feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    // Reset active state after animation
    setTimeout(() => setActiveKey(null), 200);
  };

  return (
    <div className={clsx("dtmf-keypad", `dtmf-keypad--${theme}`)}>
      {DTMF_KEYS.map((key) => (
        <button
          key={key.digit}
          type="button"
          className={clsx(
            "dtmf-key",
            activeKey === key.digit && "dtmf-key--active",
            disabled && "dtmf-key--disabled"
          )}
          onClick={() => handleKeyPress(key.digit)}
          disabled={disabled}
          aria-label={`DTMF ${key.digit}${key.letters ? ` ${key.letters}` : ""}`}
        >
          <span className="dtmf-key__digit">{key.digit}</span>
          {key.letters && <span className="dtmf-key__letters">{key.letters}</span>}
        </button>
      ))}
    </div>
  );
};
