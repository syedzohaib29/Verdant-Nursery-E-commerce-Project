/*
  Seed users.

  Passwords are hashed with bcrypt at seed time and never stored in plain text.
  The two documented accounts are the ones you can sign in with; the six customers
  are realistic names and cities so the order data reads like a real customer base
  rather than a test fixture.

  Every customer has a home address, because an order without a plausible delivery
  address is the first thing that makes seeded data look fake. Those same rows
  become their Address book entry, so the account pages have something in them.

  Passwords follow Firstname@12345 so they are easy to type from the README while
  still being obviously seed-only credentials.
*/

export type SeedAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  phone: string;
  address: SeedAddress;
};

export const USERS: SeedUser[] = [
  {
    name: "Mara Ellison",
    email: "admin@verdant.dev",
    password: "Admin@12345",
    role: "ADMIN",
    phone: "+1 (503) 555-0101",
    address: {
      line1: "1420 SE Ankeny Street",
      line2: null,
      city: "Portland",
      state: "OR",
      postalCode: "97214",
      country: "US",
    },
  },
  {
    name: "Theo Marsh",
    email: "demo@verdant.dev",
    password: "Demo@12345",
    role: "STAFF",
    phone: "+1 (503) 555-0102",
    address: {
      line1: "2841 NE Alberta Street",
      line2: "Apt 3",
      city: "Portland",
      state: "OR",
      postalCode: "97211",
      country: "US",
    },
  },
  {
    name: "Priya Raman",
    email: "priya.raman@example.com",
    password: "Priya@12345",
    role: "CUSTOMER",
    phone: "+1 (206) 555-0143",
    address: {
      line1: "918 NW 63rd Street",
      line2: null,
      city: "Seattle",
      state: "WA",
      postalCode: "98107",
      country: "US",
    },
  },
  {
    name: "Jordan Okafor",
    email: "jordan.okafor@example.com",
    password: "Jordan@12345",
    role: "CUSTOMER",
    phone: "+1 (512) 555-0177",
    address: {
      line1: "2214 South 5th Street",
      line2: "Unit B",
      city: "Austin",
      state: "TX",
      postalCode: "78704",
      country: "US",
    },
  },
  {
    name: "Sofia Lindqvist",
    email: "sofia.lindqvist@example.com",
    password: "Sofia@12345",
    role: "CUSTOMER",
    phone: "+1 (312) 555-0119",
    address: {
      line1: "547 West Eugenie Street",
      line2: null,
      city: "Chicago",
      state: "IL",
      postalCode: "60607",
      country: "US",
    },
  },
  {
    name: "Marcus Chen",
    email: "marcus.chen@example.com",
    password: "Marcus@12345",
    role: "CUSTOMER",
    phone: "+1 (415) 555-0162",
    address: {
      line1: "3310 22nd Street",
      line2: "Apt 5",
      city: "San Francisco",
      state: "CA",
      postalCode: "94110",
      country: "US",
    },
  },
  {
    name: "Amara Diallo",
    email: "amara.diallo@example.com",
    password: "Amara@12345",
    role: "CUSTOMER",
    phone: "+1 (718) 555-0134",
    address: {
      line1: "412 7th Avenue",
      line2: "Apt 2R",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11215",
      country: "US",
    },
  },
  {
    name: "Elena Vasquez",
    email: "elena.vasquez@example.com",
    password: "Elena@12345",
    role: "CUSTOMER",
    phone: "+1 (305) 555-0188",
    address: {
      line1: "1824 SW 9th Street",
      line2: null,
      city: "Miami",
      state: "FL",
      postalCode: "33135",
      country: "US",
    },
  },
];

/**
 * The six shop customers, in the order the reviews refer to them by email. Reviews
 * name an email rather than an index, so a review can never point at a user who
 * does not exist, and the admin and demo accounts never end up writing reviews.
 */
export const CUSTOMERS: SeedUser[] = USERS.filter((user) => user.role === "CUSTOMER");

/**
 * Guest checkout does not need an account, so some orders belong to people with no
 * User row at all. They are listed here so those orders still carry a real name and
 * a deliverable address instead of `guest1@example.com`.
 */
export const GUESTS: { name: string; email: string; phone: string; address: SeedAddress }[] = [
  {
    name: "Nadia Farouk",
    email: "nadia.farouk@example.com",
    phone: "+1 (617) 555-0155",
    address: {
      line1: "76 Prospect Avenue",
      line2: null,
      city: "Somerville",
      state: "MA",
      postalCode: "02143",
      country: "US",
    },
  },
  {
    name: "Ruben Alvarez",
    email: "ruben.alvarez@example.com",
    phone: "+1 (720) 555-0192",
    address: {
      line1: "1501 Blake Street",
      line2: "Apt 210",
      city: "Denver",
      state: "CO",
      postalCode: "80202",
      country: "US",
    },
  },
  {
    name: "Greta Lindholm",
    email: "greta.lindholm@example.com",
    phone: "+1 (503) 555-0121",
    address: {
      line1: "4403 SW Nevada Court",
      line2: null,
      city: "Portland",
      state: "OR",
      postalCode: "97219",
      country: "US",
    },
  },
  {
    name: "Tobias Whitfield",
    email: "tobias.whitfield@example.com",
    phone: "+1 (404) 555-0166",
    address: {
      line1: "1288 Howell Mill Road",
      line2: "Unit 4B",
      city: "Atlanta",
      state: "GA",
      postalCode: "30318",
      country: "US",
    },
  },
  {
    name: "Yuki Tanabe",
    email: "yuki.tanabe@example.com",
    phone: "+1 (213) 555-0139",
    address: {
      line1: "3110 West 20th Street",
      line2: null,
      city: "Los Angeles",
      state: "CA",
      postalCode: "90064",
      country: "US",
    },
  },
];
