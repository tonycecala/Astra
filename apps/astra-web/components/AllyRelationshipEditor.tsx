"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { allyRelationshipTags, normalizeAllyRelationshipTag, type AllyRelationshipTag } from "@astra/contracts";
import { ui } from "../lib/i18n";

export function AllyRelationshipEditor({ allyId, relationship }: { allyId: string; relationship: string }) {
  const canonical = normalizeAllyRelationshipTag(relationship);
  const router = useRouter();
  const [value, setValue] = useState<AllyRelationshipTag>(canonical ?? "Other");
  const [savedValue, setSavedValue] = useState<AllyRelationshipTag | undefined>(canonical);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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
    <form className="ally-relationship-editor" onSubmit={save}>
      <label>
        <span>{ui.allies.editRelationshipLabel}</span>
        <select disabled={status === "saving"} onChange={(event) => { setValue(event.target.value as AllyRelationshipTag); setStatus("idle"); }} value={value}>
          {allyRelationshipTags.map((tag) => <option key={tag} value={tag}>{ui.allies.relationshipLabels[tag]}</option>)}
        </select>
      </label>
      <button className="button secondary" disabled={status === "saving" || value === savedValue} type="submit">
        {status === "saving" ? ui.allies.savingRelationship : ui.allies.saveRelationship}
      </button>
      <span aria-live="polite">
        {status === "saved" ? ui.allies.relationshipSaved : status === "error" ? ui.allies.relationshipSaveError : ""}
      </span>
    </form>
  );
}
