import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MainLayout } from "../components/templates/MainLayout";
import { Login } from "@/components/organisms/login/login";

export default async function Home() {
  const cookieStore = await cookies();

  if (cookieStore.get("sid")?.value) {
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
