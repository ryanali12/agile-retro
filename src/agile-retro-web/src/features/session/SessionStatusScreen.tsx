import type { ReactNode } from "react";
import { Link } from "react-router";
import { Badge, type BadgeVariant } from "../../shared/components/ui";
import { ThemeToggle } from "../../shared/components/ThemeToggle";

interface SessionStatusScreenProps {
  badge?: string;
  tone?: BadgeVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  loading?: boolean;
}

/**
 * Full-page shell for the states around the board: loading, not found, errors
 * and join-required. Keeps the session route consistent without the marketing
 * layout.
 */
export function SessionStatusScreen({
  badge,
  tone = "neutral",
  title,
  description,
  action,
  loading = false,
}: SessionStatusScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[100rem] items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground"
            >
              AR
            </span>
            AgileRetro
          </Link>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div
          role={loading ? "status" : undefined}
          className="flex max-w-md flex-col items-center gap-3 text-center"
        >
          {loading ? (
            <span
              aria-hidden="true"
              className="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
            />
          ) : badge ? (
            <Badge variant={tone}>{badge}</Badge>
          ) : null}

          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>

          {description ? (
            <p className="text-balance text-muted">{description}</p>
          ) : null}

          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </main>
    </div>
  );
}
