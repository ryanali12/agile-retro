import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CardTextDrawer } from "../board/CardTextDrawer";
import { Board } from "../board/Board";
import { boardColumns } from "../board/boardColumns";
import { ParticipantsDrawer } from "../board/ParticipantsDrawer";
import { ConfirmDialog } from "../../shared/components/ui";
import { SessionBoardHeader } from "./SessionBoardHeader";
import {
  SessionBoardErrorState,
  SessionBoardLoadingState,
  SessionConnectionLostState,
} from "./SessionBoardStates";
import { SessionHeader } from "./SessionHeader";
import { useSessionPageDataProvider } from "./SessionPageDataContext";
import { ShareSessionDrawer } from "./ShareSessionDrawer";
import { useBoardSession } from "../board/useBoardSession";
import type { BoardCard, BoardColumnId } from "../board/api";
import { MicrophoneToggle } from "./MicrophoneToggle";

type CreatedNavigationState = { created?: boolean } | null | undefined;

function getDeleteError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Could not delete the card. Try again.";
  }

  const hubMessage = error.message.match(/HubException: (.+)$/)?.[1];

  return hubMessage ?? "Could not delete the card. Try again.";
}

export function SessionScreen() {
  const session = useSessionPageDataProvider();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    board,
    participants,
    isLoading,
    error,
    refetch,
    connectionStatus,
    retryConnection,
    createCard,
    updateCard,
    deleteCard,
  } = useBoardSession(session.code, session.participantId);

  const [addColumnId, setAddColumnId] = useState<BoardColumnId | null>(null);
  const [editingCard, setEditingCard] = useState<BoardCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<BoardCard | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(
    () => (location.state as CreatedNavigationState)?.created === true,
  );
  const [participantsOpen, setParticipantsOpen] = useState(false);

  // The "created" flag is one-shot: drop it from history so a refresh or a
  // back-navigation does not reopen the share drawer.
  useEffect(() => {
    if ((location.state as CreatedNavigationState)?.created) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const addColumn =
    boardColumns.find((column) => column.id === addColumnId) ?? null;

  const handleAddCard = async (text: string) => {
    if (!addColumnId) return;

    await createCard({ columnKey: addColumnId, text });
    setAddColumnId(null);
  };

  const handleUpdateCard = async (text: string) => {
    if (!editingCard) return;

    await updateCard({ cardId: editingCard.id, text });
    setEditingCard(null);
  };

  const onEditCard = (card: BoardCard) => {
    setEditingCard(card);
  };

  const requestDeleteCard = (card: BoardCard) => {
    setDeleteError(null);
    setCardToDelete(card);
  };

  const cancelDeleteCard = () => {
    if (isDeleting) return;

    setCardToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteCard({ cardId: cardToDelete.id });
      setCardToDelete(null);
    } catch (error) {
      setDeleteError(getDeleteError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const editingColumn =
    boardColumns.find((column) => column.id === editingCard?.columnId) ?? null;

  if (connectionStatus === "disconnected") {
    return <SessionConnectionLostState onRetry={retryConnection} />;
  }

  if (error) {
    return <SessionBoardErrorState onRetry={() => void refetch()} />;
  }

  if (isLoading || !board) {
    return <SessionBoardLoadingState />;
  }

  const canAddCards = connectionStatus === "connected";

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SessionHeader
        sessionName={session.name}
        code={session.code}
        participantName={session.participantName}
        participantsCount={participants.length}
        onShare={() => setShareOpen(true)}
        onShowParticipants={() => setParticipantsOpen(true)}
        audioControls={<MicrophoneToggle />}
      />

      <main className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <SessionBoardHeader
          sessionName={session.name}
          code={session.code}
          cardCount={board.cards.length}
          participantsCount={participants.length}
          connectionStatus={connectionStatus}
          canAddCards={canAddCards}
          onShare={() => setShareOpen(true)}
          onAddCard={() => setAddColumnId(boardColumns[0].id)}
        />

        <Board
          cards={board.cards}
          currentParticipantId={session.participantId}
          onAddCard={setAddColumnId}
          onEditCard={onEditCard}
          onDeleteCard={requestDeleteCard}
          disabled={!canAddCards}
        />
      </main>

      <CardTextDrawer
        isOpen={addColumn !== null}
        onClose={() => setAddColumnId(null)}
        mode="create"
        columnTitle={addColumn?.title ?? ""}
        authorName={session.participantName}
        onSubmit={handleAddCard}
      />

      <CardTextDrawer
        isOpen={editingCard !== null}
        onClose={() => setEditingCard(null)}
        mode="edit"
        columnTitle={editingColumn?.title ?? ""}
        authorName={session.participantName}
        initialText={editingCard?.text ?? ""}
        onSubmit={handleUpdateCard}
      />

      <ShareSessionDrawer
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        sessionName={session.name}
        code={session.code}
      />

      <ParticipantsDrawer
        isOpen={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        participants={participants}
        currentParticipantId={session.participantId}
        connectionStatus={connectionStatus}
      />

      <ConfirmDialog
        isOpen={cardToDelete !== null}
        title="Delete this card?"
        description="This card will be removed from the board for everyone. This cannot be undone."
        confirmLabel="Delete card"
        pendingLabel="Deleting..."
        tone="danger"
        isPending={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteCard()}
        onCancel={cancelDeleteCard}
      />
    </div>
  );
}
