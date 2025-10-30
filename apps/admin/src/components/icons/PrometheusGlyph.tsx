import * as React from 'react';

export const PrometheusGlyph: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    viewBox="0 0 64 64"
    role="img"
    aria-labelledby="prometheusGlyphTitle"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title id="prometheusGlyphTitle">Prometheus style mark</title>
    <rect width="64" height="64" rx="14" fill="#111827" />
    <circle cx="32" cy="32" r="24" fill="#fb923c" />
    <path
      d="M32 14c-4 4.5-6.5 8.83-6.5 12.79 0 3.48 1.53 6.24 4.53 8.32-2.68 1.12-4.53 3.47-4.53 6.39 0 4.09 3.25 7.5 7.5 7.5s7.5-3.41 7.5-7.5c0-2.92-1.85-5.27-4.53-6.39 3-2.08 4.53-4.84 4.53-8.32C38.5 22.83 36 18.5 32 14Z"
      fill="#fff7ed"
    />
    <path d="M32 47.5c-2.9 0-5.5 1.67-6.8 4.2A16 16 0 0 0 32 56a16 16 0 0 0 6.8-4.3c-1.3-2.53-3.9-4.2-6.8-4.2Z" fill="#f97316" />
  </svg>
);

export default PrometheusGlyph;
