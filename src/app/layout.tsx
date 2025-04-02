import type { Metadata } from "next";
// Remove Geist fonts
// import { Geist, Geist_Mono } from "next/font/google";
import { Nunito } from "next/font/google"; // Add Nunito
import { PT_Sans } from "next/font/google"; // Add PT_Sans
import "./globals.css";

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
  title: "Cognition - Interactive AI Learning", // Keep existing metadata
  description: "Learn complex topics visually with an interactive AI interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Update body className and add texture div */}
      <body
        className={`${nunito.variable} ${ptSans.variable} antialiased relative`}
      >
        <div className="texture" /> 
        {children}
      </body>
    </html>
  );
}
