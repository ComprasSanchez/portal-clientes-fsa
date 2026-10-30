import { Suspense } from "react";
import LoginEmailStep from "@/components/organisms/auth-nuevo/login-email-step/login-email-step";
import { exigirLoginNuevo } from "./_lib/guard";

export default function IngresarPage() {
  exigirLoginNuevo();
  return (
    <Suspense fallback={null}>
      <LoginEmailStep />
    </Suspense>
  );
}
