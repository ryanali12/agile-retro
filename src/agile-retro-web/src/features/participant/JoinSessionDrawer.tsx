import { useForm } from "react-hook-form";
import { Button, Drawer, Field, Input } from "../../shared/components/ui";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { joinSession } from "./api";
import { useSessionParticipants } from "./SessionParticipantProvider";

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "A session code is required.")
    .max(100, "That code is too long."),
  participantName: z
    .string()
    .trim()
    .min(1, "Your name is required.")
    .max(100, "Name cannot exceed 100 characters."),
});

type JoinData = z.infer<typeof schema>;

function JoinSessionDrawer({
  isOpen,
  onClose,
  code,
}: {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<JoinData>({
    defaultValues: {
      code,
      participantName: "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(schema),
  });
  const { setParticipantId } = useSessionParticipants();
  const {
    mutate: join,
    isPending,
    error,
    reset: resetMutation,
  } = useMutation({
    mutationFn: joinSession,
    onSuccess: (data, variables) => {
      setParticipantId(variables.code, data.participantId);
    },
  });

  const handleClose = () => {
    resetMutation();
    onClose();
  };

  const onSubmit = (data: JoinData) => {
    join(data);
  };

  return (
    <Drawer
      isOpen={isOpen}
      close={handleClose}
      title="Join this session"
      subTitle="Looks like you are not a participant of this session."
    >
      <form
        className="flex h-full flex-col gap-6"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <input type="hidden" {...register("code")} />
        <div className="flex flex-col gap-4">
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
              autoFocus
            />
          </Field>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          >
            Couldn't join this session. Check the link and try again.
          </p>
        ) : null}

        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Not now
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Joining..." : "Join session"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default JoinSessionDrawer;
