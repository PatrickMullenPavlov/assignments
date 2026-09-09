/* Reports — views of data, built through canvases.

   The thumbnail is not a loading state. It is a SHAPE SIGNATURE: a true
   miniature of the report's own layout, so a grid of twelve is scannable
   by form before you read a single title. A funnel looks like a funnel at
   1/8 scale; a table looks like a table.

   Six shapes cover everything we build today. Each is real geometry —
   proportioned bars, an actual sparkline path — not decorative pills.   */

const SHAPES = {};

/* a row of stat tiles, then a short table underneath */
SHAPES.kpi = () => `
  <div class="sk-row">
    ${[0, 1, 2, 3].map(() => `<div class="sk-tile"><i class="sk-b w40"></i><i class="sk-b h6 w70 strong"></i></div>`).join("")}
  </div>
  <div class="sk-table">
    <div class="sk-tr head"><i class="sk-b w50"></i><i class="sk-b w30"></i><i class="sk-b w26"></i><i class="sk-b w20"></i></div>
    ${[70, 54, 62].map((w) => `<div class="sk-tr"><i class="sk-b" style="width:${w}%"></i><i class="sk-b w30"></i><i class="sk-b w26"></i><i class="sk-b w20"></i></div>`).join("")}
  </div>`;

/* a plain table — header strip and rows */
SHAPES.table = () => `
  <div class="sk-table tall">
    <div class="sk-tr head"><i class="sk-b w60"></i><i class="sk-b w28"></i><i class="sk-b w34"></i><i class="sk-b w22"></i></div>
    ${[78, 58, 84, 66, 72, 54].map((w) => `<div class="sk-tr"><i class="sk-b" style="width:${w}%"></i><i class="sk-b w28"></i><i class="sk-b w34"></i><i class="sk-b w22"></i></div>`).join("")}
  </div>`;

/* an area chart with a small legend beside it */
SHAPES.trend = () => `
  <div class="sk-split">
    <div class="sk-chart">
      <svg viewBox="0 0 120 56" preserveAspectRatio="none" aria-hidden="true">
        <path class="sk-area" d="M0 44 L15 40 L30 42 L45 30 L60 33 L75 22 L90 24 L105 12 L120 8 L120 56 L0 56 Z"/>
        <path class="sk-line-p" d="M0 44 L15 40 L30 42 L45 30 L60 33 L75 22 L90 24 L105 12 L120 8"/>
      </svg>
      <div class="sk-axis"><i></i><i></i><i></i><i></i></div>
    </div>
    <div class="sk-list">
      ${[62, 48, 70, 40].map((w) => `<div class="sk-li"><span class="sk-dot"></span><i class="sk-b" style="width:${w}%"></i></div>`).join("")}
    </div>
  </div>`;

/* descending bars — a funnel */
SHAPES.funnel = () => `
  <div class="sk-funnel">
    ${[100, 78, 52, 41, 24].map((w) => `
      <div class="sk-fr">
        <i class="sk-b w28"></i>
        <span class="sk-bar" style="width:${w}%"></span>
        <i class="sk-b w14"></i>
      </div>`).join("")}
  </div>`;

/* a column histogram */
SHAPES.distribution = () => `
  <div class="sk-cols">
    ${[28, 44, 60, 82, 96, 74, 55, 38, 30, 22].map((h, i) => `<span class="sk-col${i === 4 || i === 3 ? " hot" : ""}" style="height:${h}%"></span>`).join("")}
  </div>
  <div class="sk-baseline"></div>
  <div class="sk-row tight">
    ${[0, 1, 2].map(() => `<div class="sk-tile flat"><i class="sk-b w60"></i><i class="sk-b h6 w40 strong"></i></div>`).join("")}
  </div>`;

/* small columns on the left, a list on the right */
SHAPES.split = () => `
  <div class="sk-split">
    <div class="sk-chart">
      <div class="sk-cols short">
        ${[54, 78, 46, 92, 62].map((h) => `<span class="sk-col" style="height:${h}%"></span>`).join("")}
      </div>
      <div class="sk-baseline"></div>
    </div>
    <div class="sk-table flush">
      <div class="sk-tr head"><i class="sk-b w56"></i><i class="sk-b w26"></i></div>
      ${[74, 52, 66, 44].map((w) => `<div class="sk-tr"><i class="sk-b" style="width:${w}%"></i><i class="sk-b w26"></i></div>`).join("")}
    </div>
  </div>`;

const REPORTS = [
  { shape: "distribution", title: "Onboarding speed, this quarter",
    blurb: "Eleven accounts cleared in under 20 days against a 45-day norm. The other 23 took 41 on average, and all eleven of the fast ones connected a second tool in week one.",
    age: "Rebuilt this morning" },
  { shape: "table", title: "Where the team is single threaded",
    blurb: "31 accounts across five books have exactly one person replying. Seven of them renew inside 120 days, and two are the largest on the team.",
    age: "Rebuilt Monday" },
  { shape: "kpi", title: "What we lost, and why",
    blurb: "Six accounts churned this year. Four had no exec sponsor at renewal and three lost an admin in the quarter before, which is the same story twice.",
    age: "Rebuilt 1 September" },
  { shape: "trend", title: "Expansion signals we didn't act on",
    blurb: "19 accounts crossed a usage threshold this quarter. We opened a conversation on six of them, and the other 13 have had nothing said to them.",
    age: "Rebuilt Monday" },
  { shape: "distribution", title: "Seat downgrade exposure",
    blurb: "£340k sits on accounts under 60% seat use that renew inside six months. Half of it is on three accounts.",
    age: "Rebuilt this morning" },
  { shape: "funnel", title: "Which nudges actually work",
    blurb: "Step 2 gets 35% of clicks and step 3 gets 16%. Moving the second nudge from day 3 to day 7 in August is what did that.",
    age: "Rebuilt 1 September" },
  { shape: "split", title: "Tickets that became renewal problems",
    blurb: "Nine accounts raised the same issue twice or more. Four of them are inside their notice window right now.",
    age: "Rebuilt this morning" },
  { shape: "table", title: "Where our data is wrong",
    blurb: "12 accounts have no renewal date and four contacts have no email address, so three assignments skip them silently every morning.",
    age: "Rebuilt this morning" },
  { shape: "trend", title: "Time back, by assignment",
    blurb: "Logging and CRM tidying ran 41,000 times this quarter and produced nothing anyone read, which is the point of them.",
    age: "Rebuilt 1 September" },
];

import { onFilterChange } from "./filter.js";

onFilterChange((rep) => {
  const note = document.querySelector("#reports-note");
  if (note)
    note.textContent =
      rep === "All"
        ? ""
        : "Reports are built across the whole team. They don't change with this filter.";
});

document.querySelector("#reports-grid").replaceChildren(
  ...REPORTS.map((r) => {
    const el = document.createElement("article");
    el.className = "report";
    el.innerHTML = `
      <div class="thumb" data-shape="${r.shape}" aria-hidden="true">
        <div class="thumb-inner">${SHAPES[r.shape]()}</div>
        <div class="thumb-fade"></div>
      </div>
      <h3>${r.title}</h3>
      <p class="blurb">${r.blurb}</p>
      <p class="age">${r.age}</p>`;
    return el;
  }),
);
