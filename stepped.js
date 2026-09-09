import { ACCOUNTS, SETS, count, pct } from "./cohort.js";
import { LOGS } from "./logs.js";

/* The stepped view: assignment → subjects → the work.

   THE RULE, settled earlier: column 2 exists when THE RUN produced more
   than one output. When it produced one, the column collapses and the
   canvas takes the width. Nothing branches on the assignment's type — it
   branches on what the run actually made, which the run already knows.
   The same assignment can therefore come up three-column one day and
   two-column the next, and that is intended.

   Which is the same rule as the layout table, seen twice:

     LAYOUT             makes            column 2
     sequence           one stack        collapses — the stack has its own index
     grid               one table        collapses — it is about everyone at once
     batch              one per subject  stays — pick which one
     single artefact    one per subject  stays — pick which one

   So the assignment's layout predicts the column count. Nothing has to
   be configured twice.

   Column 2 is never "Accounts". It is whatever the subject is — reps,
   deals, champions, accounts — grouped by what the run did to them,
   which is what makes 5 or 50 navigable.                                 */

const noop = () => "";

/* ------------------------------------------------------------- canvases */

const CANVAS = {};

/* SEQUENCE — every output stacked, read in the order the week happens.
   An index across the top jumps without leaving the page.               */
CANVAS.sequence = (it) => `
  <h2>${it.name}</h2>
  <p class="canvas-meta">${it.meta}</p>
  <div class="seq-index">
    ${it.parts.map((p, i) => `<span class="seq-chip${i === 0 ? " on" : ""}"><span class="d${p.read ? " read" : ""}"></span>${p.name}<em>${p.when}</em></span>`).join("")}
  </div>
  <div class="canvas-body wide">
    ${it.parts
      .map(
        (p) => `
      <article class="seq-part">
        <header>
          <span class="seq-when">${p.when}</span>
          <span class="seq-name">${p.name}</span>
          <span class="seq-meta">${p.meta}</span>
          <span class="seq-state">${p.read ? "Read" : "Not opened"}</span>
        </header>
        <div class="seq-cols">
          <div>
            <h3>${p.leftTitle}</h3>
            <ul class="ev">${p.left.map((x) => `<li>${x}</li>`).join("")}</ul>
          </div>
          <div>
            <h3>${p.rightTitle}</h3>
            <ol class="steps">${p.right.map((x) => `<li>${x}</li>`).join("")}</ol>
          </div>
        </div>
      </article>`,
      )
      .join("")}
  </div>`;

/* GRID — one table about everyone. Scanned for the exception, not read. */
CANVAS.grid = (it) => `
  <h2>${it.name}</h2>
  <p class="canvas-meta">${it.meta}</p>
  ${
    it.collapseNote
      ? `<div class="collapse-note">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
           This run made <strong>one thing</strong>, and it is about all ${it.rows.length} at once. There is nothing to pick between, so the subject column steps out of the way.
         </div>`
      : ""
  }
  <div class="canvas-body wide">
    ${it.bulk ? `<div class="bulk">${it.bulk}</div>` : ""}
    <div class="table set-table" style="--set-cols:${it.widths}">
      <div class="row head">${it.cols.map((c) => `<span>${c}</span>`).join("")}</div>
      ${it.rows.map((r) => `<div class="row item">${r.map((c) => `<span>${c}</span>`).join("")}</div>`).join("")}
    </div>
    <p class="canvas-after">${it.judgement}</p>
  </div>`;

/* BATCH — one output per subject, worked through one at a time. */
CANVAS.batch = (it) => `
  <h2>${it.name}</h2>
  <p class="canvas-meta">${it.meta}</p>
  <div class="canvas-body wide">
    <div class="canvas-cols">
      <div>
        <h3>Why it picked them up</h3>
        <ul class="ev">${it.why.map((w) => `<li>${w}</li>`).join("")}</ul>
      </div>
      <div>
        <h3>What it did here</h3>
        <ol class="steps">${it.did.map((d) => `<li>${d}</li>`).join("")}</ol>
      </div>
    </div>
    ${
      it.draft
        ? `<h3>What it wrote</h3>
           <div class="artefact">
             <p class="artefact-meta">${it.draft.meta}</p>
             <p class="artefact-body">${it.draft.body}</p>
           </div>
           <div class="canvas-actions">
             <button class="btn primary" type="button">Open in Gmail</button>
             <button class="btn" type="button">Bin the draft</button>
           </div>`
        : ""
    }
  </div>`;

/* SINGLE ARTEFACT — show the document, not a link to it. The page is the
   body of the canvas; provenance, checks and versions sit beside it. */

const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.4h.01"/></svg>';

CANVAS.document = (it) => `
  <div class="canvas-head">
    <div>
      <h2>${it.name} <span class="tag">${it.version}</span> <span class="tag">${it.status}</span></h2>
      <p class="canvas-meta">${it.meta}</p>
    </div>
    <div class="canvas-actions tight">
      <button class="btn primary" type="button">Edit in Google Docs</button>
      <button class="btn" type="button">Download</button>
      <button class="btn" type="button">Open in Gmail</button>
    </div>
  </div>

  <div class="doc-split">
    <div class="paper-frame">
      <article class="paper">
        <header class="paper-top">
          <span class="paper-brand">${it.doc.brand}</span>
          <span class="paper-conf">Commercial in confidence</span>
        </header>
        <h3 class="paper-title">${it.doc.title}</h3>
        <p class="paper-sub">${it.doc.sub}</p>
        ${it.doc.sections
          .map(
            (sec) =>
              `<h4 class="paper-h">${sec.h}</h4>` +
              (sec.p ? `<p class="paper-p">${sec.p}</p>` : "") +
              (sec.lines
                ? `<div class="paper-table">${sec.lines
                    .map((l) => `<div class="paper-line${l[2] ? " strong" : ""}"><span>${l[0]}</span><span>${l[1]}</span></div>`)
                    .join("")}</div>`
                : ""),
          )
          .join("")}
        <div class="paper-fade"></div>
        <p class="paper-foot">Page 1 of ${it.doc.pages}</p>
      </article>
    </div>

    <aside class="doc-side">
      <h3>What it was built from</h3>
      <ul class="prov">${it.from.map((f) => `<li><span class="prov-t">${f[0]}</span><span class="prov-s">${f[1]}</span></li>`).join("")}</ul>

      <h3>What it checked</h3>
      <ul class="checks">${it.checked
        .map((c) => `<li class="${c[0]}"><span class="check-i">${c[0] === "ok" ? TICK : WARN}</span><span><span class="prov-t">${c[1]}</span><span class="prov-s">${c[2]}</span></span></li>`)
        .join("")}</ul>

      <h3>Versions <em>no history to dig through</em></h3>
      <ul class="versions">${it.versions
        .map((v) => `<li${v[3] ? ' class="on"' : ""}><span class="v-n">${v[0]}</span><span><span class="prov-t">${v[1]}</span><span class="prov-s">${v[2]}</span></span></li>`)
        .join("")}</ul>
    </aside>
  </div>

  <p class="canvas-after">The assignment finished when it produced this. Editing, sending or shelving it are yours to do, in your own tools — Trig just notices when ${it.version} goes out.</p>`;


/* THE REPORT — what column 3 shows before a subject is picked. Not about
   one account: the definition, the mechanism, the efficacy against a held
   back group, and what has actually been learned. */

const D = (k, text) => `<button class="door" type="button" data-set="${k}">${text ?? count(k)}</button>`;

CANVAS.report = (it) => `
  <div class="canvas-head">
    <div>
      <h2>${it.name}</h2>
      <p class="canvas-verdict"><strong>${it.verdict}</strong> ${D("converted")} of ${D("reached")} came back, against 5 of 94 we deliberately left alone. That is inside the noise — the emails are fine, the cohort is wrong.</p>
      <p class="canvas-meta">${it.meta}</p>
    </div>
    <div class="canvas-actions tight">
      <button class="btn" type="button">Edit</button>
      <button class="btn" type="button">Pause it</button>
    </div>
  </div>

  <div class="def-strip">
    ${it.defs.map((d) => `<div class="def"><h3>${d.h}</h3><p>${d.p}</p><span class="def-where">${d.where}</span></div>`).join("")}
  </div>

  <h3 class="canvas-h">The work, and who is standing where</h3>
  <ol class="flowsteps">
    <li class="trigger">
      <span class="fs-n">T</span>
      <span class="fs-b"><span class="fs-t">The trial ended 30 days ago and nothing converted</span>
        <span class="fs-s">checked every Tuesday against the cohort</span></span>
      <span class="fs-through">${D("reached")} entered</span>
      <span class="fs-tag">trigger</span>
    </li>
    <li class="wait"><span>straight away</span></li>
    <li class="send">
      <span class="fs-n">1</span>
      <span class="fs-b"><span class="fs-t">Ask what stopped them</span>
        <span class="fs-s">a plain question — no pitch, no link, no offer</span></span>
      <span class="fs-through">${D("reached")} sent · ${D("opened")} opened</span>
      <span class="fs-tag">sends itself</span>
    </li>
    <li class="wait"><span>then 14 days, if no reply</span><span class="wait-here">${D("wait1")} sitting here now</span></li>
    <li class="send">
      <span class="fs-n">2</span>
      <span class="fs-b"><span class="fs-t">Send the case study closest to their use case</span>
        <span class="fs-s">picked from what they actually used during the trial</span></span>
      <span class="fs-through">84 sent · ${D("clicked")} clicked</span>
      <span class="fs-tag">sends itself</span>
    </li>
    <li class="wait"><span>then 14 days, if no reply</span><span class="wait-here">${D("wait2")} sitting here now</span></li>
    <li class="needs">
      <span class="fs-n">3</span>
      <span class="fs-b"><span class="fs-t">Offer 20% for the first year</span>
        <span class="fs-s">written into the owner's Gmail, unsent</span></span>
      <span class="fs-through">61 written · ${D("step3")} unsent</span>
      <span class="fs-tag">needs you</span>
    </li>
    <li class="wait"><span>then it stops</span><span class="wait-here">${D("left")} have left · ${D("inflight")} still inside</span></li>
  </ol>
  <p class="canvas-after">${it.stopsWhen}</p>

  <h3 class="canvas-h">Did it work</h3>
  <div class="funnel">
    ${[["reached", 10], ["opened", 7], ["clicked", 4], ["replied", 3], ["converted", 2]]
      .map(
        ([k, w]) => `<div class="fn" style="flex-grow:${w}">
          <div class="fn-bar"><span style="width:${w * 10}%"></span></div>
          ${D(k)}<span class="fn-l">${SETS[k].label}</span>
        </div>`,
      )
      .join("")}
  </div>
  <div class="held">
    <div><span class="held-n">${D("converted")} of ${D("reached")}</span><span class="held-l">came back after being contacted — ${pct("converted", "reached")}</span></div>
    <div><span class="held-n quiet">5 of 94</span><span class="held-l">came back with no contact at all — 5.3%</span></div>
    <p class="held-say">${it.held.say}</p>
  </div>

  <h3 class="canvas-h">What actually works</h3>
  <div class="canvas-cols">
    <div>
      <h4 class="sub-h">Which email does the work</h4>
      <div class="table set-table" style="--set-cols:1fr 58px 62px 62px">
        <div class="row head"><span>Step</span><span>Sent</span><span>Clicked</span><span>Replied</span></div>
        <div class="row item"><span>1 · Ask what stopped them</span><span>${D("reached")}</span><span>4%</span><span>6%</span></div>
        <div class="row item hot"><span>2 · The closest case study</span><span>84</span><span>11%</span><span>9%</span></div>
        <div class="row item"><span>3 · 20% for the first year</span><span>61</span><span>7%</span><span>3%</span></div>
      </div>
      <p class="canvas-after">The case study is the only step that moves anything. The discount converts worse than the plain question — people who want a discount ask for one.</p>
    </div>
    <div>
      <h4 class="sub-h">Which accounts come back</h4>
      <div class="table set-table" style="--set-cols:1fr 74px 88px">
        <div class="row head"><span>How much of the trial they used</span><span>Accounts</span><span>Came back</span></div>
        ${["heavy", "some", "once"]
          .map(
            (b) => `<div class="row item${b === "heavy" ? " hot" : ""}">
              <span>${SETS[b].label.replace(/^\w/, (c) => c.toUpperCase())}</span>
              <span>${D(b)}</span>
              <span>${D(b + "-back", pct(b + "-back", b))}</span>
            </div>`,
          )
          .join("")}
      </div>
      <p class="canvas-after">Half the cohort never really tried the product. They are dragging the whole number down, and no email fixes that. Narrow the cohort to 5+ days and the rate is ${pct("heavy-back", "heavy")}.</p>
    </div>
  </div>

  <h3 class="canvas-h">Run by run</h3>
  <div class="table set-table runs-table" style="--set-cols:${it.runsWidths}">
    <div class="row head">${it.runsCols.map((c) => `<span>${c}</span>`).join("")}</div>
    ${it.timeline
      .map((e) =>
        e.change
          ? `<div class="row change ${e.tone || ""}">
               <span class="cl-d">${e.when}</span>
               <span class="cl-t">${e.change}</span>
             </div>`
          : `<div class="row item">${e.cells.map((c) => `<span>${c}</span>`).join("")}</div>`,
      )
      .join("")}
  </div>
  <p class="canvas-after">A change sits between the runs it separates, so the row below one is the first run after it.</p>`;

/* Opening a count: the same accounts, in a drawer. A list of who is a
   lookaside from the report, not a page you navigate to. */
CANVAS.set = (key) => {
  const rows = SETS[key].of();
  return `
    <header>
      <div>
        <h2>${rows.length} ${SETS[key].label}</h2>
        <p>Every one of them, not a sample · Win back lapsed trials</p>
      </div>
      <button class="icon-btn" type="button" data-close aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>
    <div class="drawer-body">
      <ul class="acct-list">
        ${rows
          .map(
            (a) => `<li>
              <span class="al-name">${a.name}</span>
              <span class="al-where">${a.positionLabel}</span>
              <span class="al-sub">${a.bandLabel} · ${a.what} · ${a.when}</span>
            </li>`,
          )
          .join("")}
      </ul>
    </div>`;
};


/* A BATCH OF DRAFTS — Trig has written them; a person decides which go.
   Trig does not send: the bulk action puts the chosen ones into the
   owner's Gmail, and sending happens there. Nothing here composes. */

CANVAS.drafts = (it) => `
  <div class="canvas-head">
    <div>
      <h2>${it.name}</h2>
      <p class="canvas-meta">${it.meta}</p>
    </div>
  </div>

  <div class="bulkbar" data-bulk>
    <label class="cb all"><input type="checkbox" data-all checked><span></span></label>
    <span class="bulk-count"><strong data-count>12</strong> of ${it.rows.length} selected</span>
    <span class="bulk-note">The ${it.rows.filter((r) => r.flag).length} flagged below start unticked.</span>
    <button class="btn primary" type="button" data-place>Put <span data-count2>12</span> in my Gmail</button>
  </div>

  <div class="table drafts-table">
    <div class="row head">
      <span></span><span>Deal</span><span>What fired</span><span>Who it goes to, and how it opens</span><span></span>
    </div>
    ${it.rows
      .map(
        (r, i) => `
      <div class="row item draft${r.flag ? " flagged" : ""}" data-draft="${i}">
        <label class="cb"><input type="checkbox" data-row${r.flag ? "" : " checked"}><span></span></label>
        <span class="d-deal">${r.deal}</span>
        <span class="d-fired">${r.fired}</span>
        <span class="d-who">
          <span class="d-open">${r.who} — &ldquo;${r.opens}&rdquo;</span>
          ${r.flag ? `<span class="d-flag">${r.flag}</span>` : ""}
          <span class="d-full">${r.body}</span>
        </span>
        <span class="d-act"><button class="btn sm" type="button" data-read="${i}">Read</button></span>
      </div>`,
      )
      .join("")}
  </div>

  <p class="canvas-after">${it.after}</p>`;

/* A log, in the drawer. Same rule as the report's counts: a number you
   cannot open is a claim. */
CANVAS.log = (key) => {
  const l = LOGS[key];
  return `
    <header>
      <div>
        <h2>${l.rows.length === Number(l.rows.length) ? "" : ""}${l.label.replace(/^\w/, (c) => c.toUpperCase())}</h2>
        <p>${l.meta}</p>
      </div>
      <button class="icon-btn" type="button" data-close aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>
    <div class="drawer-body">
      <div class="table set-table log-table" style="--set-cols:${l.widths}">
        <div class="row head">${l.cols.map((c) => `<span>${c}</span>`).join("")}</div>
        ${l.rows.map((r) => `<div class="row item">${r.map((c) => `<span>${c}</span>`).join("")}</div>`).join("")}
      </div>
    </div>`;
};

/* A run that produced nothing. Not a layout — a STATE any layout can be
   in, so it renders above whatever the layout would have shown.         */
CANVAS.nothing = (it) => `
  <h2>${it.name}</h2>
  <p class="canvas-meta">${it.meta}</p>
  <div class="verdict ${it.ok ? "ok" : "bad"}">${it.verdict}</div>
  <div class="canvas-body">
    <h3>What it actually looked at</h3>
    <div class="proof">
      ${it.proof
        .map(
          (p) => `<div class="proof-row">
            <span class="proof-n">${p[3] ? `<button class="door" type="button" data-log="${p[3]}">${p[0]}</button>` : p[0]}</span>
            <div><span class="proof-l">${p[1]}</span><span class="proof-s">${p[2]}</span></div>
          </div>`,
        )
        .join("")}
    </div>
    ${it.cost ? `<p class="canvas-after cost">${it.cost}</p>` : ""}
    ${it.normally ? `<p class="canvas-after">Normally this is a <strong>${it.normally}</strong>. ${it.normallyNote}</p>` : ""}
  </div>`;

/* ------------------------------------------------------------------ data */

export const RUNS = {

  /* ---- SEQUENCE — collapses to one stack -------------------------------- */

  "Prep my 1:1s": { layout: "sequence", run: "Today, 6:40 am · 1m 42s · closed", single: {
    shape: "sequence", name: "This week's customer one-to-ones",
    meta: "Five recurring calls, in the order the week happens. Built 6:40 am from what changed since you last spoke to each.",
    parts: [
      { name: "Halcyon · Ruth Ellery", when: "Mon 10:00", read: false, meta: "£142k · last spoke 22 Aug",
        leftTitle: "What changed since 22 August", rightTitle: "What to raise",
        left: ["2 ops admin seats removed on 27 August, 42 to 40. Both opened reports weekly.",
               "Reporting hasn't been opened in 5 weeks. Through July it averaged 11 views a week.",
               "Ticket 4412 has been open 9 days with no reply from us."],
        right: ["Ask who replaced the two ops admins. If nobody did, the seat drop and the reporting drop are one story.",
                "Get ahead of 4412 before they raise it.",
                "Renewal is 10 weeks out and there is still no exec sponsor named."] },
      { name: "Cobalt Systems · Marta Lind", when: "Tue 14:00", read: true, meta: "£88k · last spoke 1 Sep",
        leftTitle: "What changed since 1 September", rightTitle: "What to raise",
        left: ["Weekly active users passed 30 for the first time, up from 24 in July.",
               "Ren Kapoor added as an admin — the first new admin since March.",
               "Still no exec sponsor named, on day 34 of adoption."],
        right: ["Say the numbers back to her. This is going well and nobody has told her.",
                "Ask what Ren is going to own.",
                "Name a sponsor. It is the only thing off-pattern here."] },
      { name: "Meridian Health · Alex Renn", when: "Wed 11:00", read: true, meta: "£88k · last spoke 26 Aug",
        leftTitle: "What changed since 26 August", rightTitle: "What to raise",
        left: ["A renewal proposal has been sitting unsent for six days.",
               "Alex inherited the account in July; the previous sponsor never handed over.",
               "Ticket volume doubled in August, all from one team."],
        right: ["Send the proposal before the call or it reads as an afterthought.",
                "Ask what he inherited and what he was never told.",
                "The ticket spike is one team — find out which."] },
      { name: "Talia Foods · Jo Bergström", when: "Thu 09:30", read: true, meta: "£61k · last spoke 1 Sep",
        leftTitle: "What changed since 1 September", rightTitle: "What to raise",
        left: ["Passed 80% of seats on 1 September.",
               "Usage flat since July, which is normal for them.",
               "Renewal is 6 weeks out with no exec sponsor named."],
        right: ["The seat threshold is a conversation, not a bill.",
                "Name a sponsor. Six weeks is late but not too late.",
                "Nothing else — this is a short call."] },
      { name: "Ardent Rail · Sam Idowu", when: "Fri 15:00", read: false, meta: "£39k · last spoke 6 Aug",
        leftTitle: "What changed since 6 August", rightTitle: "What to raise",
        left: ["Sam has not opened anything in 34 days, against a 30-day line.",
               "He is the only one of seven named contacts engaged since May.",
               "Nothing has been sent — the assignment that watches this is blind."],
        right: ["Ask directly whether this is still a priority for him.",
                "Get a second name. One contact on a renewal is thin.",
                "If he has moved on, say so and we stop chasing."] },
    ] } },

  "Rank today's list before dialling": { layout: "sequence", run: "Today, 6:40 am · gone at 6 pm", single: {
    shape: "sequence", name: "Today's list, ranked",
    meta: "Looked at all 61. These 8 are worth the morning — about 65 minutes. Gone at 6 pm; a fresh one is built at 6:40 tomorrow.",
    parts: [
      { name: "1 · Halcyon", when: "12 min", read: false, meta: "£142k · renews 12 Nov",
        leftTitle: "Why it's first", rightTitle: "How to open",
        left: ["Both ops admins gone 43 days, renewal 10 weeks out.",
               "Highest value at risk on the book."],
        right: ["Ask who replaced the two admins before anything else."] },
      { name: "2 · Ferrovia", when: "10 min", read: false, meta: "£96k · renews 3 Dec",
        leftTitle: "Why it's second", rightTitle: "How to open",
        left: ["8 days from go-live and hasn't moved since 21 August.",
               "Three emails, no reply."],
        right: ["Ask what is actually blocking go-live. Nobody has said."] },
      { name: "3 · Kestrel Group", when: "8 min", read: false, meta: "£61k · renews 19 Dec",
        leftTitle: "Why it's third", rightTitle: "How to open",
        left: ["Two nudges unopened. A draft is already in Lazlo's Gmail."],
        right: ["Ring first, then send the draft. It reads better after a call."] },
    ] } },

  /* ---- GRID — collapses to one table ------------------------------------ */

  "Confirm exec sponsor involvement before renewal": { layout: "grid", run: "Monday 8 Sep, 6:40 am", single: {
    shape: "grid", name: "Where we have no exec sponsor before renewal",
    meta: "Rebuilt every Monday · nothing saved, no new object created · +2 in, −1 out this week",
    widths: "150px 88px 1fr 300px",
    collapseNote: true,
    cols: ["Account", "Renews", "Who we hear from", "What that leaves them without"],
    rows: [
      ["Halcyon", "12 Nov", "Ruth Ellery only", "No exec sponsor, 96 days into a stage that clears in 45"],
      ["Ferrovia", "3 Dec", "Marc Oyelaran only", "6 contacts in HubSpot, 1 has ever replied to anything"],
      ["Kestrel Group", "19 Dec", "Jo Bergström only", "Both admins left on 12 August, neither replaced since"],
      ["Talia Foods", "14 Jan", "Priya Shah only", "Sponsor named in March, gone in June, nobody named since"],
      ["Ardent Rail", "2 Feb", "Sam Idowu only", "7 named contacts, only Sam has opened anything since May"],
      ["Lowen & Bray", "20 Feb", "Nina Cardoso only", "No sponsor 5 months out; the last 2 that renewed had one by now"],
      ["Pike & Rowe", "3 Mar", "Ben Achebe only", "2 contacts in total, against a median of 5 for accounts this size"],
    ],
    judgement: "A judgement I made: someone counts as a live contact only if they have replied in the last 90 days. HubSpot lists 4 more at Halcyon; none has ever answered, so I left them out. Count them and this drops to 3." } },

  "Book meetings with the people we're missing": { layout: "drafts", run: "Today, 6:41 am · 14 drafted", noun: "Deals",
    single: {
      shape: "drafts",
      name: "Meeting asks waiting on you",
      meta: "Today, 6:41 am · 14 signals fired and 14 asks were written · 12 routine, 2 I would read first",
      rows: [
        { deal: "Brightsea", fired: "Funding round", who: "Ana Rehn, VP Ops", opens: "Congratulations on the Series B — usually means the ops team is about to double.", flag: null, body: "Congratulations on the Series B — usually means the ops team is about to double. If that's on the cards, worth 20 minutes on what you already have set up before you add people to it?" },
        { deal: "Corvus", fired: "Job change", who: "Marta Lind, Head of Data", opens: "Saw you've moved into the data role. Worth 20 minutes?", flag: null, body: "Saw you've moved into the data role — congratulations. Your team already runs us for reporting; happy to walk you through what's there so you're not inheriting it blind." },
        { deal: "Pike &amp; Rowe", fired: "Hired a role", who: "Ben Achebe, CTO", opens: "You're hiring two analytics engineers.", flag: null, body: "You're hiring two analytics engineers. When they land they'll ask the same three questions everyone does — happy to save you that conversation." },
        { deal: "Ardent Rail", fired: "Funding round", who: "Sam Idowu, COO", opens: "Congratulations on the raise.", flag: null, body: "Congratulations on the raise. The scaling question usually lands about now — happy to share what similar teams did at this point." },
        { deal: "Talia Foods", fired: "Usage threshold", who: "Jo Bergstr&ouml;m, admin", opens: "You've passed 80% of your seats.", flag: null, body: "You've passed 80% of your seats this month. Nothing breaks at 100%, but it's worth knowing before it does." },
        { deal: "Meridian Health", fired: "Job change", who: "Alex Renn, Director", opens: "You've picked up the account — happy to catch you up.", flag: null, body: "I gather you've picked up this from Dana. Happy to spend 20 minutes catching you up on what was agreed rather than let you find it in a folder." },
        { deal: "Northwind Rail", fired: "Hired a role", who: "Tom Verity, Head of Ops", opens: "You're hiring three ops analysts.", flag: null, body: "You're hiring three ops analysts. Onboarding them onto what you already run is usually the bit that slips — happy to help you plan it." },
        { deal: "Bevan &amp; Co", fired: "Funding round", who: "Ruth Ellery, CFO", opens: "Congratulations on the round.", flag: null, body: "Congratulations on the round. Worth a short conversation about what changes on your side before it does." },
        { deal: "Trellis", fired: "Usage threshold", who: "Nina Okafor, admin", opens: "You've passed 80% of your seats.", flag: null, body: "You've passed 80% of your seats. Worth a look at how they're being used before you buy more." },
        { deal: "Oakhampton", fired: "Job change", who: "Sam Bright, VP Revenue", opens: "Congratulations on the new role.", flag: null, body: "Congratulations on the new role. We work with your team already — happy to give you the two-minute version." },
        { deal: "Redwing", fired: "Hired a role", who: "Cara Milne, Head of RevOps", opens: "You're hiring a RevOps lead.", flag: null, body: "You're hiring a RevOps lead. Happy to share what the last three teams did in their first month, if it saves you a decision." },
        { deal: "Fenwick", fired: "Funding round", who: "Alan Reddy, COO", opens: "Congratulations on the Series A.", flag: null, body: "Congratulations on the Series A. The ops question arrives about six weeks after the money does — happy to get ahead of it." },
        { deal: "Lowen &amp; Bray", fired: "Job change", who: "Nina Cardoso, VP", opens: "Noticed you've moved to Lowen &amp; Bray — we worked together at Corvus.", flag: "She said &ldquo;not now, try me in the new year&rdquo; on 19 August. This would be the second approach in three weeks.", body: "Noticed you've moved to Lowen &amp; Bray — we worked together at Corvus. Happy to pick that up whenever it's useful." },
        { deal: "Kestrel Group", fired: "Funding round", who: "Jo Bergstr&ouml;m, CFO", opens: "Congratulations on the round — worth revisiting the platform conversation?", flag: "Kestrel is mid-renewal and Lazlo calls them on Thursday. This would arrive first.", body: "Congratulations on the round — worth revisiting the platform conversation now the budget question has changed?" }
      ],
      after: "Trig wrote these; it does not send them. Putting them in your Gmail leaves 12 drafts in your drafts folder addressed and ready — you send, edit or bin them there, and Trig sees which ones went.",
    } },

  "Log every touch, contact and outcome": { layout: "grid", run: "Continuous · 412 writes today", single: {
    shape: "nothing", name: "Log every touch, contact and outcome",
    meta: "Continuous since 4 March · 41,000 writes this quarter",
    ok: true,
    verdict: "It produces nothing you read, and that is the point of it. Here is what it did instead.",
    proof: [["412", "records written today", "calls, emails, meetings and outcomes"],
            ["41,000", "this quarter", "against 38,200 last quarter"],
            ["3", "writes rejected", "all three Salesforce, same required field — it's in Needs you"],
            ["0", "people opened its output", "there is no output to open"]],
    cost: null,
    normally: "grid",
    normallyNote: "The log itself is a table you can open, but nobody does — and nobody should have to." } },

  /* ---- BATCH — column 2 stays -------------------------------------------- */

  "Chase quiet champions": { layout: "batch", run: "Today, 6:40 am · 3s · produced nothing", single: {
    shape: "nothing", name: "Chase quiet champions",
    meta: "Live since 19 June · every weekday, 6:40 am · ran today in 3 seconds",
    ok: false,
    verdict: "Nothing today, and that's wrong. It hasn't been able to read HubSpot since 29 August, so it has found nothing for 40 runs.",
    proof: [["0", "champions checked", "it couldn't list them — 18 the last time it could", "invisible"],
            ["0", "activity records read", "against 412 on 28 August, the last good run"],
            ["40", "runs that found nothing", "28 August was the last one that could look at anything", "blind"],
            ["3s", "today's run", "a normal run takes 41 seconds, because there is something to read"]],
    cost: "Reading the history now the gap is known: 3 champions crossed 30 days quiet while it was blind. Sam Idowu at Ardent Rail is on day 41. Nobody was told.",
    normally: "batch",
    normallyNote: "One nudge per champion, worked through one at a time. There would be 18 in the column beside this." } },

  "Win back lapsed trials": { layout: "batch", run: "Tuesday 2 Sep, 6:40 am · 12 touched", noun: "Accounts",
    single: {
      shape: "report",
      name: "Win back lapsed trials",
      verdict: "Not moving.",
      verdictLine: "7 of 96 came back, against 5 of 94 we deliberately left alone. That is inside the noise — the emails are fine, the cohort is wrong.",
      meta: "Live since 21 July · every Tuesday, 6:40 am · 8 runs · cohort emptied on 5 September",
      defs: [
        { h: "A lapsed trial is",
          p: "A trial that <strong>ended without converting</strong>, inside the last <strong>6 months</strong>, with no active subscription and no open opportunity. 96 accounts fitted that on 2 September.",
          where: "Set in the cohort, not here — and it was narrowed to 6 weeks on 5 September, which took it to 0." },
        { h: "Winning back is",
          p: "Three emails over four weeks from the account owner's own address, ending in a discount offer that <strong>a person has to approve</strong>. No calls, no in-product message, no third-party sequence.",
          where: "Set in the steps, not here." },
      ],
      steps: [
        { n: "T", t: "The trial ended 30 days ago and nothing converted", s: "checked every Tuesday against the cohort", through: "96 entered", tag: "trigger", kind: "trigger" },
        { wait: "straight away" },
        { n: "1", t: "Ask what stopped them", s: "a plain question — no pitch, no link, no offer", through: "96 sent · 6 replied", tag: "sends itself", kind: "send" },
        { wait: "then 14 days, if no reply", here: "4 sitting here now" },
        { n: "2", t: "Send the case study closest to their use case", s: "picked from what they actually used during the trial", through: "84 sent · 9 replied", tag: "sends itself", kind: "send" },
        { wait: "then 14 days, if no reply", here: "8 sitting here now" },
        { n: "3", t: "Offer 20% for the first year", s: "written into the owner's Gmail, unsent", through: "61 written · 12 unsent", tag: "needs you", kind: "needs" },
        { wait: "then it stops", here: "72 have left · 24 are still inside" },
      ],
      stopsWhen: "It stops when they reply, when they convert, or when step 3 has been written — never a fourth time, and never a discount without a person seeing it first. <strong>The 24 accounts still inside were removed from the cohort on 5 September, mid-sequence, and nobody was told.</strong>",
      funnel: [["96", "reached", 10], ["41", "opened", 7], ["18", "clicked", 4], ["12", "replied", 3], ["7", "converted", 2]],
      held: {
        treated: "7 of 96", treatedL: "converted after being contacted — 7.3%",
        control: "5 of 94", controlL: "converted with no contact at all — 5.3%",
        say: "Two extra customers over eight weeks, and the gap is not big enough to be sure it came from the emails. This is the only number the assignment has to move, and it hasn't.",
      },
      insight: [
        { h: "Which email does the work",
          widths: "1fr 58px 62px 62px",
          cols: ["Step", "Sent", "Clicked", "Replied"],
          rows: [
            { c: ["1 · Ask what stopped them", "96", "4%", "6%"] },
            { c: ["2 · The closest case study", "84", "11%", "9%"], hot: 1 },
            { c: ["3 · 20% for the first year", "61", "7%", "3%"] },
          ],
          note: "The case study is the only step that moves anything. The discount converts worse than the plain question — people who want a discount ask for one." },
        { h: "Which accounts come back",
          widths: "1fr 74px 74px",
          cols: ["How much of the trial they used", "Accounts", "Came back"],
          rows: [
            { c: ["Used it on 5+ days", "18", "19%"], hot: 1 },
            { c: ["Used it on 2–4 days", "27", "7%"] },
            { c: ["Signed up, opened it once", "51", "2%"] },
          ],
          note: "Half the cohort never really tried the product. They are dragging the whole number down, and no email fixes that. Narrow the cohort to 5+ days and the rate is 19%." },
      ],
      runsWidths: "116px 68px 62px 54px 60px 68px 1fr",
      runsCols: ["Run", "In cohort", "Touched", "Sent", "Clicked", "Came back", "Outcome"],
      timeline: [
        { cells: ["9 Sep 6:40 am", "0", "0", "0", "\u2014", "0", "nothing to run on"] },
        { when: "5 Sep", tone: "bad", change: "Someone narrowed the cohort from 6 months to 6 weeks. 96 accounts became 0, and 24 of them were mid-sequence." },
        { cells: ["2 Sep 6:40 am", "96", "12", "12", "2", "1", "1 came back, 11 still out"] },
        { cells: ["26 Aug 6:40 am", "94", "14", "14", "3", "2", "2 came back"] },
        { when: "19 Aug", tone: "good", change: "Step 2 changed from a generic case study to the one closest to their trial usage. Clicks went 5% to 11% from the next run on." },
        { cells: ["19 Aug 6:40 am", "91", "17", "17", "2", "1", "1 came back"] },
        { cells: ["12 Aug 6:40 am", "88", "21", "21", "4", "2", "2 came back"] },
        { cells: ["5 Aug 6:40 am", "84", "19", "19", "3", "1", "1 came back"] },
        { when: "4 Aug", change: "Discount raised from 15% to 20%. No change in conversion either way." },
        { when: "21 Jul", change: "Turned on by Marcus Ade, with 94 accounts held back on purpose." },
      ],
    },
  },

  /* ---- SINGLE ARTEFACT — column 2 stays ---------------------------------- */

  "Draft proposals against our pricing": { layout: "artefact", run: "Today, 6:41 am · wrote 3", noun: "Deals",
    groups: [
      { label: "3 finished, not sent", items: [
        { id: "p1", name: "Ferrovia — expansion proposal", sub: "£140k · Proposal", shape: "document",
          version: "v2", status: "You haven't sent it",
          meta: "A 4-page proposal taking Ferrovia from £96k to £140k, finished at 6:41 am today. Two pricing lines are outside your standard discount — flagged, not changed.",
          doc: { brand: "Northwind", title: "Expansion proposal", pages: 4,
            sub: "Ferrovia · prepared for Marc Oyelaran · 8 September 2026",
            sections: [
              { h: "Where you are today", p: "You bought 40 seats in March across two teams. 34 are in weekly use, and the operations team has been at capacity since June — four people are sharing a single admin login, which is what has been slowing the month-end close." },
              { h: "What we're proposing", lines: [["Platform seats, 40 &rarr; 60", "£84,000", 1], ["Advanced reporting, 20 seats", "£28,000", 0], ["Second environment for staging", "£18,000", 0], ["Implementation, 6 weeks", "£10,000", 0], ["Year one total", "£140,000", 1], ["Against your current £96,000", "+£44,000", 0]] },
              { h: "Why now", p: "Your renewal is 3 December. Committing before 31 October holds the current book rate for 24 months rather than 12, which is worth about £9,400 over the term at the uplift we applied last year." },
              { h: "What happens if you don't", p: "Nothing breaks. The operations team keeps sharing a login and month-end keeps taking three days instead of one. We'd expect the same conversation in February, at February's rates." },
            ] },
          from: [["Draft proposals against our pricing", "the assignment · run today, 6:41 am"],
                 ["Pricing book v4", "current since 1 August — v3 was in force when v1 went out"],
                 ["Ferrovia's usage, last 90 days", "34 of 40 seats weekly, ops at capacity since June"],
                 ["The proposal you sent in March", "reused its structure, not its numbers"],
                 ["HubSpot deal — £96k to £140k", "stage: proposal · closes 3 December"]],
          checked: [["ok", "Every line priced from the current book", "4 lines, all matched"],
                    ["warn", "Two lines are outside standard discount", "22% and 25% against a 20% cap. Flagged for you, not changed."],
                    ["ok", "Renewal date matches HubSpot", "3 December, both places"]],
          versions: [["v2", "Finished today at 6:41 am", "Rebuilt because pricing book v4 landed on 1 August", 1],
                     ["v1", "Sent to Marc Oyelaran on 4 September", "Replaced 6 September. Still in your sent mail.", 0]] },

        { id: "p2", name: "Meridian Health — renewal proposal", sub: "£88k · Negotiation", shape: "document",
          version: "v1", status: "You haven't sent it",
          meta: "A 3-page flat renewal, finished 3 September. It has been with you six days.",
          doc: { brand: "Northwind", title: "Renewal proposal", pages: 3,
            sub: "Meridian Health · prepared for Alex Renn · 3 September 2026",
            sections: [
              { h: "Where you are today", p: "You have run 30 seats since 2024 and 22 are in weekly use. Usage has been flat for four quarters, and the team that drove adoption moved on in July." },
              { h: "What we're proposing", lines: [["Platform seats, 30, unchanged", "£88,000", 1], ["Year one total", "£88,000", 1], ["Against your current £88,000", "no change", 0]] },
              { h: "Why no uplift", p: "Their usage does not support one. Asking for more against flat adoption is the conversation that loses a renewal rather than the one that wins it." },
            ] },
          from: [["Draft proposals against our pricing", "the assignment · run 3 September, 6:41 am"],
                 ["Pricing book v4", "current since 1 August"],
                 ["Two years of usage", "flat at 22 of 30 seats"],
                 ["The original contract", "signed 14 May 2024"]],
          checked: [["ok", "Priced from the current book", "1 line, matched"],
                    ["ok", "No uplift applied", "their usage does not support one"]],
          versions: [["v1", "Finished 3 September at 6:41 am", "Not sent — it has been with you six days", 1]] } ] },

      { label: "1 sent", items: [
        { id: "p3", name: "Corvus — upsell proposal", sub: "£46k · sent 4 Sep", shape: "document",
          version: "v1", status: "Sent 4 September",
          meta: "A 3-page upsell taking Corvus from £74k to £120k. Opened twice, no reply yet.",
          doc: { brand: "Northwind", title: "Upsell proposal", pages: 3,
            sub: "Corvus · prepared for Marta Lind · 4 September 2026",
            sections: [
              { h: "Where you are today", p: "23 of 24 seats are in weekly use and have been for three weeks. Four people in finance started using the product on 28 August, on seats that were sold to operations." },
              { h: "What we're proposing", lines: [["Platform seats, 24 &rarr; 40", "£96,000", 1], ["Finance module, 8 seats", "£24,000", 0], ["Year one total", "£120,000", 1], ["Against your current £74,000", "+£46,000", 0]] },
              { h: "Why now", p: "You are one seat from a hard stop, six months before renewal. Waiting turns a growth conversation into a bill conversation." },
            ] },
          from: [["Draft proposals against our pricing", "the assignment · run 4 September, 6:41 am"],
                 ["Pricing book v4", "current since 1 August"],
                 ["The finance team's usage since 28 August", "4 people, daily"]],
          checked: [["ok", "All lines inside the discount cap", "2 lines, both matched"]],
          versions: [["v1", "Sent to Marta Lind on 4 September", "Opened twice. No reply yet.", 1]] } ] },

      { label: "2 skipped, on purpose", items: [
        { id: "p4", name: "Talia Foods — renewal", sub: "too early, no pricing agreed", shape: "batch",
          meta: "Skipped 6:41 am",
          why: ["No pricing has been agreed, so there is nothing to price against."],
          did: ["Skipped it and said so rather than write a proposal from guesses."] } ] },
    ] },

  "Publish the weekly revenue pack": { layout: "artefact", run: "Friday 5 Sep, 5:00 pm", noun: "Editions",
    groups: [
      { label: "11 published", items: [
        { id: "r1", name: "Weekly revenue pack", sub: "week 36 · opened by 6 of 7", shape: "document",
          version: "wk 36", status: "Published Friday, 5:00 pm",
          meta: "Nine pages of team forecast, pipeline movement and at-risk renewals. Opened by 6 of 7 before Monday.",
          doc: { brand: "Northwind", title: "Weekly revenue pack", pages: 9,
            sub: "Week 36 · published Friday 5 September, 5:00 pm",
            sections: [
              { h: "The number", lines: [["Committed this quarter", "£1,840,000", 1], ["Against last Friday", "&minus;£42,000", 0], ["Coverage against target", "2.4&times;", 0]] },
              { h: "What moved", p: "Two deals left commit without a note against either. Lazlo's forecast dropped £42k in one week, which is the whole of the movement — everybody else was flat." },
              { h: "What to ask on Monday", p: "Ferrovia and Meridian both went quiet in the same fortnight, both at proposal stage. That is either a coincidence or a pattern, and nobody has established which." },
            ] },
          from: [["Publish the weekly revenue pack", "the assignment · run Friday, 5:00 pm"],
                 ["HubSpot pipeline at 4:55 pm Friday", "the snapshot the pack is built on"],
                 ["Every rep's committed number", "5 commits, all in before 4 pm"],
                 ["The last 11 editions", "for the week-on-week deltas"]],
          checked: [["ok", "Team total reconciles against rep commits", "£1,840,000, both ways"],
                    ["warn", "Two deals moved category without a note", "flagged in the pack, not corrected"]],
          versions: [["wk 36", "Published Friday at 5:00 pm", "Opened by 6 of 7 before Monday", 1],
                     ["wk 35", "Published 29 August", "Opened by 7 of 7", 0]] } ] },
    ] },

};

export { CANVAS };
