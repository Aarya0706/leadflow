"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useAddDiscussion } from "@/hooks/useLeads";
import { defaultFollowUp, localInputsToIso, toDateInput } from "@/lib/time";

export function DiscussionForm({ leadId, now }: { leadId: number; now: Date }) {
  const mutation = useAddDiscussion(leadId);
  const [note, setNote] = useState("");
  const [followUpOn, setFollowUpOn] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const followUpIso = followUpOn ? localInputsToIso(date, time) : null;
  const inPast = followUpIso !== null && new Date(followUpIso) <= now;
  const error = formError ?? (mutation.isError ? mutation.error.message : null);

  function toggleFollowUp(checked: boolean) {
    setFollowUpOn(checked);
    setFormError(null);
    // Suggest tomorrow at 10:00 the first time it's switched on.
    if (checked && !date && !time) {
      const suggestion = defaultFollowUp(now);
      setDate(suggestion.date);
      setTime(suggestion.time);
    }
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (mutation.isPending) return;
    if (!note.trim()) {
      setFormError("Write what you discussed before saving.");
      return;
    }
    if (followUpOn && !followUpIso) {
      setFormError("Choose both a date and a time for the follow-up.");
      return;
    }
    setFormError(null);
    mutation.mutate(
      { note: note.trim(), follow_up_at: followUpIso },
      {
        onSuccess: () => {
          setNote("");
          setFollowUpOn(false);
          setDate("");
          setTime("");
        },
      },
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-line bg-white px-5 py-4">
      <textarea
        aria-label="New discussion note"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setFormError(null);
        }}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={5000}
        placeholder="Log a new discussion..."
        className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm placeholder:text-ink-faint"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={followUpOn}
              onChange={(e) => toggleFollowUp(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Set follow-up
          </label>
          {followUpOn && (
            <>
              <input
                type="date"
                aria-label="Follow-up date"
                value={date}
                min={toDateInput(now)}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-line px-2 py-1"
              />
              <input
                type="time"
                aria-label="Follow-up time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-md border border-line px-2 py-1"
              />
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !note.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save note"}
        </button>
      </div>

      {inPast && (
        <p className="text-xs text-ink-soft">That time has already passed, so this lead will show as overdue.</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-alert">
          {error}
        </p>
      )}
    </form>
  );
}
