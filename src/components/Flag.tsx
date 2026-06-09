import { flagSrc } from "@/lib/teams";

// Muestra la bandera de una selección como imagen local.
// Si no hay imagen, cae a un emoji de bandera blanca.
export default function Flag({
  team,
  className = "h-4 w-6",
}: {
  team: string;
  className?: string;
}) {
  const src = flagSrc(team);
  if (!src) return <span className={className}>🏳️</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Bandera de ${team}`}
      title={team}
      loading="lazy"
      className={`inline-block rounded-[2px] border border-black/10 object-cover align-middle ${className}`}
    />
  );
}
