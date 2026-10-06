/*
  Seed reviews.

  Forty individual experiences, not forty variations on one template. Where
  possible each review sits on a product that plausibly attracted that reviewer:
  people who buy calatheas write about humidity and crisping edges, people who buy
  snake plants write about forgetting to water, people who buy soil write about
  what their old mix was doing wrong.

  The two-star and three-star entries are deliberate. A plant that arrived
  damaged, a courier error, a plant that died despite sensible care. A review
  section with no criticism in it reads as fabricated, and it also hides the
  returns-bench problems we would rather hear about. Several are the customer's
  own fault and they say so, because those are the reviews that teach somebody
  something.

  Authors are named by email rather than by index, so a review can never point at
  an account that does not exist, and the admin and demo accounts never end up
  writing customer reviews.

  A Review row has no link back to an order, so "verified purchase" is derived by
  matching the reviewer against paid and fulfilled order lines. A little over half
  of these forty reviews have such a line, because the order generator reads this
  file and favours the things a customer went on to review. The remainder are
  people who also buy over the counter, which is what makes the badge a signal
  rather than decoration.

  Three reviews are deliberately left `approved: false` so the moderation queue is
  not empty on a fresh database.
*/

export type SeedReview = {
  sku: string;
  rating: number;
  title: string;
  body: string;
  approved: boolean;
  /** Days before today. Spread so review dates are not all the same. */
  daysAgo: number;
  /** Must be one of the six customer accounts in ./users. */
  customer: string;
};

export const REVIEWS: SeedReview[] = [
  // Monstera Deliciosa
  {
    sku: "VRD-IND-1001",
    rating: 5,
    title: "Second one, because the first did not survive a move",
    body: "I killed a monstera moving flats and ordered another rather than replace it with something easier. This one arrived with seven leaves, all flat and unfenestrated because they were still hardening, which the card explained, and three weeks later the splits are coming in. Packed in a box with no loose soil, which is more than I can say for the last nursery I tried.",
    approved: true,
    daysAgo: 12,
    customer: "priya.raman@example.com",
  },
  {
    sku: "VRD-IND-1001",
    rating: 4,
    title: "Loose soil in the box",
    body: "Plant was fine and healthy but there was soil everywhere inside the box and one leaf had a nick out of it. Nothing serious. Packing note was useful and the plant itself was clearly well looked after, so this is about the packaging rather than what I received.",
    approved: false,
    daysAgo: 2,
    customer: "elena.vasquez@example.com",
  },

  // Snake Plant
  {
    sku: "VRD-LGT-1002",
    rating: 5,
    title: "Two weeks without water and it did not even sulk",
    body: "Went on a work trip, forgot to tell my flatmate, came back after thirteen days fully expecting to compost it. Looked exactly the same. I now water it whenever I remember, which is roughly monthly, and it has been the least demanding plant in the room for a year.",
    approved: true,
    daysAgo: 8,
    customer: "jordan.okafor@example.com",
  },
  {
    sku: "VRD-LGT-1002",
    rating: 3,
    title: "Good plant, wrong time of year for me",
    body: "No complaint about the plant itself, it is healthy and correctly packed. The fault is mine: I ordered it into a north-facing bathroom with no window and it has grown three new leaves in eight months. Should have read the light requirement more carefully.",
    approved: true,
    daysAgo: 33,
    customer: "elena.vasquez@example.com",
  },

  // Golden Pothos
  {
    sku: "VRD-IND-1003",
    rating: 5,
    title: "Best value on the site",
    body: "Fifteen dollars for a plant that will outlive me. It arrived in a 10cm pot already trailing slightly, and I have since rooted three cuttings from it in jars on my windowsill, which is exactly what everyone says you can do and I did not believe them. Bright yellow, not the washed-out green you get from etiolated supermarket stock.",
    approved: true,
    daysAgo: 5,
    customer: "marcus.chen@example.com",
  },

  // Fiddle Leaf Fig
  {
    sku: "VRD-IND-1004",
    rating: 5,
    title: "Worth the money, and I was nervous about the price",
    body: "Eighty-five dollars is a lot for a plant and I spent a fortnight deciding. What you are actually paying for is that it has hardened off, and it has not dropped a single leaf in two months in a south-facing room. The leaves are proper dinner-plate size rather than the small ones you get from an unrooted cutting.",
    approved: true,
    daysAgo: 14,
    customer: "amara.diallo@example.com",
  },
  {
    sku: "VRD-IND-1004",
    rating: 3,
    title: "Dropped four leaves after I moved it",
    body: "Read the warning about not moving it after it settles and then moved it about three weeks after delivery, which was stupid of me. Four leaves gone, two new ones coming. Recovering now that I have left it in one spot, and the shop did reply when I asked whether that was normal. To be fair to them it was entirely my fault.",
    approved: true,
    daysAgo: 29,
    customer: "sofia.lindqvist@example.com",
  },
  {
    sku: "VRD-IND-1004",
    rating: 4,
    title: "Big and healthy, check your furniture first",
    body: "The plant is excellent. My own watering habits are the weak link, having lost a plant in the fortnight after it arrived and put two back before this one. Four stars is for the plant and not for my track record, and the pot is heavier than I expected so I had to move it to a stronger shelf.",
    approved: false,
    daysAgo: 0,
    customer: "priya.raman@example.com",
  },

  // ZZ Plant
  {
    sku: "VRD-LGT-1005",
    rating: 5,
    title: "Perfect for the study where the radiator runs all winter",
    body: "Dry air from a radiator is what killed my last plant, and this has sat above it through a full winter with maybe four waterings. Glossy, thick stems, no complaints. It has thrown four new shoots since spring.",
    approved: true,
    daysAgo: 10,
    customer: "sofia.lindqvist@example.com",
  },
  {
    sku: "VRD-LGT-1005",
    rating: 2,
    title: "Yellowed within a month",
    body: "Three lower leaflets went yellow and dropped, then two more. I was watering weekly because that is what I do to everything else, and the note says monthly. Clearly my fault, and I should have read further down the page. The shop replaced it and I took the replacement, but the first one was still a shock.",
    approved: true,
    daysAgo: 38,
    customer: "jordan.okafor@example.com",
  },

  // Peace Lily
  {
    sku: "VRD-IND-1006",
    rating: 5,
    title: "Flowered in four months in a room with no window",
    body: "Genuinely did not expect this. Three white spathes so far. It droops dramatically when it wants water and stands back up within an hour of a drink, which sounds annoying but I find it useful. If you can live with a plant that performs its feelings this is a great deal.",
    approved: true,
    daysAgo: 17,
    customer: "marcus.chen@example.com",
  },
  {
    sku: "VRD-IND-1006",
    rating: 4,
    title: "Brown edges, but that is my water",
    body: "Tips started browning after about six weeks. I read the note properly this time and it is hard tap water, so I have switched to filtered and the new growth is clean. Same plant, same care, different water. Fine with me since I know why now.",
    approved: true,
    daysAgo: 31,
    customer: "jordan.okafor@example.com",
  },

  // Rubber Plant
  {
    sku: "VRD-IND-1007",
    rating: 5,
    title: "Watched the new leaf unroll in one morning",
    body: "The burgundy sheath thing is not marketing, it is real. Came in as a tight red scroll and was fully open by the next morning. Big and glossy and the leaves have actually got bigger since it arrived, which I did not think happened with these.",
    approved: true,
    daysAgo: 20,
    customer: "elena.vasquez@example.com",
  },

  // Bird of Paradise
  {
    sku: "VRD-IND-1008",
    rating: 5,
    title: "A leaf every three weeks, not exaggerating",
    body: "Counted them. Five new leaves since June in a south-facing room. The splits on the older leaves look like damage to me but apparently they are just how the leaf splits as it hardens, and I have stopped worrying about it. Worth the reduced price.",
    approved: true,
    daysAgo: 11,
    customer: "amara.diallo@example.com",
  },

  // Philodendron Brasil
  {
    sku: "VRD-IND-1009",
    rating: 4,
    title: "Rooted a cutting in a jam jar",
    body: "Did not believe the note about rooting in water. Cut a node off a trailing vine, put it in a jar, changed the water every few days, and there are roots after about three weeks. Now potted and growing. The trade-off is that the cream stripe has already greened up on the older leaves, because I gave it less light than the note asks for. Two plants from one purchase, both alive, so I am happy.",
    approved: true,
    daysAgo: 9,
    customer: "sofia.lindqvist@example.com",
  },

  // Chinese Money Plant
  {
    sku: "VRD-IND-1010",
    rating: 5,
    title: "Four pups already, my colleagues have taken three",
    body: "Wobbly little thing that leans hard toward the window, exactly as described, and it has produced four offsets I have potted up. The office now has more pileas than it has windows. Rotating it weekly is not optional or you get one long stem.",
    approved: true,
    daysAgo: 15,
    customer: "priya.raman@example.com",
  },

  // Calathea Orbifolia
  {
    sku: "VRD-PET-1011",
    rating: 4,
    title: "It is labelled fussy and that is fair",
    body: "Third calathea I have bought and the first two came from a supermarket. This one came with the humidity requirement stated plainly, which meant I bought a mister at the same time and it has not crisped once. The silver banding is much stronger than on the supermarket ones, presumably because it has not been grown in a dark corner of a warehouse. Down a star because it is genuinely more work than my last two plants.",
    approved: true,
    daysAgo: 7,
    customer: "marcus.chen@example.com",
  },
  {
    sku: "VRD-PET-1011",
    rating: 3,
    title: "Two leaves crisped in the first fortnight",
    body: "I did not have filtered water ready and used tap for the first two waterings. Switched to rainwater and it has been healthy since, so the plant is fine and my set-up was not. Three stars is for the shock rather than the plant.",
    approved: true,
    daysAgo: 25,
    customer: "sofia.lindqvist@example.com",
  },

  // Areca Palm
  {
    sku: "VRD-PET-1012",
    rating: 4,
    title: "Replaced a Kentia that died in a month",
    body: "The Kentia was a shop display plant that had been in a dark lobby for years and it went brown inside six weeks. This one is small and actively growing rather than dramatic, which I would rather have. Four fronds in five months. It is not a centrepiece and I would not pretend otherwise, but it is alive, which the last one never managed.",
    approved: true,
    daysAgo: 16,
    customer: "marcus.chen@example.com",
  },

  // Boston Fern
  {
    sku: "VRD-PET-1013",
    rating: 5,
    title: "Passed the three-month test",
    body: "Reviewing a lot of ferns on here suggests others have had my experience, which is that they go brown and dramatic if you look at them wrong. Mine came with a note about humidity and a bathroom with a window, and three months on it is lush. Two of my friends have now ordered one after seeing it.",
    approved: true,
    daysAgo: 6,
    customer: "jordan.okafor@example.com",
  },
  {
    sku: "VRD-PET-1013",
    rating: 3,
    title: "Dried out in my house before I worked out why",
    body: "Whole thing went crisp in four days while I was away for a long weekend and I was not expecting weekly watering to be a two-person job. It recovered after cutting everything back but it looks sparse now. My fault entirely, and the care card did say twice a week.",
    approved: true,
    daysAgo: 46,
    customer: "amara.diallo@example.com",
  },
  {
    sku: "VRD-PET-1013",
    rating: 5,
    title: "So much better than the last nursery",
    body: "Ordered two ferns, both arrived with firm green fronds and none of the brown edges the supermarket ones always have. Second one is in the hallway and doing well too. Just wanted to say the difference is obvious.",
    approved: false,
    daysAgo: 1,
    customer: "sofia.lindqvist@example.com",
  },

  // Aloe Vera
  {
    sku: "VRD-SUC-1014",
    rating: 5,
    title: "Useful and basically unkillable",
    body: "Used a leaf for a kitchen burn the week it arrived, which sounds like a gimmick but it genuinely worked. Three pups at the base now and the parent has not sulked once. Bright window, water every three weeks, done.",
    approved: true,
    daysAgo: 13,
    customer: "priya.raman@example.com",
  },

  // Jade Plant
  {
    sku: "VRD-SUC-1015",
    rating: 5,
    title: "The red edges are real and they look good",
    body: "Everyone warns you off succulents because of rot, and this one has been in a south-facing window since March with almost no water and has grown a woody stem. The red margins on the older leaves are sun stress apparently, and I have decided to read that as a feature.",
    approved: true,
    daysAgo: 21,
    customer: "sofia.lindqvist@example.com",
  },

  // Echeveria Set
  {
    sku: "VRD-SUC-1016",
    rating: 5,
    title: "Four different rosettes, not four of the same one",
    body: "This is what I wanted and it is rarer than it sounds. Two are powder blue, one is green, one is somewhere between. They have coloured up noticeably now the nights are cooler. Kept them on a south sill and watered the soil only.",
    approved: true,
    daysAgo: 18,
    customer: "amara.diallo@example.com",
  },
  {
    sku: "VRD-SUC-1016",
    rating: 2,
    title: "Lost a rosette in the first month",
    body: "One of the four went soft and collapsed, which is what happens when water sits in the crown. Mine, not theirs, I poured straight into the middle while it was still wet from a previous watering. The other three are excellent. Bought it at the reduced price and would still say it was worth it for three.",
    approved: true,
    daysAgo: 52,
    customer: "priya.raman@example.com",
  },

  // String of Pearls
  {
    sku: "VRD-SUC-1017",
    rating: 4,
    title: "Arrived already on the frame, so it looked right immediately",
    body: "The thing I like most is that it did not arrive as a sad bundle of unrooted strands that takes a year to look like anything. Established on a wire frame with proper root mass. Four strands lengthened noticeably in two months. I would have liked one more strand for the price, hence the missing star.",
    approved: true,
    daysAgo: 23,
    customer: "jordan.okafor@example.com",
  },
  {
    sku: "VRD-SUC-1017",
    rating: 3,
    title: "Lost a strand to overwatering, my fault",
    body: "Watered it weekly like the listing roughly says and lost one strand's worth of pearls overnight, which is unrecoverable as the note warned. Cut the damage back, moved it to the brightest window I have and slowed to every ten days. The rest is holding on.",
    approved: true,
    daysAgo: 45,
    customer: "elena.vasquez@example.com",
  },

  // Spider Plant
  {
    sku: "VRD-PET-1018",
    rating: 5,
    title: "Gave a plantlet to everyone in the office",
    body: "Four pups in the first summer and everyone wanted one. The brown tips it warned about turned out to be tap water, and rainwater fixed that overnight. Cheapest plant we sell and the least trouble.",
    approved: true,
    daysAgo: 4,
    customer: "marcus.chen@example.com",
  },
  {
    sku: "VRD-PET-1018",
    rating: 5,
    title: "Safe around a very interested cat",
    body: "I ordered three of these specifically because my cat has destroyed everything else. All three intact after four months of being batted at and occasionally sat on. Recommended without reservation to anyone with a cat.",
    approved: true,
    daysAgo: 37,
    customer: "priya.raman@example.com",
  },

  // Prayer Plant
  {
    sku: "VRD-PET-1019",
    rating: 5,
    title: "Actually folds up at night",
    body: "I thought the name was marketing. Come back into the room after dark and the leaves are folded upright like hands together, and by morning they are flat again. Worth buying for that alone.",
    approved: true,
    daysAgo: 29,
    customer: "amara.diallo@example.com",
  },

  // Planters and pots
  {
    sku: "VRD-POT-1020",
    rating: 5,
    title: "Soaked them first, exactly as instructed, and it worked",
    body: "I have repotted before without soaking clay and wondered why the mix went dry in an hour. Soaked these for half an hour like the card said and the potting took ten minutes longer with damp clay that actually holds together. Three useful sizes.",
    approved: true,
    daysAgo: 15,
    customer: "amara.diallo@example.com",
  },
  {
    sku: "VRD-POT-1021",
    rating: 5,
    title: "Bought a second for the fiddle leaf",
    body: "The liner is the point and it makes a real difference, my plant dries out at a normal rate instead of the two days a cachepot gave me. Matte green is nicer than the shiny stuff and does not show fingerprints.",
    approved: true,
    daysAgo: 26,
    customer: "marcus.chen@example.com",
  },
  {
    sku: "VRD-POT-1022",
    rating: 5,
    title: "Three weeks away and came back to healthy plants",
    body: "Travelled for 24 days with this on the counter and filled the reservoir before I left. Came back to no drama. The indicator window is genuinely useful and I have bought two more.",
    approved: true,
    daysAgo: 33,
    customer: "elena.vasquez@example.com",
  },

  // Soil and care
  {
    sku: "VRD-SOI-1023",
    rating: 5,
    title: "First proper potting mix I have bought",
    body: "Dug my monstera out of four-year-old compacted compost and repotted it in this. Coir and bark, no peat, and it has pushed four new leaves in a month. The wet-it-first instruction is real; I skipped it on the second bag and regretted that too.",
    approved: true,
    daysAgo: 10,
    customer: "jordan.okafor@example.com",
  },
  {
    sku: "VRD-SOI-1024",
    rating: 5,
    title: "Rescued a soggy succulent with this",
    body: "Mixed it two parts to one with the potting mix as suggested, repotted a jade that was going soft at the base, and it has hardened off completely. Big particle size is the whole point and you can see it in the bag.",
    approved: true,
    daysAgo: 21,
    customer: "priya.raman@example.com",
  },
  {
    sku: "VRD-SOI-1025",
    rating: 5,
    title: "Fixed a plant that had gone nowhere for a year",
    body: "One tub in spring, watered it in immediately, and within six weeks the calathea put out a new leaf I would not have believed from that plant. Cheapest thing on this site and the highest return.",
    approved: true,
    daysAgo: 24,
    customer: "amara.diallo@example.com",
  },

  // Tools
  {
    sku: "VRD-CAR-1026",
    rating: 5,
    title: "The spout is worth the money on its own",
    body: "Reaching between a crowded monstera without putting soil on the floor, and without cold water sitting in the crown, which is what I used to do with a normal can. Heavy enough to stay put. Already developing a patina.",
    approved: true,
    daysAgo: 12,
    customer: "marcus.chen@example.com",
  },
  {
    sku: "VRD-CAR-1027",
    rating: 5,
    title: "Bigger leaves on the same plant within a month",
    body: "Added it to a philodendron that was producing small leaves on long stems, which I now understand is what happens without something to climb. Two new leaves since, both noticeably larger. Wet the pole first as instructed.",
    approved: true,
    daysAgo: 27,
    customer: "sofia.lindqvist@example.com",
  },
  {
    sku: "VRD-CAR-1028",
    rating: 5,
    title: "Cuts like scissors rather than a pair of pliers",
    body: "Makes a real difference taking a pothos cutting. Clean slice, no crushing of the stem, and the new cutting rooted in nine days. Wiped with alcohol between plants as suggested.",
    approved: true,
    daysAgo: 31,
    customer: "jordan.okafor@example.com",
  },
];