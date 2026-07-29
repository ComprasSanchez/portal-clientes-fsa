"use client";

import dynamic from "next/dynamic";

const CoraPageClient = dynamic(
  () => import("./_CoraPageClient").then((m) => ({ default: m.CoraPageClient })),
  { ssr: false },
);

export default function Page() {
  return <CoraPageClient />;
}
