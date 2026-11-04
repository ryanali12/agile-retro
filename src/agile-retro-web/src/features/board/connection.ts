import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr'

// Default to the dev-server proxy (and same-origin production). Set
// VITE_HUB_URL only when the hub lives on a different origin.
const HUB_URL = import.meta.env.VITE_HUB_URL ?? '/hubs/board'

/**
 * Creates a connection to the board hub. Call `start()` before use and keep the
 * connection in one place so reconnection handling stays consistent.
 */
export function createBoardConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build()
}
