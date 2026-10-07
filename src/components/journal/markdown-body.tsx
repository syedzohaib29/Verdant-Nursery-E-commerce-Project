import type { ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugify } from "@/lib/utils";

/*
  Journal copy rendered from Markdown source.

  Rendering happens on the server at read time; the posts table holds source
  text, never HTML, so there is no stored markup to sanitise and no way for a
  post to ship a script. remark-gfm brings the tables, strikethrough and task
  lists the nursery actually writes.

  The typography lives in `.markdown-body` in globals.css — tissue-coloured
  prose on warm white, 65–72ch measure, 1.7 line height, forest links.
*/

/** The text content of a heading, used to derive the anchor id. */
function toText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  const element = node as { props?: { children?: ReactNode } };
  if (element.props?.children != null) return toText(element.props.children);
  return "";
}

function Heading({
  level,
  children,
}: {
  level: 2 | 3;
  children: ReactNode;
}) {
  const text = toText(children);
  const id = slugify(text);
  const Tag = level === 2 ? "h2" : "h3";

  return (
    <Tag id={id} className="group">
      {children}
      <a
        href={`#${id}`}
        aria-label={`Link to this section: ${text}`}
        className="markdown-anchor"
      >
        <span aria-hidden="true">#</span>
      </a>
    </Tag>
  );
}

/** An image in a post: full-bleed within the measure, with the room's ratio. */
function PostImage({
  src,
  alt,
}: {
  src?: string | Blob;
  alt?: string;
}) {
  const source = typeof src === "string" ? src : "";

  if (!source.startsWith("/")) {
    return (
      // A pasted absolute URL cannot be optimised without a remote pattern, so
      // it is shown as-is. Admin users are expected to use /images paths.
      <img
        src={source}
        alt={alt ?? ""}
        className="w-full rounded-xl"
        loading="lazy"
      />
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
      <Image
        src={source}
        alt={alt ?? ""}
        fill
        sizes="(min-width: 768px) 748px, 92vw"
        className="object-cover"
      />
    </div>
  );
}

const components: Components = {
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  img: (props) => <PostImage src={props.src} alt={props.alt} />,
};

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}