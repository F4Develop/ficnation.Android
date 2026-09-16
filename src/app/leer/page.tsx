import { Suspense } from "react";
import MobileReaderPage from "@/app/m/leer/page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">
          Cargando lector FicNation...
        </div>
      }
    >
      <MobileReaderPage />
    </Suspense>
  );
}
