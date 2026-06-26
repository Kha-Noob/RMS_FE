import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "@/components/Toast";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RMS - Restaurant Management System",
  description: "Professional Restaurant Management System with POS, KDS, HR, Inventory, and Procurement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#f8f9fc] text-slate-800 antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
