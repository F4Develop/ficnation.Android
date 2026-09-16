import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PresenceProvider } from "@/context/PresenceContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { StoryModalProvider } from "@/context/StoryModalContext";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { StoryDetailModal } from "@/components/stories/StoryDetailModal";
import { AppShell } from "@/components/layout/AppShell";
import { NativeAppBridge } from "@/components/native/NativeAppBridge";

export const metadata: Metadata = {
  title: "FicNation — Historias, Fanfics y Universos Ilimitados",
  description: "Descubre, lee y publica historias originales y fanfics en FicNation. Únete a una comunidad apasionada de autores y lectores.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FicNation",
  },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col relative transition-colors duration-200"
        style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
      >
        <AuthProvider>
          <PresenceProvider>
            <SettingsProvider>
              <StoryModalProvider>
                <AppShell>{children}</AppShell>
                <NativeAppBridge />
                <SettingsModal />
                <StoryDetailModal />
              </StoryModalProvider>
            </SettingsProvider>
          </PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
