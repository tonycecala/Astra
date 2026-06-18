import { OperatorReviewWorkspace } from "../../components/OperatorReviewWorkspace";
import { PageHeader } from "../../components/PageHeader";
import { composerUi } from "../../lib/i18n";

export default function ReviewPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={composerUi.review.eyebrow}
        title={composerUi.pages.review.title}
        description={composerUi.pages.review.description}
      />
      <OperatorReviewWorkspace />
    </div>
  );
}
