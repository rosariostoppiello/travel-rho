import { TripProvider } from "@/components/TripProvider";
import { TripShell } from "@/components/TripShell";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <TripProvider id={id}>
      <TripShell id={id}>{children}</TripShell>
    </TripProvider>
  );
}
