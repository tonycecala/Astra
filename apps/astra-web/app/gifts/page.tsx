import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";
import { ui } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const view = await getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow={ui.gifts.eyebrow} title={ui.gifts.title}>
        {ui.gifts.intro}
      </PageHeader>
      <section className="grid" aria-label={ui.gifts.listLabel}>
        {view.gifts.map((gift) => (
          <article className="card" key={gift.id}>
            <div className="eyebrow">{gift.code}</div>
            <h2>{gift.name}</h2>
            <p>{gift.description}</p>
            <p>{ui.gifts.starCost(gift.starCost)}</p>
          </article>
        ))}
        {view.starTransactions.map((transaction) => (
          <article className="card" key={transaction.id}>
            <div className="eyebrow">{transaction.direction}</div>
            <h2>{ui.gifts.starAmount(transaction.amount)}</h2>
            <p>{transaction.reason}</p>
          </article>
        ))}
      </section>
    </>
  );
}
