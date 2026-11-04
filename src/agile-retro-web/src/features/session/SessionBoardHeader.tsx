import { Button } from "../../shared/components/ui";
import { PlusIcon, ShareIcon } from "../../shared/components/icons";
import { SessionConnectionBadge } from "./SessionConnectionBadge";
import type { BoardConnectionStatus } from "../board/useBoardSession";

interface SessionBoardHeaderProps {
  sessionName: string;
  code: string;
  cardCount: number;
  participantsCount: number;
  connectionStatus: BoardConnectionStatus;
  canAddCards: boolean;
  onShare: () => void;
  onAddCard: () => void;
}

export function SessionBoardHeader({
  sessionName,
  code,
  cardCount,
  participantsCount,
  connectionStatus,
  canAddCards,
  onShare,
  onAddCard,
}: SessionBoardHeaderProps) {
  const cardLabel = cardCount === 1 ? "card" : "cards";
  const onlineLabel = participantsCount === 1 ? "1 online" : `${participantsCount} online`;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {sessionName}
          </h1>
          <SessionConnectionBadge status={connectionStatus} />
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <span>
            Code{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-text">
              {code}
            </code>
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {cardCount} {cardLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{onlineLabel}</span>
          <span aria-hidden="true">·</span>
          <span>
            {canAddCards
              ? "Changes appear live for everyone."
              : "Changes will sync when the connection returns."}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={onShare} className="sm:hidden">
          <ShareIcon className="size-4" />
          Share
        </Button>
        <Button onClick={onAddCard} disabled={!canAddCards}>
          <PlusIcon className="size-4" />
          Add card
        </Button>
      </div>
    </div>
  );
}
