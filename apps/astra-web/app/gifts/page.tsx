import { PageHeader } from "../../components/PageHeader";
import { getFoundationViewModel } from "../../lib/foundation";

export default function GiftsPage() {
  const view = getFoundationViewModel();

  return (
    <>
      <PageHeader eyebrow="Gifts" title="Stars stay accountable">
        Gifts and star transactions are symbolic, but their accounting is explicit from the first slice.
      </PageHeader>
      <section className="grid" aria-label="Gifts and star transactions">
        {view.gifts.map((gift) => (
          <article className="card" key={gift.id}>
            <div className="eyebrow">{gift.code}</div>
            <h2>{gift.name}</h2>
            <p>{gift.description}</p>
            <p>{gift.starCost} stars</p>
          </article>
        ))}
        {view.starTransactions.map((transaction) => (
          <article className="card" key={transaction.id}>
            <div className="eyebrow">{transaction.direction}</div>
            <h2>{transaction.amount} stars</h2>
            <p>{transaction.reason}</p>
          </article>
        ))}
      </section>
    </>
  );
}
