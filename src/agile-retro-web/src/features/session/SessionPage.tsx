import { useParams } from "react-router";
import SessionPageGuardDataProvider from "./SessionPageGuardDataProvider";
import { SessionScreen } from "./SessionScreen";

export function SessionPage() {
  const { code } = useParams();

  return (
    <SessionPageGuardDataProvider key={code}>
      <SessionScreen />
    </SessionPageGuardDataProvider>
  );
}
