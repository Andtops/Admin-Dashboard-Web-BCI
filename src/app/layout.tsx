import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { ApolloClientProvider } from "@/providers/apollo-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { LenisProvider } from "@/providers/lenis-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ReAuthProvider } from "@/contexts/re-auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { ReAuthManager } from "@/components/auth/re-auth-manager";
import { Toaster } from "@/components/ui/sonner";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Benzochem Admin Dashboard",
  description: "Admin dashboard for Benzochem Industries - Manage users, products, and system settings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LenisProvider>
          <ConvexClientProvider>
            <ApolloClientProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                >
              <AuthProvider>
                  <ReAuthProvider>
                    <NotificationProvider>
                      {children}
                      <ReAuthManager />
                      <Toaster />
                      <ScrollToTop />
                    </NotificationProvider>
                  </ReAuthProvider>
                </AuthProvider>
              </ThemeProvider>
            </ApolloClientProvider>
          </ConvexClientProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
