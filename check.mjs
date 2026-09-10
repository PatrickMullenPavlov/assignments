import { CANVAS, RUNS } from "/Users/patrick/Desktop/trig-prototype/stepped.js";
import { SETS, ACCOUNTS } from "/Users/patrick/Desktop/trig-prototype/cohort.js";
import { LOGS } from "/Users/patrick/Desktop/trig-prototype/logs.js";
import { RENEWALS } from "/Users/patrick/Desktop/trig-prototype/renewals.js";
const BY_ID = new Set(["pack", "dial"]);
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
      BY_ID.has(i.shape) ? CANVAS[i.shape](i.id) : CANVAS[i.shape](i);
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
