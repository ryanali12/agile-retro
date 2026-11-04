import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Button, Drawer, Field, Input } from "../../shared/components/ui";

const schema = z.object({
  link: z.string().trim().min(1, "Paste the session link or code."),
});

type FormValues = z.infer<typeof schema>;

/** Accepts a full session URL, a /join/ URL, or a bare code. */
function extractCode(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  const match = trimmed.match(/\/(?:sessions|join)\/([^/?#]+)/i);

  return match ? decodeURIComponent(match[1]) : trimmed;
}

export default function JoinByLinkDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { link: "" },
  });

  const onSubmit = ({ link }: FormValues) => {
    const code = extractCode(link);

    if (!code) return;

    reset();
    onClose();
    navigate(`/sessions/${encodeURIComponent(code)}`);
  };

  return (
    <Drawer
      isOpen={isOpen}
      close={onClose}
      title="Join a session"
      subTitle="Open the link your facilitator shared"
    >
      <form
        className="flex h-full flex-col gap-6"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field
          label="Session link or code"
          hint="Paste the full link or just the code."
          error={errors.link?.message}
          required
        >
          <Input
            {...register("link")}
            placeholder="brave-otter-42"
            autoComplete="off"
            autoFocus
          />
        </Field>

        <p className="text-sm text-muted">
          You'll add your display name on the board before adding cards.
        </p>

        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Open session</Button>
        </div>
      </form>
    </Drawer>
  );
}
