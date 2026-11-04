import { Badge, Button } from "../../shared/components/ui";
import { cn } from "../../shared/utils/cn";
import { boardColumns } from "./boardColumns";
import { PencilIcon, PlusIcon } from "../../shared/components/icons";
import { getInitials } from "../../shared/utils/initials";
import type { BoardCard, BoardColumnId } from "./api";

interface BoardProps {
  cards: BoardCard[];
  currentParticipantId: string;
  onAddCard: (columnId: BoardColumnId) => void;
  onEditCard: (card: BoardCard) => void;
  disabled?: boolean;
}

function BoardCardItem({
  card,
  isCurrentParticipant,
  onEdit,
}: {
  card: BoardCard;
  isCurrentParticipant: boolean;
  onEdit?: () => void;
}) {
  return (
    <article
      className={cn(
        "rounded-lg border bg-bg p-3 shadow-sm",
        isCurrentParticipant
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/10"
          : "border-border",
      )}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {card.text}
      </p>

      <footer className="mt-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary"
        >
          {getInitials(card.authorName)}
        </span>
        <span className="truncate text-xs text-muted">{card.authorName}</span>
        {isCurrentParticipant ? (
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <Badge variant="primary">You</Badge>
            {onEdit ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-7 px-2 text-xs text-muted"
                aria-label="Edit your card"
              >
                <PencilIcon className="size-3.5" />
                Edit
              </Button>
            ) : null}
          </span>
        ) : null}
      </footer>
    </article>
  );
}

export function Board({
  cards,
  currentParticipantId,
  onAddCard,
  onEditCard,
  disabled = false,
}: BoardProps) {
  return (
    <div className="grid flex-1 auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {boardColumns.map((column) => {
        const columnCards = cards.filter(
          (card) => card.columnId === column.id,
        );

        return (
          <section
            key={column.id}
            aria-labelledby={`column-${column.id}`}
            className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
          >
            <div
              aria-hidden="true"
              className={cn("h-1 w-full", column.accentClassName)}
            />

            <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    column.accentClassName,
                  )}
                />
                <div className="min-w-0">
                  <h2
                    id={`column-${column.id}`}
                    className="truncate text-sm font-semibold"
                  >
                    {column.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {column.description}
                  </p>
                </div>
              </div>

              <Badge variant="neutral" className="shrink-0 tabular-nums">
                {columnCards.length}
              </Badge>
            </header>

            <div className="flex flex-1 flex-col gap-2 p-3">
              {columnCards.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm font-medium text-muted">No cards yet</p>
                  <p className="text-xs text-muted">Add the first thought.</p>
                </div>
              ) : (
                columnCards.map((card) => (
                  <BoardCardItem
                    key={card.id}
                    card={card}
                    isCurrentParticipant={
                      card.participantId === currentParticipantId
                    }
                    onEdit={
                      disabled ? undefined : () => onEditCard(card)
                    }
                  />
                ))
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddCard(column.id)}
                disabled={disabled}
                className="mt-auto w-full justify-center border border-dashed border-border text-muted hover:border-primary/40 hover:text-text"
              >
                <PlusIcon className="size-4" />
                Add card
              </Button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
