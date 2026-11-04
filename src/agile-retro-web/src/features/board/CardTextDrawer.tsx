import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Drawer, Field, Textarea } from "../../shared/components/ui";

const schema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Write a card before saving it.")
    .max(500, "Keep cards under 500 characters."),
});

type FormValues = z.infer<typeof schema>;

function getSubmitError(error: unknown, mode: "create" | "edit") {
  const fallback =
    mode === "edit"
      ? "Could not save the card. Try again."
      : "Could not add the card. Try again.";

  if (!(error instanceof Error)) return fallback;

  const hubMessage = error.message.match(/HubException: (.+)$/)?.[1];

  return hubMessage ?? fallback;
}

interface CardTextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  columnTitle: string;
  authorName: string;
  initialText?: string;
  onSubmit: (text: string) => Promise<void>;
}

/**
 * Shared composer for new cards and edits. Both paths use the same validation
 * and hub contract, only the labels and initial value differ.
 */
export function CardTextDrawer({
  isOpen,
  onClose,
  mode,
  columnTitle,
  authorName,
  initialText = "",
  onSubmit,
}: CardTextDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: initialText },
    mode: "onBlur",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    reset({ text: isOpen ? initialText : "" });
    setSubmitError(null);
  }, [isOpen, initialText, reset]);

  const textLength = watch("text")?.length ?? 0;
  const isEdit = mode === "edit";

  const submit = handleSubmit(async ({ text }) => {
    setSubmitError(null);

    try {
      await onSubmit(text);
      reset();
    } catch (error) {
      setSubmitError(getSubmitError(error, mode));
    }
  });

  return (
    <Drawer
      isOpen={isOpen}
      close={onClose}
      title={isEdit ? "Edit card" : "Add a card"}
      subTitle={isEdit ? `Your card in ${columnTitle}` : `In ${columnTitle}`}
    >
      <form className="flex h-full flex-col gap-6" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1.5">
          <Field
            label={isEdit ? "Your card" : "Your thought"}
            hint={
              isEdit ? `Editing as ${authorName}.` : `Posting as ${authorName}.`
            }
            error={errors.text?.message}
            required
          >
            <Textarea
              {...register("text")}
              rows={6}
              maxLength={500}
              placeholder="What is worth sharing?"
            />
          </Field>
          <p className="text-right text-xs tabular-nums text-muted">
            {textLength}/500
          </p>
        </div>

        <p className="text-xs text-muted">
          Be specific and kind. A card should be one clear idea.
        </p>

        {submitError ? (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        ) : null}

        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEdit
              ? isSubmitting
                ? "Saving..."
                : "Save changes"
              : isSubmitting
                ? "Adding..."
                : "Add card"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
