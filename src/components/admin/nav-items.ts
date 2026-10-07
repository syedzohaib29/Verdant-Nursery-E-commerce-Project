import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboardIcon,
  MailIcon,
  NotebookPenIcon,
  ReceiptTextIcon,
  SettingsIcon,
  SproutIcon,
  StarIcon,
  StoreIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react";

/*
  The sidebar's destinations, as data.

  Kept out of the components so the sidebar and the top bar's breadcrumb read
  the same list — one definition of what the back office contains, and one
  place to give a destination a real href the day its screen is built.
*/

export type NavDestination = {
  label: string;
  icon: LucideIcon;
  /** Present means the destination exists; absent means it is still "Soon". */
  href?: string;
  soon?: boolean;
};

export type NavGroup = {
  /** Omitted for the untitled first group (the overview sits alone up top). */
  label?: string;
  items: NavDestination[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: "Overview", icon: LayoutDashboardIcon, href: "/admin" }],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Products", icon: SproutIcon, href: "/admin/products" },
      { label: "Categories", icon: TagsIcon, href: "/admin/categories" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", icon: ReceiptTextIcon, href: "/admin/orders" },
      { label: "Customers", icon: UsersIcon, href: "/admin/customers" },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Reviews", icon: StarIcon, href: "/admin/reviews" },
      { label: "Journal", icon: NotebookPenIcon, href: "/admin/journal" },
      { label: "Messages", icon: MailIcon, href: "/admin/messages" },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", icon: SettingsIcon, href: "/admin/settings" }],
  },
];

/** The escape hatch to the shopfront, pinned above the user card. */
export const STORE_DESTINATION: NavDestination = {
  label: "View store",
  icon: StoreIcon,
  href: "/",
};

/**
 * Which destination a pathname marks active.
 *
 * The overview matches only exactly — /admin/orders is Orders' page, not a
 * bigger Overview — while a nested route keeps its parent lit, so an order's
 * detail page still reads as "Orders". The store link never lights up: it
 * belongs to the shopfront, not the desk.
 */
export function isActiveDestination(pathname: string, href: string): boolean {
  if (href === "/") return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
