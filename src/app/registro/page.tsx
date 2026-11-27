import { Suspense } from "react";
import RegistroForm from "@/components/organisms/auth-nuevo/registro-form/registro-form";
import { entrarSiYaHaySesion, exigirLoginNuevo } from "../ingresar/_lib/guard";

type RegistroPageProps = {
  searchParams: Promise<{
    redirectTo?: string | string[];
    sessionExpired?: string | string[];
  }>;
};

export default async function RegistroPage({ searchParams }: RegistroPageProps) {
  exigirLoginNuevo();
  await entrarSiYaHaySesion(searchParams);
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  );
}
