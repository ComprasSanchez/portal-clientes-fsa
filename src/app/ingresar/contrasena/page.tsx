import LoginPasswordStep from "@/components/organisms/auth-nuevo/login-password-step/login-password-step";
import { exigirLoginNuevo } from "../_lib/guard";

export default function IngresarContrasenaPage() {
  exigirLoginNuevo();
  return <LoginPasswordStep />;
}
