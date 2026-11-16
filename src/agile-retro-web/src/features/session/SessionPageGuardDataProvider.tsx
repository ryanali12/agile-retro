import { useState, type ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { useParams } from "react-router";
import { useSessionParticipants } from "../participant/SessionParticipantProvider";
import {
  JoinRequiredScreen,
  MissingLinkScreen,
  RejoinSessionScreen,
  RetryScreen,
  SessionLoadingScreen,
  SessionNotFoundScreen,
} from "./SessionGuardStates";
import { SessionPageDataProvider } from "./SessionPageDataProvider";
import {
  isNotFound,
  liveKitTokenQueryOptions,
  participantQueryOptions,
  sessionByCodeQueryOptions,
} from "./sessionQueries";

const livekitUrl = import.meta.env.VITE_LIVEKIT_URL ?? "APP_LIVEKIT_URL";

function SessionPageGuardDataProvider({ children }: { children: ReactNode }) {
  const { code } = useParams();
  const { getParticipantId, removeParticipant } = useSessionParticipants();
  const sessionCode = code?.trim();
  const participantId = sessionCode ? getParticipantId(sessionCode) : undefined;
  const [joinOpen, setJoinOpen] = useState(true);

  const [sessionQuery, participantQuery, liveKitTokenQuery] = useQueries({
    queries: [
      sessionByCodeQueryOptions(sessionCode),
      participantQueryOptions(sessionCode, participantId),
      liveKitTokenQueryOptions(sessionCode, participantId),
    ],
  });

  const rejoinSession = (sessionCode: string) => {
    removeParticipant(sessionCode);
    setJoinOpen(true);
  };

  if (!sessionCode) {
    return <MissingLinkScreen />;
  }

  if (sessionQuery.isLoading) {
    return (
      <SessionLoadingScreen
        title="Loading session"
        description="Opening the board..."
      />
    );
  }

  if (sessionQuery.isError) {
    return isNotFound(sessionQuery.error) ? (
      <SessionNotFoundScreen />
    ) : (
      <RetryScreen
        title="Unable to load this session"
        description="The board could not be reached. Check your connection and try again."
        onRetry={() => sessionQuery.refetch()}
      />
    );
  }

  const session = sessionQuery.data;

  if (!session) {
    return <SessionNotFoundScreen />;
  }

  if (!participantId) {
    return (
      <JoinRequiredScreen
        sessionName={session.name}
        sessionCode={session.code}
        isJoinOpen={joinOpen}
        onOpenJoin={() => setJoinOpen(true)}
        onCloseJoin={() => setJoinOpen(false)}
      />
    );
  }

  if (participantQuery.isLoading) {
    return (
      <SessionLoadingScreen
        title="Checking your spot"
        description="Making sure you can add cards to this session."
      />
    );
  }

  if (participantQuery.isError) {
    return isNotFound(participantQuery.error) ? (
      <RejoinSessionScreen onRejoin={() => rejoinSession(session.code)} />
    ) : (
      <RetryScreen
        title="Unable to check your spot"
        description="We could not confirm your participant details. Try again."
        onRetry={() => participantQuery.refetch()}
      />
    );
  }

  const participant = participantQuery.data;

  if (!participant) {
    return <RejoinSessionScreen onRejoin={() => rejoinSession(session.code)} />;
  }

  return (
    <LiveKitRoom
      audio={false}
      video={false}
      serverUrl={liveKitTokenQuery.data?.url ?? livekitUrl}
      token={liveKitTokenQuery.data?.token}
    >
      <RoomAudioRenderer />
      <SessionPageDataProvider
        value={{
          id: session.id,
          name: session.name,
          code: session.code,
          participantId: participant.id,
          participantName: participant.name,
          livekitToken: liveKitTokenQuery.data ?? null,
        }}
      >
        {children}
      </SessionPageDataProvider>
    </LiveKitRoom>
  );
}

export default SessionPageGuardDataProvider;
