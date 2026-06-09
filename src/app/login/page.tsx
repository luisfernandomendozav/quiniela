import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand via-brand-light to-mxred">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🇲🇽⚽</div>
          <h1 className="text-2xl font-extrabold text-brand">Quiniela Mundial 2026</h1>
          <p className="text-gray-500 text-sm mt-1">Pronostica al Tri y compite con todos</p>
          <div className="mt-2 h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-brand via-gray-300 to-mxred" />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
