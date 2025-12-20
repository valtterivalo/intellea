/**
 * @fileoverview Next.js page component.
 * Exports: RootLayout, metadata
 */
import type { Metadata } from "next";
import { Nunito, PT_Sans } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server';
import SupabaseListener from '@/components/SupabaseListener';
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Intellea - Interactive AI Learning",
  description: "A more intuitive way to learn and research with interactive knowledge graphs",
  icons: {
    icon: [
      { url: '/intellea-assets/intellea_favicon_16.png', sizes: '16x16', type: 'image/png' },
      { url: '/intellea-assets/intellea_favicon_32.png', sizes: '32x32', type: 'image/png' },
      { url: '/intellea-assets/intellea_favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  let initialSession = null;
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    initialSession = data.session;
  }

  return (
    <html lang="en">
      <body className={`${nunito.variable} ${ptSans.variable} antialiased relative`}>
        <SupabaseListener serverAccessToken={initialSession?.access_token} />
        <div className="texture" />
        {children}
      </body>
    </html>
  );
}
