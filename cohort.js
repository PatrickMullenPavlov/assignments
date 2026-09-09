/* The 96 accounts that went through Win back lapsed trials.

   Every number in the report is derived from this list, not typed next to
   it. If a count appears on screen it is `ACCOUNTS.filter(...).length`, so
   the arithmetic cannot drift the way it did when the figures were prose.

   Distributions, fixed so the cross-tabs close:

     trial use     5+ days 18 · 2–4 days 27 · opened once 51      = 96
     came back     4 of the 18 · 2 of the 27 · 1 of the 51        =  7
     position      4 waiting after step 1 · 8 after step 2
                   12 at step 3 · 7 came back · 5 replied, no buy
                   60 went silent                                 = 96      */

const STEMS = [
  "Orvis", "Fenwick", "Marchmont", "Trellis", "Redwing", "Cassidy", "Pentworth", "Halverson",
  "Bevan", "Kestrel", "Oakhampton", "Norling", "Ardwick", "Brightsea", "Corvus", "Talia",
  "Meridian", "Northwind", "Lowen", "Pike", "Ferrovia", "Halcyon", "Cobalt", "Ardent",
  "Sandmere", "Whitlock", "Ashby", "Drummond", "Everly", "Farrow", "Garrick", "Hollis",
  "Ingram", "Jarrow", "Kinsley", "Lambourn", "Merrick", "Netherby", "Ossory", "Prendergast",
  "Quillon", "Rathmore", "Selby", "Thornby", "Ulverston", "Vanbrugh", "Wexford", "Yarrow",
];
const SUFFIX = ["", " Group", " Labs", " & Co", " Rail", " Foods", " Health", " Partners"];

function names(n) {
  const out = [];
  for (let i = 0; out.length < n; i++) {
    const stem = STEMS[i % STEMS.length];
    const suf = SUFFIX[Math.floor(i / STEMS.length) % SUFFIX.length];
    out.push(stem + suf);
  }
  return out;
}

/* position → what the row says about it */
const POSITIONS = {
  wait1:    { label: "Waiting after step 1",     order: 1 },
  wait2:    { label: "Waiting after step 2",     order: 2 },
  step3:    { label: "At step 3, waiting on you", order: 3 },
  back:     { label: "Came back",                 order: 4 },
  saidno:   { label: "Replied, didn't buy",       order: 5 },
  silent:   { label: "Went silent",               order: 6 },
};

/* how many sit in each position, and how the trial-use bands cut across it */
/* position, how many, how they split across the three trial-use bands, and
   how many of them opened / clicked. Quotas rather than derived flags, so
   the funnel lands on 96 · 41 · 18 · 12 · 7 exactly. */
const PLAN = [
  ["wait1", 4, [1, 1, 2], 3, 0],
  ["wait2", 8, [2, 3, 3], 8, 4],
  ["step3", 12, [4, 4, 4], 10, 2],
  ["back", 7, [4, 2, 1], 7, 7],
  ["saidno", 5, [2, 2, 1], 5, 5],
  ["silent", 60, [5, 15, 40], 8, 0],
];
const BANDS = ["heavy", "some", "once"];
const BAND_LABEL = { heavy: "Used it on 5+ days", some: "Used it on 2–4 days", once: "Signed up, opened it once" };

const WHAT = {
  wait1: ["Step 1 sent, opened, no reply", "Step 1 sent, not opened"],
  wait2: ["Case study sent, clicked, no reply", "Case study sent, not opened", "Case study sent, opened"],
  step3: ["20% offer written, unsent", "20% offer written, unsent for a fortnight"],
  back: ["Replied to the case study and converted", "Replied to step 1 within the hour"],
  saidno: ["Replied — already bought elsewhere", "Replied — no budget this year"],
  silent: ["Three steps, nothing opened", "Three steps, one open, no click"],
};
const WHEN = {
  wait1: ["2 Sep", "2 Sep"], wait2: ["26 Aug", "2 Sep", "19 Aug"],
  step3: ["2 Sep", "26 Aug"], back: ["3 Sep", "21 Aug"],
  saidno: ["14 Aug", "28 Aug"], silent: ["1 Sep", "26 Aug"],
};

const pool = names(96);
let n = 0;

export const ACCOUNTS = PLAN.flatMap(([position, total, bandSplit, opens, clicks]) => {
  let seen = 0;
  return BANDS.flatMap((band, bi) =>
    Array.from({ length: bandSplit[bi] }, () => {
      const i = n++;
      const k = seen++;
      const converted = position === "back";
      const replied = converted || position === "saidno";
      // the heaviest trial users engage first — quotas fill in band order
      const clicked = k < clicks;
      const opened = k < opens;
      return {
        name: pool[i],
        band,
        bandLabel: BAND_LABEL[band],
        position,
        positionLabel: POSITIONS[position].label,
        order: POSITIONS[position].order,
        opened, clicked, replied, converted,
        what: WHAT[position][i % WHAT[position].length],
        when: WHEN[position][i % WHEN[position].length],
      };
    }),
  );
});

/* Every set the report can open. The count shown IS this length. */
export const SETS = {
  reached:   { label: "reached", of: () => ACCOUNTS },
  opened:    { label: "opened", of: () => ACCOUNTS.filter((a) => a.opened) },
  clicked:   { label: "clicked", of: () => ACCOUNTS.filter((a) => a.clicked) },
  replied:   { label: "replied", of: () => ACCOUNTS.filter((a) => a.replied) },
  converted: { label: "came back", of: () => ACCOUNTS.filter((a) => a.converted) },
  wait1:  { label: "waiting after step 1", of: () => ACCOUNTS.filter((a) => a.position === "wait1") },
  wait2:  { label: "waiting after step 2", of: () => ACCOUNTS.filter((a) => a.position === "wait2") },
  step3:  { label: "at step 3, waiting on you", of: () => ACCOUNTS.filter((a) => a.position === "step3") },
  back:   { label: "came back", of: () => ACCOUNTS.filter((a) => a.position === "back") },
  saidno: { label: "replied but didn't buy", of: () => ACCOUNTS.filter((a) => a.position === "saidno") },
  silent: { label: "went silent", of: () => ACCOUNTS.filter((a) => a.position === "silent") },
  inflight: { label: "still inside the machine", of: () => ACCOUNTS.filter((a) => ["wait1", "wait2", "step3"].includes(a.position)) },
  left:     { label: "have left the machine", of: () => ACCOUNTS.filter((a) => ["back", "saidno", "silent"].includes(a.position)) },
  heavy:  { label: "used it on 5+ days", of: () => ACCOUNTS.filter((a) => a.band === "heavy") },
  some:   { label: "used it on 2–4 days", of: () => ACCOUNTS.filter((a) => a.band === "some") },
  once:   { label: "signed up, opened it once", of: () => ACCOUNTS.filter((a) => a.band === "once") },
  "heavy-back": { label: "used it on 5+ days and came back", of: () => ACCOUNTS.filter((a) => a.band === "heavy" && a.converted) },
  "some-back":  { label: "used it on 2–4 days and came back", of: () => ACCOUNTS.filter((a) => a.band === "some" && a.converted) },
  "once-back":  { label: "opened it once and came back", of: () => ACCOUNTS.filter((a) => a.band === "once" && a.converted) },
};

export const count = (k) => SETS[k].of().length;
export const pct = (a, b) => Math.round((count(a) / count(b)) * 100) + "%";
