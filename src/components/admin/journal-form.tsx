"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  checkJournalSlugAction,
  createJournalPostAction,
  updateJournalPostAction,
} from "@/app/actions/admin-journal";
import { Button } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UnsavedChangesBar } from "@/components/admin/unsaved-changes-bar";
import { slugify } from "@/lib/utils";

import { journalPostSchema } from "@/lib/validations/admin";
import { z } from "zod";

type FormValues = z.infer<typeof journalPostSchema>;

/**
 * The post preview — react-markdown is a heavy client bundle, so it is only
 * fetched once somebody is actually looking at the editor, and never shipped
 * to a visitor who is just reading the journal.
 */
const MarkdownPreview = dynamic(
  () =>
    import("@/components/journal/markdown-body").then(
      (mod) => mod.MarkdownBody,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-small text-ink/50">
        Loading preview…
      </div>
    ),
  },
);

export function JournalForm({
  post,
}: {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    author: string;
    readMinutes: number;
    published: boolean;
  } | null;
}) {
  const router = useRouter();
  const isEdit = post !== null;
  const [saving, setSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugChecked, setSlugChecked] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(journalPostSchema),
    defaultValues: post
      ? {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          author: post.author,
          readMinutes: post.readMinutes,
          published: post.published,
        }
      : {
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          coverImage: "/images/journal-",
          author: "The Verdant bench",
          readMinutes: 4,
          published: false,
        },
    mode: "onTouched",
  });

  const title = watch("title");
  const slug = watch("slug");
  const content = watch("content");
  const coverImage = watch("coverImage");

  // Auto-generate the slug from the title while the slug field is still holding
  // a value we made for it (never once the writer has typed their own).
  const [lastGeneratedSlug, setLastGeneratedSlug] = useState("");

  useEffect(() => {
    const generated = slugify(title);
    if (generated && (slug === "" || slug === lastGeneratedSlug)) {
      setValue("slug", generated, { shouldValidate: true });
      setLastGeneratedSlug(generated);
    }
  }, [title, slug, lastGeneratedSlug, setValue]);

  // Slug availability on blur, only when it has changed.
  async function handleSlugBlur() {
    if (!slug || slug === slugChecked) return;

    setSlugStatus("checking");
    setSlugChecked(slug);

    const result = await checkJournalSlugAction({
      slug,
      postId: post?.id,
    });

    setSlugStatus(result.available ? "available" : "taken");
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);

    const payload = {
      ...values,
      ...(post ? { id: post.id } : {}),
    };

    const result = isEdit
      ? await updateJournalPostAction(payload)
      : await createJournalPostAction(payload);

    setSaving(false);

    if (!result.success) {
      const fieldErrors = result.fieldErrors;

      if (fieldErrors.slug) {
        setError("slug", { message: fieldErrors.slug[0] });
        setSlugStatus("taken");
      }
      if (fieldErrors.title) setError("title", { message: fieldErrors.title[0] });
      if (fieldErrors.excerpt) setError("excerpt", { message: fieldErrors.excerpt[0] });
      if (fieldErrors.content) setError("content", { message: fieldErrors.content[0] });
      if (fieldErrors.coverImage) setError("coverImage", { message: fieldErrors.coverImage[0] });
      if (fieldErrors.author) setError("author", { message: fieldErrors.author[0] });

      toast.error(result.error || "It did not save. Try again.");
      return;
    }

    reset(values);
    toast.success(isEdit ? "Post saved." : "Post created.");

    if (result.postId) {
      router.push(`/admin/journal/${result.postId}`);
    }
  }

  const slugHelp =
    slugStatus === "checking"
      ? "Checking that URL…"
      : slugStatus === "available"
        ? "That URL is free."
        : slugStatus === "taken"
          ? "Another post already uses that URL."
          : "The address on the storefront.";

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6"
      >
        {/* ----------------------------- The post ----------------------------- */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">The post</h2>
          <p className="mt-1 text-small text-ink/55">
            The card the journal grid shows before anybody clicks.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field invalid={Boolean(errors.title)}>
                <FieldLabel htmlFor="jf-title">Title</FieldLabel>
                <FieldControl
                  render={
                    <Input
                      id="jf-title"
                      autoFocus
                      placeholder="Drainage is not optional"
                      maxLength={140}
                      {...register("title")}
                    />
                  }
                />
                <AnimatedFieldError show={Boolean(errors.title)}>
                  {errors.title?.message}
                </AnimatedFieldError>
              </Field>
            </div>

            <Field invalid={Boolean(errors.slug)}>
              <FieldLabel htmlFor="jf-slug">Slug</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="jf-slug"
                    placeholder="drainage-is-not-optional"
                    maxLength={160}
                    aria-describedby="jf-slug-help"
                    {...register("slug", {
                      onBlur: () => void handleSlugBlur(),
                    })}
                  />
                }
              />
              <p id="jf-slug-help" className="text-small text-ink/55">
                {slugHelp}
              </p>
              <AnimatedFieldError show={Boolean(errors.slug)}>
                {errors.slug?.message}
              </AnimatedFieldError>
            </Field>

            <Field invalid={Boolean(errors.author)}>
              <FieldLabel htmlFor="jf-author">Author</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="jf-author"
                    placeholder="Mara Quinn"
                    maxLength={80}
                    {...register("author")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.author)}>
                {errors.author?.message}
              </AnimatedFieldError>
            </Field>

            <Field invalid={Boolean(errors.readMinutes)}>
              <FieldLabel htmlFor="jf-read">Read time, minutes</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="jf-read"
                    type="number"
                    min={1}
                    max={120}
                    inputMode="numeric"
                    {...register("readMinutes")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.readMinutes)}>
                {errors.readMinutes?.message}
              </AnimatedFieldError>
            </Field>

            <div className="sm:col-span-2">
              <Field invalid={Boolean(errors.excerpt)}>
                <FieldLabel htmlFor="jf-excerpt">Excerpt</FieldLabel>
                <FieldControl
                  render={
                    <Textarea
                      id="jf-excerpt"
                      rows={3}
                      maxLength={320}
                      placeholder="The two or three sentences a card shows before the click."
                      {...register("excerpt")}
                    />
                  }
                />
                <FieldDescription>
                  Rendered as the lede on the post page, so it should read like
                  the first sentence of the article.
                </FieldDescription>
                <AnimatedFieldError show={Boolean(errors.excerpt)}>
                  {errors.excerpt?.message}
                </AnimatedFieldError>
              </Field>
            </div>
          </div>
        </section>

        {/* ----------------------------- The words ---------------------------- */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">The words</h2>
          <p className="mt-1 text-small text-ink/55">
            Markdown on the left, the storefront&apos;s render on the right.
          </p>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Field invalid={Boolean(errors.content)} className="xl:col-span-1">
              <FieldLabel htmlFor="jf-content">Markdown source</FieldLabel>
              <FieldControl
                render={
                  <Textarea
                    id="jf-content"
                    rows={26}
                    spellCheck
                    className="font-mono text-sm leading-relaxed"
                    placeholder={"## The rule\n\nWrite the post here. Headings, **bold** and > quotes all render live."}
                    {...register("content")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.content)}>
                {errors.content?.message}
              </AnimatedFieldError>
            </Field>

            <div
              aria-live="polite"
              className="min-h-64 max-h-[42rem] overflow-y-auto rounded-xl border border-ink/10 bg-warm-white p-5 sm:p-6"
            >
              <MarkdownPreview content={content} />
            </div>
          </div>
        </section>

        {/* ----------------------------- The cover ---------------------------- */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">The cover</h2>
          <p className="mt-1 text-small text-ink/55">
            A 16:10 photograph from /public/images — the journal files ship
            with the repo, so a post&apos;s cover is usually a path like
            &ldquo;/images/journal-drainage.webp&rdquo;.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_10rem]">
            <Field invalid={Boolean(errors.coverImage)}>
              <FieldLabel htmlFor="jf-cover">Cover image path</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="jf-cover"
                    placeholder="/images/journal-drainage.webp"
                    maxLength={300}
                    {...register("coverImage")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.coverImage)}>
                {errors.coverImage?.message}
              </AnimatedFieldError>
            </Field>

            <div className="relative hidden aspect-[16/10] overflow-hidden rounded-lg border border-ink/10 bg-mint sm:block">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>
          </div>
        </section>

        {/* ---------------------------- Publishing ---------------------------- */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-ink/10 bg-warm-white px-4 py-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-ink/25 accent-forest"
              {...register("published")}
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                Publish to the journal
              </span>
              <span className="mt-0.5 block text-small text-ink/55">
                Unpublished posts are only visible in the back office. The
                moment it goes live the post&apos;s dateline is stamped, so
                &ldquo;newest first&rdquo; means &ldquo;newest published&rdquo;.
              </span>
            </span>
          </label>
        </section>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            onClick={() => router.push("/admin/journal")}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={isSubmitting || saving}>
            {isEdit ? "Save post" : "Create post"}
          </Button>
        </div>
      </form>

      <UnsavedChangesBar
        onSave={() => void handleSubmit(onSubmit)()}
        onDiscard={() => reset()}
        saving={isSubmitting || saving}
      />
    </>
  );
}