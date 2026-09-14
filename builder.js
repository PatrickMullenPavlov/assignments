/* The assignment builder, as agreed on 14 September.

   Three fields and a prompt, then a plan you can disagree with. In the
   drawer, so the list you already have stays behind it.

   Two rules from that conversation shape everything here:

   It never asks a follow-up question. Presented with "confirm exec sponsor
   involvement before renewal" it does not ask what a sponsor is or where
   that lives — it shows the conclusion it drew, however wrong, and lets a
   person say "I can see how you got there, but it's not that".

   It never gates a silly prompt. Ask it to walk your dog and it will tell
   you, with the tools it has, what it would do. You reject it. Nobody
   needs protecting from typing the wrong thing; they need to see what it
   understood before anything runs.

   So several of the plans below come back visibly wrong on purpose. A
   builder whose every guess is right would demonstrate the opposite of
   what was decided.                                                       */

import { showDrawer, drawerEl } from "./drawer.js";
import { REPS } from "./filter.js";

const CLOSE = `<button class="icon-btn" type="button" data-close aria-label="Close">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
  </button>`;

const CADENCES = [
  "Every weekday, 6:40 am",
  "Every Monday, 6:40 am",
  "Every Tuesday",
  "Every morning",
  "Continuously",
];

/* What Trig can reach. Shown up front, because the alternative is finding
   out at run time that Gong was never connected. */
const TOOLS = [
  ["HubSpot", true], ["Salesforce", true], ["Google Calendar", true],
  ["Gmail", true], ["Slack", true], ["Gong", false], ["Zoom", false],
];

/* Four steps: what it gets, what it does to it, what it makes, where it
   goes. `wrong` marks a step the interpretation got wrong — the thing a
   person is here to catch. */
const PLANS = [
  {
    match: /1:1|one to one|prep.*call|call.*prep|prep.*1:1/i,
    name: "Prep my 1:1s",
    steps: [
      ["What it gets", "Every customer call in their calendar for the coming week, and the account behind each one", "Google Calendar, HubSpot"],
      ["What it does to it", "Reads what moved since they last spoke, what was promised, and who has gone quiet", ""],
      ["What it makes", "One pack per call &mdash; 11 this week", ""],
      ["Where it goes", "Into Trig, ready on Monday morning", ""],
    ],
  },
  {
    match: /exec sponsor|sponsor.*renewal|renewal.*sponsor/i,
    name: "Confirm exec sponsor involvement before renewal",
    steps: [
      ["What it gets", "Accounts with a renewal date inside 90 days", "HubSpot"],
      ["What it does to it", "Checks whether anyone with <strong>role equals Manager</strong> has replied in the last 60 days", "", true],
      ["What it makes", "A list of accounts where nobody senior is involved", ""],
      ["Where it goes", "Into Trig, every Monday", ""],
    ],
    note: "It has guessed that an exec sponsor is anyone whose CRM role says Manager. That is almost certainly not what you meant &mdash; change the line and it will read it again.",
  },
  {
    match: /demo|follow.?up/i,
    name: "Draft a follow-up for every demo",
    steps: [
      ["What it gets", "Demos in their calendar this week, and the recording of each one", "Google Calendar, <em>Gong &mdash; not connected</em>", true],
      ["What it does to it", "Pulls out what was asked, what was promised, and any objection raised", ""],
      ["What it makes", "One follow-up email per demo, unsent", ""],
      ["Where it goes", "Their Gmail drafts", ""],
    ],
    note: "It needs Gong to hear the demos. Without it, this runs on calendar titles alone and the follow-ups will be generic.",
    fix: "Connect Gong",
  },
  {
    match: /summar\w+.*call|call.*summar|log every|crm up to date/i,
    name: "Summarise every call into the CRM",
    steps: [
      ["What it gets", "Every customer call as it finishes", "Google Calendar, Gong &mdash; not connected", true],
      ["What it does to it", "Writes a short summary, pulls out the next step and who owns it", ""],
      ["What it makes", "One record per call", ""],
      ["Where it goes", "Onto the account in HubSpot. Nobody reads it, which is the point", ""],
    ],
    fix: "Connect Gong",
  },
  {
    match: /shop|dog|walk|dinner|laundry/i,
    name: "Weekly shop",
    steps: [
      ["What it gets", "Nothing. None of the tools it has hold a shopping list or a dog", "", true],
      ["What it does to it", "&mdash;", "", true],
      ["What it makes", "&mdash;", "", true],
      ["Where it goes", "&mdash;", "", true],
    ],
    note: "Trig has HubSpot, Salesforce, a calendar, a mailbox and Slack. None of those will do this. Nothing stopped you asking &mdash; you can see it cannot, so bin it.",
    dead: true,
  },
];

const FALLBACK = {
  name: "Your assignment",
  steps: [
    ["What it gets", "Accounts in their book, and activity on each", "HubSpot"],
    ["What it does to it", "Reads what changed since the last run", "", true],
    ["What it makes", "A short summary per account", "", true],
    ["Where it goes", "Into Trig", ""],
  ],
  note: "It could not tell what this should look at, so it has guessed the broadest thing. If that is wrong, say what it should read.",
};

const EXAMPLES = [
  "Prep my 1:1s each week",
  "Confirm exec sponsor involvement before renewal",
  "Draft a follow-up for every demo I did this week",
  "Summarise every call into the CRM",
  "Will you do my weekly shop and walk my dog",
];

const plan = (text) => PLANS.find((p) => p.match.test(text)) ?? FALLBACK;

/* ------------------------------------------------------------ the form */

let picked = new Set([REPS[4]]);
let cadence = CADENCES[1];
let prompt = "";

const form = () => `
  <header>
    <div>
      <h2>Add an assignment</h2>
      <p>A unit of work, repeated. Say what you want done and Trig plans it out.</p>
    </div>
    ${CLOSE}
  </header>
  <div class="drawer-body">
    <h3>Who it's for</h3>
    <div class="bd-who">
      ${REPS.map(
        (r) => `<button class="bd-chip${picked.has(r) ? " on" : ""}" type="button" data-bd-who="${r}">${r}</button>`,
      ).join("")}
    </div>
    <p class="bd-hint">One unit of work, however many people it runs for. Each gets it against their own book.</p>

    <h3>When it runs</h3>
    <div class="bd-who">
      ${CADENCES.map(
        (c) => `<button class="bd-chip${c === cadence ? " on" : ""}" type="button" data-bd-when="${c}">${c}</button>`,
      ).join("")}
    </div>

    <h3>What it does</h3>
    <textarea class="bd-input" name="ask" rows="3"
      placeholder="Prep my 1:1s each week&#10;&#10;Say where you want it to land too &mdash; in Trig, in Slack, as a draft.">${prompt}</textarea>
    <p class="bd-hint">Plain English. Trig will show you what it understood before anything runs.</p>

    <div class="canvas-actions">
      <button class="btn primary" type="button" data-bd-plan>Plan it out</button>
    </div>

    <h3>Or start from one of these</h3>
    <div class="bd-eg">
      ${EXAMPLES.map((x) => `<button class="bd-chip" type="button" data-bd-eg="${x}">${x}</button>`).join("")}
    </div>
  </div>`;

/* ------------------------------------------------------------ the plan */

const steps = (p) =>
  p.steps
    .map(
      ([title, body, via, wrong], i) => `
      <div class="bd-step${wrong ? " wrong" : ""}">
        <span class="bd-n">${i + 1}</span>
        <span class="bd-body">
          <span class="bd-label">${title}</span>
          <span class="bd-value">${body}</span>
          ${via ? `<span class="bd-note">${via}</span>` : ""}
        </span>
        <span class="bd-change"><button class="btn sm" type="button" data-bd-edit>Change</button></span>
      </div>`,
    )
    .join("");

const planned = (p, text) => `
  <header>
    <div>
      <p class="drawer-kind">${cadence} &middot; for ${[...picked].join(", ") || "nobody yet"}</p>
      <h2>${p.name}</h2>
    </div>
    ${CLOSE}
  </header>
  <div class="drawer-body">
    <p class="bd-said">&ldquo;${text}&rdquo;</p>

    <h3>With the tools it has</h3>
    <div class="bd-tools">
      ${TOOLS.map(([t, on]) => `<span class="bd-tool${on ? "" : " off"}">${t}</span>`).join("")}
      <button class="btn sm" type="button" data-bd-edit>Add a tool</button>
    </div>

    <h3>Here's what it will do</h3>
    ${steps(p)}
    ${p.note ? `<p class="bd-said warn">${p.note}</p>` : ""}

    <div class="canvas-actions">
      ${
        p.dead
          ? `<button class="btn" type="button" data-bd-back>Bin it and start again</button>`
          : `<button class="btn primary" type="button" data-bd-accept="${p.name}">Start running it</button>
             ${p.fix ? `<button class="btn" type="button" data-bd-edit>${p.fix}</button>` : ""}
             <button class="btn" type="button" data-bd-back>Change the prompt</button>`
      }
    </div>
  </div>`;

const running = (name) => `
  <header>
    <div><h2>${name} is running</h2></div>
    ${CLOSE}
  </header>
  <div class="drawer-body">
    <div class="bd-verdict ok">
      <p class="bd-v-t">${cadence}, for ${[...picked].join(", ")}</p>
      <p class="bd-v-a">It will appear in the list either way &mdash; if it finds nothing, it says so and shows you what it checked.</p>
    </div>
    <div class="canvas-actions">
      <button class="btn primary" type="button" data-close>Back to assignments</button>
      <button class="btn" type="button" data-bd-back>Add another</button>
    </div>
  </div>`;

/* --------------------------------------------------------------- wiring */

const openForm = () => {
  showDrawer(form());
  drawerEl.querySelector(".bd-input")?.focus();
};

const openPlan = (text) => {
  prompt = text;
  showDrawer(planned(plan(text), text));
};

const typed = () => (drawerEl.querySelector('[name="ask"]')?.value ?? "").trim();

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-add-assignment]")) {
    e.preventDefault();
    prompt = "";
    return openForm();
  }
  if (!drawerEl.contains(e.target)) return;

  const who = e.target.closest("[data-bd-who]");
  if (who) {
    const r = who.dataset.bdWho;
    picked.has(r) ? picked.delete(r) : picked.add(r);
    prompt = typed();
    return openForm();
  }

  const when = e.target.closest("[data-bd-when]");
  if (when) {
    cadence = when.dataset.bdWhen;
    prompt = typed();
    return openForm();
  }

  const eg = e.target.closest("[data-bd-eg]");
  if (eg) return openPlan(eg.dataset.bdEg);

  if (e.target.closest("[data-bd-plan]")) {
    const v = typed();
    return v ? openPlan(v) : drawerEl.querySelector(".bd-input")?.focus();
  }

  if (e.target.closest("[data-bd-back]")) return openForm();

  const accept = e.target.closest("[data-bd-accept]");
  if (accept) return showDrawer(running(accept.dataset.bdAccept));

  /* Correcting a line means saying it again in your own words, which runs
     the interpretation afresh. Davy called that half a step from a chat
     interface, and he is right — it is the open question here. */
  const edit = e.target.closest("[data-bd-edit]");
  if (edit) return openForm();
});
