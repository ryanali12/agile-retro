import { Button } from "../../shared/components/ui";
import { SessionStatusScreen } from "./SessionStatusScreen";

interface RetryActionProps {
  onRetry: () => void;
}

export function SessionConnectionLostState({ onRetry }: RetryActionProps) {
  return (
    <SessionStatusScreen
      badge="Offline"
      tone="danger"
      title="Lost the live board"
      description="Your cards are saved on the server. Reconnect to keep collaborating."
      action={
        <Button variant="secondary" onClick={onRetry}>
          Reconnect
        </Button>
      }
    />
  );
}

export function SessionBoardErrorState({ onRetry }: RetryActionProps) {
  return (
    <SessionStatusScreen
      badge="Live board"
      tone="danger"
      title="Unable to open the board"
      description="The session was found, but its cards could not be loaded."
      action={
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

export function SessionBoardLoadingState() {
  return (
    <SessionStatusScreen
      loading
      title="Joining the board"
      description="Connecting you to the live retrospective..."
    />
  );
}
