"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type User } from "@/lib/db";
import LogoutButton from "./LogoutButton";

type Item = { href: string; label: string; icon: string };

const BASE_ITEMS: Item[] = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/matches", label: "Partidos", icon: "⚽" },
  { href: "/bracket", label: "Bracket", icon: "🗺️" },
  { href: "/leaderboard", label: "Tabla", icon: "🏆" },
  { href: "/plantilla", label: "Plantilla", icon: "👕" },
  { href: "/sedes", label: "Sedes", icon: "🏟️" },
];

export default function NavBar({ user }: { user: User }) {
  const pathname = usePathname();
  const items = user.is_admin
    ? [...BASE_ITEMS, { href: "/admin", label: "Admin", icon: "🛠️" }]
    : BASE_ITEMS;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Barra superior */}
      <header className="bg-brand text-white sticky top-0 z-20 shadow-md">
        <div className="h-1 bg-gradient-to-r from-brand-dark via-white to-mxred" />
        <nav className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="font-extrabold whitespace-nowrap">
            🇲🇽 <span className="hidden xs:inline">Mundial</span> 2026
          </Link>

          {/* Enlaces en línea (solo tablet/escritorio) */}
          <div className="hidden md:flex items-center gap-4">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`text-sm hover:text-white transition ${
                  isActive(it.href) ? "text-white font-semibold" : "text-white/80"
                }`}
              >
                {it.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-white/80 hidden sm:inline max-w-[8rem] truncate">
              {user.name}
            </span>
            <LogoutButton />
          </div>
        </nav>
      </header>

      {/* Barra inferior de pestañas (solo móvil) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.06)] pb-safe">
        <div className="flex">
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] ${
                  active ? "text-brand font-semibold" : "text-gray-500"
                }`}
              >
                <span className="text-xl leading-none">{it.icon}</span>
                <span>{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
