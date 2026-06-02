import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MainLayout } from "../components/templates/MainLayout";
import { Login } from "@/components/organisms/login/login";

type HomePageProps = {
  searchParams: Promise<{
    identityLink?: string | string[];
    onboarding?: string | string[];
    googleOnboarding?: string | string[];
    token?: string | string[];
    verificationToken?: string | string[];
    onboardingToken?: string | string[];
    convenio?: string | string[];
    redirectTo?: string | string[];
  }>;
};

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
  const convenioParam = rawConvenio?.trim().toUpperCase() || null;
  const rawRedirectTo = Array.isArray(query.redirectTo) ? query.redirectTo[0] : query.redirectTo;

  const hasPendingGoogleOnboarding =
    onboarding === "google" ||
    googleOnboarding === "pending" ||
    googleOnboarding === "1";
  const hasPendingIdentityLink = identityLink === "pending";
  const hasVerificationToken = Boolean(
    token?.trim() || verificationToken?.trim() || onboardingToken?.trim(),
  );

  if (
    cookieStore.get("sid")?.value &&
    !hasPendingIdentityLink &&
    !hasPendingGoogleOnboarding &&
    !hasVerificationToken
  ) {
    const target = convenioParam
      ? `/socios?convenio=${encodeURIComponent(convenioParam)}`
      : "/socios";
    redirect(target);
  }

  if (convenioParam && !rawRedirectTo) {
    redirect(
      `/?convenio=${encodeURIComponent(convenioParam)}&redirectTo=${encodeURIComponent(`/socios?convenio=${convenioParam}`)}`,
    );
  }

  return (
    <MainLayout>
      <div>
        <Login />
      </div>
    </MainLayout>
  );
}
