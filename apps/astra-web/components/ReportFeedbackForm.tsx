"use client";

import { useState, type FormEvent } from "react";

type ReportFeedbackLabels = {
  category: string;
  categoryBug: string;
  categoryCheckout: string;
  categoryOther: string;
  categoryReportQuality: string;
  error: string;
  message: string;
  messagePlaceholder: string;
  rating: string;
  ratingMixed: string;
  ratingMissed: string;
  ratingStrong: string;
  ratingUseful: string;
  ratingWeak: string;
  sending: string;
  sent: string;
  submit: string;
  title: string;
  eyebrow: string;
};

export function ReportFeedbackForm({ labels, reportId }: { labels: ReportFeedbackLabels; reportId: string }) {
  const [rating, setRating] = useState("5");
  const [category, setCategory] = useState("report_quality");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const response = await fetch("/api/beta-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        category,
        message,
        rating: Number(rating),
        reportId
      })
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setMessage("");
    setStatus("sent");
  }

  return (
    <form className="reportFeedbackForm noPrint" onSubmit={submitFeedback}>
      <div className="reportFeedbackHeader">
        <p className="eyebrow">{labels.eyebrow}</p>
        <h2>{labels.title}</h2>
      </div>
      <div className="reportFeedbackControls">
        <label>
          {labels.rating}
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="5">{labels.ratingStrong}</option>
            <option value="4">{labels.ratingUseful}</option>
            <option value="3">{labels.ratingMixed}</option>
            <option value="2">{labels.ratingWeak}</option>
            <option value="1">{labels.ratingMissed}</option>
          </select>
        </label>
        <label>
          {labels.category}
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="report_quality">{labels.categoryReportQuality}</option>
            <option value="checkout">{labels.categoryCheckout}</option>
            <option value="bug">{labels.categoryBug}</option>
            <option value="other">{labels.categoryOther}</option>
          </select>
        </label>
      </div>
      <label className="reportFeedbackMessage">
        {labels.message}
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={labels.messagePlaceholder}
          rows={4}
          maxLength={2000}
          required
        />
      </label>
      <div className="reportFeedbackActions">
        <button type="submit" disabled={!message.trim() || status === "sending"}>
          {status === "sending" ? labels.sending : labels.submit}
        </button>
        {status === "sent" ? <span role="status" aria-live="polite">{labels.sent}</span> : null}
        {status === "error" ? <span role="alert" aria-live="assertive">{labels.error}</span> : null}
      </div>
    </form>
  );
}
