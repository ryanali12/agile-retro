import { Link, NavLink, Outlet } from "react-router";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { cn } from "../shared/utils/cn";

const navItems = [{ to: "/design", label: "Design system" }];

export function BaseLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-5">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground"
            >
              AR
            </span>
            AgileRetro
          </NavLink>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 sm:flex"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-surface-muted font-medium text-text"
                      : "text-muted hover:text-text",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>AgileRetro — retrospectives that end with action.</p>
          <nav aria-label="Footer" className="flex items-center gap-4">
            <Link to="/design" className="transition-colors hover:text-text">
              Design system
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
