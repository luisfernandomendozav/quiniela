import Link from "next/link";
import { type User } from "@/lib/db";
import LogoutButton from "./LogoutButton";

export default function NavBar({ user }: { user: User }) {
  return (
    <header className="bg-brand text-white sticky top-0 z-10 shadow-md">
      <div className="h-1 bg-gradient-to-r from-brand-dark via-white to-mxred" />
      <nav className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="font-extrabold mr-2 whitespace-nowrap">
          🇲🇽 Mundial 2026
        </Link>
        <Link href="/matches" className="text-sm text-white/90 hover:text-white">
          Partidos
        </Link>
        <Link href="/leaderboard" className="text-sm text-white/90 hover:text-white">
          Tabla
        </Link>
        <Link href="/plantilla" className="text-sm text-white/90 hover:text-white">
          Plantilla
        </Link>
        <Link href="/sedes" className="text-sm text-white/90 hover:text-white">
          Sedes
        </Link>
        {user.is_admin && (
          <Link href="/admin" className="text-sm text-white/90 hover:text-white">
            Admin
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-white/80 hidden sm:inline">{user.name}</span>
          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}
