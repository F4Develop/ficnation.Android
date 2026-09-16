"use client";

import { useEffect, useState } from "react";
import { initNativeBridge } from "@/lib/nativeBridge";
import { WifiOff, Wifi } from "lucide-react";

export function NativeAppBridge() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Inicializar Capacitor bridge
    initNativeBridge();

    // Detección de conectividad
    const handleNetworkChange = (e: any) => {
      const isConnected = e.detail?.connected ?? navigator.onLine;
      if (!isConnected) {
        setIsOffline(true);
        setShowReconnected(false);
      } else if (isOffline) {
        setIsOffline(false);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("ficnation_network_changed", handleNetworkChange);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("ficnation_network_changed", handleNetworkChange);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [isOffline]);

  return (
    <>
      {/* Banner flotante de Sin Conexión */}
      {isOffline && (
        <div className="fixed top-safe mt-2 inset-x-4 z-50 p-2.5 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-between shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sin conexión a internet. Leyendo en Modo Offline.</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
            Offline
          </span>
        </div>
      )}

      {/* Banner de Conexión Restablecida */}
      {showReconnected && (
        <div className="fixed top-safe mt-2 inset-x-4 z-50 p-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡Conexión restablecida! Sincronizando datos...</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
            Online
          </span>
        </div>
      )}
    </>
  );
}
