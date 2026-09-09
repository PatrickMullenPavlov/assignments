/* The accounts with no exec sponsor before renewal.

   Two questions: which accounts, and what should I do about it. The second
   is not answered with a prescription — it is answered by putting the value,
   the clock and the account's behaviour next to each other so a person can
   decide which of seven to spend Thursday on.

   Dates and exposure are computed, never typed. Notice is 30 days before
   renewal, which is the deadline that actually matters.                   */

const TODAY = Date.UTC(2026, 8, 9);
const DAY = 86400000;
const NOTICE_DAYS = 30;

const fmt = (t) =>
  new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const RAW = [
  {
    account: "Halcyon", value: 142000, renews: Date.UTC(2026, 10, 12), owner: "Mia",
    replies: "Ruth Ellery", repliesRole: "VP Operations", lastReply: "22 Aug",
    known: 5, engaged: 1,
    usage: "falling", usageNote: "Reporting stopped 43 days ago. Weekly users 27 → 19.",
    sponsor: "Named in January, left the business on 27 August with both ops admins.",
    behaviour: [
      ["Reports opened a week", "0", "3 to 9", "falling", "Stopped on 28 July after averaging 11 through the month."],
      ["Weekly active users", "19", "18 to 40", "falling", "Down from 27 in July, at the bottom edge of normal."],
      ["Seats in use", "38 of 40", "—", "rising", "94% for three weeks, the highest it has been."],
      ["API calls a week", "4,100", "1,200–3,000", "rising", "Up 40% since June and above the band."],
      ["Admins with a login", "2", "2 to 6", "falling", "Two removed on 27 August, neither replaced."],
    ],
    inFlight: "A draft to Ruth has been in Mia's Gmail since yesterday. A renewal agenda is ready for Thursday.",
    verdict: "Highest value, soonest notice, and the only account here where usage is falling and rising at once. Somebody is building on the API while the interface went quiet — find out who, because that is the sponsor.",
  },
  {
    account: "Ferrovia", value: 96000, renews: Date.UTC(2026, 11, 3), owner: "Lazlo",
    replies: "Marc Oyelaran", repliesRole: "Head of Operations", lastReply: "19 Aug",
    known: 7, engaged: 1,
    usage: "stalled", usageNote: "Eight days from go-live and hasn't moved since 21 August.",
    sponsor: "Never named. The deal closed without one in March.",
    behaviour: [
      ["Go-live progress", "8 days out", "—", "flat", "Unchanged since 21 August."],
      ["Weekly active users", "6", "18 to 40", "falling", "Never reached the band. Six people since March."],
      ["Contacts who have ever replied", "1 of 7", "—", "flat", "Marc is the only one, and he last replied on 19 August."],
      ["Emails sent by us", "3", "—", "flat", "Three over ten days. No reply to any."],
    ],
    inFlight: "Handed over by Nudge stalled onboarders on 6 September. It will not send again.",
    verdict: "Not a sponsor problem so much as an adoption one — they never went live. A sponsor will not fix an account that has not started. Worth deciding whether this renews at all before spending the effort.",
  },
  {
    account: "Kestrel Group", value: 61000, renews: Date.UTC(2026, 11, 19), owner: "Lazlo",
    replies: "Jo Bergström", repliesRole: "CFO", lastReply: "14 Aug",
    known: 3, engaged: 1,
    usage: "falling", usageNote: "Both admins left on 12 August. Nobody replaced them.",
    sponsor: "Was one of the two admins who left on 12 August.",
    behaviour: [
      ["Admins with a login", "0", "2 to 6", "falling", "Both left on 12 August. Nobody has been added."],
      ["Reports opened a week", "1", "3 to 9", "falling", "Down from 7 before the admins left."],
      ["Weekly active users", "11", "18 to 40", "falling", "Below the band since 20 August."],
      ["Emails opened", "0 of 2", "—", "flat", "Two nudges, neither opened."],
    ],
    inFlight: "A draft is in Lazlo's Gmail. Lazlo calls them on Thursday.",
    verdict: "The clearest fix on the list. They have no admin at all, which is a concrete thing to offer help with — and Jo is a CFO, which makes her the sponsor if she will take it.",
  },
  {
    account: "Talia Foods", value: 61000, renews: Date.UTC(2027, 0, 14), owner: "Yan",
    replies: "Priya Shah", repliesRole: "Operations admin", lastReply: "1 Sep",
    known: 5, engaged: 1,
    usage: "flat", usageNote: "Flat since July, which is normal for them.",
    sponsor: "Named in March, gone in June. Nobody since.",
    behaviour: [
      ["Seats in use", "80%", "—", "rising", "Passed 80% on 1 September."],
      ["Weekly active users", "24", "18 to 40", "flat", "Inside the band all year."],
      ["Reports opened a week", "5", "3 to 9", "flat", "Steady since March."],
      ["Support tickets", "1", "under 4", "flat", "Quiet, and quiet is normal here."],
    ],
    inFlight: "A renewal agenda is ready for Thursday's call.",
    verdict: "The healthiest account with no sponsor. Nothing is wrong, which makes this the cheapest one to fix — ask on Thursday's call rather than making a separate approach.",
  },
  {
    account: "Lowen & Bray", value: 54000, renews: Date.UTC(2027, 1, 20), owner: "Kish",
    replies: "Nina Cardoso", repliesRole: "VP Revenue", lastReply: "19 Aug",
    known: 4, engaged: 1,
    usage: "falling", usageNote: "Seats down 8% since July — the second month running.",
    sponsor: "Never named since the account moved to Kish in April.",
    behaviour: [
      ["Seats in use", "23 of 30", "—", "falling", "Down 8% since July, second month running."],
      ["Weekly active users", "16", "18 to 40", "falling", "Below the band since August."],
      ["Reports opened a week", "3", "3 to 9", "flat", "At the bottom of the band."],
    ],
    inFlight: "Nina declined a meeting ask on 19 August — “not now, try me in the new year”.",
    verdict: "She has already said not until the new year, and the notice window opens in January. Respect that and diarise it rather than approaching again — a second ask in three weeks costs more than it gains.",
  },
  {
    account: "Ardent Rail", value: 39000, renews: Date.UTC(2027, 1, 2), owner: "Kish",
    replies: "Sam Idowu", repliesRole: "COO", lastReply: "6 Aug",
    known: 7, engaged: 1,
    usage: "flat", usageNote: "Low but steady. Seats unchanged since June.",
    sponsor: "Sam is the closest thing to one, and he has gone quiet.",
    behaviour: [
      ["Days since Sam opened anything", "34", "under 30", "falling", "Crossed the line on 5 September. Nobody was told."],
      ["Contacts engaged since May", "1 of 7", "—", "flat", "Only Sam, and only until August."],
      ["Weekly active users", "9", "18 to 40", "flat", "Below the band all year, but steady."],
    ],
    inFlight: "The assignment that watches this has been blind since 29 August. Nothing was sent.",
    verdict: "Smallest value and the least engaged. The honest move is to ask Sam directly on Friday whether this is still a priority — a clear no is worth more than another quarter of chasing.",
  },
  {
    account: "Pike & Rowe", value: 47000, renews: Date.UTC(2027, 2, 3), owner: "Cabbage Mick",
    replies: "Ben Achebe", repliesRole: "CTO", lastReply: "14 Aug",
    known: 2, engaged: 1,
    usage: "falling", usageNote: "Quiet, and quiet is unusual for them.",
    sponsor: "Never named. Ben has acted as one informally.",
    behaviour: [
      ["Contacts in total", "2", "median 5", "falling", "Half the median for accounts this size."],
      ["Weekly active users", "21", "18 to 40", "falling", "Down from 29 in June."],
      ["Reports opened a week", "2", "3 to 9", "falling", "Below the band since 12 August."],
    ],
    inFlight: "They are hiring two analytics engineers — a meeting ask is drafted and waiting.",
    verdict: "Two contacts in total is the real problem; the missing sponsor is a symptom. They are hiring analytics engineers, which is the natural reason to be introduced to somebody new.",
  },
];

export const RENEWALS = RAW.map((r) => {
  const notice = r.renews - NOTICE_DAYS * DAY;
  const daysToNotice = Math.round((notice - TODAY) / DAY);
  return {
    ...r,
    renewsLabel: fmt(r.renews),
    noticeLabel: fmt(notice),
    daysToNotice,
    weeksToNotice: Math.max(1, Math.round(daysToNotice / 7)),
    // £ of value per remaining week — what you lose, over the time left to save it
    exposure: Math.round(r.value / Math.max(1, Math.round(daysToNotice / 7))),
    valueLabel: "£" + (r.value / 1000) + "k",
  };
}).sort((a, b) => b.exposure - a.exposure);

export const TOTAL = RENEWALS.reduce((s, r) => s + r.value, 0);
export const INSIDE_90 = RENEWALS.filter((r) => r.daysToNotice <= 90).length;
export const FALLING = RENEWALS.filter((r) => r.usage === "falling").length;
export const money = (n) => "£" + (n / 1000).toFixed(0) + "k";
