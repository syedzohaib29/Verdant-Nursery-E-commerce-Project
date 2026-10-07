import type { SVGProps } from "react";

/**
 * Where we are, as a drawing rather than a widget.
 *
 * No map tiles, no API key, no third-party script — a hand-drawn slice of
 * Portland with the nursery marked in leaf. The real address is in the copy
 * beside it; this illustration exists to say "somewhere warm and green", not
 * to be navigated by.
 */
export function MapIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 640 360"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full"
      {...props}
    >
      {/* The neighbourhood: warm-white ground, mint park, ink river. */}
      <rect width="640" height="360" fill="#F8F8F4" />
      <path
        d="M0 262 L120 244 L248 268 L392 240 L520 258 L640 236 L640 360 L0 360 Z"
        fill="#E6F2E8"
      />
      <path
        d="M0 296 Q180 284 320 300 T640 292 L640 360 L0 360 Z"
        fill="#14532D"
        opacity="0.85"
      />
      <path
        d="M420 92 C470 110 492 150 486 196 C480 238 456 262 420 272 C384 262 360 238 354 196 C348 150 370 110 420 92 Z"
        fill="#E6F2E8"
      />

      {/* Streets: hairline ink. */}
      <path
        d="M0 120 L640 96"
        stroke="#0B0F0C"
        strokeOpacity="0.14"
        strokeWidth="5"
      />
      <path
        d="M80 0 L120 360"
        stroke="#0B0F0C"
        strokeOpacity="0.1"
        strokeWidth="6"
      />
      <path
        d="M300 0 L330 360"
        stroke="#0B0F0C"
        strokeOpacity="0.1"
        strokeWidth="4"
      />
      <path
        d="M520 0 L488 360"
        stroke="#0B0F0C"
        strokeOpacity="0.1"
        strokeWidth="6"
      />
      <path
        d="M180 190 Q300 180 420 192"
        stroke="#0B0F0C"
        strokeOpacity="0.12"
        strokeWidth="3.5"
        fill="none"
      />

      {/* The nursery: a leaf pin on a forest puddle. */}
      <circle cx="308" cy="160" r="30" fill="#E6F2E8" />
      <circle cx="308" cy="160" r="18" fill="#3E9B4F" />
      <path
        d="M308 148 C316 152 320 160 318 168 C312 172 304 172 298 168 C296 160 300 152 308 148 Z"
        fill="#14532D"
      />
      <path d="M308 168 L308 178" stroke="#14532D" strokeWidth="3" />
      <circle cx="308" cy="184" r="4" fill="#14532D" />

      {/* A passing bicycle, because Portland. */}
      <g stroke="#0B0F0C" strokeOpacity="0.35" strokeWidth="2.5">
        <circle cx="120" cy="112" r="8" fill="none" />
        <circle cx="148" cy="106" r="8" fill="none" />
        <path d="M128 110 L146 106 L136 96 L128 102 L122 92" fill="none" />
      </g>
    </svg>
  );
}