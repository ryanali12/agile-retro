import { HubConnectionState, type HubConnection } from "@microsoft/signalr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  BoardCardSchema,
  BoardParticipantsSchema,
  boardQueryKey,
  createBoardCard,
  deleteBoardCard,
  joinBoard,
  updateBoardCard,
  type BoardCard,
  type BoardSnapshot,
  type CreateBoardCardInput,
  type DeleteBoardCardInput,
  type UpdateBoardCardInput,
} from "./api";
import { createBoardConnection } from "./connection";

export type BoardConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

function mergeCard(cards: BoardCard[], card: BoardCard): BoardCard[] {
  const exists = cards.some((current) => current.id === card.id);

  return exists
    ? cards.map((current) => (current.id === card.id ? card : current))
    : [...cards, card];
}

function upsertCard(snapshot: BoardSnapshot, card: BoardCard): BoardSnapshot {
  return {
    ...snapshot,
    cards: mergeCard(snapshot.cards, card),
  };
}

function removeCard(snapshot: BoardSnapshot, cardId: string): BoardSnapshot {
  return {
    ...snapshot,
    cards: snapshot.cards.filter((card) => card.id !== cardId),
  };
}

/**
 * Owns the board hub lifecycle. The snapshot is loaded through SignalR, and
 * card writes go through the hub; HTTP is only used by the session guard.
 */
export function useBoardSession(code: string, participantId: string) {
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const [status, setStatus] = useState<BoardConnectionStatus>("connecting");
  const hasConnected = useRef(false);
  const pendingCards = useRef<BoardCard[]>([]);

  useEffect(() => {
    const connection = createBoardConnection();
    let disposed = false;

    connectionRef.current = connection;
    pendingCards.current = [];

    const handleCardUpserted = (payload: unknown) => {
      const parsed = BoardCardSchema.safeParse(payload);

      if (!parsed.success) return;

      if (!queryClient.getQueryData(boardQueryKey(code))) {
        pendingCards.current = mergeCard(pendingCards.current, parsed.data);
        return;
      }

      queryClient.setQueryData<BoardSnapshot>(
        boardQueryKey(code),
        (current) => (current ? upsertCard(current, parsed.data) : current),
      );
    };

    const handleCardDeleted = (payload: unknown) => {
      const parsed = z.uuid().safeParse(payload);

      if (!parsed.success) return;

      queryClient.setQueryData<BoardSnapshot>(
        boardQueryKey(code),
        (current) => (current ? removeCard(current, parsed.data) : current),
      );
    };

    const handleParticipantsChanged = (payload: unknown) => {
      const parsed = BoardParticipantsSchema.safeParse(payload);

      if (!parsed.success) return;

      queryClient.setQueryData<BoardSnapshot>(
        boardQueryKey(code),
        (current) =>
          current ? { ...current, participants: parsed.data } : current,
      );
    };

    connection.on("CardCreated", handleCardUpserted);
    connection.on("CardUpdated", handleCardUpserted);
    connection.on("CardDeleted", handleCardDeleted);
    connection.on("ParticipantsChanged", handleParticipantsChanged);

    connection.onreconnecting(() => {
      if (!disposed) setStatus("reconnecting");
    });

    connection.onreconnected(() => {
      if (!disposed) setStatus("connected");
    });

    connection.onclose(() => {
      if (!disposed) setStatus("disconnected");
    });

    // Defer the start by a microtask so StrictMode's development-only
    // unmount happens first; otherwise the first connection is stopped
    // mid-negotiation and logs a spurious error.
    const startConnection = async () => {
      await Promise.resolve();

      if (disposed) return;

      try {
        await connection.start();

        if (!disposed) setStatus("connected");
      } catch {
        if (!disposed) setStatus("disconnected");
      }
    };

    void startConnection();

    return () => {
      disposed = true;
      connection.off("CardCreated", handleCardUpserted);
      connection.off("CardUpdated", handleCardUpserted);
      connection.off("CardDeleted", handleCardDeleted);
      connection.off("ParticipantsChanged", handleParticipantsChanged);
      void connection.stop();

      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
    };
  }, [code, queryClient]);

  const boardQuery = useQuery({
    queryKey: boardQueryKey(code),
    queryFn: async () => {
      const connection = connectionRef.current;

      if (!connection) {
        throw new Error("The board connection is not ready.");
      }

      const snapshot = await joinBoard(connection, code, participantId);
      const buffered = pendingCards.current;

      pendingCards.current = [];

      return buffered.reduce(upsertCard, snapshot);
    },
    enabled: status === "connected",
    staleTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Rejoin the group and resync after a reconnect. On a remount with cached
  // data we still need this call, because the new connection is not in the
  // group yet.
  useEffect(() => {
    if (status !== "connected") return;

    if (!hasConnected.current) {
      hasConnected.current = true;

      if (queryClient.getQueryData(boardQueryKey(code))) {
        void queryClient.invalidateQueries({ queryKey: boardQueryKey(code) });
      }

      return;
    }

    void queryClient.invalidateQueries({ queryKey: boardQueryKey(code) });
  }, [status, code, queryClient]);

  const createCard = useMutation({
    mutationFn: (input: CreateBoardCardInput) => {
      const connection = connectionRef.current;

      if (!connection) {
        throw new Error("The board connection is not ready.");
      }

      return createBoardCard(connection, input);
    },
    onSuccess: (card) => {
      queryClient.setQueryData<BoardSnapshot>(
        boardQueryKey(code),
        (current) => (current ? upsertCard(current, card) : current),
      );
    },
  });

  const updateCard = useMutation({
    mutationFn: (input: UpdateBoardCardInput) => {
      const connection = connectionRef.current;

      if (!connection) {
        throw new Error("The board connection is not ready.");
      }

      return updateBoardCard(connection, input);
    },
    onSuccess: (card) => {
      queryClient.setQueryData<BoardSnapshot>(
        boardQueryKey(code),
        (current) => (current ? upsertCard(current, card) : current),
      );
    },
  });

  const deleteCard = useMutation({
    mutationFn: (input: DeleteBoardCardInput) => {
      const connection = connectionRef.current;

      if (!connection) {
        throw new Error("The board connection is not ready.");
      }

      return deleteBoardCard(connection, input);
    },
    onSuccess: (cardId) => {
      queryClient.setQueryData<BoardSnapshot>(
        boardQueryKey(code),
        (current) => (current ? removeCard(current, cardId) : current),
      );
    },
  });

  const retryConnection = useCallback(() => {
    const connection = connectionRef.current;

    if (!connection || connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    setStatus("connecting");

    connection
      .start()
      .then(() => setStatus("connected"))
      .catch(() => setStatus("disconnected"));
  }, []);

  return {
    board: boardQuery.data ?? null,
    participants: boardQuery.data?.participants ?? [],
    isLoading: boardQuery.isPending,
    error: boardQuery.error,
    refetch: boardQuery.refetch,
    connectionStatus: status,
    retryConnection,
    createCard: createCard.mutateAsync,
    updateCard: updateCard.mutateAsync,
    deleteCard: deleteCard.mutateAsync,
  };
}
