"use client";

import { useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

type PublishedCardBodyProps = {
  text: string;
  showLessLabel: string;
  showMoreLabel: string;
};

export function PublishedCardBody({ showLessLabel, showMoreLabel, text }: PublishedCardBodyProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldClamp = text.length > 140;
  const toggleLabel = isExpanded ? showLessLabel : showMoreLabel;

  function toggleExpanded(event: KeyboardEvent<HTMLSpanElement> | MouseEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsExpanded((current) => !current);
  }

  return (
    <span className="astraPublishedCardBodyWrap">
      <span className={isExpanded || !shouldClamp ? "astraPublishedCardBody" : "astraPublishedCardBody astraPublishedCardBody-clamped"}>{text}</span>
      {shouldClamp ? (
        <span
          aria-expanded={isExpanded}
          aria-label={toggleLabel}
          className="astraPublishedCardReadMore"
          onClick={toggleExpanded}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") toggleExpanded(event);
          }}
          role="button"
          tabIndex={0}
        >
          {toggleLabel}
        </span>
      ) : null}
    </span>
  );
}
