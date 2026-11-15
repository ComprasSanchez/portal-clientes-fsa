import RecuperarClaveStep from "@/components/organisms/auth-nuevo/recuperar-clave-step/recuperar-clave-step";
import { exigirLoginNuevo } from "../../_lib/guard";

export default function RecuperarNuevaPage() {
  exigirLoginNuevo();
  return <RecuperarClaveStep />;
}
