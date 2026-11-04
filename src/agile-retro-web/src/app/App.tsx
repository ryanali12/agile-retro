import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Routes from "./Routes";
import { SessionParticipantProvider } from "../features/participant/SessionParticipantProvider";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionParticipantProvider>
        <Routes />
      </SessionParticipantProvider>
    </QueryClientProvider>
  );
}
