import { Badge } from "../../shared/components/ui";
import { connectionBadges } from "./connectionBadges";
import type { BoardConnectionStatus } from "../board/useBoardSession";

interface SessionConnectionBadgeProps {
  status: BoardConnectionStatus;
}

export function SessionConnectionBadge({
  status,
}: SessionConnectionBadgeProps) {
  const badge = connectionBadges[status];

  return (
    <Badge variant={badge.variant} title={badge.title}>
      {badge.label}
    </Badge>
  );
}
