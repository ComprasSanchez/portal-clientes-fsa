import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MainLayout } from "../components/templates/MainLayout";
import { Login } from "@/components/organisms/login/login";
import { recoverConvenioFromCanal } from "@/lib/convenio-link-recovery";
import { isLoginNuevoActivo } from "@/lib/auth-nuevo";

type HomePageProps = {
  searchParams: Promise<{
    identityLink?: string | string[];
    onboarding?: string | string[];
    googleOnboarding?: string | string[];
    token?: string | string[];
    verificationToken?: string | string[];
    onboardingToken?: string | string[];
    convenio?: string | string[];
    canal?: string | string[];
    redirectTo?: string | string[];
    sessionExpired?: string | string[];
    sucursalCodigo?: string | string[];
    sucursal?: string | string[];
    /** `clasico`: el login de siempre aunque esté prendido el nuevo (ej. "Olvidé mi contraseña"). */
    login?: string | string[];
  }>;
};

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default async function Home({ searchParams }: HomePageProps) {
  const cookieStore = await cookies();
  const query = await searchParams;
  const identityLink = Array.isArray(query.identityLink)
    ? query.identityLink[0]
    : query.identityLink;
  const onboarding = Array.isArray(query.onboarding)
    ? query.onboarding[0]
    : query.onboarding;
  const googleOnboarding = Array.isArray(query.googleOnboarding)
    ? query.googleOnboarding[0]
    : query.googleOnboarding;
  const token = Array.isArray(query.token) ? query.token[0] : query.token;
  const verificationToken = Array.isArray(query.verificationToken)
    ? query.verificationToken[0]
    : query.verificationToken;
  const onboardingToken = Array.isArray(query.onboardingToken)
    ? query.onboardingToken[0]
    : query.onboardingToken;
  const rawConvenio = Array.isArray(query.convenio) ? query.convenio[0] : query.convenio;
  const rawCanal = Array.isArray(query.canal) ? query.canal[0] : query.canal;
  // Recuperación de links/QR mal armados (ver src/lib/convenio-link-recovery.ts):
  // algunos vienen con el convenio embebido dentro del propio valor de `canal`
  // (ej. `?canal=CONVENIOS=CONCI CARPINELLA`) en vez de `?convenio=` por separado.
  // Sin esto, un usuario ya logueado que entra con ese link termina redirigido a
  // /socios liso, sin ningún rastro de que venía de un convenio.
  const recoveredConvenio = !rawConvenio?.trim()
    ? recoverConvenioFromCanal(rawCanal)
    : null;
  const convenioParam =
    rawConvenio?.trim().toUpperCase() || recoveredConvenio?.toUpperCase() || null;
  const canalParam = recoveredConvenio
    ? "CONVENIO"
    : rawCanal?.trim().toUpperCase() || null;
  const canalQuery = canalParam ? `&canal=${encodeURIComponent(canalParam)}` : "";
  const rawRedirectTo = Array.isArray(query.redirectTo) ? query.redirectTo[0] : query.redirectTo;

  const hasPendingGoogleOnboarding =
    onboarding === "google" ||
    googleOnboarding === "pending" ||
    googleOnboarding === "1";
  const hasPendingIdentityLink = identityLink === "pending";
  // Viene del SessionExpiryGuard: la sesión no sirve aunque quede la cookie.
  // Si igual se redirigiera a /socios, el guard volvería acá: bucle de recargas.
  const sessionExpiredParam = Array.isArray(query.sessionExpired)
    ? query.sessionExpired[0]
    : query.sessionExpired;
  const sessionExpired = sessionExpiredParam === "1";
  const hasVerificationToken = Boolean(
    token?.trim() || verificationToken?.trim() || onboardingToken?.trim(),
  );

  if (
    cookieStore.get("sid")?.value &&
    !sessionExpired &&
    !hasPendingIdentityLink &&
    !hasPendingGoogleOnboarding &&
    !hasVerificationToken
  ) {
    const safeRedirectTo =
      rawRedirectTo?.startsWith("/") && !rawRedirectTo.startsWith("//")
        ? rawRedirectTo
        : null;
    const target =
      safeRedirectTo ??
      (convenioParam
        ? `/socios?convenio=${encodeURIComponent(convenioParam)}${canalQuery}`
        : "/socios");
    redirect(target);
  }

  if (convenioParam && !rawRedirectTo) {
    const sociosTarget = `/socios?convenio=${convenioParam}${canalQuery}`;
    redirect(
      `/?convenio=${encodeURIComponent(convenioParam)}${canalQuery}&redirectTo=${encodeURIComponent(sociosTarget)}`,
    );
  }

  // Login nuevo (mismos pasos que la app). Los links del login de siempre
  // (verificación de email, alta con Google, vinculación pendiente) siguen acá.
  if (
    isLoginNuevoActivo() &&
    first(query.login) !== "clasico" &&
    !hasPendingIdentityLink &&
    !hasPendingGoogleOnboarding &&
    !hasVerificationToken
  ) {
    const params = new URLSearchParams();
    if (rawRedirectTo) params.set("redirectTo", rawRedirectTo);
    if (canalParam) params.set("canal", canalParam);
    if (convenioParam) params.set("convenio", convenioParam);
    const sucursal = first(query.sucursalCodigo) ?? first(query.sucursal);
    if (sucursal) params.set("sucursalCodigo", sucursal);
    const qs = params.toString();
    redirect(qs ? `/ingresar?${qs}` : "/ingresar");
  }

  return (
    <MainLayout>
      <div>
        <Login />
      </div>
    </MainLayout>
  );
}
