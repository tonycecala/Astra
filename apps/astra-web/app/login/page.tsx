import { AuthPanel } from "../../components/AuthPanel";
import { ui } from "../../lib/i18n";

export default function LoginPage() {
  return (
    <main className="loginShell" id="main-content">
      <section className="loginCard">
        <a className="loginLogo" href="/">
          {ui.shell.brand}
        </a>
        <div className="loginHeader">
          <p className="loginKicker">{ui.login.pageKicker}</p>
          <h1>{ui.login.pageTitle}</h1>
          <p>{ui.login.pageIntro}</p>
        </div>
        <AuthPanel />
      </section>
    </main>
  );
}
