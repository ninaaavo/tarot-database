import { BookOpen, FileText, Library, Plus } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { usesLocalFallback } from "@/lib/repository";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Deck", icon: Library },
  { to: "/readings", label: "Readings", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/readings/new", label: "New", icon: Plus },
];

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/95">
        <div className="page-shell flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="inline-block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <h1 className="text-2xl font-semibold tracking-normal transition-colors hover:text-primary">Tarot Database</h1>
            </Link>
            <p className="text-sm text-muted-foreground">Personal card encyclopedia and reading journal</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      {usesLocalFallback() && (
        <div className="border-b border-primary/40 bg-primary/10 px-4 py-2 text-center text-sm text-primary">
          Supabase env vars are not set. Changes are saved in this browser until VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY are configured.
        </div>
      )}
      <Outlet />
    </div>
  );
}
