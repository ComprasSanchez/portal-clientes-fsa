import { RegistroVerificarClient } from "./_RegistroVerificarClient";
import { exigirLoginNuevo } from "../../ingresar/_lib/guard";

export default function RegistroVerificarPage() {
  exigirLoginNuevo();
  return <RegistroVerificarClient />;
}
