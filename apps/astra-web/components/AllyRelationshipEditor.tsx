"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { allyRelationshipTags, normalizeAllyRelationshipTag, type AllyRelationshipTag } from "@astra/contracts";
import { ui } from "../lib/i18n";

export function AllyRelationshipEditor({
  allyId,
  allyName,
  editBirthHref,
  relationship
}: {
  allyId: string;
  allyName: string;
  editBirthHref?: string;
  relationship: string;
}) {
  const canonical = normalizeAllyRelationshipTag(relationship);
  const router = useRouter();
  const titleId = useId();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<AllyRelationshipTag>(canonical ?? "Other");
  const [savedValue, setSavedValue] = useState<AllyRelationshipTag | undefined>(canonical);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function close() {
    if (status === "saving") return;
    setValue(savedValue ?? "Other");
    setStatus("idle");
    setEditing(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    try {
      const response = await fetch(`/api/allies/${encodeURIComponent(allyId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ relationship: value })
      });
      if (!response.ok) throw new Error("ALLY_RELATIONSHIP_UPDATE_FAILED");
      setSavedValue(value);
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        aria-label={`${ui.allies.editAction}: ${allyName}`}
        className="button secondary"
        onClick={() => setEditing(true)}
        title={ui.allies.editAction}
        type="button"
      >
        <Pencil aria-hidden="true" size={16} />
      </button>
      {editing ? (
        <div className="ally-edit-layer" role="presentation">
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="ally-edit-dialog"
            onKeyDown={(event) => { if (event.key === "Escape") close(); }}
            role="dialog"
          >
            <h3 id={titleId}>{ui.allies.editTitle(allyName)}</h3>
            <form onSubmit={save}>
              <label className="ally-edit-field">
                <span>{ui.allies.editRelationshipLabel}</span>
                <select autoFocus disabled={status === "saving"} onChange={(event) => { setValue(event.target.value as AllyRelationshipTag); setStatus("idle"); }} value={value}>
                  {allyRelationshipTags.map((tag) => <option key={tag} value={tag}>{ui.allies.relationshipLabels[tag]}</option>)}
                </select>
              </label>
              <p className="ally-edit-hint">{ui.allies.editRelationshipHint}</p>
              <span aria-live="polite" className={status === "error" ? "ally-edit-status ally-edit-status-error" : "ally-edit-status"}>
                {status === "saved" ? ui.allies.relationshipSaved : status === "error" ? ui.allies.relationshipSaveError : ""}
              </span>
              <div className="ally-edit-actions">
                <button className="button" disabled={status === "saving" || value === savedValue} type="submit">
                  {status === "saving" ? ui.allies.savingRelationship : ui.allies.saveRelationship}
                </button>
                {editBirthHref ? <Link className="button secondary" href={editBirthHref} onClick={close}>{ui.allies.editBirthDetails}</Link> : null}
                <button className="button secondary" disabled={status === "saving"} onClick={close} type="button">
                  {ui.allies.editClose}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
