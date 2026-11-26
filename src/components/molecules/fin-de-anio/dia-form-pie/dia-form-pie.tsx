import { Save } from "lucide-react";
import Alert from "@/components/atoms/alert/alert";
import PortalButton from "@/components/atoms/button/button";

type DiaFormPieProps = {
  error?: string | null;
  guardando: boolean;
};

/** Error del guardado y botón "Guardar" de los formularios del calendario. */
export default function DiaFormPie({ error, guardando }: DiaFormPieProps) {
  return (
    <>
      {error && <Alert color="error">{error}</Alert>}
      <PortalButton type="submit" tone="socios" loading={guardando} icon={<Save size={18} />}>
        Guardar
      </PortalButton>
    </>
  );
}
