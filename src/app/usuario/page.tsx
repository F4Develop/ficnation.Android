import { Suspense } from "react";
import UserProfilePage from "./UsuarioClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-purple-400 font-bold">
          Cargando perfil...
        </div>
      }
    >
      <UserProfilePage />
    </Suspense>
  );
}
