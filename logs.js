/* What the silent assignments actually did.

   "412 records written today" and "40 runs that found nothing" are claims
   until you can open them. These are the lists behind those numbers.
   Long ones are truncated honestly — the drawer says how many it is
   showing and of what, rather than implying the list is the whole thing. */

const ORGS = [
  "Halcyon", "Ferrovia", "Corvus", "Cobalt Systems", "Kestrel Group", "Talia Foods",
  "Meridian Health", "Ardent Rail", "Lowen & Bray", "Pike & Rowe", "Brightsea", "Northwind Rail",
  "Trellis", "Redwing", "Orvis", "Fenwick", "Bevan & Co", "Oakhampton",
];
const PEOPLE = ["Mia", "Lazlo", "Cabbage Mick", "Yan", "Kish"];

const KINDS = [
  ["Call", "logged 22 min, outcome: next step agreed"],
  ["Email", "sent, threaded to the open opportunity"],
  ["Email", "reply received, sentiment recorded"],
  ["Meeting", "attendees matched to contacts, notes attached"],
  ["Outcome", "stage moved to Proposal, reason recorded"],
  ["Call", "logged 8 min, outcome: no answer"],
  ["Contact", "new contact created from an email signature"],
  ["Outcome", "next step set for 16 September"],
];

function clock(i) {
  const m = 6 * 60 + 41 + i * 17;
  const h = Math.floor(m / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/* 412 written today — the last 40, newest first */
const writes = Array.from({ length: 40 }, (_, i) => {
  const k = KINDS[i % KINDS.length];
  return [clock(39 - i), ORGS[i % ORGS.length], k[0], `${k[1]} · as ${PEOPLE[i % PEOPLE.length]}`];
});

/* the three that did not go through */
const rejects = [
  ["Tue 08:14", "Ferrovia", "Opportunity", "Forecast Category is required and Trig does not fill it. The update is queued, not lost."],
  ["Tue 11:02", "Meridian Health", "Opportunity", "Forecast Category is required. Same field, same cause."],
  ["Wed 09:37", "Corvus", "Opportunity", "Forecast Category is required. Third attempt since the field was added on 2 September."],
];

/* Every run since the token expired on 29 August, and the last one that
   could see. Generated from the dates so the count cannot be wrong: the
   figure on the report is this list's length. */
const BLIND_FROM = Date.UTC(2026, 7, 31); // Monday 31 August, the first missed run
const TODAY = Date.UTC(2026, 8, 9);

const blind = [];
for (let t = TODAY; t >= BLIND_FROM; t -= 86400000) {
  const d = new Date(t);
  if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
  blind.push([
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) + ", 6:40 am",
    "0", "0", "3s", "found nothing — could not read HubSpot",
  ]);
}
export const BLIND_RUNS = blind.length;
blind.push(["28 Aug, 6:40 am", "18", "412", "41s", "the last run that could see anything"]);

/* the 18 it can no longer look at */
const invisible = [
  ["Ruth Ellery", "Halcyon", "last opened something 22 August"],
  ["Sam Idowu", "Ardent Rail", "day 41 quiet — crossed the line on 5 September"],
  ["Marc Oyelaran", "Ferrovia", "day 34 quiet — crossed the line on 12 September"],
  ["Jo Bergström", "Kestrel Group", "day 31 quiet — crossed the line on 8 September"],
  ["Marta Lind", "Corvus", "last opened something 3 September"],
  ["Priya Shah", "Talia Foods", "last opened something 1 September"],
  ["Alex Renn", "Meridian Health", "last opened something 26 August"],
  ["Nina Cardoso", "Lowen & Bray", "last opened something 19 August"],
  ["Ben Achebe", "Pike & Rowe", "last opened something 14 August"],
  ["Ana Rehn", "Brightsea", "last opened something 4 September"],
];

export const LOGS = {
  writes: {
    label: "records written today",
    meta: "Showing the last 40 of 412 · today, from 6:41 am",
    cols: ["Time", "Account", "Kind", "What was written"],
    widths: "68px 150px 84px 1fr",
    rows: writes,
  },
  quarter: {
    label: "records written this quarter",
    meta: "Showing the last 40 of 41,000 · 4 March to today",
    cols: ["Time", "Account", "Kind", "What was written"],
    widths: "68px 150px 84px 1fr",
    rows: writes,
  },
  rejects: {
    label: "writes rejected",
    meta: "All three · every one Salesforce, every one the same field",
    cols: ["When", "Account", "Object", "Why it was rejected"],
    widths: "88px 150px 96px 1fr",
    rows: rejects,
  },
  blind: {
    label: "runs that found nothing",
    meta: `All ${BLIND_RUNS} of them since the token expired on 29 August, and the last run that could see. A normal run takes 41 seconds.`,
    cols: ["Run", "Checked", "Records read", "Took", "Outcome"],
    widths: "132px 72px 104px 60px 1fr",
    rows: blind,
  },
  invisible: {
    label: "champions it can no longer look at",
    meta: "Showing 10 of 18 · last read on 28 August, so every date below is stale",
    cols: ["Champion", "Account", "As at 28 August"],
    widths: "150px 150px 1fr",
    rows: invisible,
  },
};
