"use client";

import { Suspense } from "react";
import MobileNotificationsPage from "@/app/m/notificaciones/page";

export default function NotificacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">
          Cargando notificaciones...
        </div>
      }
    >
      <MobileNotificationsPage />
    </Suspense>
  );
}
