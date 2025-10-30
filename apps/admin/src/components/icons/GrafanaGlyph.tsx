import * as React from 'react';

export const GrafanaGlyph: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    viewBox="0 0 64 64"
    role="img"
    aria-labelledby="grafanaGlyphTitle"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title id="grafanaGlyphTitle">Grafana style mark</title>
    <defs>
      <linearGradient id="grafanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#facc15" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="#111827" />
    <path
      d="M32 12c-7.18 0-13 5.82-13 13 0 4.2 1.95 7.93 5 10.32-.64 1.35-1 2.86-1 4.46 0 6.08 4.92 11 11 11s11-4.92 11-11c0-1.6-.36-3.11-1-4.46 3.05-2.39 5-6.12 5-10.32 0-7.18-5.82-13-13-13Zm0 8c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5Zm0 26c-2.76 0-5-2.24-5-5 0-.77.17-1.5.48-2.16 1.35.73 2.88 1.16 4.52 1.16s3.17-.43 4.52-1.16c.31.66.48 1.39.48 2.16 0 2.76-2.24 5-5 5Z"
      fill="url(#grafanaGradient)"
    />
  </svg>
);

export default GrafanaGlyph;
