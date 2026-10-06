/*
  Seed inbox rows: newsletter subscribers and contact messages.

  These two tables are small but they are the only place the shop has an inbound
  queue, and an empty queue hides every state the contact page and the footer
  signup need to render. So the list is long enough to be a list.

  Newsletter signups are dated across four months, oldest first, because "joined
  in March" is what the account pages show and a single signup date for everyone
  looks like a fixture. Some addresses are existing customers and some are not;
  both happen, and only the customer ones have an account to find.

  Contact messages are left mostly unread on purpose, so the admin inbox has
  something to triage. Topics come from CONTACT_TOPICS in
  /src/lib/constants.ts, and the type here is derived from that list rather than
  written out again, so adding a topic to the constants cannot leave this file
  seeding a value the contact form would reject.

  Message text is what a person actually types: lower case, no signature, and one
  that admits a plant died rather than being a compliment with a question
  stapled on.
*/

import type { ContactTopic } from "../../src/lib/constants";

export type SeedNewsletterSubscriber = {
  email: string;
  /** Days before today. */
  daysAgo: number;
};

export const NEWSLETTER_SUBSCRIBERS: SeedNewsletterSubscriber[] = [
  { email: "mara.thornton@gmail.com", daysAgo: 128 },
  { email: "daniel.reyes@outlook.com", daysAgo: 121 },
  { email: "priya.raman@example.com", daysAgo: 96 },
  { email: "hannah.lindqvist@fastmail.com", daysAgo: 84 },
  { email: "sofia.lindqvist@example.com", daysAgo: 71 },
  { email: "peter.novak@gmail.com", daysAgo: 63 },
  { email: "amara.diallo@example.com", daysAgo: 55 },
  { email: "grace.mbeki@yahoo.com", daysAgo: 47 },
  { email: "tom.ferreira@gmail.com", daysAgo: 38 },
  { email: "marcus.chen@example.com", daysAgo: 29 },
  { email: "sara.hughes@proton.me", daysAgo: 22 },
  { email: "elena.vasquez@example.com", daysAgo: 14 },
  { email: "ben.oyelaran@gmail.com", daysAgo: 6 },
  { email: "claire.dubois@laposte.net", daysAgo: 1 },
];

export type SeedContactMessage = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  read: boolean;
  /** Days before today. */
  daysAgo: number;
};

export const CONTACT_MESSAGES: SeedContactMessage[] = [
  {
    name: "Hannah Lindqvist",
    email: "hannah.lindqvist@fastmail.com",
    topic: "ORDER",
    message:
      "My order number is VRD-10051. You said it had shipped on Thursday and it still hasn't turned up and the tracking link has not moved in three days. Is it stuck somewhere or has it been lost? It is not urgent because the plants are not going to survive much longer in the box.",
    read: false,
    daysAgo: 2,
  },
  {
    name: "Grace Mbeki",
    email: "grace.mbeki@yahoo.com",
    topic: "PLANT_ADVICE",
    message:
      "I have a monstera that has been dropping one leaf a week since I moved house in February. Bright indirect light, watered when the top is dry, same routine as always. The new leaves are coming in smaller than the old ones. Is this a light problem or has the move done something to the roots?",
    read: false,
    daysAgo: 4,
  },
  {
    name: "Daniel Reyes",
    email: "daniel.reyes@outlook.com",
    topic: "DELIVERY",
    message:
      "Two of the four pots in my order arrived cracked and one had soil all over the outside of the box. The plants themselves look fine. Do I need to send the pots back or are you replacing them? I would rather not drive two hours for a terracotta pot but I also do not want to be charged for the damage.",
    read: true,
    daysAgo: 9,
  },
  {
    name: "Sara Hughes",
    email: "sara.hughes@proton.me",
    topic: "WHOLESALE",
    message:
      "I run a small interiors shop in Bend and I would like to stock about fifteen of the terracotta pots and a dozen of the brass cans. Do you do wholesale pricing, and is there a minimum? Happy to collect from Portland if that is easier than shipping.",
    read: false,
    daysAgo: 16,
  },
  {
    name: "Peter Novak",
    email: "peter.novak@gmail.com",
    topic: "PLANT_ADVICE",
    message:
      "My Boston fern went completely brown in four days while I was away for a long weekend and I did not arrange for anyone to water it. I have cut it all back and there is still some green at the base. Is there any point trying to bring it back or should I buy another one?",
    read: false,
    daysAgo: 21,
  },
  {
    name: "Claire Dubois",
    email: "claire.dubois@laposte.net",
    topic: "OTHER",
    message:
      "Not a question, just to say the potting mix note about wetting the mix first saved a plant of mine. I have been potting up dry for twenty years. Also I would like a second copy of the drainage article to give to my sister, who is worse than I was.",
    read: false,
    daysAgo: 26,
  },
];
