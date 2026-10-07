"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The bar that slides in when a form has been touched and not saved.
 *
 * It exists because the alternative is a person who edits twelve fields, hits
 * the back button, and loses all of it — or worse, does not notice they were
 * editing at all. The bar says what is about to be lost and offers the two
 * honest outcomes: save it, or throw it away on purpose.
 *
 * Sticky at the bottom on every size, and it clears the space the toaster
 * uses so a "saved" message never lands underneath it.
 */
export function UnsavedChangesBar({
  onSave,
  onDiscard,
  saving,
}: {
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 shadow-lift backdrop-blur-sm"
        role="status"
      >
        <div className="mx-auto flex max-w-[80rem] flex-wrap items-center gap-3 px-5 py-3 sm:px-8 lg:px-10">
          <p className="min-w-0 flex-1 text-small text-ink/70">
            You have unsaved changes.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              disabled={saving}
            >
              Discard
            </Button>
            <Button size="sm" onClick={onSave} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
