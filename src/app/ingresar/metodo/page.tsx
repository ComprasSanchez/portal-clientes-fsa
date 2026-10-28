import LoginMetodoStep from "@/components/organisms/auth-nuevo/login-metodo-step/login-metodo-step";
import { exigirLoginNuevo } from "../_lib/guard";

export default function IngresarMetodoPage() {
  exigirLoginNuevo();
  return <LoginMetodoStep />;
}
