import { ConvenioRegistroView } from "@/components/organisms/convenio/ConvenioRegistroView";

export default async function ConvenioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const convenio = decodeURIComponent(slug).toUpperCase();

  return <ConvenioRegistroView convenio={convenio} />;
}
