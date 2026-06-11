import { PageHeader } from "../../components/PageHeader";
import { ui } from "../../lib/i18n";

export default function LoginPage() {
  return (
    <>
      <PageHeader eyebrow={ui.login.eyebrow} title={ui.login.title}>
        {ui.login.intro}
      </PageHeader>
      <section className="card">
        <h2>{ui.login.infrastructureTitle}</h2>
        <p>{ui.login.infrastructureDescription}</p>
      </section>
    </>
  );
}
