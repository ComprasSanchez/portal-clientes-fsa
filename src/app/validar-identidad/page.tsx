import { Suspense } from "react";
import ValidarIdentidad from "@/components/organisms/auth-nuevo/validar-identidad/validar-identidad";

/** Cuenta con sesión iniciada pero sin vincular a su DNI (la pide el guard del portal). */
export default function ValidarIdentidadPage() {
  return (
    <Suspense fallback={null}>
      <ValidarIdentidad />
    </Suspense>
  );
}
