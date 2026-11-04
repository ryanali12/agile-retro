import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SessionParticipants = Record<string, string>;

interface SessionParticipantContextType {
  participants: SessionParticipants;
  getParticipantId: (sessionCode: string) => string | undefined;
  setParticipantId: (sessionCode: string, participantId: string) => void;
  removeParticipant: (sessionCode: string) => void;
}

const STORAGE_KEY = "session-participants";

const SessionParticipantContext =
  createContext<SessionParticipantContextType | null>(null);

function getStoredParticipants(): SessionParticipants {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

interface Props {
  children: ReactNode;
}

export function SessionParticipantProvider({ children }: Props) {
  const [participants, setParticipants] = useState<SessionParticipants>(
    getStoredParticipants,
  );

  const getParticipantId = useCallback(
    (sessionCode: string) => participants[sessionCode],
    [participants],
  );

  const setParticipantId = useCallback(
    (sessionCode: string, participantId: string) => {
      setParticipants((current) => {
        const updated = {
          ...current,
          [sessionCode]: participantId,
        };

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        return updated;
      });
    },
    [],
  );

  const removeParticipant = useCallback((sessionCode: string) => {
    setParticipants((current) => {
      const updated = { ...current };
      delete updated[sessionCode];

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      participants,
      getParticipantId,
      setParticipantId,
      removeParticipant,
    }),
    [participants, getParticipantId, setParticipantId, removeParticipant],
  );

  return (
    <SessionParticipantContext.Provider value={value}>
      {children}
    </SessionParticipantContext.Provider>
  );
}

export function useSessionParticipants() {
  const context = useContext(SessionParticipantContext);

  if (!context) {
    throw new Error(
      "useSessionParticipants must be used within SessionParticipantProvider",
    );
  }

  return context;
}
