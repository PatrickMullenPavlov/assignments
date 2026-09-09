/* Needs action — rows, and the drawer behind them.

   A row's SUBJECT decides its shape. Four of them occur:

     account     something happened at a customer
     tool        a connection broke, so work stopped
     assignment  the work itself is wrong — no output, or aimed at nobody
     person      someone inside YOUR business has to do something

   Only the first is about a customer. The other three are about the
   machine, and they read differently: what's blocked, and whose call it
   is. Same list, because a person clearing their morning shouldn't have
   to check two places to find out why nothing happened.

   Rules this implements, all settled earlier:
   - Trig never sends. A draft already sits in the owner's Gmail; the verb
     leaves the product. "Bin it" is Trig tidying its own artefact.
   - A one-click action gets a line and its verb in the row. Something you
     have to read before deciding gets the drawer.
   - Resolving advances to the next item. The queue empties itself.
   - These are the same objects as Issues, filtered to what needs a person
     today. One dataset, two views — not two lists.                        */

const ITEMS = [
  {
    subject: "tool", name: "HubSpot", kind: "decision",
    owner: null, perRep: { Lazlo: "4 assignments · 14 of your accounts", Mia: "4 assignments · 12 of your accounts", "Cabbage Mick": "4 assignments · 11 of your accounts", Yan: "4 assignments · 9 of your accounts", Kish: "4 assignments · 15 of your accounts" },
    line: "Lost permission on 29 August. Every run since has finished in 3 seconds with nothing to read.",
    blocks: "4 assignments · 61 accounts", whose: "You", age: "11 days",
    inlineVerb: { label: "Reconnect" },
    why: [
      "The token expired on 29 August. Nobody re-authorised it.",
      "A normal run reads 412 activity records. Every run since has read 0.",
      "Three champions crossed 30 days quiet while it couldn't see. One is on day 41.",
    ],
    did: [
      "Carried on running to schedule, 11 days, 40 runs.",
      "Found nothing each time — which looks identical to a quiet fortnight.",
      "Flagged it here once the gap in reads was long enough to be certain.",
    ],
    artefact: null,
    actions: [{ label: "Reconnect HubSpot", primary: true }, { label: "Show me the 3 I missed" }, { label: "Pause the 4 assignments" }],
    after: "Reconnecting fixes all four at once. They pick up on tomorrow's 6:40 run without being told.",
  },
  {
    subject: "account", name: "Halcyon", kind: "decision",
    owner: "Mia", perRep: null,
    line: "A draft to Ruth is in Mia's Gmail. Reporting stopped 43 days ago and both admins left on 27 August.",
    blocks: "Confirm exec sponsor involvement", whose: "Mia", age: "1 day",
    inlineVerb: { label: "Open in Gmail", external: true },
    why: [
      "Reports opened a week went from 11 to 0 on 28 July.",
      "Two ops admin seats removed on 27 August, 42 to 40. Both opened reports weekly.",
      "Ticket 4412 has been open 9 days with no reply from us.",
    ],
    did: [
      "Held the first draft for six weeks — policy caps this account at 2 emails a week.",
      "Rewrote it on 8 September once the seat change landed.",
      "Wrote it into Mia's drafts at 6:41 am. Nothing has been sent.",
    ],
    artefact: {
      meta: "To Ruth Ellery · from anna@trypavlov.com · subject &ldquo;Before Monday&rdquo;",
      body: "Hi Ruth — before we speak Monday, I noticed the 2 ops admin seats came off in late August. If the reporting work moved to someone new, I'd like to get them set up properly rather than let it go quiet.",
    },
    actions: [{ label: "Open in Gmail", primary: true, external: true }, { label: "Bin the draft" }],
    after: "Send it or rewrite it there. Trig watches sent mail, sees it go, and stops chasing Halcyon on its own.",
  },
  {
    subject: "person", name: "Priya Shah", kind: "conversation",
    owner: "Mia", perRep: null,
    line: "Has no Trig account, so the onboarding assignment can't reach her. Trig can't fix this on its own.",
    blocks: "Book meetings with the people we're missing · 1", whose: "Someone at Halcyon", age: "6 days",
    inlineVerb: null,
    why: [
      "She was named as the onboarding contact at Halcyon on 2 September.",
      "There is no Trig account against that address, so nothing can be sent as her or to her.",
      "The assignment has waited at step 1 for six days rather than skip her silently.",
    ],
    did: [
      "Stopped at step 1 and waited, rather than pick a different contact on its own.",
      "Checked again each morning. Nothing has changed.",
    ],
    artefact: null,
    actions: [{ label: "Point it at Marc instead", primary: true }, { label: "Ask someone to add her" }, { label: "Dismiss" }],
    after: "This is a conversation, not a button. Trig will keep waiting until somebody decides — it won't guess a replacement contact.",
  },
  {
    subject: "assignment", name: "Chase quiet champions", kind: "decision",
    owner: null, perRep: { Lazlo: "Itself · 5 of your champions", Mia: "Itself · 4 of your champions", "Cabbage Mick": "Itself · 3 of your champions", Yan: "Itself · 2 of your champions", Kish: "Itself · 4 of your champions" },
    line: "Has run 40 times and produced nothing. It is blind, not quiet — see HubSpot above.",
    blocks: "Itself · 18 accounts", whose: "You", age: "40 runs",
    inlineVerb: null,
    why: [
      "0 output across 40 consecutive runs since 29 August.",
      "Before that it fired roughly twice a week for three months.",
      "The cause is upstream: it reads HubSpot, and HubSpot has been unreadable.",
    ],
    did: [
      "Ran to schedule every weekday. Never stopped itself.",
      "Produced no output and raised no alarm of its own — which is the problem.",
    ],
    artefact: null,
    actions: [{ label: "Fix the cause", primary: true }, { label: "Pause it until it's fixed" }, { label: "Leave it running" }],
    after: "An assignment that produces nothing for 40 runs should say so. This row is Trig admitting it.",
  },
  {
    subject: "account", name: "Ferrovia", kind: "decision",
    owner: "Lazlo", perRep: null,
    line: "Handed over — three emails over ten days, no reply, and the assignment has run out of things to try.",
    blocks: "Book meetings with the people we're missing", whose: "Mia", age: "3 days",
    inlineVerb: null,
    why: [
      "Still 8 days from go-live, and it hasn't moved since 21 August.",
      "Marc Oyelaran is the only person who has ever replied — 6 others in HubSpot never have.",
      "Step 5 is the last step. It will not send again unless told to.",
    ],
    did: [
      "Step 1 nudge on 21 August. Opened, no reply.",
      "Step 2 nudge on 28 August. Not opened.",
      "Stopped at step 3 and handed it over rather than send a third time.",
    ],
    artefact: null,
    actions: [{ label: "I've got this", primary: true }, { label: "See what was sent" }, { label: "Try once more" }],
    after: "Taking it yourself tells the assignment to leave Ferrovia alone. It carries on with the other 60.",
  },
  {
    subject: "tool", name: "Salesforce", kind: "decision",
    owner: null, perRep: { Lazlo: "2 assignments · 5 of your deals", Mia: "2 assignments · 3 of your deals", "Cabbage Mick": "2 assignments · 2 of your deals", Yan: "2 assignments · 1 of your deals", Kish: "2 assignments · 1 of your deals" },
    line: "Rejected 12 writes since Tuesday. A required field was added to Opportunity that Trig doesn't fill.",
    blocks: "2 assignments · 12 deals", whose: "You", age: "4 days",
    inlineVerb: null,
    why: [
      "12 writes rejected with the same error: Forecast Category is now required.",
      "The field was added on 2 September. Nothing told Trig.",
      "Reads still work, so nothing else looks broken from the outside.",
    ],
    did: [
      "Retried each write twice, then stopped rather than keep failing.",
      "Kept the 12 updates queued. Nothing has been lost.",
    ],
    artefact: null,
    actions: [{ label: "Map the field", primary: true }, { label: "Stop writing to Salesforce" }, { label: "Show the 12" }],
    after: "Map it once and the 12 queued writes go through on the next run.",
  },
  {
    subject: "assignment", name: "Win back lapsed trials", kind: "decision",
    owner: null, perRep: {},
    line: "Targets a cohort that is now empty. Someone narrowed \u201cLapsed trials\u201d on 5 September, 96 accounts to 0.",
    blocks: "Itself · 0 accounts", whose: "You", age: "4 days",
    inlineVerb: null,
    why: [
      "The cohort rule changed on 5 September: 6 months became 6 weeks.",
      "96 accounts were in it. None are now.",
      "The assignment is healthy and running — there is simply nobody to run it on.",
    ],
    did: [
      "Ran each morning and found an empty cohort.",
      "Did not widen the cohort on its own. It never will.",
    ],
    artefact: null,
    actions: [{ label: "See what changed", primary: true }, { label: "Put it back to day 30" }, { label: "Leave it" }],
    after: "Two other assignments point at the same cohort. Changing it back changes all three.",
  },
  {
    subject: "account", name: "Corvus", kind: "ready",
    owner: "Yan", perRep: null,
    line: "Expansion proposal finished, not sent. Seats at 23 of 24 for three weeks and finance started using it unsold.",
    blocks: "Draft proposals against our pricing", whose: "Mia", age: "2 days",
    inlineVerb: { label: "Read it" },
    why: [
      "Seats have sat at 23 of 24 since 19 August. They bought 24 in March.",
      "Four people in finance started using it on 28 August. Nobody sold to finance.",
      "Renewal is 8 April, so this is six months early rather than a bill conversation.",
    ],
    did: [
      "Watched the seat threshold cross 95% on 19 August.",
      "Matched it against 11 accounts that spread to a second department.",
      "Wrote the proposal at 6:41 am on 7 September. It is yours to send.",
    ],
    artefact: null,
    actions: [{ label: "Read the proposal", primary: true }, { label: "Not useful" }],
    after: "This one keeps. Nothing expires, and nothing is blocked while it waits.",
  },
];

const GLYPH = {
  account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V6l7-3v18"/><path d="M11 9h6a2 2 0 0 1 2 2v10"/><path d="M2.5 21h19"/><path d="M14.5 13h1M14.5 17h1M7 8h1M7 12h1M7 16h1"/></svg>',
  tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v6"/><path d="M15 3v6"/><path d="M6 9h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6Z"/><path d="M12 18v3"/></svg>',
  assignment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h9"/><path d="M4 12h6"/><path d="M4 18h9"/><path d="m15 9 5 3-5 3Z"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>',
};

const SUBJECT_LABEL = { account: "Account", tool: "Connection", assignment: "Assignment", person: "Person" };

const EXT = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>';

import { currentRep, onFilterChange } from "./filter.js";

const rows = document.querySelector("#needs-list");
const drawer = document.querySelector("#drawer");
const scrim = document.querySelector("#scrim");
let openIndex = null;

/* ------------------------------------------------------------------ rows */

const HEADINGS = ["What it's about", "What happened", "What it blocks", "Whose call", "Waiting", ""];

/* An item is in a rep's list if they own it, or if the workspace-level
   thing it describes touches their book. Their share replaces the team
   number — the row is re-scoped, not repeated. */
function forRep(rep) {
  if (rep === "All") return ITEMS.map((item) => ({ ...item }));
  return ITEMS.filter((item) => {
    if (item.owner) return item.owner === rep;
    return item.perRep && item.perRep[rep];
  }).map((item) => ({ ...item, blocks: item.perRep?.[rep] ?? item.blocks }));
}

let VISIBLE = [];

function paint(rep) {
  VISIBLE = forRep(rep);

  const head = document.createElement("div");
  head.className = "row head";
  head.innerHTML = HEADINGS.map((h) => `<span>${h}</span>`).join("");

  rows.replaceChildren(
    head,
    ...VISIBLE.map((item, i) => {
      const row = document.createElement("div");
      row.className = "row item need";
      row.dataset.index = String(i);
      row.dataset.kind = item.kind;
      row.dataset.subject = item.subject;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.innerHTML = `
        <span class="need-name">
          <span class="need-glyph" title="${SUBJECT_LABEL[item.subject]}">${GLYPH[item.subject]}</span>
          ${item.name}
        </span>
        <span class="need-line">${item.line}</span>
        <span class="need-meta">${item.blocks}</span>
        <span class="need-meta whose">${item.whose}</span>
        <span class="need-age">${item.age}</span>
        <span class="need-verb">${
          item.inlineVerb
            ? `<button class="btn sm" type="button" data-inline="${i}">${item.inlineVerb.label}${item.inlineVerb.external ? " " + EXT : ""}</button>`
            : ""
        }</span>`;
      return row;
    }),
  );

  const count = document.querySelector("#needs-count");
  if (count) count.textContent = String(VISIBLE.filter((x) => x.kind !== "ready").length);
}

onFilterChange(paint);

/* ---------------------------------------------------------------- drawer */

function draw(i) {
  const item = VISIBLE[i];
  drawer.innerHTML = `
    <header>
      <div>
        <p class="drawer-kind"><span class="need-glyph">${GLYPH[item.subject]}</span>${SUBJECT_LABEL[item.subject]}</p>
        <h2>${item.name}</h2>
        <p>Blocks ${item.blocks} · ${item.whose} · waiting ${item.age}</p>
      </div>
      <button class="icon-btn" type="button" data-close aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>

    <div class="drawer-body">
      <h3>${item.subject === "account" ? "Why this is here" : "What happened"}</h3>
      <ul class="ev">${item.why.map((w) => `<li>${w}</li>`).join("")}</ul>

      <h3>${item.subject === "person" ? "What Trig did instead" : "What Trig did"}</h3>
      <ol class="steps">${item.did.map((d) => `<li>${d}</li>`).join("")}</ol>

      ${
        item.artefact
          ? `<h3>What it wrote</h3>
             <div class="artefact">
               <p class="artefact-meta">${item.artefact.meta}</p>
               <p class="artefact-body">${item.artefact.body}</p>
             </div>`
          : ""
      }
    </div>

    <footer>
      <div class="actions">
        ${item.actions
          .map(
            (a) =>
              `<button class="btn${a.primary ? " primary" : ""}" type="button" data-resolve>${a.label}${a.external ? " " + EXT : ""}</button>`,
          )
          .join("")}
      </div>
      <p class="after">${item.after}</p>
      <nav class="pager">
        <button class="icon-btn" type="button" data-step="-1" ${i === 0 ? "disabled" : ""} aria-label="Previous">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span>${i + 1} of ${VISIBLE.length}</span>
        <button class="icon-btn" type="button" data-step="1" ${i === VISIBLE.length - 1 ? "disabled" : ""} aria-label="Next">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </nav>
    </footer>`;
}

function openItem(i) {
  if (i < 0 || i >= VISIBLE.length) return;
  openIndex = i;
  draw(i);
  drawer.dataset.open = "true";
  scrim.dataset.open = "true";
  rows.querySelectorAll(".need").forEach((r, n) =>
    r.toggleAttribute("data-selected", n === i),
  );
  drawer.querySelector("[data-close]").focus();
}

function closeDrawer() {
  openIndex = null;
  drawer.dataset.open = "false";
  scrim.dataset.open = "false";
  rows.querySelectorAll(".need").forEach((r) => r.removeAttribute("data-selected"));
}

/* Resolving advances rather than closing — the queue empties itself. */
function resolve() {
  const next = openIndex + 1;
  if (next < VISIBLE.length) openItem(next);
  else closeDrawer();
}

rows.addEventListener("click", (e) => {
  const inline = e.target.closest("[data-inline]");
  if (inline) return; // the row's own verb — never opens the drawer
  const row = e.target.closest(".need");
  if (row) openItem(Number(row.dataset.index));
});

rows.addEventListener("keydown", (e) => {
  const row = e.target.closest(".need");
  if (row && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    openItem(Number(row.dataset.index));
  }
});

drawer.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closeDrawer();
  const step = e.target.closest("[data-step]");
  if (step) return openItem(openIndex + Number(step.dataset.step));
  if (e.target.closest("[data-resolve]")) return resolve();
});

scrim.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (e) => {
  if (openIndex === null) return;
  if (e.key === "Escape") closeDrawer();
  if (e.key === "ArrowDown" || e.key === "j") openItem(openIndex + 1);
  if (e.key === "ArrowUp" || e.key === "k") openItem(openIndex - 1);
});
