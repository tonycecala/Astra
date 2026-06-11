import { PageHeader } from "../../components/PageHeader";

export default function LoginPage() {
  return (
    <>
      <PageHeader eyebrow="Login" title="Better Auth boundary">
        The clean-start foundation exposes the Better Auth route and keeps UI auth flows ready for the next authenticated slice.
      </PageHeader>
      <section className="card">
        <h2>Authentication is wired as infrastructure</h2>
        <p>Email/password, verification codes, and reset delivery route through Better Auth and the shared email boundary.</p>
      </section>
    </>
  );
}
