/**
 * House mark: a stitched "A" monogram inside a running-stitch ring. Drawn as
 * inline SVG so it inherits the surrounding colour and stays crisp at any size
 * (header, footer, admin console, sign-in screens and the app icon).
 */
export function BrandMark({
  className = "h-7 w-7",
  accentClassName = "text-secondary",
}: {
  className?: string;
  accentClassName?: string;
}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false" className={className}>
      <circle
        cx="20"
        cy="20"
        r="18.2"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      <path d="M20 9.2 12.1 31.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 9.2 27.9 31.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M15 23.4h10"
        className={accentClassName}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2.6"
      />
      <circle cx="20" cy="9.2" r="1.7" className={accentClassName} fill="currentColor" />
    </svg>
  );
}
