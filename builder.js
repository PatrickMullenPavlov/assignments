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

/* Two kinds, not one. A schedule runs whether or not anything changed; a
   condition is silent until something becomes true. Inside "condition" there
   is a second distinction — a moment (a call ends, fires once and is over)
   against a state (nobody has replied in 30 days, which stays true) — but
   that one matters to the engine, not to the person setting it up, so it is
   not a choice here.

   Both borrow the app's own vocabulary rather than inventing one.

   The schedule is RecurringTasksEditor: the word "Every", a number, and a
   unit. That is the only schedule editor the app has — CRON exists in
   AgentAutomation.schedule_type but nothing creates one, ScheduleLabel only
   renders it.

   The condition is criteria-filter-future: an attribute, an operator and a
   value, with the operator labels the app already uses. It is the same
   component behind the assignment's org_filter. */
const UNITS = ["hours", "days", "weeks"];

const ATTRS = [
  ["Days since anyone replied", "number", "30"],
  ["Days until renewal", "number", "90"],
  ["Seats in use", "percent", "90"],
  ["Weekly active users", "number", "18"],
  ["Deal stage", "text", "Negotiation"],
  ["Admins with a login", "number", "1"],
];

/* Straight from criteria-filter-future's operatorSymbolMap. */
const OPS = [
  ["gte", "greater than or equal to"],
  ["gt", "greater than"],
  ["lte", "less than or equal to"],
  ["lt", "less than"],
  ["eq", "equal to"],
  ["ne", "not equal to"],
  ["is_null", "has no value"],
  ["is_not_null", "has any value"],
];
const UNARY = ["is_null", "is_not_null"];

/* What Trig can reach. Shown up front, because the alternative is finding
   out at run time that Gong was never connected. */
const TOOLS = [
  ["HubSpot", true, "HubspotLogo"],
  ["Salesforce", true, "SalesforceLogo"],
  ["Google Calendar", true, "GoogleCalendarLogo"],
  ["Gmail", true, "GmailLogo"],
  ["Slack", true, "SlackLogo"],
  ["Trig", true, "TrigLogo"],
  ["Gong", false, "GongLogo"],
  ["Zoom", false, "ZoomLogo"],
];
const TOOL = (n) => TOOLS.find(([t]) => t === n);

/* Three groups, in Patrick's own framing: inputs, actions, outputs.
   A tool sits beside the line that uses it, because "the tools it has" as a
   separate list tells you what is connected and not what gets used when.
   Actions carry no tool — they happen inside, on what the inputs fetched.

   A trailing `true` marks a line the interpretation guessed at. That is the
   thing a person is here to catch, so it is the only thing that shouts. */
const PLANS = [
  {
    match: /1:1|one to one|prep.*call|call.*prep|prep.*1:1/i,
    name: "Prep my 1:1s",
    inputs: [
      ["Google Calendar", "Every customer call in their calendar for the coming week"],
      ["HubSpot", "The account behind each call, and everything that moved since they last spoke"],
    ],
    actions: [
      "Works out what was promised last time and whether it happened",
      "Finds who has gone quiet, and what to raise because of it",
    ],
    outputs: [["Trig", "One pack per call &mdash; 11 this week, ready Monday morning"]],
  },
  {
    match: /exec sponsor|sponsor.*renewal|renewal.*sponsor/i,
    name: "Confirm exec sponsor involvement before renewal",
    inputs: [
      ["HubSpot", "Accounts with a renewal date inside 90 days"],
      ["HubSpot", "Everyone at those accounts whose <strong>role says Manager</strong>", true],
    ],
    actions: ["Checks whether any of them has replied in the last 60 days"],
    outputs: [["Trig", "A list of accounts where nobody senior is involved"]],
    note: "It has decided an exec sponsor is anyone whose CRM role says Manager. That is almost certainly not what you meant &mdash; say what it should look for and it will read it again.",
  },
  {
    match: /demo|follow.?up/i,
    name: "Draft a follow-up for every demo",
    inputs: [
      ["Google Calendar", "Demos in their calendar this week"],
      ["Gong", "The recording of each one", true],
    ],
    actions: [
      "Pulls out what was asked, what was promised, and any objection raised",
      "Writes a follow-up in their own voice, from the last five they sent",
    ],
    outputs: [["Gmail", "One draft per demo, unsent"]],
    note: "Gong is not connected, so it cannot hear the demos. Without it this runs on calendar titles alone and the follow-ups will be generic.",
    fix: "Connect Gong",
  },
  {
    match: /summar\w+.*call|call.*summar|log every|crm up to date/i,
    name: "Summarise every call into the CRM",
    inputs: [["Gong", "Each customer call the moment it ends", true]],
    actions: [
      "Writes a short summary",
      "Pulls out the next step and who owns it",
    ],
    outputs: [["HubSpot", "One record on the account. Nobody reads it, which is the point"]],
    fix: "Connect Gong",
  },
  {
    match: /shop|dog|walk|dinner|laundry/i,
    name: "Weekly shop",
    inputs: [["", "Nothing. None of the tools it has hold a shopping list or a dog", true]],
    actions: [],
    outputs: [],
    note: "Trig has HubSpot, Salesforce, a calendar, a mailbox and Slack. None of those will do this. Nothing stopped you asking &mdash; you can see it cannot, so bin it.",
    dead: true,
  },
];

const FALLBACK = {
  name: "Your assignment",
  inputs: [["HubSpot", "Accounts in their book, and activity on each", true]],
  actions: [["Reads what changed since the last run", true]],
  outputs: [["Trig", "A short summary per account", true]],
  note: "It could not tell what this should look at, so it has guessed the broadest thing. Say what it should read and it will try again.",
};

/* Each carries its own trigger, because two of these are conditions and
   leaving them on a weekly schedule would misrepresent them. */
const EXAMPLES = [
  ["Prep my 1:1s each week", { kind: "schedule", every: 1, unit: "weeks" }],
  ["Confirm exec sponsor involvement before renewal",
   { kind: "condition", attr: "Days until renewal", op: "lte", val: "90" }],
  ["Draft a follow-up for every demo I did this week", { kind: "schedule", every: 1, unit: "weeks" }],
  ["Summarise every call into the CRM", { kind: "condition", attr: "Deal stage", op: "eq", val: "Negotiation" }],
  ["Will you do my weekly shop and walk my dog", { kind: "schedule", every: 1, unit: "weeks" }],
];

const plan = (text) => PLANS.find((p) => p.match.test(text)) ?? FALLBACK;

/* ------------------------------------------------------------ the form */

let picked = new Set([REPS[4]]);
let trigger = {
  kind: "schedule",
  every: 1, unit: "days",
  attr: ATTRS[0][0], op: "gte", val: ATTRS[0][2],
};
let prompt = "";

/* The plan being reviewed, and which of its lines is open for editing. It is
   a copy, because the person is correcting this assignment rather than the
   template it was matched from. */
let current = null;
let edit = null;

/* Reads the way ScheduleLabel does: "Every day", not "Every 1 days". */
const triggerLabel = () => {
  if (trigger.kind === "schedule") {
    return trigger.every === 1
      ? `Every ${trigger.unit.replace(/s$/, "")}`
      : `Every ${trigger.every} ${trigger.unit}`;
  }
  const op = OPS.find(([k]) => k === trigger.op)[1];
  return UNARY.includes(trigger.op)
    ? `When ${trigger.attr.toLowerCase()} ${op}`
    : `When ${trigger.attr.toLowerCase()} is ${op} ${trigger.val}`;
};

/* "Every 1 days" is wrong, and the unit is the only place to fix it. */
const unitLabel = (u, n) => (n === 1 ? u.replace(/s$/, "") : u);

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
    <p class="bd-hint">One unit of work, however many people it runs for. Each against their own book.</p>

    <h3>When it runs</h3>
    <div class="bd-seg" role="group">
      <button class="bd-segment${trigger.kind === "schedule" ? " on" : ""}" type="button" data-bd-kind="schedule"
        aria-pressed="${trigger.kind === "schedule"}">On a schedule</button>
      <button class="bd-segment${trigger.kind === "condition" ? " on" : ""}" type="button" data-bd-kind="condition"
        aria-pressed="${trigger.kind === "condition"}">When something changes</button>
    </div>
    ${
      trigger.kind === "schedule"
        ? `<div class="bd-row">
             <span class="bd-word">Every</span>
             <input class="bd-num" type="number" min="1" value="${trigger.every}" data-bd-every aria-label="How often">
             <select class="bd-sel" data-bd-unit aria-label="Unit">
               ${UNITS.map(
                 (u) => `<option value="${u}"${u === trigger.unit ? " selected" : ""}>${unitLabel(u, trigger.every)}</option>`,
               ).join("")}
             </select>
           </div>
           <p class="bd-hint">Runs whether or not anything changed.</p>`
        : `<div class="bd-row">
             <select class="bd-sel wide" data-bd-attr aria-label="What to watch">
               ${ATTRS.map(([a]) => `<option${a === trigger.attr ? " selected" : ""}>${a}</option>`).join("")}
             </select>
             <select class="bd-sel" data-bd-op aria-label="Operator">
               ${OPS.map(([k, l]) => `<option value="${k}"${k === trigger.op ? " selected" : ""}>${l}</option>`).join("")}
             </select>
             ${UNARY.includes(trigger.op) ? "" : `<input class="bd-num" value="${trigger.val}" data-bd-val aria-label="Value">`}
           </div>
           <p class="bd-hint">Silent until it does. Checked every morning.</p>`
    }

    <h3>What it does</h3>
    <textarea class="bd-input" name="ask" rows="2"
      placeholder="Prep my 1:1s each week">${prompt}</textarea>
    <p class="bd-hint">Plain English. Say where you want it to land too &mdash; in Trig, in Slack, as a draft.</p>

    <div class="bd-eg">
      ${EXAMPLES.map(([x], i) => `<button class="bd-chip" type="button" data-bd-eg="${i}">${x}</button>`).join("")}
    </div>

    <div class="canvas-actions">
      <button class="btn primary" type="button" data-bd-plan>Plan it out</button>
    </div>
  </div>`;

/* ------------------------------------------------------------ the plan */

const isOn = (t) => (TOOL(t) ?? [, false])[1];
const asRow = (r) => (Array.isArray(r) ? [null, r[0], r[1]] : [null, r]);
const plain = (t) => String(t).replace(/<[^>]+>/g, "");

const icon = (name) => {
  const t = TOOL(name);
  return t
    ? `<img class="pl-icon${t[1] ? "" : " off"}" src="assets/brands/${t[2]}.svg" alt="" width="18" height="18">`
    : "";
};

/* One line. Inputs and outputs carry a tool so they get the icon column;
   actions carry none, so their group drops the column rather than indenting
   past an empty one.

   Every line can be changed here. Rewriting the whole prompt to move one
   destination would be absurd, and this is the screen where you notice. */
const line = (key, [tool, text, wrong], i) => `
  <div class="pl-line${wrong ? " wrong" : ""}${tool === null ? " bare" : ""}">
    ${tool === null ? "" : `<span class="pl-tool">${icon(tool)}<span class="pl-name">${tool}</span></span>`}
    <span class="pl-text">${text}</span>
    <button class="pl-edit" type="button" data-bd-step="${key}:${i}">Change</button>
  </div>`;

const editing = (key, i, [tool, text]) => `
  <div class="pl-line open${tool === null ? " bare" : ""}">
    ${
      tool === null
        ? ""
        : `<span class="pl-tool">
             <select class="bd-sel tool" data-bd-tool="${key}:${i}" aria-label="Which tool">
               ${TOOLS.map(([t, on]) => `<option${t === tool ? " selected" : ""}>${t}${on ? "" : " — not connected"}</option>`).join("")}
             </select>
           </span>`
    }
    <span class="pl-text">
      <input class="bd-input line" value="${plain(text)}" data-bd-text="${key}:${i}" aria-label="What this step does">
    </span>
    <button class="pl-edit on" type="button" data-bd-step="">Done</button>
  </div>`;

const group = (title, key, rows, extra = "") =>
  rows.length
    ? `<h3${rows[0][0] === null ? ' class="bare"' : ""}>${title}</h3>` +
      rows.map((r, i) => (edit === `${key}:${i}` ? editing(key, i, r) : line(key, r, i))).join("") +
      extra
    : "";

const planned = (p, text) => `
  <header>
    <div>
      <p class="drawer-kind">${triggerLabel()} &middot; for ${[...picked].join(", ") || "nobody yet"}</p>
      <h2>${p.name}</h2>
    </div>
    ${CLOSE}
  </header>
  <div class="drawer-body">
    <p class="bd-echo">&ldquo;${text}&rdquo;</p>

    ${group("Inputs we'll use", "inputs", p.inputs,
      `<div class="pl-add"><button class="btn sm" type="button" data-bd-add="inputs">Add an input</button></div>`)}
    ${group("Actions we'll apply", "actions", p.actions.map(asRow))}
    ${group("Outputs we'll produce", "outputs", p.outputs,
      `<div class="pl-add"><button class="btn sm" type="button" data-bd-add="outputs">Add an output</button></div>`)}
    ${p.note ? `<p class="bd-said warn">${p.note}</p>` : ""}

    <div class="canvas-actions">
      ${
        p.dead
          ? `<button class="btn" type="button" data-bd-back>Bin it and start again</button>`
          : `<button class="btn primary" type="button" data-bd-accept="${p.name}">Start running it</button>
             ${p.fix ? `<button class="btn" type="button" data-bd-add="inputs">${p.fix}</button>` : ""}
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
      <p class="bd-v-t">${triggerLabel()}, for ${[...picked].join(", ")}</p>
      <p class="bd-v-a">It will appear in the list either way &mdash; if it finds nothing, it says so and shows you what it checked.</p>
    </div>
    <div class="canvas-actions">
      <button class="btn primary" type="button" data-close>Back to assignments</button>
      <button class="btn" type="button" data-bd-back>Add another</button>
    </div>
  </div>`;

/* --------------------------------------------------------------- wiring */

const openForm = () => {
  edit = null;
  showDrawer(form());
  drawerEl.querySelector(".bd-input")?.focus();
};

const draw = () => {
  showDrawer(planned(current, prompt));
  drawerEl.querySelector(".bd-input.line, .bd-sel.tool")?.focus();
};

const openPlan = (text) => {
  prompt = text;
  edit = null;
  const p = plan(text);
  /* A copy: from here on you are correcting this assignment, not the template
     it matched. Actions normalise to the same three-part shape as the rest. */
  current = {
    ...p,
    inputs: p.inputs.map((r) => [...r]),
    actions: p.actions.map((r) => asRow(r)),
    outputs: p.outputs.map((r) => [...r]),
  };
  draw();
};

const typed = () => (drawerEl.querySelector('[name="ask"]')?.value ?? "").trim();
const at = (ref) => {
  const [key, i] = ref.split(":");
  return [key, Number(i)];
};

drawerEl.addEventListener("change", (e) => {
  const t = e.target;
  const v = t.value;

  const tool = t.closest("[data-bd-tool]");
  if (tool) {
    const [key, i] = at(tool.dataset.bdTool);
    current[key][i][0] = v.replace(/ — not connected$/, "");
    current[key][i][2] = false; // you have said what it should be
    return draw();
  }

  if (t.matches("[data-bd-every]")) trigger = { ...trigger, every: Math.max(1, Number(v) || 1) };
  else if (t.matches("[data-bd-unit]")) trigger = { ...trigger, unit: v };
  else if (t.matches("[data-bd-attr]"))
    trigger = { ...trigger, attr: v, val: (ATTRS.find(([a]) => a === v) ?? [])[2] ?? "" };
  else if (t.matches("[data-bd-op]")) trigger = { ...trigger, op: v };
  else if (t.matches("[data-bd-val]")) trigger = { ...trigger, val: v };
  else return;
  prompt = typed();
  openForm();
});

/* Typing into a line keeps it, so closing the row does not lose the edit. */
drawerEl.addEventListener("input", (e) => {
  const box = e.target.closest("[data-bd-text]");
  if (!box) return;
  const [key, i] = at(box.dataset.bdText);
  current[key][i][1] = box.value;
  current[key][i][2] = false;
});

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

  const kind = e.target.closest("[data-bd-kind]");
  if (kind) {
    trigger = { ...trigger, kind: kind.dataset.bdKind };
    prompt = typed();
    return openForm();
  }

  const eg = e.target.closest("[data-bd-eg]");
  if (eg) {
    const [text, t] = EXAMPLES[Number(eg.dataset.bdEg)];
    trigger = { ...trigger, ...t };
    return openPlan(text);
  }

  if (e.target.closest("[data-bd-plan]")) {
    const v = typed();
    return v ? openPlan(v) : drawerEl.querySelector(".bd-input")?.focus();
  }

  if (e.target.closest("[data-bd-back]")) return openForm();

  const step = e.target.closest("[data-bd-step]");
  if (step) {
    edit = step.dataset.bdStep || null;
    return draw();
  }

  const add = e.target.closest("[data-bd-add]");
  if (add) {
    const key = add.dataset.bdAdd;
    current[key].push(["HubSpot", "Say what this should do"]);
    edit = `${key}:${current[key].length - 1}`;
    return draw();
  }

  const accept = e.target.closest("[data-bd-accept]");
  if (accept) return showDrawer(running(accept.dataset.bdAccept));
});
