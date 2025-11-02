export interface LanguageOption {
  code: string;
  label: string;
  flag: string; // Unicode flag emoji or SVG
}

export interface LanguageSelectorProps {
  languages: LanguageOption[];
  selected: string;
  onChange: (code: string) => void;
  theme?: "light" | "dark";
}

const defaultLanguages: LanguageOption[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export const LanguageSelector = ({
  languages = defaultLanguages,
  selected,
  onChange,
  theme = "dark",
}: LanguageSelectorProps) => {
  const selectedLang = languages.find((l) => l.code === selected) || languages[0];

  return (
    <div className={`codex-language-selector codex-language-selector--${theme}`}>
      <select
        className="codex-language-selector__select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
      <div className="codex-language-selector__display" aria-hidden="true">
        <span className="codex-language-selector__flag">{selectedLang?.flag}</span>
      </div>
    </div>
  );
};
