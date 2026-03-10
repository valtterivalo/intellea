/**
 * @fileoverview Persistent top navigation bar — sticky, glass backdrop.
 * Exports: Nav
 */
import Link from 'next/link';

/** Top-level nav links shown on all pages. */
const NAV_LINKS = [
  { label: 'docs', href: '/docs' },
  { label: 'examples', href: '/examples' },
  { label: 'embed shell ↗', href: '/embed/graph' },
] as const;

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 border-b border-border"
      style={{
        height: '52px',
        background: 'rgba(7, 9, 13, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* brand mark */}
      <Link
        href="/"
        className="font-display text-lg leading-none select-none"
        style={{ color: '#0AFFD9' }}
      >
        intellea
      </Link>

      {/* nav links */}
      <div className="flex items-center gap-6">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
