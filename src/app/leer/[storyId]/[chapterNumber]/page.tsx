import { Suspense } from "react";
import LeerClient from "./LeerClient";

export async function generateStaticParams() {
  return [{ storyId: "preview", chapterNumber: "1" }];
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">
          Cargando lector...
        </div>
      }
    >
      <LeerClient />
    </Suspense>
  );
}
