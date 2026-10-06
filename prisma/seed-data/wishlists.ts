/*
  Seed wishlists.

  Wishlist rows are the easiest thing in the schema to leave empty and the first
  thing an account page looks broken without, so a handful of customers get a
  saved list. Two details are deliberate:

  - Somebody is watching the String of Pearls, which is out of stock. A wishlist
    full of things you could buy right now would not tell you why the feature
    exists.
  - Items are dated. A list where everything was saved on the same day reads as a
    fixture, and the "saved 3 weeks ago" line is what a real list shows.
*/

export type SeedWishlistItem = {
  /** Must be one of the six customer accounts in ./users. */
  customer: string;
  sku: string;
  /** Days before today. */
  daysAgo: number;
};

export const WISHLIST: SeedWishlistItem[] = [
  { customer: "sofia.lindqvist@example.com", sku: "VRD-SUC-1017", daysAgo: 34 },
  { customer: "sofia.lindqvist@example.com", sku: "VRD-CAR-1026", daysAgo: 21 },
  { customer: "sofia.lindqvist@example.com", sku: "VRD-IND-1008", daysAgo: 9 },

  { customer: "jordan.okafor@example.com", sku: "VRD-PET-1012", daysAgo: 27 },
  { customer: "jordan.okafor@example.com", sku: "VRD-POT-1020", daysAgo: 12 },

  { customer: "elena.vasquez@example.com", sku: "VRD-IND-1004", daysAgo: 41 },
  { customer: "elena.vasquez@example.com", sku: "VRD-PET-1011", daysAgo: 6 },

  { customer: "marcus.chen@example.com", sku: "VRD-CAR-1027", daysAgo: 18 },
  { customer: "marcus.chen@example.com", sku: "VRD-POT-1022", daysAgo: 3 },

  { customer: "amara.diallo@example.com", sku: "VRD-SOI-1023", daysAgo: 30 },
  { customer: "amara.diallo@example.com", sku: "VRD-SUC-1016", daysAgo: 15 },
  { customer: "amara.diallo@example.com", sku: "VRD-IND-1001", daysAgo: 2 },

  { customer: "priya.raman@example.com", sku: "VRD-LGT-1005", daysAgo: 23 },
  { customer: "priya.raman@example.com", sku: "VRD-PET-1019", daysAgo: 11 },
  { customer: "priya.raman@example.com", sku: "VRD-SOI-1024", daysAgo: 4 },
];
