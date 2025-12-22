/**
 * @fileoverview Next.js root layout for the graph platform docs site.
 * Exports: RootLayout, metadata
 */
import type { Metadata } from 'next';
import { Nunito, PT_Sans } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
});

const ptSans = PT_Sans({
  variable: '--font-pt-sans',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'intellea graph platform',
  description: 'schema-first graph rendering, embeddable anywhere.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${ptSans.variable} antialiased relative`}>
        <div className="texture" />
        {children}
      </body>
    </html>
  );
}
