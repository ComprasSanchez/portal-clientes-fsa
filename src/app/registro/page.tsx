import { Suspense } from "react";
import RegistroForm from "@/components/organisms/auth-nuevo/registro-form/registro-form";
import { exigirLoginNuevo } from "../ingresar/_lib/guard";

export default function RegistroPage() {
  exigirLoginNuevo();
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  );
}
