export const SCRIPT_STATUSES = ["draft", "scheduled", "posted", "archived"] as const;

export type ScriptStatus = (typeof SCRIPT_STATUSES)[number];

export const SCRIPT_STATUS_LABEL: Record<ScriptStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  posted: "Posted",
  archived: "Archived",
};

export const SCRIPT_STATUS_STYLE: Record<ScriptStatus, string> = {
  draft: "bg-canvas-deep text-ink-soft",
  scheduled: "bg-[#e7ecf5] text-[#33507f]",
  posted: "bg-[#e6efe3] text-[#3d5730]",
  archived: "bg-canvas-deep text-ink-faint",
};

export function isScriptStatus(value: string): value is ScriptStatus {
  return (SCRIPT_STATUSES as readonly string[]).includes(value);
}

/** The asks used so far. Free text in the DB — this list is just the picker. */
export const CTA_OPTIONS = ["DM", "DM / website", "Comment FREE", "Comment WEBSITE", "Link in bio"];

/**
 * Roughly how long the script reads aloud. Reels are paced near 3 words/second,
 * so this stays close to the timings already written on the five scripts.
 */
export function estimateDuration(words: number) {
  return Math.round(words / 3.1);
}

export function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
