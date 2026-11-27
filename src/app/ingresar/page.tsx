import { Suspense } from "react";
import LoginEmailStep from "@/components/organisms/auth-nuevo/login-email-step/login-email-step";
import { entrarSiYaHaySesion, exigirLoginNuevo } from "./_lib/guard";

type IngresarPageProps = {
  searchParams: Promise<{
    redirectTo?: string | string[];
    sessionExpired?: string | string[];
  }>;
};

export default async function IngresarPage({ searchParams }: IngresarPageProps) {
  exigirLoginNuevo();
  await entrarSiYaHaySesion(searchParams);
  return (
    <Suspense fallback={null}>
      <LoginEmailStep />
    </Suspense>
  );
}
