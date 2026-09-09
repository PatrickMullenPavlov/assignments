/* Assignments — the dashboard list.

   Columns, and why each earns its place next to Needs action above it:

     name + cadence   what it is, and when to expect something
     lands            the only thing distinguishing the output patterns
                      without inventing categories or tabs
     covers           NOT "accounts" — an assignment's subject can be reps,
                      deals, people or your whole book, and the noun has to
                      change with it
     needs you        a decision the work can't proceed without. A finished
                      document is not waiting; it's done, and yours
     evidence         the verdict with its comparison, never a bare word
     working          the pill, which only repeats the verdict's first word

   Every count is a door and opens on the run.                            */

const ASSIGNMENTS = [
  {
    name: "Prep my 1:1s",
    perRep: { }, needsPerRep: null,
    cadence: "Weekly · Monday, 6:40 am",
    lands: "A pack per call",
    covers: "38 accounts",
    needs: null,
    verdict: "Working",
    evidence: "Read before 11 of the last 12 sessions. The one that wasn't, Dev was on leave.",
    state: "good",
  },
  {
    name: "Draft proposals against our pricing",
    perRep: { Lazlo: "2 deals", Mia: "1 deal", "Cabbage Mick": "1 deal", Yan: "1 deal" }, needsPerRep: null,
    cadence: "Per deal",
    lands: "A document, per deal",
    covers: "5 deals",
    needs: null,
    verdict: "Working",
    evidence: "3 written, 1 sent, 2 sitting unsent with a person. Two lines flagged outside the discount cap.",
    state: "good",
  },
  {
    name: "Rank today's list before dialling",
    perRep: { Lazlo: "your book · 14", Mia: "your book · 12", "Cabbage Mick": "your book · 11", Yan: "your book · 9", Kish: "your book · 15" }, needsPerRep: null,
    cadence: "Daily · 6:40 am",
    lands: "Slack, today only",
    covers: "your book · 61",
    needs: null,
    verdict: "Working",
    evidence: "Opened 18 of 20 mornings. The top 3 were rung on 14 of them.",
    state: "good",
  },
  {
    name: "Confirm exec sponsor involvement before renewal",
    perRep: { Lazlo: "8 accounts", Mia: "7 accounts", "Cabbage Mick": "6 accounts", Yan: "5 accounts", Kish: "8 accounts" }, needsPerRep: { Mia: "1" },
    cadence: "Weekly · Mondays",
    lands: "A list, every Monday",
    covers: "34 accounts",
    needs: "1",
    verdict: "Working",
    evidence: "11 flagged since June. 4 now have a sponsor named; 2 renewed without one and both dropped a tier.",
    state: "good",
  },
  {
    name: "Book meetings with the people we're missing",
    perRep: { Lazlo: "6 deals", Mia: "5 deals", "Cabbage Mick": "4 deals", Yan: "4 deals", Kish: "4 deals" }, needsPerRep: { Lazlo: "5", Mia: "4", "Cabbage Mick": "2", Yan: "2", Kish: "1" },
    cadence: "Weekly",
    lands: "Drafts, into your Gmail",
    covers: "23 deals",
    needs: "14",
    verdict: "Working",
    evidence: "38 meetings booked from 62 asks sent. Deals it touched reach 4 contacts, against 2 for the rest.",
    state: "good",
  },
  {
    name: "Chase quiet champions",
    perRep: { Lazlo: "5 champions", Mia: "4 champions", "Cabbage Mick": "3 champions", Yan: "2 champions", Kish: "4 champions" }, needsPerRep: null,
    cadence: "Daily · 6:40 am",
    lands: "On each person",
    covers: "18 champions",
    needs: null,
    verdict: "Stuck",
    evidence: "Nothing for 8 runs. It reads HubSpot, and HubSpot has been unreadable since 29 August.",
    state: "bad",
  },
  {
    name: "Win back lapsed trials",
    perRep: { }, needsPerRep: null,
    cadence: "Weekly · Tuesdays",
    lands: "On each account",
    covers: "0 accounts",
    needs: null,
    verdict: "Not moving",
    evidence: "12% replied. So did 11% of the ones we left alone. Its cohort emptied on 5 September.",
    state: "bad",
  },
  {
    name: "Log every touch, contact and outcome",
    perRep: { Lazlo: "your book · 14", Mia: "your book · 12", "Cabbage Mick": "your book · 11", Yan: "your book · 9", Kish: "your book · 15" }, needsPerRep: null,
    cadence: "Continuous",
    lands: "Nowhere you read",
    covers: "your book · 61",
    needs: null,
    verdict: "Working",
    evidence: "41,000 writes this quarter, 3 rejected. Nobody has opened its output, which is the point of it.",
    state: "good",
  },
  {
    name: "Publish the weekly revenue pack",
    perRep: { }, needsPerRep: null,
    cadence: "Weekly · Friday, 5 pm",
    lands: "A document, weekly",
    covers: "the team",
    needs: null,
    verdict: "Working",
    evidence: "Delivered 11 Fridays running. Opened by 6 of 7 people before Monday.",
    state: "good",
  },
];

import { onFilterChange } from "./filter.js";
import { RUNS, CANVAS, WEEKCALLS, DIALS } from "./stepped.js";
import { SETS } from "./cohort.js";
import { showDrawer, hideDrawer } from "./drawer.js";

let grid = document.querySelector("#assignments-list");

/* One row, two widths. The narrow column is the same markup with the
   middle cells hidden — never a second component. */
function rowHTML(a) {
  return `
      <span class="asg-name">
        <span class="asg-title">${a.name}</span>
        <span class="asg-cadence">${a.cadence}</span>
      </span>
      <span class="asg-meta">${a.lands}</span>
      <span class="asg-door">${a.covers}</span>
      <span class="asg-door${a.needs ? " needs" : " none"}">${a.needs ?? "—"}</span>
      <span class="asg-evidence">${a.evidence}</span>
      <span class="asg-state"><span class="pill">${a.verdict}</span></span>`;
}

let repNow = "All";

function paint(rep) {
  repNow = rep;
  const head = document.createElement("div");
  head.className = "row head";
  head.innerHTML = ["Name", "Where its output lands", "Covers", "Needs you", "What the evidence says", ""]
    .map((h) => `<span>${h}</span>`)
    .join("");

  const visible =
    rep === "All"
      ? ASSIGNMENTS.map((a) => ({ ...a }))
      : ASSIGNMENTS.filter((a) => a.perRep && a.perRep[rep]).map((a) => ({
          ...a,
          covers: a.perRep[rep],
          needs: a.needsPerRep?.[rep] ?? null,
        }));

  grid = document.querySelector("#assignments-list");
  if (!grid) return;
  grid.replaceChildren(
    head,
    ...visible.map((a) => {
      const row = document.createElement("div");
      row.className = "row item asg";
      row.dataset.state = a.state;
      row.dataset.name = a.name;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.innerHTML = rowHTML(a);
      return row;
    }),
  );

  const note = document.querySelector("#assignments-note");
  if (note) {
    const hidden = ASSIGNMENTS.length - visible.length;
    note.textContent =
      rep === "All" || hidden === 0
        ? ""
        : `${hidden} more run across the team but touch nothing in ${rep}'s book.`;
  }
}

onFilterChange(paint);


/* ------------------------------------------------------- the stepped view
   Clicking an assignment turns the list into a navigator: the table
   becomes column 1, the run's subjects become column 2, and the work
   becomes the canvas. Column 2 is absent when the run made one thing. */

const view = document.querySelector("#asg-view");

/* The dashboard shows the same list without the navigator. A row there
   routes to the assignments page with that assignment already open —
   a summary section is the wrong place for a three-column drill-down,
   and its first column would repeat the list you just clicked. */
if (!view) {
  document.querySelector("#assignments-list")?.addEventListener("click", (e) => {
    const row = e.target.closest(".row.item.asg");
    if (row) location.href = "assignments.html?open=" + encodeURIComponent(row.dataset.name);
  });
  document.querySelector("#assignments-list")?.addEventListener("keydown", (e) => {
    const row = e.target.closest(".row.item.asg");
    if (row && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      location.href = "assignments.html?open=" + encodeURIComponent(row.dataset.name);
    }
  });
}

let openAssignment = null;
let openItem = null;

function allItems(run) {
  return (run.groups ?? []).flatMap((g) => g.items);
}

function stepped(name) {
  const run = RUNS[name];
  if (!run || !view) return;
  openAssignment = name;

  const single = run.single ?? null;
  const items = single ? [] : allItems(run);
  // "the report" is a subject-list row like any other, and it is the default.
  // Picking an account narrows to that account; picking it again comes back.
  const hasReport = Boolean(run.report);
  if (!single && openItem !== "__report" && !items.some((i) => i.id === openItem)) {
    openItem = hasReport ? "__report" : (items[0]?.id ?? null);
  }
  const current =
    single ?? (openItem === "__report" ? run.report : items.find((i) => i.id === openItem));

  history.replaceState(null, "", "?open=" + encodeURIComponent(name));

  view.innerHTML = `
    <div class="stepped${single ? " collapsed" : ""}">

      <div class="col col-list">
        <div class="table assignments narrow">
          <div class="row head"><span>Name</span><span>${ASSIGNMENTS.length}</span></div>
          ${ASSIGNMENTS.map(
            (a) => `
            <div class="row item asg" data-state="${a.state}" data-pick="${a.name}" role="button" tabindex="0"${
              a.name === name ? ' aria-current="true"' : ""
            }>${rowHTML(a)}</div>`,
          ).join("")}
        </div>
      </div>

      ${
        single
          ? ""
          : `<div class="col col-subjects">
               <div class="col-head">${run.noun}</div>
               ${
                 hasReport
                   ? `<button class="subj report${openItem === "__report" ? " on" : ""}" type="button" data-item="__report">
                        <span class="subj-name">The whole assignment</span>
                        <span class="subj-sub">definition, steps, efficacy</span>
                      </button>
                      <div class="grp">${run.run.split(" · ")[0]}</div>`
                   : `<div class="run-chip">${run.run} <span>&#9662;</span></div>`
               }
               ${run.groups
                 .map(
                   (g) => `
                 <div class="grp${g.tone === "warn" ? " warn" : ""}">${g.label}</div>
                 ${g.items
                   .map(
                     (i) => `
                   <button class="subj${i.id === openItem ? " on" : ""}" type="button" data-item="${i.id}">
                     <span class="subj-name">${i.name}</span>
                     <span class="subj-sub">${i.sub}</span>
                   </button>`,
                   )
                   .join("")}`,
                 )
                 .join("")}
             </div>`
      }

      <div class="col col-canvas">${current ? CANVAS[current.shape](current) : ""}</div>
    </div>`;
}

function restore() {
  openAssignment = null;
  openItem = null;
  history.replaceState(null, "", location.pathname);
  view.innerHTML = `<p class="filter-note" id="assignments-note"></p><div class="table assignments" id="assignments-list"></div>`;
  paint(repNow);
}

if (view) view.addEventListener("click", (e) => {
  const door = e.target.closest("[data-set]");
  if (door) return showDrawer(CANVAS.set(door.dataset.set));
  const log = e.target.closest("[data-log]");
  if (log) return showDrawer(CANVAS.log(log.dataset.log));
  const rn = e.target.closest("[data-renewal]");
  if (rn) return showDrawer(CANVAS.renewal(rn.dataset.renewal));
  const champ = e.target.closest("[data-champ]");
  if (champ) return showDrawer(CANVAS.champs(champ.dataset.champ));
  const pk = e.target.closest("[data-pack]");
  if (pk) {
    const id = pk.dataset.pack;
    return showDrawer(id in DIALS ? CANVAS.dial(id) : CANVAS.pack(id));
  }
  const dayT = e.target.closest("[data-day-toggle]");
  if (dayT) return dayT.closest(".wk-day").toggleAttribute("data-open");

  const pick = e.target.closest("[data-pick]");
  if (pick) {
    // the open row is the way back — there is nothing else to return to
    if (pick.dataset.pick === openAssignment) return restore();
    openItem = null;
    hideDrawer();
    return stepped(pick.dataset.pick);
  }
  const item = e.target.closest("[data-item]");
  if (item) { openItem = item.dataset.item; return stepped(openAssignment); }
  const row = e.target.closest(".row.item.asg");
  if (row) stepped(row.dataset.name);
});


/* Selection in a batch of drafts. The count in the bar and the count on
   the button are the same number, always. */
if (view) view.addEventListener("change", (e) => {
  const bar = view.querySelector("[data-bulk]");
  if (!bar) return;
  const boxes = [...view.querySelectorAll("[data-row]")];
  if (e.target.matches("[data-all]")) boxes.forEach((b) => (b.checked = e.target.checked));

  const n = boxes.filter((b) => b.checked).length;
  view.querySelector("[data-count]").textContent = String(n);
  view.querySelector("[data-count2]").textContent = String(n);
  const all = view.querySelector("[data-all]");
  all.checked = n === boxes.length;
  all.indeterminate = n > 0 && n < boxes.length;
  view.querySelector("[data-place]").disabled = n === 0;
  boxes.forEach((b) => b.closest(".draft").toggleAttribute("data-off", !b.checked));
});

/* Read expands the draft in place. It never removes anything. */
if (view) view.addEventListener("click", (e) => {
  const read = e.target.closest("[data-read]");
  if (!read) return;
  const row = read.closest(".draft");
  const open = row.toggleAttribute("data-open");
  read.textContent = open ? "Close" : "Read";
});


/* Arriving from the dashboard, or refreshing with one open. */
if (view) {
  const wanted = new URLSearchParams(location.search).get("open");
  if (wanted && RUNS[wanted]) stepped(wanted);
}
