import { MailIcon, Share2Icon, XIcon } from "lucide-react";

import { SITE_URL } from "@/lib/site";

/*
  Share destinations for a post, as plain links.

  No share widgets, no script, no popup window: each is a normal link with an
  explicit label, so it works with a keyboard, a screen reader and a browser
  that blocks scripts. The post title travels in the query string.
*/

type ShareDestination = {
  label: "X" | "LinkedIn" | "Email";
  icon: typeof XIcon;
  href: string;
};

export function ShareBar({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const url = `${SITE_URL}/journal/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent(`"${title}" — from the Verdant journal`);

  const destinations: ShareDestination[] = [
    { label: "X", icon: XIcon, href: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}` },
    { label: "LinkedIn", icon: Share2Icon, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "Email", icon: MailIcon, href: `mailto:?subject=${text}&body=${encodedUrl}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-small font-medium tracking-wide text-ink/55 uppercase">
        Share
      </span>
      {destinations.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-ink/10 px-3.5 text-small font-medium text-ink/80 transition-colors duration-200 hover:border-forest/30 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </a>
      ))}
    </div>
  );
}