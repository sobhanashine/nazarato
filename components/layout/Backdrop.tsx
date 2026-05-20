/**
 * Ambient page backdrop — the drifting aurora glow + fine grain that sit
 * behind all content. Was `body::before` / `body::after` in globals.css;
 * pseudo-elements can't be expressed in JSX, so they are real (decorative,
 * aria-hidden) elements. Complex multi-gradient backgrounds stay as inline
 * styles; positioning + animation use Tailwind utilities.
 */

const aurora =
  "radial-gradient(45vmax 40vmax at 12% 8%, rgba(91, 230, 178, 0.20), transparent 60%)," +
  "radial-gradient(50vmax 45vmax at 88% 22%, rgba(123, 137, 255, 0.20), transparent 65%)," +
  "radial-gradient(60vmax 55vmax at 50% 95%, rgba(255, 107, 149, 0.10), transparent 65%)," +
  "radial-gradient(40vmax 40vmax at 95% 75%, rgba(245, 181, 68, 0.10), transparent 60%)";

const grain =
  `radial-gradient(ellipse at top, rgba(10, 14, 24, 0) 0%, rgba(6, 8, 15, 0.55) 70%, #06080f 100%),` +
  `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E` +
  `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' ` +
  `stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.042 0'/%3E` +
  `%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-[-20vmax] z-[-2] pointer-events-none animate-[aurora_32s_ease-in-out_infinite_alternate] motion-reduce:animate-none"
        style={{ background: aurora, filter: "blur(20px) saturate(140%)" }}
      />
      <div
        aria-hidden
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{ background: grain }}
      />
    </>
  );
}
