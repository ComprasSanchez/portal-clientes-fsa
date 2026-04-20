import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MainLayout } from "../components/templates/MainLayout";
import { Login } from "@/components/organisms/login/login";

type HomePageProps = {
  searchParams: Promise<{
    onboarding?: string | string[];
    googleOnboarding?: string | string[];
    token?: string | string[];
    verificationToken?: string | string[];
    onboardingToken?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const cookieStore = await cookies();
  const query = await searchParams;
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
  const hasPendingGoogleOnboarding =
    onboarding === "google" ||
    googleOnboarding === "pending" ||
    googleOnboarding === "1";
  const hasVerificationToken = Boolean(
    token?.trim() || verificationToken?.trim() || onboardingToken?.trim(),
  );

  if (
    cookieStore.get("sid")?.value &&
    !hasPendingGoogleOnboarding &&
    !hasVerificationToken
  ) {
    redirect("/socios");
  }

  return (
    <MainLayout>
      <div>
        <Login />
      </div>
    </MainLayout>
  );
}
