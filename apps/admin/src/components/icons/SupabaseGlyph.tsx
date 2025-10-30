import * as React from 'react';

export const SupabaseGlyph: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    viewBox="0 0 64 64"
    role="img"
    aria-labelledby="supabaseGlyphTitle"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title id="supabaseGlyphTitle">Supabase style mark</title>
    <defs>
      <linearGradient id="supabaseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="#0f172a" />
    <path
      d="M18 10 46 34c1.7 1.44 0.8 4.22-1.45 4.5L33.5 40l8.5 10.5c1.45 1.78.15 4.41-2.16 4.41H20.82c-1.1 0-2-.9-2-2V10.32c0-1.76 2.06-2.67 3.24-1.32Z"
      fill="url(#supabaseGradient)"
    />
  </svg>
);

export default SupabaseGlyph;
