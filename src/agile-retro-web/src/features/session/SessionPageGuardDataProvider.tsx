import { StatusCodes } from "http-status-codes";
import { createContext, useContext, useState, type ReactNode } from "react";
import { ApiError } from "../../shared/api/client";
import { useQueries } from "@tanstack/react-query";
import { useSessionParticipants } from "../participant/SessionParticipantProvider";
import { Link, useParams } from "react-router";
import { getSessionByCode } from "./api";
import { getParticipantByIdAndSessionCode } from "../participant/api";
import { Button, buttonStyles } from "../../shared/components/ui";
import JoinSessionDrawer from "../participant/JoinSessionDrawer";
import { SessionStatusScreen } from "./SessionStatusScreen";

type SessionData = {
  id: string;
  code: string;
  name: string;
  participantName: string;
  participantId: string;
};

const SessionDataProvider = createContext<SessionData | null>(null);

function BackHomeAction() {
  return (
    <Link
      to="/"
      className={buttonStyles({ variant: "secondary", size: "md" })}
    >
      Back to home
    </Link>
  );
}

function SessionPageGuardDataProvider({ children }: { children: ReactNode }) {
  const { code } = useParams();
  const { getParticipantId, removeParticipant } = useSessionParticipants();
  const sessionCode = code?.trim();
  const participantId = sessionCode ? getParticipantId(sessionCode) : undefined;
  const [joinOpen, setJoinOpen] = useState(true);

  const retryUnlessNotFound = (failureCount: number, error: Error) =>
    !(error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) &&
    failureCount < 2;

  const [sessionQuery, participantQuery] = useQueries({
    queries: [
      {
        queryKey: ["sessionByCode", sessionCode],
        queryFn: () => getSessionByCode(sessionCode!),
        enabled: !!sessionCode,
        retry: retryUnlessNotFound,
      },
      {
        queryKey: ["participantByIdAndSessionCode", sessionCode, participantId],
        queryFn: () =>
          getParticipantByIdAndSessionCode(sessionCode!, participantId!),
        enabled: !!sessionCode && !!participantId,
        retry: retryUnlessNotFound,
      },
    ],
  });

  if (!sessionCode) {
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

  if (sessionQuery.isLoading) {
    return (
      <SessionStatusScreen
        loading
        title="Loading session"
        description="Opening the board..."
      />
    );
  }

  if (sessionQuery.isError) {
    if (
      sessionQuery.error instanceof ApiError &&
      sessionQuery.error.status === StatusCodes.NOT_FOUND
    ) {
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

    return (
      <SessionStatusScreen
        badge="Error"
        tone="danger"
        title="Unable to load this session"
        description="The board could not be reached. Check your connection and try again."
        action={
          <Button variant="secondary" onClick={() => sessionQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const session = sessionQuery.data;

  if (!session) {
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

  // Participant has not joined this session yet.
  if (!participantId) {
    return (
      <>
        <SessionStatusScreen
          badge="Join required"
          title={`Join ${session.name}`}
          description="Add your display name to open the board and start adding cards."
          action={
            <Button onClick={() => setJoinOpen(true)}>Join this session</Button>
          }
        />
        <JoinSessionDrawer
          code={session.code}
          isOpen={joinOpen}
          onClose={() => setJoinOpen(false)}
        />
      </>
    );
  }

  if (participantQuery.isLoading) {
    return (
      <SessionStatusScreen
        loading
        title="Checking your spot"
        description="Making sure you can add cards to this session."
      />
    );
  }

  if (participantQuery.isError) {
    if (
      participantQuery.error instanceof ApiError &&
      participantQuery.error.status === StatusCodes.NOT_FOUND
    ) {
      return (
        <SessionStatusScreen
          badge="Join again"
          tone="warning"
          title="Your spot in this session expired"
          description="Join again with your display name to get back to the board."
          action={
            <Button
              onClick={() => {
                removeParticipant(session.code);
                setJoinOpen(true);
              }}
            >
              Join this session
            </Button>
          }
        />
      );
    }

    return (
      <SessionStatusScreen
        badge="Error"
        tone="danger"
        title="Unable to check your spot"
        description="We could not confirm your participant details. Try again."
        action={
          <Button
            variant="secondary"
            onClick={() => participantQuery.refetch()}
          >
            Try again
          </Button>
        }
      />
    );
  }

  const participant = participantQuery.data;

  if (!participant) {
    return (
      <SessionStatusScreen
        badge="Join again"
        tone="warning"
        title="Your spot in this session expired"
        description="Join again with your display name to get back to the board."
        action={
          <Button
            onClick={() => {
              removeParticipant(session.code);
              setJoinOpen(true);
            }}
          >
            Join this session
          </Button>
        }
      />
    );
  }

  return (
    <SessionDataProvider.Provider
      value={{
        id: session.id,
        name: session.name,
        code: session.code,
        participantId: participant.id,
        participantName: participant.name,
      }}
    >
      {children}
    </SessionDataProvider.Provider>
  );
}

export function useSessionPageDataProvider() {
  const context = useContext(SessionDataProvider);

  if (!context) {
    throw new Error(
      "useSessionPageDataProvider must be used within SessionPageGuardDataProvider",
    );
  }

  return context;
}

export default SessionPageGuardDataProvider;
