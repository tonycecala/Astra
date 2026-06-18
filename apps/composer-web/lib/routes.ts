import { BookOpen, Boxes, ClipboardCheck, FileText, Images, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { composerUi } from "./i18n";

export const composerRoutes = [
  { href: "/", label: composerUi.nav.dashboard, icon: LayoutDashboard },
  { href: "/drafts", label: composerUi.nav.drafts, icon: FileText },
  { href: "/cards", label: composerUi.nav.cards, icon: Images },
  { href: "/course", label: composerUi.nav.course, icon: BookOpen },
  { href: "/library", label: composerUi.nav.library, icon: Boxes },
  { href: "/review", label: composerUi.nav.review, icon: ClipboardCheck },
  { href: "/onboarding", label: composerUi.nav.onboarding, icon: Sparkles },
  { href: "/settings", label: composerUi.nav.settings, icon: Settings }
] as const;
