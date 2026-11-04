import { Badge, Drawer } from "../../shared/components/ui";
import type { BoardParticipant } from "./api";
import { getInitials } from "../../shared/utils/initials";
import type { BoardConnectionStatus } from "./useBoardSession";

interface ParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participants: BoardParticipant[];
  currentParticipantId: string;
  connectionStatus: BoardConnectionStatus;
}

export function ParticipantsDrawer({
  isOpen,
  onClose,
  participants,
  currentParticipantId,
  connectionStatus,
}: ParticipantsDrawerProps) {
  const ordered = [...participants].sort((left, right) => {
    if (left.participantId === currentParticipantId) return -1;
    if (right.participantId === currentParticipantId) return 1;

    return left.name.localeCompare(right.name);
  });

  const count = ordered.length;

  return (
    <Drawer
      isOpen={isOpen}
      close={onClose}
      title="Active participants"
      subTitle={
        count === 1 ? "1 person is here right now." : `${count} people are here right now.`
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Everyone with the board open in this session. The list updates live as
          people join and leave.
        </p>

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm font-medium text-muted">No one is online</p>
            <p className="text-xs text-muted">
              Participants will appear as they open the board.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {ordered.map((participant) => {
              const isCurrent = participant.participantId === currentParticipantId;

              return (
                <li
                  key={participant.participantId}
                  className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {getInitials(participant.name)}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {participant.name}
                  </span>

                  {isCurrent ? (
                    <Badge variant="primary" className="shrink-0">
                      You
                    </Badge>
                  ) : null}

                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-success">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full bg-success"
                    />
                    <span className="sr-only">Online</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {connectionStatus !== "connected" ? (
          <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            Presence updates resume when the live connection returns.
          </p>
        ) : null}
      </div>
    </Drawer>
  );
}
