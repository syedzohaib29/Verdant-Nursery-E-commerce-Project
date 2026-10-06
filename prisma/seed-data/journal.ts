/*
  Seed journal posts.

  Six long-form pieces, 600-odd words each. Six different jobs:

    1. an anecdote that lands the rule
    2. an honest answer that handles the objections
    3. a recipe, with the reasoning underneath it
    4. a triage list you can follow in order
    5. the mechanism, explained because it is genuinely interesting
    6. a confession about something we got wrong on the bench

  The voice is the nursery owner: warm, knowledgeable, lightly witty, and willing
  to say "this is harder than it looks" when that is true. No generic marketing
  copy, and no two posts open the same way.

  Author is a display name rather than a foreign key, because a journal post stays
  published after the person who wrote it stops working here.

  Every post needs a 16:10 cover, and the filename is the contract with
  /public/images/REPLACE_ME.md.
*/

export type SeedJournalPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  readMinutes: number;
  /** Days before today. */
  daysAgo: number;
};

export const JOURNAL_POSTS: SeedJournalPost[] = [
  {
    title: "Drainage is not optional, and your pot is lying to you",
    slug: "drainage-is-not-optional",
    excerpt:
      "Most houseplants die of kindness, and the kindness is usually water sitting in a pot with no hole. What actually happens to the roots, the three signs you are already too late, and what to do about it.",
    content: `Last February we took back eleven plants in a single fortnight. Not returns for a reason we could fix with a refund. Returns because they had been loved, thoroughly, by people who did everything the label told them and watched them die anyway. Eleven out of eleven had the same fault: a pot with no drainage hole.

I know why the pot exists. It is a glazed ceramic thing in a colour that matches someone's shelf, it was eleven pounds, and it looked wonderful in the shop. It is also a sealed box. Water goes in and does not come out, unless you remember to tip it out, and nobody remembers, because the label on the plant does not say "water, then remember to tip the pot". The plant label says "keep lightly moist". Lightly moist. In a sealed pot that is a slow, kind, total drowning.

Here is what happens below the surface, because it is worth understanding rather than just obeying. Roots need oxygen, not just water. A potful of soil is half air by volume, and that air is what the roots are breathing. When you fill every one of those pockets with water, the roots start to suffocate within hours. Suffocated root tissue is dead tissue. Dead tissue is food, and the bacteria that live in dead tissue are exactly the ones that flourish in a warm, wet, oxygen-poor pot. So the sequence is: roots drown, roots die, bacteria arrive, bacteria spread upward into the stem. By the time you see a yellow leaf, the rot has been running for two or three weeks.

Three signs you are already in it. First, the soil smells. Healthy potting mix smells like soil. Rotting mix smells sour, musty, faintly sweet, and you will recognise it instantly once you have smelled it. Second, the yellowing starts at the bottom. One lower leaf going yellow is the plant retiring an old one, which is normal. Three lower leaves going soft and yellow at once is rot climbing. Third, weight. A pot that still feels heavy four days after you watered it is holding water it should have drained. Pick it up. That is a test you can do with one hand.

What to do about it. Unpot the plant and look. Healthy roots are pale, firm, and they smell like nothing in particular. Dead roots are brown or black, soft, and slide between your fingers. Trim them off with clean scissors. Cut back into firm tissue, even if that means cutting back a lot. Pot it into a fresh, dry mix in a container with a hole, and then wait. Not water it for ten days. This is the part people get wrong: a plant with damaged roots cannot drink, and watering it again puts fresh water on tissue that cannot absorb it. Ten dry days is genuinely unpleasant to sit through and it is the single thing most likely to save the plant.

If you love the pot, and I would, then the fix is not to throw the pot away. It is to keep the plant in the plastic nursery pot it came in, and set that inside the decorative one. Water, wait ten minutes, tip the excess out of the outer pot. Ten minutes and a bit of attention, once a fortnight, and the expensive pot becomes furniture instead of a coffin.`,
    coverImage: "/images/journal-drainage.webp",
    author: "Mara",
    readMinutes: 4,
    daysAgo: 5,
  },
  {
    title: "How often should you water? The honest answer is it depends",
    slug: "watering-intervals-honestly",
    excerpt:
      "Every care card says water when the top is dry, which is correct and close to useless. How to work out what your plant actually needs this week, and why a calendar is the wrong tool.",
    content: `"How often should I water this?" is the question we get most, and it is the one we have to answer badly on purpose. There is no honest number. A monstera in a bright south-facing room in July wants water every nine or ten days. The same monstera, same pot, in a north-facing room in January wants it every three weeks. Anyone who tells you a fixed schedule is telling you about their own window, not your plant.

So here is the actual method, which takes about five seconds and beats any calendar.

Push a finger into the soil. Not the surface, which lies. Down to the second knuckle, which is roughly five centimetres. If it comes out cool and slightly damp, leave it. If it comes out dry and room temperature, water it. If it comes out wet and you are pretty sure you did not water it yesterday, you have a drainage problem, not a watering problem, and we have written about that one at length.

That is the core of it. Everything below is about the four things that make your plant's answer different from your neighbour's.

The pot matters more than people expect. Terracotta is porous and it evaporates through its walls, so a plant in terracotta can need water twice as often as the same plant in plastic. Glazed ceramic holds water close to plastic. A self-watering planter holds water on purpose, so it will be damp long after you think it should be. If you move a plant between pots and change its watering at the same time, you will not know which change did it. Change one thing at a time.

The season matters, and almost everybody gets winter wrong. Houseplants slow down in winter because the light is weaker and the days are shorter. They are not dying. They are resting. The instinct to fix a plant that looks a bit sad in January is to give it more water, and that is precisely how you turn a slightly unhappy plant into a dead one. Less water in winter, always.

The plant itself matters, and the honest ranking runs from thirsty to forgettable. Ferns, calatheas, prayer plants and peace lilies want to stay lightly moist and will tell you within hours when they are unhappy about it. Tropical foliage like monstera, philodendron and rubber plants want the top few centimetres dry. Succulents, cacti, snake plants and ZZ want to dry out completely, which in practice means watering them far less often than feels responsible. A snake plant does not want to be on a schedule at all; it wants to be left alone.

Two objections I get every time. First: I use a moisture meter. Good. It is the correct tool and it costs less than a plant. Push it in to the depth the roots actually are, which for most plants is not the surface. Second: I have a schedule and it works fine. Then your plant is unusually tolerant, or your schedule is wrong and you are getting away with it. The finger test costs nothing and settles the question every time.

The one thing I would add: water thoroughly and let it drain completely, rather than little and often. A small sip wets the top of the pot and leaves the root ball dry, which encourages roots to stay near the surface where they dry out fastest. Soak until water runs out of the hole, empty the saucer, and then leave it alone until the finger test says otherwise.`,
    coverImage: "/images/journal-watering-intervals.webp",
    author: "Mara",
    readMinutes: 4,
    daysAgo: 12,
  },
  {
    title: "The potting mix that actually works, and the one that does not",
    slug: "potting-mix-that-works",
    excerpt:
      "Garden compost is not potting mix and using it is the fastest way to kill a houseplant. What goes into a mix that holds water and air at the same time, how to tell yours has gone wrong, and why wet it before you pot.",
    content: `I will save you the two years of trial and error. Do not put garden soil in a pot. Not once, not even to save money, not even for a plant you do not care about.

Garden compost is engineered to stay where it is put. In a bed, worms turn it over, roots move through it, and rain drains away from it. That structure is the entire point. Scoop the same material into a pot and you have removed the entire reason it worked. It compacts. The air spaces collapse. And a potful of compacted compost holds water like a sponge, which means the roots sit in wet soil permanently, which is the thing we spend eleven returns a February talking about.

A potting mix has three jobs, and every ingredient is there for one of them. Hold some water. Hold some air. Do not compact. Those pull against each other, and the mix is the compromise between them.

For foliage plants, the mix we use on the bench is roughly two parts coir, one part fine perlite, one part fine pine bark. The coir holds water. It is a coconut byproduct, it holds several times its own weight in water, and unlike peat it is a waste stream rather than a bog we drained, which is the main reason we stopped using it. The perlite is expanded volcanic glass and its entire job is to be light and to refuse to collapse; it makes the air spaces that keep the roots breathing. The bark is structural. It stops the coir and perlite settling into a solid plug over a couple of years.

For succulents and cacti the ratio changes, because the requirement is the opposite: get rid of the water fast. One part coir, one part perlite, one part coarse bark or pumice, and the particle size gets larger. The test is in your hand. Squeeze a handful. If it holds together in a damp ball it is too wet for a succulent. If it feels gritty and falls apart when you open your fingers, it is right. A cactus mix you can form into a patty is a cactus mix that will kill a cactus.

Diagnosing a mix that has gone wrong takes ten seconds, because there are only two symptoms. If the soil stays wet for days after you water, it is too dense: add perlite or bark at the next repot, and repot sooner rather than later. If it goes bone dry within hours of watering, it is too open: add coir, or repot into something with more water retention. A plant that is neither is in the right mix and the problem is somewhere else, which is usually light.

One instruction that people skip and then blame us for. Wet the mix before you pot it up. Dry coir repels water, and if you pour dry mix into a pot and then water it, the water rolls off the top and down the sides and you are convinced you have a hydrophobic mix when you do not. Ten seconds of water and a squeeze, and it pots like soil should.

And the thing nobody tells you: potting mix expires. The organic matter breaks down, the structure slumps, and the plant starts struggling even if you are watering perfectly. Around eighteen months, check it. Squeeze a handful from the top of the pot. If it feels like fine flour rather than crumbs, top-dress or repot. I have had fiddle leaf figs decline for six months for no reason other than that.`,
    coverImage: "/images/journal-potting-mix.webp",
    author: "Theo",
    readMinutes: 4,
    daysAgo: 19,
  },
  {
    title: "Yellow leaves: what they mean and when to panic",
    slug: "yellow-leaves-explained",
    excerpt:
      "A yellow leaf is not always a crisis. Sometimes it is a plant retiring an old one. A short triage order for working out which it is, and the one thing you should never do.",
    content: `A yellow leaf arrives and the first thought is always the same: I have killed it. Usually you have not. Work through this in order and you will find out within a minute.

Step one: how many, and where. One or two leaves at the very bottom of the plant, with the rest of it looking healthy, is the plant recycling an old leaf it no longer has the light or the energy to support. This is completely normal and happens on every plant, always. It is not a symptom, it is housekeeping. Cut the yellow leaf off at the stem and leave everything else alone.

Step two: are they soft or crisp? This one question splits the problem in half and it is the most useful thing to check. Soft and mushy, especially at the base where they join the stem, means too much water. The tissue is failing rather than drying out, and the soil will be wet. Crisp and papery, almost translucent at the edges, means not enough water, or water that has arrived but could not be used.

Step three: touch the soil. This should really have been step one. If it is wet and the leaves are soft, you have been too kind. If it is dry and the leaves are crisp, you have been too careful. Both are fixable in the same afternoon and neither is fatal on its own.

Step four: light, if the first three came back normal. A plant in a dim spot cannot afford to hold leaves it cannot photosynthesise, so it drops the cheapest ones first, which are the shaded lower ones. Those leaves usually fall while still green rather than yellowing, but if they yellow first, this is you. The remaining leaves will look small and pale and the internodes between them will be long and stretched. Move the plant closer to the window and be patient; it will take a few weeks to look like itself again.

Step five: food. Interveinal yellowing, where the leaf is pale but the veins stay green, is a magnesium or iron shortage, and it is the only yellowing here that a fertiliser fixes. It shows up on older leaves first for magnesium and on newer ones for iron. A balanced feed, once a month from spring to autumn, prevents it entirely. Never feed in winter. The plant is not growing and the fertiliser will not be taken up; it will just sit in the soil and burn the roots.

What actually panics me is not yellowing. It is yellowing that arrives fast and everywhere at once, on soft leaves, in wet soil, with a smell coming up from the pot. That is root rot and the triage is different: unpot it, cut away anything brown and soft with a clean blade, repot into fresh dry mix, and do not water it for ten days.

And the last thing, which is counter-intuitive: never try to save a yellow leaf. It will not go green again. Anyone who tells you it will is thinking of the leaf above it. Trim the yellow and the plant puts that energy into the next one instead.`,
    coverImage: "/images/journal-yellow-leaves.webp",
    author: "Mara",
    readMinutes: 4,
    daysAgo: 26,
  },
  {
    title: "Variegation is a genetic accident, and it is fragile",
    slug: "variegation-fragile-beautiful",
    excerpt:
      "That cream stripe on your pothos is a mutation that leaves part of the leaf unable to feed the plant. Why variegated plants grow slower, need more light, burn more easily, and slowly revert to green.",
    content: `A plant makes chlorophyll, and chlorophyll is what captures light and turns it into food. Variegation is a patch of cells in the leaf that cannot make it. Those patches are the white and cream parts, and from the plant's point of view they are dead weight on every single leaf.

Once you frame it that way, every peculiar thing about variegated plants stops being mysterious and becomes obvious.

They grow more slowly. A variegated monstera will always be smaller than a green monstera of the same age, because it has less working surface. It is not sick. It is paying a permanent tax for the pattern. If you have read a listing that calls a slow-growing variegated plant healthy and vigorous, that is a description of something it is not.

They need more light. Less chlorophyll means less energy captured, so the plant needs more light to hit the same output. A green pothos will put up with a dim hallway for years. A variegated pothos in the same hallway will slowly lose its pattern, because the efficient thing to do with a leaf that is mostly white is to grow a leaf that is mostly green. That is not the plant misbehaving. It is the plant doing arithmetic. Bright indirect light, and it holds the pattern.

They burn more easily. The pale patches have no chlorophyll and no protective wax, and neither of those is a sunscreen. White tissue in direct sun cooks faster than green tissue, and white tissue in dry air crisps faster than green tissue. So brown edges on the white part of a leaf are a light or humidity problem, not a watering problem, and chasing it with a watering can makes it worse. Move the plant back from the glass, or put it in a room with more ambient light and less direct.

They revert, and this is the part that catches people. A variegated plant can and does produce a completely green leaf. That leaf is more efficient than its variegated neighbours, so it grows faster, and if you leave it alone the plant becomes green one leaf at a time. Six months of a lucky plant and the whole thing is plain green, which is genuinely deflating. The counter is simple and people do not do it: cut out any fully green leaf as soon as you see it, with a blade cleaned in alcohol, before it has a chance to dominate. Cut close to the stem. It feels ruthless and it is the whole game.

None of this means avoid variegated plants. It means go in with the right expectations. A variegated plant is a slightly harder plant that looks better, it will not outgrow a green one, and it will tell you quite quickly if the light is wrong. If you want an easy first houseplant, buy something with a pattern that is a feature of the species rather than a mutation: a sansevieria band, or the silver striping on a calathea, which is structural and stays exactly where it is.`,
    coverImage: "/images/journal-variegation.webp",
    author: "Theo",
    readMinutes: 4,
    daysAgo: 33,
  },
  {
    title: "We repotted a whole bench wrong in March",
    slug: "repotting-when-and-why",
    excerpt:
      "Repotting is stressful and doing it at the wrong time sets a plant back for months. What actually tells you it is time, why one size up is the rule, and the bench mistake we made in March.",
    content: `In March we decided that a handful of our plants looked tired. They had not. We repotted six of them into fresh mix and two sizes up, because that is what you do when a plant looks tired, and then watched all six sulk for two months and drop leaves we had no way to replace. It cost us six plants of goodwill and one afternoon of standing in front of them feeling stupid. Here is what we got wrong and what we now tell people.

Repotting is not maintenance. It is a construction project with a recovery period attached, and doing it on a plant that does not need it is the same as renovating a house that is fine. The roots get disturbed. The plant loses the fine feeder roots it had just finished growing. It spends the next month rebuilding them instead of growing leaves, and it may drop one or two in protest, which everyone panics about and which is completely normal.

The real test is not on top. It is at the roots. Slide the plant out of its pot and look. A dense mat of roots circling the bottom and coming through the drainage hole, with almost no visible soil, means it is time. Soil still visible, roots loose and white, means leave it alone. That is the whole test and it takes two minutes including putting it back.

Two symptoms mean root-bound even though they do not look like a plant problem. The first is wilting in wet soil, which confuses everybody, because you water it and it looks worse. That is not overwatering. A root ball packed solid with no soil cannot hold water, so the plant wilts, you water it, the water runs straight through, and it wilts more. The second is a plant that has stopped growing in the middle of summer and you have already ruled out light and water. It has run out of soil to feed from.

When you do repot, one size up. No more than two or three centimetres wider than the old pot. This is the rule people break constantly and it is counterintuitive, because a bigger pot feels more generous. A large pot holds a large volume of soil, and a large volume of soil stays wet for a long time, and a plant sitting in permanently wet soil develops exactly the root rot you were repotting to cure. You are trying to give the roots more room; you are not trying to give them a swamp. If the old pot is badly cracked and falling apart, take it up one size and accept that, because a pot that is visibly failing is a different problem.

Always fresh mix. Never garden soil, and never reuse the old mix, which carries whatever went wrong. Water thoroughly straight after to settle the mix around the roots and eliminate the air pockets, and then leave it alone. Do not compensate for the stress by watering more. The roots need dry-ish time to heal and to find the new soil.

And the timing. Spring and early summer, when the plant is pushing growth and can recover quickly. Never in winter, because a resting plant cannot repair root damage. Never on a plant that is already stressed by rot, pests or a move, either. Fix what is wrong first, then repot, and never do both in the same month.`,
    coverImage: "/images/journal-repotting.webp",
    author: "Mara",
    readMinutes: 4,
    daysAgo: 40,
  },
];