"use client";

import { ui } from "../../lib/i18n";

export default function JourneyError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="journey-empty" role="alert"><h2>{ui.journey.errorTitle}</h2><p>{ui.journey.errorBody}</p><button className="button" onClick={reset} type="button">{ui.journey.retry}</button></section>;
}
