import { redirect } from "next/navigation";

/** El catálogo AutoBeauty vive dentro de /socios (con el menú del portal). */
export default function BeautyPage() {
  redirect("/socios?view=beauty");
}
