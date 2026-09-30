import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

// Goes on <html>: theme.css resolves --font-sans there, so variables set on <body> fall back to the system font.
export const fontVariables = `${GeistSans.variable} ${GeistMono.variable}`;
