import { Suspense } from "react";
import HistoriaClient from "./HistoriaClient";

export async function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">
          Cargando historia...
        </div>
      }
    >
      <HistoriaClient />
    </Suspense>
  );
}
