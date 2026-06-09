import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PLAYERS, STARS, photo } from "@/lib/players";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const stars = STARS.map((slug) => PLAYERS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ name: p.name, src: photo(p.slug) }))
    .filter((p) => p.src)
    .slice(0, 6);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand via-brand-light to-mxred">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🇲🇽⚽</div>
          <h1 className="text-2xl font-extrabold text-brand">Quiniela Mundial 2026</h1>
          <p className="text-gray-500 text-sm mt-1">Pronostica al Tri y compite con todos</p>
          <div className="mt-2 h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-brand via-gray-300 to-mxred" />
        </div>

        <div className="flex justify-center -space-x-3 mb-6">
          {stars.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.name}
              src={p.src!}
              alt={p.name}
              title={p.name}
              className="w-11 h-11 rounded-full object-cover object-top border-2 border-white shadow ring-1 ring-brand/20"
            />
          ))}
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
