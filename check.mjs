import { readFileSync, readdirSync, existsSync } from "node:fs";
const DIR = "/Users/patrick/Desktop/trig-prototype/";

import { CANVAS, RUNS, resolve } from "/Users/patrick/Desktop/trig-prototype/stepped.js";
import { SETS, ACCOUNTS } from "/Users/patrick/Desktop/trig-prototype/cohort.js";
import { LOGS } from "/Users/patrick/Desktop/trig-prototype/logs.js";
import { RENEWALS } from "/Users/patrick/Desktop/trig-prototype/renewals.js";
const SENTINEL = new Set(["WRITES"]);
const bad = [];
let items = 0, agendas = 0;
for (const [n, r] of Object.entries(RUNS)) {
  try {
    if (r.single) CANVAS[r.single.shape](r.single);
    if (r.report) CANVAS[r.report.shape](r.report);
    if (r.agenda) { CANVAS.agendaCol2(r, null); agendas++; }
    for (const i of (r.groups ?? []).flatMap((g) => g.items)) {
      if (!i.shape) continue;
      items++;
      CANVAS[i.shape](i); // exactly how the third pane calls it
    }
  } catch (e) { bad.push(n + " → " + e.message); }
}
console.log(bad.length ? "FAILS:\n  " + bad.join("\n  ")
  : `ok: ${Object.keys(RUNS).length} runs, ${agendas} column-2 agendas, ${items} items all render`);

/* The question a user actually asks: I clicked this assignment — did
   anything appear? Run the app's own resolve(), not a copy of it, from
   a cold open and from whatever was open before. */
const empty = [];
for (const [n, r] of Object.entries(RUNS)) {
  const priors = [null, "__report", "halcyon", "no-such-item"];
  for (const prior of priors) {
    let html;
    try {
      const { current } = resolve(r, prior);
      html = current ? CANVAS[current.shape](current) : "";
    } catch (e) { html = "THREW: " + e.message; }
    if (!html || html.startsWith("THREW")) empty.push(`${n} (was ${prior}) → ${html || "empty pane"}`);
  }
}
console.log(empty.length ? "OPENS TO NOTHING:\n  " + empty.join("\n  ")
  : `ok: every assignment opens to a pane, from every prior selection`);

const html = Object.values(RUNS).map((r) =>
  [r.single && CANVAS[r.single.shape](r.single), r.report && CANVAS[r.report.shape](r.report)]
    .filter(Boolean).join("")).join("");
const doors = [...html.matchAll(/data-set="([^"]+)"/g)].map((m) => m[1]);
const logs = [...html.matchAll(/data-log="([^"]+)"/g)].map((m) => m[1]).filter((l) => !SENTINEL.has(l));
const rens = [...html.matchAll(/data-renewal="([^"]+)"/g)].map((m) => m[1]);
const dead = [...doors.filter((d) => !SETS[d]), ...logs.filter((l) => !LOGS[l]),
              ...rens.filter((r) => !RENEWALS.some((x) => x.account === r))];
console.log(dead.length ? "DEAD DOORS: " + dead.join(", ")
  : `ok: ${doors.length} set doors, ${logs.length} log doors, ${rens.length} renewal doors resolve`);

const names = new Set(ACCOUNTS.map((a) => a.name));
let rows = 0, mismatch = [];
for (const k of new Set(doors)) {
  const t = [...CANVAS.set(k).matchAll(/data-trial="([^"]+)"/g)].map((m) => m[1]);
  rows += t.length;
  if (t.some((n) => !names.has(n))) mismatch.push(k + " has an orphan row");
  if (t.length !== SETS[k].of().length) mismatch.push(`${k}: ${t.length} rows vs ${SETS[k].of().length}`);
}
console.log(mismatch.length ? "MISMATCH: " + mismatch.join(", ")
  : `ok: ${new Set(doors).size} drawers, ${rows} rows, each a door into its own pane`);

let panes = 0;
for (const a of ACCOUNTS) { if (CANVAS.trialPane(a.name).includes("undefined")) mismatch.push(a.name); panes++; }
for (const r of RENEWALS) { if (CANVAS.renewalPane(r.account).includes("undefined")) mismatch.push(r.account); panes++; }
console.log(mismatch.length ? "PANES WITH HOLES: " + mismatch.join(", ") : `ok: ${panes} depth panes, no holes`);

/* A canvas knows which surface it is on. Moving one from the drawer to the
   third pane and leaving its <header>, close button and .drawer-body behind
   renders a drawer inside a column — which is how the packs broke. */
const CHROME = /drawer-body|drawer-kind|data-close/;
const wrong = [];
for (const [n, r] of Object.entries(RUNS)) {
  const paneHtml = [
    r.single && CANVAS[r.single.shape](r.single),
    r.report && CANVAS[r.report.shape](r.report),
    ...(r.groups ?? []).flatMap((g) => g.items).filter((i) => i.shape).map((i) => CANVAS[i.shape](i)),
  ].filter(Boolean);
  if (paneHtml.some((h) => CHROME.test(h))) wrong.push(n + " renders drawer chrome in the pane");
}
for (const a of ACCOUNTS.slice(0, 1)) if (CHROME.test(CANVAS.trialPane(a.name))) wrong.push("trialPane");
for (const r of RENEWALS.slice(0, 1)) if (CHROME.test(CANVAS.renewalPane(r.account))) wrong.push("renewalPane");
// and the reverse: a drawer with no way out
for (const k of new Set(doors)) if (!/data-close/.test(CANVAS.set(k))) wrong.push("drawer " + k + " has no close");
for (const k of Object.keys(LOGS)) if (!/data-close/.test(CANVAS.log(k))) wrong.push("log " + k + " has no close");
console.log(wrong.length ? "WRONG SURFACE: " + wrong.join(", ")
  : "ok: no pane renders drawer chrome, and every drawer can be closed");

/* Every run carries the three bands, and the figure is derived from what the
   run produced rather than typed beside it — so a run that finds less claims
   less, and nobody can quietly inflate it. */
const { PROVENANCE, provenance } = await import("/Users/patrick/Desktop/trig-prototype/provenance.js");
const provGaps = [];
for (const name of Object.keys(RUNS)) {
  const p = PROVENANCE[name];
  if (!p) { provGaps.push(`${name} has none`); continue; }
  if (!p.from?.length) provGaps.push(`${name}: nothing it was built from`);
  if (!p.checked?.length) provGaps.push(`${name}: nothing it checked`);
  const { each, units } = p.cost ?? {};
  if (typeof each !== "number" || typeof units !== "number")
    provGaps.push(`${name}: the cost is not computed`);
  const html = provenance(name);
  if (!/prov-figure/.test(html)) provGaps.push(`${name}: renders no figure`);
}
const totalHours = Object.values(PROVENANCE)
  .reduce((n, p) => n + (p.cost.each * p.cost.units) / 60, 0);
console.log(provGaps.length
  ? "PROVENANCE GAPS: " + provGaps.join(", ")
  : `ok: all ${Object.keys(RUNS).length} runs show what they were built from, ${totalHours.toFixed(0)} hours across them`);

/* The modules that touch a DOM were invisible here: importing one throws
   without a document, so a ReferenceError inside a template survived two
   commits while every other check passed. Load them under a stub and fire
   the one click that matters. */
const dom = await import("/Users/patrick/Desktop/trig-prototype/dom.mjs");
let builderErr = null;
try {
  await import("/Users/patrick/Desktop/trig-prototype/builder.js");
} catch (e) {
  builderErr = e;
}
if (builderErr) {
  console.log("BUILDER WILL NOT LOAD: " + builderErr.message);
} else {
  const threw = dom.click("[data-add-assignment]");
  const html = dom.drawerHTML();
  console.log(
    threw ? "ADD AN ASSIGNMENT THROWS: " + threw.message
      : html.length < 400 ? `ADD AN ASSIGNMENT OPENS NOTHING (${html.length} chars)`
      : `ok: Add an Assignment opens a drawer, ${html.length} chars, ${dom.counts().click} handlers`,
  );

  /* Render every example, because the data being right is not the same as
     the screen being right. "Actions we'll apply: null" got through with
     every plan intact — the rows were transformed twice on the way out. */
  const rendered = [];
  for (let i = 0; i < 5; i++) {
    const e = dom.click("[data-bd-eg]", { bdEg: String(i) });
    const out = dom.drawerHTML();
    if (e) rendered.push(`example ${i} throws: ${e.message}`);
    else if (/>\s*(null|undefined)\s*</.test(out)) rendered.push(`example ${i} renders an empty line`);
    else if (out.length < 400) rendered.push(`example ${i} renders nothing`);
  }
  console.log(rendered.length
    ? "PLANS RENDER BADLY: " + rendered.join(", ")
    : "ok: all 5 examples render a plan with no empty lines");
}

/* Every line of every plan must carry text. "Actions we'll apply: null"
   reached the screen because the rows were normalised twice — the second
   pass shifted the text into the wrong-flag and left the text empty. */
const asRow = (r) => (Array.isArray(r) ? [null, r[0], r[1]] : [null, r]);
const blank = [];

/* Every tool a plan names must be one the builder knows, or the line renders
   a broken image where its icon should be. */
const bsrc = readFileSync("/Users/patrick/Desktop/trig-prototype/builder.js", "utf8");
const kit = bsrc.slice(bsrc.indexOf("const TOOLS = ["), bsrc.indexOf("const plan = (text)"));
const sandbox = await import(
  "data:text/javascript," +
    encodeURIComponent(kit + "\nexport { TOOLS, PLANS, FALLBACK };")
);
const iconFor = new Map(sandbox.TOOLS.map(([n, , f]) => [n, f]));
const badTool = [];
for (const p of [...sandbox.PLANS, sandbox.FALLBACK]) {
  for (const [tool] of [...p.inputs, ...p.outputs]) {
    if (!tool) continue;
    if (!iconFor.has(tool)) badTool.push(`${p.name}: ${tool} is not a tool`);
    else if (!existsSync(`${DIR}assets/brands/${iconFor.get(tool)}.svg`))
      badTool.push(`${p.name}: ${tool} has no icon file`);
  }
}
console.log(badTool.length
  ? "TOOLS WITHOUT AN ICON: " + badTool.join(", ")
  : `ok: every tool named in a plan has an icon, ${iconFor.size} in the kit`);

let planLines = 0;
for (const p of [...sandbox.PLANS, sandbox.FALLBACK]) {
  for (const row of [...p.inputs, ...p.actions.map(asRow), ...p.outputs]) {
    planLines++;
    const text = row[1];
    if (text == null || String(text).trim() === "" || String(text) === "null")
      blank.push(`${p.name}: a line with no text`);
  }
}
console.log(blank.length
  ? "PLAN LINES WITH NO TEXT: " + blank.join(", ")
  : `ok: all ${planLines} plan lines carry text`);

/* Every data-* hook a row is given must be one a handler listens for.
   Rendering proves nothing about this: a row can carry data-name forever
   while every handler reads data-pick, and it just quietly stops opening. */
const src = readdirSync(DIR)
  .filter((f) => f.endsWith(".js") && f !== "serve.py")
  .map((f) => readFileSync(DIR + f, "utf8"))
  .join("\n");

const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const written = new Set([
  ...[...src.matchAll(/\sdata-([a-z0-9-]+)[=>\s]/g)].map((m) => m[1]),
  ...[...src.matchAll(/\.dataset\.([A-Za-z0-9]+)\s*=[^=]/g)].map((m) => kebab(m[1])),
]);
// a hook is read if a handler queries it OR the stylesheet selects on it
const css = readFileSync(DIR + "styles.css", "utf8");
const read = new Set([
  ...[...src.matchAll(/\[data-([a-z0-9-]+)[\]=]/g)].map((m) => m[1]),
  ...[...src.matchAll(/\.dataset\.([A-Za-z0-9]+)(?!\s*=[^=])/g)].map((m) => kebab(m[1])),
  ...[...src.matchAll(/toggleAttribute\("data-([a-z0-9-]+)"/g)].map((m) => m[1]),
  ...[...css.matchAll(/\[data-([a-z0-9-]+)[\]=]/g)].map((m) => m[1]),
]);
const orphans = [...written].filter((a) => !read.has(a)).sort();
console.log(orphans.length
  ? "HOOKS NOTHING LISTENS FOR: " + orphans.map((a) => "data-" + a).join(", ")
  : `ok: all ${written.size} data hooks are read by a handler`);

/* Same failure, one level up: a class in the markup that the stylesheet
   never mentions renders as an unstyled div and nothing complains.
   .col-head sat in both column-2 branches for weeks with no rule at all. */
const pages = readdirSync(DIR).filter((f) => f.endsWith(".html"))
  .map((f) => readFileSync(DIR + f, "utf8")).join("\n");
const used = new Set(
  [...(src + pages).matchAll(/class="([^"$]*)"/g)]
    .flatMap((m) => m[1].split(/\s+/))
    .filter((c) => c && !/[^a-z0-9-]/.test(c)),
);
const styled = new Set([...css.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]));
const unstyled = [...used].filter((c) => !styled.has(c)).sort();
console.log(unstyled.length
  ? "CLASSES WITH NO RULE: " + unstyled.map((c) => "." + c).join(", ")
  : `ok: all ${used.size} classes in the markup have a rule`);

/* The section gutter is a token. A literal 24px in a horizontal padding is
   almost always it written out again — which is how the builder ended up
   flush against the edge while every row beside it was inset. */
const horiz = (v) => {           // the left/right parts of a padding shorthand
  const p = v.trim().split(/\s+/);
  return p.length === 1 ? [p[0]] : p.length === 3 ? [p[1]] : [p[1], p[3] ?? p[1]];
};
const strays = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .flatMap(([, sel, body]) =>
    [...body.matchAll(/(?:^|;)\s*padding:\s*([^;]+)/g)]
      .filter((m) => { const h = horiz(m[1]); return h.every((x) => x === "24px"); })
      .map(() => sel.replace(/\/\*[\s\S]*?\*\//g, "").trim().replace(/\s+/g, " ")))
  .filter((sel) => !sel.startsWith(":root"));
console.log(strays.length
  ? "GUTTER WRITTEN OUT INSTEAD OF --gutter: " + strays.join(", ")
  : "ok: every section gutter comes from the token");
