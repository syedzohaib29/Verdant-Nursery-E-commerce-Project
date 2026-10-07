import type { Metadata } from "next";

import { JournalForm } from "@/components/admin/journal-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = {
  title: "New post",
};

/**
 * The create form.
 *
 * The same form as edit, with no post: it starts empty, drafts stay private
 * until "Publish to the journal" is checked, and the live preview is right
 * there beside the editor while you write.
 */
export default function NewJournalPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Community"
        title="New post"
        description="A seed packet of words. Markdown source on the left, the storefront's render beside it."
      />

      <JournalForm post={null} />
    </div>
  );
}