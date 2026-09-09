/* Chase quiet champions — the people, and what three months of chasing
   actually taught us.

   The subject is a PERSON, not an account, and that changes the problem.
   "Quiet" is not one thing: a champion can go quiet because the account is
   dying, because they delegated and everything is fine, because they left
   the company, or because it is August. Those are four different jobs and
   only one of them is a chase.

   Every count below is derived from CHAMPIONS, never typed.              */

const KINDS = {
  risk: {
    label: "The account went quiet too",
    short: "Account quiet",
    tell: "Nobody at the account has done anything either. Usage falling.",
  },
  delegated: {
    label: "They delegated, and the account is busy",
    short: "Delegated",
    tell: "Others at the account are more active than ever. The champion stepped back.",
  },
  left: {
    label: "They left the company",
    short: "Left",
    tell: "Email bounced, or LinkedIn says a new employer. The CRM still lists them.",
  },
  seasonal: {
    label: "Quiet for a reason that passes",
    short: "Seasonal",
    tell: "Out of office, holiday, a known freeze. Usage unchanged.",
  },
};

/* kind, how many went quiet, of those how many were chased,
   and how many came back in each arm */
const PLAN = [
  ["risk", 13, { chased: 7, chasedBack: 5, leftAlone: 6, leftAloneBack: 1 }],
  ["delegated", 17, { chased: 8, chasedBack: 2, leftAlone: 9, leftAloneBack: 7 }],
  ["left", 6, { chased: 5, chasedBack: 0, leftAlone: 1, leftAloneBack: 0 }],
  ["seasonal", 5, { chased: 0, chasedBack: 0, leftAlone: 5, leftAloneBack: 4 }],
];

const NAMES = [
  ["Ruth Ellery", "Halcyon", 142], ["Sam Idowu", "Ardent Rail", 39],
  ["Marc Oyelaran", "Ferrovia", 96], ["Jo Bergström", "Kestrel Group", 61],
  ["Marta Lind", "Corvus", 74], ["Priya Shah", "Talia Foods", 61],
  ["Alex Renn", "Meridian Health", 88], ["Nina Cardoso", "Lowen & Bray", 54],
  ["Ben Achebe", "Pike & Rowe", 47], ["Ana Rehn", "Brightsea", 58],
  ["Tom Verity", "Northwind Rail", 112], ["Cara Milne", "Redwing", 46],
  ["Nina Okafor", "Trellis", 33], ["Ren Kapoor", "Cobalt Systems", 88],
  ["Dana Whitlock", "Meridian Health", 88], ["Sam Bright", "Oakhampton", 41],
  ["Alan Reddy", "Fenwick", 29], ["Cara Devlin", "Orvis", 36],
  ["Nils Haugen", "Bevan & Co", 52], ["Ify Balogun", "Sandmere", 44],
  ["Rob Kinsley", "Whitlock", 38], ["Ash Farrow", "Drummond", 67],
  ["Lena Prine", "Everly", 31], ["Cal Merrick", "Garrick", 55],
  ["Dee Hollis", "Ingram", 43], ["Tam Jarrow", "Jarrow Ltd", 27],
  ["Ola Selby", "Lambourn", 62], ["Ivo Netherby", "Ossory", 35],
  ["Ruth Quillon", "Rathmore", 49], ["Bea Thornby", "Selby", 58],
  ["Gus Wexford", "Ulverston", 40], ["Mia Vanbrugh", "Vanbrugh", 53],
  ["Jon Yarrow", "Yarrow", 30], ["Kit Ashby", "Ashby", 45],
  ["Ren Norling", "Norling", 39], ["Vic Ardwick", "Ardwick", 57],
  ["Pia Bevan", "Bevan Labs", 34], ["Sol Kestrel", "Kestrel Labs", 48],
  ["Nel Oakhampton", "Oakhampton Rail", 51], ["Ari Pentworth", "Pentworth", 42],
  ["Zoe Halverson", "Halverson", 37],
];

let n = 0;
export const CHAMPIONS = PLAN.flatMap(([kind, total, arm]) => {
  const out = [];
  const push = (chased, back, count) => {
    for (let i = 0; i < count; i++) {
      const [name, account, value] = NAMES[n % NAMES.length];
      n++;
      out.push({
        name, account, value,
        kind,
        kindLabel: KINDS[kind].label,
        kindShort: KINDS[kind].short,
        chased,
        returned: back,
        // days quiet: still-quiet people are the long ones
        days: back ? 18 + ((n * 7) % 20) : 34 + ((n * 11) % 40),
        state: back ? (chased ? "back after a nudge" : "back on their own") : chased ? "chased, still quiet" : "not chased, still quiet",
      });
    }
  };
  push(true, true, arm.chasedBack);
  push(true, false, arm.chased - arm.chasedBack);
  push(false, true, arm.leftAloneBack);
  push(false, false, arm.leftAlone - arm.leftAloneBack);
  return out;
});

export const KIND_KEYS = Object.keys(KINDS);
export const KIND = KINDS;

const where = (f) => CHAMPIONS.filter(f);
export const SET = {
  all: () => CHAMPIONS,
  chased: () => where((c) => c.chased),
  leftAlone: () => where((c) => !c.chased),
  back: () => where((c) => c.returned),
  stillQuiet: () => where((c) => !c.returned),
  gone: () => where((c) => c.kind === "left"),
};
export const byKind = (k) => where((c) => c.kind === k);
export const arm = (k, chased) => where((c) => c.kind === k && c.chased === chased);
export const armBack = (k, chased) => where((c) => c.kind === k && c.chased === chased && c.returned);
export const rate = (a, b) => (b.length ? Math.round((a.length / b.length) * 100) + "%" : "—");

/* the 18 it watches right now, and cannot currently see */
export const WATCHED = 18;
