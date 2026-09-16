import { Suspense } from "react";
import MobileStoryDetailPage from "@/app/m/historia/page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">
          Cargando detalles de la historia...
        </div>
      }
    >
      <MobileStoryDetailPage />
    </Suspense>
  );
}
