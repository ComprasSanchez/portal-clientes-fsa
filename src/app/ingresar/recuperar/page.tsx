import RecuperarEmailStep from "@/components/organisms/auth-nuevo/recuperar-email-step/recuperar-email-step";
import { exigirLoginNuevo } from "../_lib/guard";

export default function RecuperarPage() {
  exigirLoginNuevo();
  return <RecuperarEmailStep />;
}
