/**
 * @fileoverview Next.js page component.
 * Exports: RootLayout, metadata
 */
import type { Metadata } from "next";
// Remove Geist fonts
// import { Geist, Geist_Mono } from "next/font/google";
import { Nunito } from "next/font/google"; // Add Nunito
import { PT_Sans } from "next/font/google"; // Add PT_Sans
import "./globals.css";

// Import Supabase components
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs' // DELETE THIS
// import { cookies } from 'next/headers' // DELETE THIS (handled by server client utility)
import { createClient } from '@/lib/supabase/server'; // ADD THIS
import SupabaseListener from '@/components/SupabaseListener'; 

// Remove Geist font config
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
// 
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// Add Matsu font config
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

// Make the layout component async
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { session: initialSession } } = await supabase.auth.getSession(); // For initial access token

  return (
    <html lang="en">
      {/* Update body className and add texture div */}
      <body
        className={`${nunito.variable} ${ptSans.variable} antialiased relative`}
      >
        {/* Add SupabaseListener to manage client-side session changes */}
        <SupabaseListener serverAccessToken={initialSession?.access_token} /> {/* Pass token from initialSession */}
        <div className="texture" /> 
        {children}
      </body>
    </html>
  );
}
