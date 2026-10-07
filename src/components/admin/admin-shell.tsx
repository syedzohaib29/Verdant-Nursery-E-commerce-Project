"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminTopbar } from "@/components/admin/admin-topbar";
import {
  AdminSidebar,
  rememberSidebarState,
} from "@/components/admin/admin-sidebar";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { AdminAlerts } from "@/lib/data/admin";
import { XIcon } from "lucide-react";

import { cn } from "cn";

/**
 * The back office frame: ink rail on the left, sticky top bar, warm-white
 * content between them.
 *
 * The rail's collapsed state arrives from the layout (which read the cookie on
 * the server), so the very first paint already has the right width — this
 * component only keeps it in step afterwards. Under `lg` the rail leaves the
 * layout entirely and the same sidebar moves into a drawer opened from the top
 * bar; Base UI's dialog gives that drawer the focus trap and scroll lock for
 * free, and every destination inside it closes the drawer on the way out.
 */
export function AdminShell({
  user,
  alerts,
  defaultCollapsed,
  children,
}: {
  user: { name: string; email: string };
  alerts: AdminAlerts;
  defaultCollapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A destination chosen from the drawer navigates the page; the drawer should
  // not still be standing over the result.
  useEffect(() => setDrawerOpen(false), [pathname]);

  function toggleCollapse() {
    setCollapsed((previous) => {
      const next = !previous;
      rememberSidebarState(next);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <AdminSidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          /* The primitive's own `w-3/4` wins on specificity, so the drawer's
             width is asserted here — 16rem, the rail's own measure, capped at
             85% of a phone so the page behind it still shows a sliver. */
          className="data-[side=left]:w-64! max-w-[85vw]! gap-0 bg-ink p-0 text-white shadow-none"
        >
          <SheetTitle className="sr-only">Back office navigation</SheetTitle>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close navigation"
                className="absolute top-4 right-3.5 text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-white/60"
              />
            }
          >
            <XIcon aria-hidden="true" strokeWidth={1.75} />
          </SheetClose>
          <AdminSidebar
            user={user}
            variant="sheet"
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* The content follows the rail's width, so opening it is one motion
          across the whole frame rather than a shove at the end of it. */}
      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-verdant motion-reduce:transition-none lg:pl-60",
          collapsed && "lg:pl-[72px]",
        )}
      >
        <AdminTopbar
          user={user}
          alerts={alerts}
          onOpenMenu={() => setDrawerOpen(true)}
        />

        <main className="mx-auto w-full max-w-[80rem] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
