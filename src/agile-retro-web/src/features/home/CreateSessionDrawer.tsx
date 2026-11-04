import { useForm } from "react-hook-form";
import { Button, Drawer, Field, Input } from "../../shared/components/ui";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSession } from "../session/api";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSessionParticipants } from "../participant/SessionParticipantProvider";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Session name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  participantName: z
    .string()
    .trim()
    .min(1, "Your name is required.")
    .max(100, "Name cannot exceed 100 characters."),
});

type SessionData = z.infer<typeof schema>;

export default function CreateSessionDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { setParticipantId } = useSessionParticipants();
  const {
    mutate: create,
    isPending,
    error,
    reset: resetMutation,
  } = useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
      setParticipantId(data.code, data.participantId);
      navigate(`/sessions/${data.code}`, { state: { created: true } });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: "", participantName: "" },
  });

  const handleClose = () => {
    resetMutation();
    onClose();
  };

  const onSubmit = (data: SessionData) => {
    create(data);
  };

  return (
    <Drawer
      isOpen={isOpen}
      close={handleClose}
      title="Create a session"
      subTitle="Set up a board for your team"
    >
      <form
        className="flex h-full flex-col gap-6"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Session name"
            hint="For example, Sprint 42 retro."
            error={errors.name?.message}
            required
          >
            <Input
              {...register("name")}
              placeholder="Sprint 42 retro"
              autoFocus
            />
          </Field>
          <Field
            label="Your name"
            hint="Shown on the cards you add."
            error={errors.participantName?.message}
            required
          >
            <Input
              {...register("participantName")}
              placeholder="Ada Lovelace"
              autoComplete="name"
            />
          </Field>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          >
            Couldn't create the session. Check your details and try again.
          </p>
        ) : null}

        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create session"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
