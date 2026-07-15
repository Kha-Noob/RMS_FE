import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard } from "@/components/RouteGuard";
import { ToastContainer } from "@/components/Toast";
import { Chatbot } from "@/components/Chatbot";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
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
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-[#f8f9fc] text-slate-800 antialiased">
        <LanguageProvider>
          <AuthProvider>
            <RouteGuard>
              {children}
            </RouteGuard>
            <ToastContainer />
            <Chatbot />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
