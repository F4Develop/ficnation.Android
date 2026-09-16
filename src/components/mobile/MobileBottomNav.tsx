"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PenTool, Bookmark, Bell, User } from "lucide-react";
import { triggerHaptic } from "@/lib/nativeBridge";

export type MobileTab = "home" | "explore" | "write" | "notifications" | "library" | "profile";

interface MobileBottomNavProps {
  activeTab?: MobileTab;
  onSelectTab?: (tab: MobileTab) => void;
}

export function MobileBottomNav({ activeTab, onSelectTab }: MobileBottomNavProps) {
  const pathname = usePathname();

  const getIsActive = (tabName: MobileTab) => {
    if (activeTab) return activeTab === tabName;
    if (tabName === "home") return pathname === "/dashboard" || pathname === "/" || pathname === "/m";
    if (tabName === "explore") return pathname?.startsWith("/explorar") || pathname?.startsWith("/m/explorar");
    if (tabName === "write") return pathname?.startsWith("/escribir") || pathname?.startsWith("/m/escribir");
    if (tabName === "notifications") return pathname?.startsWith("/notificaciones") || pathname?.startsWith("/m/notificaciones");
    if (tabName === "library") return pathname?.startsWith("/biblioteca") || pathname?.startsWith("/m/biblioteca");
    if (tabName === "profile") return pathname?.startsWith("/perfil") || pathname?.startsWith("/m/perfil");
    return false;
  };

  const navItems: {
    id: MobileTab;
    label: string;
    icon: any;
    href: string;
    isCenter?: boolean;
    isActive: boolean;
  }[] = [
    {
      id: "home",
      label: "Inicio",
      icon: Home,
      href: "/dashboard",
      isActive: getIsActive("home"),
    },
    {
      id: "explore",
      label: "Explorar",
      icon: Compass,
      href: "/explorar",
      isActive: getIsActive("explore"),
    },
    {
      id: "write",
      label: "Escribir",
      icon: PenTool,
      href: "/escribir",
      isCenter: true,
      isActive: getIsActive("write"),
    },
    {
      id: "notifications",
      label: "Notificaciones",
      icon: Bell,
      href: "/notificaciones",
      isActive: getIsActive("notifications"),
    },
    {
      id: "library",
      label: "Biblioteca",
      icon: Bookmark,
      href: "/biblioteca",
      isActive: getIsActive("library"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f19]/95 backdrop-blur-xl border-t border-purple-500/20 px-2 pb-safe select-none shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;

          const handleClick = (e: React.MouseEvent) => {
            triggerHaptic("light");
            if (onSelectTab) {
              e.preventDefault();
              onSelectTab(item.id);
            }
          };

          if (item.isCenter) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleClick}
                className="relative -top-3.5 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/40 border border-white/20 group-hover:scale-105 transition-all">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-purple-300 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleClick}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 ${
                item.isActive
                  ? "text-purple-400 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    item.isActive ? "scale-110 text-purple-400" : ""
                  }`}
                />
                {item.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/80" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
