"use client";

import { Button } from "@inbeat/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@inbeat/ui/components/field";
import { Textarea } from "@inbeat/ui/components/textarea";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendFeedback } from "../actions/send-feedback";

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await sendFeedback({ message });
      if (!result.ok) {
        setError(result.errorId ? `${result.error} (${result.errorId})` : result.error);
        return;
      }
      setError(undefined);
      setMessage("");
      toast.success("Thanks, feedback sent");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="feedback">Feedback</FieldLabel>
        <Textarea
          id="feedback"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={Boolean(error)}
          placeholder="What should we build next?"
        />
        {error ? (
          <FieldError errors={[{ message: error }]} />
        ) : (
          <FieldDescription>Goes through action(): authorize, validate, run.</FieldDescription>
        )}
      </Field>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
