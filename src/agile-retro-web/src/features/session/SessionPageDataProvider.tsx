import type { ReactNode } from "react";
import {
  SessionPageDataContext,
  type SessionPageData,
} from "./SessionPageDataContext";

export function SessionPageDataProvider({
  value,
  children,
}: {
  value: SessionPageData;
  children: ReactNode;
}) {
  return (
    <SessionPageDataContext.Provider value={value}>
      {children}
    </SessionPageDataContext.Provider>
  );
}
