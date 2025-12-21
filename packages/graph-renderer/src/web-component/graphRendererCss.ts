/**
 * @fileoverview Minimal CSS for the graph renderer web component.
 */

export const graphRendererCss = String.raw`
:host {
  --graph-bg: #0b0f14;
  --graph-card: #0f172a;
  --graph-muted: #0b1220;
  --graph-border: rgba(148, 163, 184, 0.28);
  --graph-text: #e5e7eb;
  --graph-text-muted: #94a3b8;
  --graph-popover: #0b1220;
  --graph-accent: rgba(148, 163, 184, 0.12);
  --graph-ring: rgba(148, 163, 184, 0.5);
  color: var(--graph-text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
  display: block;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.graph-root {
  width: 100%;
  height: 100%;
}

.w-full { width: 100%; }
.h-full { height: 100%; }
.h-64 { height: 16rem; }
.aspect-video { aspect-ratio: 16 / 9; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.right-3 { right: 0.75rem; }
.bottom-3 { bottom: 0.75rem; }
.left-3 { left: 0.75rem; }
.top-3 { top: 0.75rem; }
.z-10 { z-index: 10; }
.z-50 { z-index: 50; }
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-2 { gap: 0.5rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-sm { border-radius: 0.25rem; }
.border { border-width: 1px; border-style: solid; border-color: var(--graph-border); }
.border-transparent { border-color: transparent; }
.border-border { border-color: var(--graph-border); }
.bg-muted { background-color: var(--graph-muted); }
.bg-card { background-color: var(--graph-card); }
.bg-popover { background-color: var(--graph-popover); }
.bg-background { background-color: var(--graph-bg); }
.bg-background\/80 { background-color: rgba(11, 15, 20, 0.8); }
.text-foreground { color: var(--graph-text); }
.text-foreground\/80 { color: rgba(229, 231, 235, 0.8); }
.text-muted-foreground { color: var(--graph-text-muted); }
.text-popover-foreground { color: var(--graph-text); }
.italic { font-style: italic; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.font-medium { font-weight: 500; }
.shadow-sm { box-shadow: 0 1px 2px rgba(15, 23, 42, 0.35); }
.shadow-md { box-shadow: 0 8px 16px rgba(15, 23, 42, 0.35); }
.backdrop-blur-sm { backdrop-filter: blur(6px); }
.overflow-hidden { overflow: hidden; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.h-8 { height: 2rem; }
.min-w-\[8rem\] { min-width: 8rem; }
.min-h-\[300px\] { min-height: 300px; }
.h-px { height: 1px; }
.my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
.-mx-1 { margin-left: -0.25rem; margin-right: -0.25rem; }
.cursor-default { cursor: default; }
.select-none { user-select: none; }
.inline-flex { display: inline-flex; }
.outline-none { outline: none; }
.transition { transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease; }
.hover\:border-border:hover { border-color: var(--graph-border); }
.hover\:text-foreground:hover { color: var(--graph-text); }
.hover\:bg-accent:hover { background-color: var(--graph-accent); }
.hover\:text-accent-foreground:hover { color: var(--graph-text); }
.bg-border { background-color: var(--graph-border); }

button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--graph-ring);
}
`;
