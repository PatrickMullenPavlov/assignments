/* What a run was built from, what it checked, and what it would have cost you.

   This existed on one canvas — the proposal document — as three properties of
   that shape. It is the most valuable thing on the screen and the other eight
   assignments had nothing like it, so it is a component now, rendered from
   run-level data under whatever the third pane happens to show.

   Three bands, and they answer three different questions:

     built from   where did this come from, and is it current
     checked      what did it actually verify, and what did it refuse to do
     would take   what would this have cost a person

   The last is an estimate and says so. It is computed — minutes per unit
   times the units this run produced — so the figure and its workings cannot
   drift apart, and a run that made fewer things claims less.               */

const hours = (mins) => {
  const h = mins / 60;
  if (h < 1) return `${Math.round(mins)} minutes`;
  return `${h % 1 === 0 ? h : h.toFixed(1)} hours`;
};

/* name → { from, checked, cost } */
export const PROVENANCE = {
  "Prep my 1:1s": {
    from: [
      ["Kish's calendar, 14 to 18 September", "11 customer calls, two of them moved since Friday"],
      ["HubSpot activity on all 11 accounts", "read at 6:40 am, nothing since"],
      ["Your notes from the last call with each", "9 of 11 had one — Trellis and Redwing did not"],
      ["Every promise made in those notes", "14 open, 3 of them older than a month"],
    ],
    checked: [
      ["ok", "Every call has an account behind it", "11 of 11 matched"],
      ["ok", "Nothing older than the last conversation", "cut-off is each account's own last call"],
      ["warn", "Two accounts have no notes to work from", "Trellis and Redwing — their packs are thinner and say so"],
    ],
    cost: { each: 20, units: 11, unit: "pack", how: "reading the account, the last call and the open promises" },
  },

  "Draft proposals against our pricing": {
    from: [
      ["Pricing book v4", "current since 1 August — v3 was in force when v1 went out"],
      ["The five deals at proposal stage", "£96k to £140k, all closing this quarter"],
      ["The proposal you sent each of them before", "structure reused, numbers not"],
      ["Usage on each account, last 90 days", "what justifies the seat count you are asking for"],
    ],
    checked: [
      ["ok", "Every line priced from the current book", "18 lines across 5 deals"],
      ["warn", "Two lines outside the standard discount", "22% and 25% against a 20% cap. Flagged, not changed"],
      ["ok", "Renewal dates match HubSpot", "5 of 5"],
    ],
    cost: { each: 45, units: 5, unit: "proposal", how: "pulling the pricing, the usage and the last version" },
  },

  "Rank today's list before dialling": {
    from: [
      ["All 61 accounts in Kish's book", "looked at every one at 6:40 am"],
      ["What changed on each since yesterday", "usage, replies, tickets, stage moves"],
      ["Your dialler history", "who you have already tried this week, and how often"],
    ],
    checked: [
      ["ok", "Nobody rung twice in three days", "4 held back for that reason"],
      ["ok", "Every account still in your book", "2 dropped overnight, both removed"],
      ["warn", "53 have nothing new", "left off the list rather than padded onto it"],
    ],
    cost: { each: 4, units: 61, unit: "account", how: "opening each one to see if anything moved" },
  },

  "Confirm exec sponsor involvement before renewal": {
    from: [
      ["34 accounts renewing inside 90 days", "£487k between them"],
      ["Everyone who has replied to anything in 90 days", "by account, by seniority"],
      ["Who was named as sponsor at close", "11 of 34 had one recorded"],
    ],
    checked: [
      ["ok", "Every account has a renewal date", "34 of 34"],
      ["warn", "7 have nobody senior replying", "the list this run produced"],
      ["ok", "Nobody chased about this in the last fortnight", "3 skipped for that reason"],
    ],
    cost: { each: 8, units: 34, unit: "account", how: "checking who replied last and whether they are senior" },
  },

  "Book meetings with the people we're missing": {
    from: [
      ["23 deals with a contact gap", "fewer than 3 named people on a deal over £40k"],
      ["Who the deal already talks to", "and who it never has"],
      ["The last five asks you sent", "so the drafts sound like you"],
    ],
    checked: [
      ["ok", "Nobody asked twice in a month", "6 held back"],
      ["warn", "14 drafts need you before they go", "Trig writes, you send"],
      ["ok", "Every name exists in the CRM", "no invented contacts"],
    ],
    cost: { each: 12, units: 14, unit: "draft", how: "working out who is missing and writing the ask" },
  },

  "Chase quiet champions": {
    from: [
      ["18 champions on Kish's accounts", "last read 28 August"],
      ["Their activity, until the token expired", "logins, replies, meeting attendance"],
    ],
    checked: [
      ["warn", "It could not read HubSpot", "8 runs, nothing checked"],
      ["warn", "3 crossed 30 days quiet in that window", "nobody was told"],
      ["ok", "It said so rather than reporting nothing", "every run since is on the record"],
    ],
    cost: { each: 6, units: 0, unit: "champion", how: "checking each champion's last activity", note: "Nothing this run — it could not see." },
  },

  "Win back lapsed trials": {
    from: [
      ["96 accounts whose trial ended without converting", "inside the window this run swept"],
      ["How much each used it during the trial", "the band that predicts coming back"],
      ["Everything sent to them already", "so nobody gets step 2 twice"],
    ],
    checked: [
      ["ok", "Nobody at step 3 without opening step 1", "12 waiting, all qualified"],
      ["warn", "12% replied — so did 11% left alone", "this is not working, and the report says so"],
      ["ok", "Nobody contacted who has bought since", "7 removed"],
    ],
    cost: { each: 9, units: 96, unit: "account", how: "picking them out and writing each step" },
  },

  "Log every touch, contact and outcome": {
    from: [
      ["Your dialler, mailbox and calendar", "read continuously, not on a schedule"],
      ["412 things that happened today", "calls, replies, meetings, stage moves"],
    ],
    checked: [
      ["ok", "Every record traces to something observed", "nothing invented, nothing a person typed was edited"],
      ["warn", "3 writes rejected by Salesforce", "one required field, one fix releases all three"],
      ["ok", "No duplicates written", "18 matched to an existing record instead"],
    ],
    cost: { each: 1.5, units: 412, unit: "record", how: "typing each one into the CRM after the fact" },
  },

  "Publish the weekly revenue pack": {
    from: [
      ["HubSpot pipeline at 4:55 pm Friday", "the snapshot the pack is built on"],
      ["Every rep's commit", "7 of 7 in before the cut-off"],
      ["Last week's pack", "so the movement column is real"],
    ],
    checked: [
      ["ok", "Team total reconciles against rep commits", "£1,840,000, both ways"],
      ["ok", "Every deal over £50k named", "14 of them"],
      ["warn", "Two deals slipped past the quarter", "called out rather than quietly re-dated"],
    ],
    cost: { each: 150, units: 1, unit: "pack", how: "pulling the pipeline, chasing commits and writing it up" },
  },
};

const TICK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const WARN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.01"/></svg>`;

/** The three bands, under whatever the pane is showing. */
export function provenance(name) {
  const p = PROVENANCE[name];
  if (!p) return "";
  const { each, units, unit, how, note } = p.cost;
  const total = each * units;

  return `
    <div class="prov-bands">
      <div class="prov-band">
        <h3 class="canvas-h">What it was built from</h3>
        <ul class="prov">
          ${p.from.map((f) => `<li><span class="prov-t">${f[0]}</span><span class="prov-s">${f[1]}</span></li>`).join("")}
        </ul>
      </div>

      <div class="prov-band">
        <h3 class="canvas-h">What it checked</h3>
        <ul class="checks">
          ${p.checked
            .map(
              (c) => `<li class="${c[0]}">
                <span class="check-i">${c[0] === "ok" ? TICK : WARN}</span>
                <span><span class="prov-t">${c[1]}</span><span class="prov-s">${c[2]}</span></span>
              </li>`,
            )
            .join("")}
        </ul>
      </div>

      <div class="prov-band">
        <h3 class="canvas-h">What this would have taken you</h3>
        <p class="prov-figure">${total ? hours(total) : "—"}</p>
        <p class="prov-sum">${
          note ??
          `${units} ${unit}${units === 1 ? "" : "s"} &times; ${each} minutes &mdash; ${how}.`
        }</p>
        <p class="prov-caveat">An estimate, from what this run actually produced. It falls when the run finds less.</p>
      </div>
    </div>`;
}
