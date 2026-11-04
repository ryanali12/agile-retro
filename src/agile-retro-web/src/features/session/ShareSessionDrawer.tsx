import { useId, useState } from "react";
import { Button, Drawer, Input } from "../../shared/components/ui";

interface ShareSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  code: string;
}

export function ShareSessionDrawer({
  isOpen,
  onClose,
  sessionName,
  code,
}: ShareSessionDrawerProps) {
  const linkId = useId();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const link = `${window.location.origin}/sessions/${code}`;

  const handleClose = () => {
    setCopied(false);
    setCopyError(null);
    onClose();
  };

  const copyLink = async () => {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopyError("Couldn't copy automatically. Select the link and copy it.");
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      close={handleClose}
      title="Share this session"
      subTitle={`Invite the team to ${sessionName}.`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={linkId} className="text-sm font-medium text-text">
            Session link
          </label>

          <div className="flex gap-2">
            <Input
              id={linkId}
              value={link}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              className="font-mono text-xs"
            />
            <Button type="button" onClick={copyLink} className="shrink-0">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {copyError ? (
            <p role="alert" className="text-xs text-danger">
              {copyError}
            </p>
          ) : (
            <p className="text-xs text-muted">
              Anyone with this link can join with a display name.
            </p>
          )}

          <span aria-live="polite" className="sr-only">
            {copied ? "Link copied to clipboard." : ""}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Join code
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-tight">
            {code}
          </p>
        </div>
      </div>
    </Drawer>
  );
}
