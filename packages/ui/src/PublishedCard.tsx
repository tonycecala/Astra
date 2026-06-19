"use client";

import type { ReactNode } from "react";
import { PublishedCardBody } from "./PublishedCardBody";

type PublishedCardProps = {
  body?: ReactNode;
  bodyText?: string;
  className?: string;
  contentClassName?: string;
  eyebrow: ReactNode;
  imageAlt?: string;
  imageFallback?: ReactNode;
  imageUrl?: string;
  mediaClassName?: string;
  meta?: ReactNode;
  onOpen?: () => void;
  showLessLabel: string;
  showMoreLabel: string;
  subtitle?: ReactNode;
  title: ReactNode;
  titleAttribute?: string;
};

function publishedCardClassName(className?: string) {
  return ["astraPublishedCardOpen", className].filter(Boolean).join(" ");
}

function PublishedCardInner({
  body,
  bodyText,
  contentClassName,
  eyebrow,
  imageAlt = "",
  imageFallback,
  imageUrl,
  mediaClassName,
  meta,
  showLessLabel,
  showMoreLabel,
  subtitle,
  title
}: PublishedCardProps) {
  return (
    <>
      <span className={["astraPublishedCardContent", contentClassName].filter(Boolean).join(" ")}>
        <span className="astraPublishedCardHeader">
          <span className="eyebrow astraPublishedCardEyebrow">{eyebrow}</span>
          <span className="astraPublishedCardTitle">{title}</span>
          {subtitle ? <span className="astraPublishedCardSubtitle">{subtitle}</span> : null}
        </span>
        <span className="astraPublishedCardBody">
          {bodyText ? <PublishedCardBody text={bodyText} showLessLabel={showLessLabel} showMoreLabel={showMoreLabel} /> : body}
        </span>
        {meta ? <span className="astraPublishedCardMeta">{meta}</span> : null}
      </span>
      <span className={["astraPublishedCardMedia", mediaClassName].filter(Boolean).join(" ")} aria-hidden={imageAlt ? undefined : "true"}>
        {imageUrl ? <img alt={imageAlt} className="astraPublishedCardImage" src={imageUrl} /> : <span className="astraPublishedCardImageFallback">{imageFallback}</span>}
      </span>
    </>
  );
}

export function PublishedCard(props: PublishedCardProps) {
  const className = publishedCardClassName(props.className);

  if (props.onOpen) {
    return (
      <button className={className} onClick={props.onOpen} title={props.titleAttribute} type="button">
        <PublishedCardInner {...props} />
      </button>
    );
  }

  return (
    <div className={className} title={props.titleAttribute}>
      <PublishedCardInner {...props} />
    </div>
  );
}
