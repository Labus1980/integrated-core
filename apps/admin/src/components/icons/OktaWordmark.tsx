import * as React from 'react';

export const OktaWordmark: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    viewBox="0 0 64 64"
    role="img"
    aria-labelledby="oktaWordmarkTitle"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title id="oktaWordmarkTitle">Codex platform mark</title>
    <defs>
      <linearGradient id="oktaWordmarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#oktaWordmarkGradient)" />
    <path
      d="M32 16c-9.941 0-18 8.059-18 18s8.059 18 18 18c6.77 0 12.68-3.71 15.81-9.23l-6.53-3.77C39.34 42.61 35.99 45 32 45c-6.08 0-11-4.92-11-11s4.92-11 11-11c4.08 0 7.64 2.23 9.53 5.53l6.5-3.88C44.87 19.77 38.89 16 32 16Z"
      fill="#fff"
    />
    <circle cx="32" cy="32" r="6" fill="#0f172a" opacity="0.9" />
  </svg>
);

export default OktaWordmark;
