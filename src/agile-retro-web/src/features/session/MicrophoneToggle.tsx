import { useState } from "react";
import {
  useConnectionState,
  useLocalParticipant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { MicIcon, MicOffIcon } from "../../shared/components/icons";
import { cn } from "../../shared/utils/cn";

interface MicrophoneToggleProps {
  className?: string;
}

/**
 * Mutes or unmutes the local participant's microphone. Rendered inside
 * `LiveKitRoom`, so it can use the room context directly.
 */
export function MicrophoneToggle({ className }: MicrophoneToggleProps) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();
  const [isPending, setIsPending] = useState(false);

  const isConnected = connectionState === ConnectionState.Connected;
  const isEnabled = isConnected && isMicrophoneEnabled;
  const isDisabled = !isConnected || isPending;
  const isConnecting = connectionState === ConnectionState.Connecting;

  const label = isEnabled
    ? "Mute microphone"
    : isConnected
      ? "Unmute microphone"
      : isConnecting
        ? "Connecting to audio"
        : "Audio is unavailable";

  const toggleMicrophone = async () => {
    if (isDisabled) return;

    setIsPending(true);

    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      // LiveKit records the failure on the participant and reports it through
      // `lastMicrophoneError`; the button falls back to the muted state.
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggleMicrophone()}
      disabled={isDisabled}
      aria-pressed={isEnabled}
      aria-label="Microphone"
      title={label}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:pointer-events-none disabled:opacity-60",
        "sm:h-8 sm:px-3",
        isEnabled
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-text",
        !isConnected &&
          "border-border bg-surface-muted text-muted hover:bg-surface-muted",
        className,
      )}
    >
      {isEnabled ? (
        <MicIcon className="size-4" />
      ) : (
        <MicOffIcon className="size-4" />
      )}
      <span className="hidden sm:inline">
        {isEnabled ? "Mic on" : isConnecting ? "Connecting" : "Mic off"}
      </span>
    </button>
  );
}
