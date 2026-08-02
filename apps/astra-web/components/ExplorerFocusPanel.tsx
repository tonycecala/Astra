"use client";

import { useState } from "react";
import type { ExplorerFocus, ExplorerFocusKey } from "@astra/contracts";
import { ui } from "../lib/i18n";

export function ExplorerFocusPanel({ initialFocus }: { initialFocus?: ExplorerFocus }) {
  const [focus, setFocus] = useState(initialFocus);
  const [key, setKey] = useState<ExplorerFocusKey | undefined>(focus?.status === "selected" ? focus.key : undefined);
  const [question, setQuestion] = useState(focus?.status === "selected" ? focus.question ?? "" : "");
  const [editing, setEditing] = useState(!focus);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function save(payload: { status: "selected"; key: ExplorerFocusKey; question?: string } | { status: "skipped" }) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/focus", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({})) as { focus?: ExplorerFocus };
      if (!response.ok || !body.focus) throw new Error(ui.self.focus.saveError);
      setFocus(body.focus);
      setKey(body.focus.status === "selected" ? body.focus.key : undefined);
      setQuestion(body.focus.status === "selected" ? body.focus.question ?? "" : "");
      setEditing(false);
      setMessage(ui.self.focus.saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.focus.saveError);
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="card self-insight-card" aria-label={ui.self.focus.editTitle}>
      <div className="eyebrow">{ui.self.onboarding}</div>
      <h2>{ui.self.focus.editTitle}</h2>
      {!editing ? (
        <>
          <p>{focus?.status === "selected" ? ui.self.focus.choices[focus.key] : ui.self.focus.open}</p>
          <p className="muted-copy">{ui.self.focus.editIntro}</p>
          <button className="button secondary" onClick={() => setEditing(true)} type="button">{ui.self.focus.editAction}</button>
        </>
      ) : (
        <div className="auth-form" style={{ gap: 12 }}>
          <fieldset>
            <legend>{ui.self.focus.prompt}</legend>
            {(Object.keys(ui.self.focus.choices) as ExplorerFocusKey[]).map((choice) => (
              <label key={choice} style={{ alignItems: "center", display: "flex", gap: 10 }}>
                <input checked={key === choice} name="selfFocus" onChange={() => setKey(choice)} type="radio" />
                <span>{ui.self.focus.choices[choice]}</span>
              </label>
            ))}
          </fieldset>
          {key ? <label><span>{ui.self.focus.questionLabel}</span><textarea maxLength={280} onChange={(event) => setQuestion(event.target.value)} rows={3} value={question} /><small>{ui.self.focus.questionHint}</small></label> : null}
          <div className="button-row">
            <button className="button" disabled={pending || !key} onClick={() => key && save({ status: "selected", key, question: question.trim() || undefined })} type="button">{ui.self.focus.saveAction}</button>
            <button className="button ghost" disabled={pending} onClick={() => save({ status: "skipped" })} type="button">{ui.self.focus.skip}</button>
          </div>
        </div>
      )}
      {message ? <p role="status">{message}</p> : null}
    </article>
  );
}
