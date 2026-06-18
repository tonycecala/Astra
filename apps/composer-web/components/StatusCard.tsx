type StatusCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "good" | "warn" | "neutral";
};

export function StatusCard({ label, value, detail, tone = "neutral" }: StatusCardProps) {
  return (
    <article className={`status-card status-card-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
