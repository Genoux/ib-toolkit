import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Goes on <html>: theme.css resolves --font-sans there, so variables set on <body> fall back to the system font.
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
