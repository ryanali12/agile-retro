import { Link } from "react-router";
import { Button, buttonStyles } from "../../shared/components/ui";
import JoinSessionDrawer from "../participant/JoinSessionDrawer";
import { SessionStatusScreen } from "./SessionStatusScreen";

function BackHomeAction() {
  return (
    <Link to="/" className={buttonStyles({ variant: "secondary", size: "md" })}>
      Back to home
    </Link>
  );
}

export function MissingLinkScreen() {
  return (
    <SessionStatusScreen
      badge="Missing link"
      tone="danger"
      title="This session link is incomplete"
      description="Open the link your facilitator shared, or start a new session."
      action={<BackHomeAction />}
    />
  );
}

export function SessionNotFoundScreen() {
  return (
    <SessionStatusScreen
      badge="Not found"
      tone="danger"
      title="Session not found"
      description="The link may be mistyped or the session may have been removed."
      action={<BackHomeAction />}
    />
  );
}

export function SessionLoadingScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <SessionStatusScreen loading title={title} description={description} />;
}

export function JoinRequiredScreen({
  sessionName,
  sessionCode,
  isJoinOpen,
  onOpenJoin,
  onCloseJoin,
}: {
  sessionName: string;
  sessionCode: string;
  isJoinOpen: boolean;
  onOpenJoin: () => void;
  onCloseJoin: () => void;
}) {
  return (
    <>
      <SessionStatusScreen
        badge="Join required"
        title={`Join ${sessionName}`}
        description="Add your display name to open the board and start adding cards."
        action={<Button onClick={onOpenJoin}>Join this session</Button>}
      />
      <JoinSessionDrawer
        code={sessionCode}
        isOpen={isJoinOpen}
        onClose={onCloseJoin}
      />
    </>
  );
}

export function RejoinSessionScreen({ onRejoin }: { onRejoin: () => void }) {
  return (
    <SessionStatusScreen
      badge="Join again"
      tone="warning"
      title="Your spot in this session expired"
      description="Join again with your display name to get back to the board."
      action={<Button onClick={onRejoin}>Join this session</Button>}
    />
  );
}

export function RetryScreen({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <SessionStatusScreen
      badge="Error"
      tone="danger"
      title={title}
      description={description}
      action={
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}
