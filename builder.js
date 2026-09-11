/* The assignment builder.

   In the drawer, not in the page. Creating something should not destroy your
   view of what already exists — the list stays behind it, and closing puts
   you back exactly where you were.

   One question, then a brief you correct. Not a form: scope falls out of who
   it's for, when it runs and what it's about, so asking for a cohort up front
   asks for something Trig can usually work out.

   Four shapes, all reachable from the examples:

     runnable        it has what it needs and says so
     needs a set     "lapsed" can't be derived, so it asks — the only time
                     the cohort question appears
     needs a marker  "at risk" isn't checkable until someone says what to
                     look for; Trig proposes and lets you cut
     a question      answerable, but nobody would set it up as a job       */

import { showDrawer, drawerEl } from "./drawer.js";

const CLOSE = `<button class="icon-btn" type="button" data-close aria-label="Close">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
  </button>`;

/* What Trig understood. Canned, because this is a prototype — but the shape
   is the real one: every line is a statement it can be wrong about. */
const READS = [
  {
    match: /1:1|one to one|prep.*call|call.*prep/i,
    name: "Prep my 1:1s",
    verdict: "runnable",
    lines: [
      ["Who it's for", "You", "Your book, your calendar"],
      ["When it runs", "Every Monday, 6:40 am", "Before the week starts"],
      ["What it's about", "Each call", "11 this week, from your calendar"],
      ["What it does", "Builds a pack", "What moved, what you promised, what to raise"],
      ["Where it lands", "In Trig", "Read only — it changes nothing"],
    ],
    after: "One pack per call, so two calls with the same account this week are two packs.",
  },
  {
    match: /champion|quiet|gone (quiet|dark)/i,
    name: "Chase quiet champions",
    verdict: "runnable",
    lines: [
      ["Who it's for", "You", "The champions on your accounts"],
      ["When it runs", "When someone goes quiet for 30 days", "Checked every morning"],
      ["What it's about", "Each person", "18 champions today"],
      ["What it does", "Drafts a note, then stops when they reply", "Never more than one chase a fortnight"],
      ["Where it lands", "A draft for you", "Trig writes it. You send it"],
    ],
    after: "Silent most days. When it finds nothing it will still say so, and show you what it checked.",
  },
  {
    match: /proposal|pricing|negotiat/i,
    name: "Draft proposals against our pricing",
    verdict: "runnable",
    lines: [
      ["Who it's for", "You", "Your deals"],
      ["When it runs", "The moment a deal reaches Negotiation", "Not on a timetable"],
      ["What it's about", "Each deal", "One document per deal, not per account"],
      ["What it does", "Writes the proposal, checked against your pricing", "Flags anything outside the discount cap"],
      ["Where it lands", "A draft for you", "Trig writes it. You send it"],
    ],
    after: "It reads your pricing document. If that changes, say so — it will not notice on its own.",
  },
  {
    match: /win ?back|lapsed|trial/i,
    name: "Win back lapsed trials",
    verdict: "needs-a-set",
    ask: "Which trials count as lapsed?",
    askWhy:
      "The one thing Trig can't work out. Your book and the cadence give it everything else, but nobody has said what lapsed means.",
    options: [
      "Trial ended, no purchase, within the last 6 months",
      "Trial ended, no purchase, ever",
      "Signed up, never activated",
    ],
    lines: [
      ["Who it's for", "You", "Your book"],
      ["When it runs", "Every Tuesday", ""],
      ["What it's about", "Each account", "One sequence per account"],
      ["What it does", "Sends three steps, stopping when they reply", "Step 3 needs you — it holds a discount"],
      ["Where it lands", "A draft for you", "Trig writes it. You send it"],
    ],
  },
  {
    match: /at risk|worry|churn(ing)? risk|won'?t close|wasting time/i,
    name: "",
    verdict: "needs-a-marker",
    ask: "What would tell you an account is at risk?",
    askWhy:
      "Risk isn't something Trig can check for. Name what you'd look at and it becomes a job it can run every morning.",
    proposed: [
      ["Usage falling below its normal band", true],
      ["The last admin leaving", true],
      ["No reply from anyone in 30 days", true],
      ["A renewal inside 90 days with no exec sponsor", false],
      ["Support tickets doubling month on month", false],
    ],
  },
  {
    match: /hit the number|forecast|how many|which of my accounts (grew|have)/i,
    name: "",
    verdict: "a-question",
    answer:
      "You're £340k against a £400k quarter with 3 weeks left. £96k is in Negotiation and £210k in Proposal. Two deals slipped past the quarter this week.",
    why: "This is a question, not a job. You want the answer now, not every Monday whether you want it or not.",
  },
];

const FALLBACK = {
  verdict: "unclear",
  ask: "What should Trig look at?",
  askWhy:
    "Trig couldn't tell what this would run over. Say what it should check and how often, and it will read it back.",
};

const EXAMPLES = [
  "Prep me for my 1:1s each week",
  "Tell me when a champion goes quiet",
  "Draft a proposal when a deal reaches negotiation",
  "Win back our lapsed trials",
  "Tell me which accounts are at risk",
  "Are we going to hit the number this quarter?",
];

const read = (text) => READS.find((r) => r.match.test(text)) ?? FALLBACK;

const lineRows = (lines) =>
  lines
    .map(
      ([label, value, note]) => `
      <div class="bd-line">
        <span class="bd-label">${label}</span>
        <span class="bd-body">
          <span class="bd-value">${value}</span>
          ${note ? `<span class="bd-note">${note}</span>` : ""}
        </span>
        <span class="bd-change"><button class="btn sm" type="button" data-bd-change>Change</button></span>
      </div>`,
    )
    .join("");

function ask(text) {
  return `
    <header>
      <div>
        <h2>Add an assignment</h2>
        <p>Say what you want Trig to do. It reads it back before anything runs.</p>
      </div>
      ${CLOSE}
    </header>
    <div class="drawer-body">
      <form class="bd-ask">
        <input class="bd-input" name="ask" autocomplete="off" placeholder="Prep me for my 1:1s each week"
               value="${text ?? ""}" aria-label="What do you want Trig to do?">
        <button class="btn primary" type="submit">Read it back</button>
      </form>
      <p class="bd-hint">Say it the way you would to a colleague.</p>
      <h3>Or start from one of these</h3>
      <div class="bd-eg">
        ${EXAMPLES.map((x) => `<button class="bd-chip" type="button" data-bd-eg="${x}">${x}</button>`).join("")}
      </div>
    </div>`;
}

function brief(r, text) {
  const head = `
    <header>
      <div>
        <p class="drawer-kind">You asked for</p>
        <h2>${text}</h2>
      </div>
      ${CLOSE}
    </header>`;

  if (r.verdict === "a-question") {
    return `${head}
      <div class="drawer-body">
        <div class="bd-verdict q">
          <p class="bd-v-t">That's a question, so here's the answer</p>
          <p class="bd-v-a">${r.answer}</p>
        </div>
        <p class="rn-p">${r.why}</p>
        <div class="canvas-actions">
          <button class="btn" type="button" data-bd-back>Ask something else</button>
        </div>
      </div>`;
  }

  if (r.verdict === "needs-a-marker" || r.verdict === "unclear") {
    return `${head}
      <div class="drawer-body">
        <div class="bd-verdict ask">
          <p class="bd-v-t">${r.ask}</p>
          <p class="bd-v-a">${r.askWhy}</p>
        </div>
        ${
          r.proposed
            ? `<h3>What Trig can already see. Cut anything you disagree with</h3>
               ${r.proposed
                 .map(
                   ([m, on]) =>
                     `<label class="bd-mark"><input type="checkbox" ${on ? "checked" : ""}><span>${m}</span></label>`,
                 )
                 .join("")}
               <div class="canvas-actions">
                 <button class="btn primary" type="button" data-bd-eg="Tell me when a champion goes quiet">Use these</button>
                 <button class="btn" type="button" data-bd-back>Start again</button>
               </div>`
            : `<div class="canvas-actions"><button class="btn" type="button" data-bd-back>Start again</button></div>`
        }
      </div>`;
  }

  const needsSet = r.verdict === "needs-a-set";
  return `${head}
    <div class="drawer-body">
      ${
        needsSet
          ? `<div class="bd-verdict ask">
               <p class="bd-v-t">${r.ask}</p>
               <p class="bd-v-a">${r.askWhy}</p>
               <div class="bd-opts">
                 ${r.options
                   .map(
                     (o, i) =>
                       `<label class="bd-opt"><input type="radio" name="set" ${i === 0 ? "checked" : ""}><span>${o}</span></label>`,
                   )
                   .join("")}
               </div>
             </div>`
          : `<p class="bd-ok">Trig has everything it needs. Nothing runs until you say so.</p>`
      }

      <h3>What it will do</h3>
      ${lineRows(r.lines)}
      ${r.after ? `<p class="canvas-after">${r.after}</p>` : ""}

      <h3>How you'll know it's working</h3>
      <p class="rn-p">Trig will tell you whether it ran, and whether you read what it made. It can't tell you whether it worked — that needs a group left alone to compare against, and we don't do that yet.</p>

      <div class="canvas-actions">
        <button class="btn primary" type="button" data-bd-accept="${r.name}">Start running it</button>
        <button class="btn" type="button" data-bd-back>Start again</button>
      </div>
    </div>`;
}

function done(name) {
  return `
    <header>
      <div><h2>${name} is running</h2></div>
      ${CLOSE}
    </header>
    <div class="drawer-body">
      <div class="bd-verdict ok">
        <p class="bd-v-t">First run Monday at 6:40 am</p>
        <p class="bd-v-a">It will appear in your list either way — if it finds nothing, it will say so and show you what it checked.</p>
      </div>
      <div class="canvas-actions">
        <button class="btn primary" type="button" data-close>Back to assignments</button>
        <button class="btn" type="button" data-bd-back>Add another</button>
      </div>
    </div>`;
}

function open(text) {
  showDrawer(text == null ? ask() : brief(read(text), text));
  drawerEl.querySelector(".bd-input")?.focus();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-add-assignment]")) {
    e.preventDefault();
    return open(null);
  }
  if (!drawerEl.contains(e.target)) return;

  const eg = e.target.closest("[data-bd-eg]");
  if (eg) return open(eg.dataset.bdEg);

  if (e.target.closest("[data-bd-back]")) return open(null);

  const accept = e.target.closest("[data-bd-accept]");
  if (accept) return showDrawer(done(accept.dataset.bdAccept || "Your assignment"));

  // Correcting a line is the open design question: retype in the same words
  // you asked in, or be given a control. This only shows where it would go.
  const change = e.target.closest("[data-bd-change]");
  if (change) change.closest(".bd-line").classList.toggle("editing");
});

drawerEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = new FormData(e.target).get("ask").trim();
  if (v) open(v);
});
