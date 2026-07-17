import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeDebtAI - AI-Powered Technical Debt Analyzer",
  description: "Combine Radon static code analysis with intelligent AI-generated refactoring suggestions to eliminate codebase technical debt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#0B0F19] text-slate-100 font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
