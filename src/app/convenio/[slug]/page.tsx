import { ConvenioRegistroView } from "@/components/organisms/convenio/ConvenioRegistroView";

export default async function ConvenioPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ canal?: string }>;
}) {
  const { slug } = await params;
  const { canal } = await searchParams;
  const convenio = decodeURIComponent(slug).toUpperCase();

  return <ConvenioRegistroView convenio={convenio} canal={canal} />;
}
