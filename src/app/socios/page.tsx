"use client";

import dynamic from "next/dynamic";

const SociosPageClient = dynamic(
  () => import("./_SociosPageClient").then((m) => ({ default: m.SociosPageClient })),
  { ssr: false },
);

export default function Page() {
  return <SociosPageClient />;
}
