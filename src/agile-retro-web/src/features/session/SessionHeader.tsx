import { Link } from "react-router";
import { Badge, Button } from "../../shared/components/ui";
import { ThemeToggle } from "../../shared/components/ThemeToggle";
import { getInitials } from "../../shared/utils/initials";
import { ShareIcon, UsersIcon } from "../../shared/components/icons";

interface SessionHeaderProps {
  sessionName: string;
  code: string;
  participantName: string;
  participantsCount: number;
  onShare: () => void;
  onShowParticipants: () => void;
}

export function SessionHeader({
  sessionName,
  code,
  participantName,
  participantsCount,
  onShare,
  onShowParticipants,
}: SessionHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[100rem] items-center gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground"
          >
            AR
          </span>
          <span className="hidden sm:inline">AgileRetro</span>
        </Link>

        <div aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{sessionName}</span>
          <Badge
            variant="neutral"
            className="hidden shrink-0 font-mono sm:inline-flex"
          >
            {code}
          </Badge>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onShowParticipants}
            aria-label={`Show active participants (${participantsCount})`}
          >
            <UsersIcon className="size-4" />
            <span className="hidden sm:inline">Participants</span>
            <span className="rounded-full bg-surface-muted px-1.5 text-xs tabular-nums text-text">
              {participantsCount}
            </span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onShare}
            className="hidden sm:inline-flex"
          >
            <ShareIcon className="size-4" />
            Share
          </Button>

          <div className="hidden items-center gap-2 md:flex">
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
            >
              {getInitials(participantName)}
            </span>
            <span className="max-w-32 truncate text-sm text-muted">
              {participantName}
            </span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
