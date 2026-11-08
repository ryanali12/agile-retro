import { createContext, useContext } from "react";
import type { LiveKitToken } from "./api";

export type SessionPageData = {
  id: string;
  code: string;
  name: string;
  participantName: string;
  participantId: string;
  /** LiveKit credentials, or null while loading or when LiveKit is unavailable. */
  livekitToken: LiveKitToken | null;
};

export const SessionPageDataContext = createContext<SessionPageData | null>(
  null,
);

export function useSessionPageDataProvider() {
  const context = useContext(SessionPageDataContext);

  if (!context) {
    throw new Error(
      "useSessionPageDataProvider must be used within a SessionPageDataProvider",
    );
  }

  return context;
}
