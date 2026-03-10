/**
 * @fileoverview Root layout — fonts, global styles, and persistent nav.
 * Exports: RootLayout, metadata
 */
import type { Metadata } from 'next';
import { Instrument_Serif, IBM_Plex_Mono } from 'next/font/google';
import { Nav } from '@/components/nav';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'intellea graph platform',
  description: 'schema-first graph rendering for llm outputs. embeddable anywhere.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSerif.variable} ${ibmPlexMono.variable} antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
