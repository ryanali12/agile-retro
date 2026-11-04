import type { BadgeVariant } from "../../shared/components/ui";
import type { BoardConnectionStatus } from "../board/useBoardSession";

export const connectionBadges: Record<
  BoardConnectionStatus,
  { variant: BadgeVariant; label: string; title: string }
> = {
  connected: {
    variant: "success",
    label: "Live",
    title: "Changes appear for everyone as they happen.",
  },
  connecting: {
    variant: "neutral",
    label: "Connecting",
    title: "Opening the live board connection.",
  },
  reconnecting: {
    variant: "warning",
    label: "Reconnecting",
    title: "The connection dropped. Trying to reconnect.",
  },
  disconnected: {
    variant: "danger",
    label: "Offline",
    title: "The live connection is closed.",
  },
};
