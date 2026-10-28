import { IngresarCodigoClient } from "./_IngresarCodigoClient";
import { exigirLoginNuevo } from "../_lib/guard";

export default function IngresarCodigoPage() {
  exigirLoginNuevo();
  return <IngresarCodigoClient />;
}
