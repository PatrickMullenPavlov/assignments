import { CANVAS, RUNS } from "/Users/patrick/Desktop/trig-prototype/stepped.js";
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

/* Every data-* hook a row is given must be one a handler listens for.
   Rendering proves nothing about this: a row can carry data-name forever
   while every handler reads data-pick, and it just quietly stops opening. */
import { readFileSync, readdirSync } from "node:fs";
const DIR = "/Users/patrick/Desktop/trig-prototype/";
const src = readdirSync(DIR)
  .filter((f) => f.endsWith(".js") && f !== "serve.py")
  .map((f) => readFileSync(DIR + f, "utf8"))
  .join("\n");

const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const written = new Set([
  ...[...src.matchAll(/\sdata-([a-z0-9-]+)=/g)].map((m) => m[1]),
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
