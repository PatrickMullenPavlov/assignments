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
  <div class="collapse-note">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    This run made <strong>one thing</strong>, and it is about all ${it.rows.length} at once. There is nothing to pick between, so the subject column steps out of the way.
  </div>
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

CANVAS.report = (it) => `
  <div class="canvas-head">
    <div>
      <h2>${it.name}</h2>
      <p class="canvas-verdict"><strong>${it.verdict}</strong> ${it.verdictLine}</p>
      <p class="canvas-meta">${it.meta}</p>
    </div>
    <div class="canvas-actions tight">
      <button class="btn" type="button">Edit</button>
      <button class="btn" type="button">Pause it</button>
    </div>
  </div>

  <div class="def-strip">
    ${it.defs
      .map(
        (d) => `<div class="def">
          <h3>${d.h}</h3>
          <p>${d.p}</p>
          <span class="def-where">${d.where}</span>
        </div>`,
      )
      .join("")}
  </div>

  <h3 class="canvas-h">The work, and who is standing where</h3>
  <ol class="flowsteps">
    ${it.steps
      .map(
        (st) =>
          st.wait
            ? `<li class="wait"><span>${st.wait}</span>${st.here ? `<span class="wait-here">${st.here}</span>` : ""}</li>`
            : `<li class="${st.kind}">
                 <span class="fs-n">${st.n}</span>
                 <span class="fs-b">
                   <span class="fs-t">${st.t}</span>
                   <span class="fs-s">${st.s}</span>
                 </span>
                 <span class="fs-through">${st.through}</span>
                 <span class="fs-tag">${st.tag}</span>
               </li>`,
      )
      .join("")}
  </ol>
  <p class="canvas-after">${it.stopsWhen}</p>

  <h3 class="canvas-h">Did it work</h3>
  <div class="funnel">
    ${it.funnel
      .map(
        (f, i) =>
          `<div class="fn" style="flex-grow:${f[2]}">
             <div class="fn-bar"><span style="width:${f[2] * 10}%"></span></div>
             <span class="fn-n">${f[0]}</span>
             <span class="fn-l">${f[1]}</span>
           </div>`,
      )
      .join("")}
  </div>
  <div class="held">
    <div><span class="held-n">${it.held.treated}</span><span class="held-l">${it.held.treatedL}</span></div>
    <div><span class="held-n quiet">${it.held.control}</span><span class="held-l">${it.held.controlL}</span></div>
    <p class="held-say">${it.held.say}</p>
  </div>

  <h3 class="canvas-h">What actually works</h3>
  <div class="canvas-cols">
    ${it.insight
      .map(
        (t) => `<div>
          <h4 class="sub-h">${t.h}</h4>
          <div class="table set-table" style="--set-cols:${t.widths}">
            <div class="row head">${t.cols.map((c) => `<span>${c}</span>`).join("")}</div>
            ${t.rows.map((r) => `<div class="row item${r.hot ? " hot" : ""}">${r.c.map((c) => `<span>${c}</span>`).join("")}</div>`).join("")}
          </div>
          <p class="canvas-after">${t.note}</p>
        </div>`,
      )
      .join("")}
  </div>

  <h3 class="canvas-h">Run by run</h3>
  <div class="canvas-cols runs">
    <div>
      <div class="table set-table" style="--set-cols:${it.runsWidths}">
        <div class="row head">${it.runsCols.map((c) => `<span>${c}</span>`).join("")}</div>
        ${it.runs.map((r) => `<div class="row item">${r.map((c) => `<span>${c}</span>`).join("")}</div>`).join("")}
      </div>
    </div>
    <div>
      <h4 class="sub-h">What changed, and when</h4>
      <ul class="changelog">
        ${it.changes.map((c) => `<li class="${c[2] || ""}"><span class="cl-d">${c[0]}</span><span>${c[1]}</span></li>`).join("")}
      </ul>
    </div>
  </div>`;

/* A run that produced nothing. Not a layout — a STATE any layout can be
   in, so it renders above whatever the layout would have shown.         */
CANVAS.nothing = (it) => `
  <h2>${it.name}</h2>
  <p class="canvas-meta">${it.meta}</p>
  <div class="verdict ${it.ok ? "ok" : "bad"}">${it.verdict}</div>
  <div class="canvas-body">
    <h3>What it actually looked at</h3>
    <div class="proof">
      ${it.proof.map((p) => `<div class="proof-row"><span class="proof-n">${p[0]}</span><div><span class="proof-l">${p[1]}</span><span class="proof-s">${p[2]}</span></div></div>`).join("")}
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

  "Book meetings with the people we're missing": { layout: "grid", run: "Today, 6:41 am · 14 waiting", single: {
    shape: "grid", name: "Meeting asks waiting on you",
    meta: "Today, 6:41 am · 14 drafted, 12 routine and 2 I would read first",
    bulk: "<strong>12 selected</strong> — the routine ones. The 2 flagged below are unticked. <button class=\"btn primary sm\" type=\"button\">Send these 12</button><button class=\"btn sm\" type=\"button\">Select all 14</button>",
    widths: "146px 132px 1fr 128px",
    cols: ["Deal", "What fired", "Who it goes to, and how it opens", ""],
    rows: [
      ["Brightsea", "Funding round", "Ana Rehn, VP Ops — “Congratulations on the Series B — usually means the ops team is about to double.”", "Send"],
      ["Corvus", "Job change", "Marta Lind, Head of Data — “Saw you've moved into the data role. Worth 20 minutes?”", "Send"],
      ["Pike &amp; Rowe", "Hired a role", "Ben Achebe, CTO — “You're hiring two analytics engineers.”", "Send"],
      ["Ardent Rail", "Funding round", "Sam Idowu, COO — “Congratulations on the raise.”", "Send"],
      ["Talia Foods", "Usage threshold", "Jo Bergström, admin — “You've passed 80% of your seats.”", "Send"],
      ["Lowen &amp; Bray", "Job change", "Nina Cardoso — she said “not now, try me in the new year” on 19 August. Second approach in three weeks.", "Read it"],
      ["Kestrel Group", "Funding round", "Jo Bergström, CFO — mid-renewal, and Lazlo calls them Thursday. This would arrive first.", "Read it"],
    ],
    judgement: "Sending is the only thing that happens here. “Read it” takes an item out of this list and into your Gmail drafts, and Trig stops chasing it." } },

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
    proof: [["0", "champions checked", "it couldn't list them — 18 the last time it could"],
            ["0", "activity records read", "against 412 on 28 August, the last good run"],
            ["40", "runs that found nothing", "28 August was the last one that could look at anything"],
            ["3s", "today's run", "a normal run takes 41 seconds, because there is something to read"]],
    cost: "Reading the history now the gap is known: 3 champions crossed 30 days quiet while it was blind. Sam Idowu at Ardent Rail is on day 41. Nobody was told.",
    normally: "batch",
    normallyNote: "One nudge per champion, worked through one at a time. There would be 18 in the column beside this." } },

  "Win back lapsed trials": { layout: "batch", run: "Tuesday 2 Sep, 6:40 am · 12 touched", noun: "Accounts",
    report: {
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
      runsWidths: "112px 66px 62px 54px 58px 66px 1fr",
      runsCols: ["Run", "In cohort", "Touched", "Sent", "Clicked", "Came back", "Outcome"],
      runs: [
        ["9 Sep 6:40 am", "0", "0", "0", "—", "0", "cohort empty since the rule changed"],
        ["2 Sep 6:40 am", "96", "12", "12", "2", "1", "1 converted, 11 still out"],
        ["26 Aug 6:40 am", "94", "14", "14", "3", "2", "2 converted"],
        ["19 Aug 6:40 am", "91", "17", "17", "2", "1", "1 converted"],
        ["12 Aug 6:40 am", "88", "21", "21", "4", "2", "2 converted"],
        ["5 Aug 6:40 am", "84", "19", "19", "3", "1", "1 converted"],
      ],
      changes: [
        ["5 Sep", "Someone narrowed the cohort from 6 months to 6 weeks. 96 accounts became 0, and nobody was told.", "bad"],
        ["19 Aug", "Step 2 changed from a generic case study to the one closest to their trial usage. Clicks went 5% to 11%.", "good"],
        ["4 Aug", "Discount raised from 15% to 20%. No change in conversion either way."],
        ["21 Jul", "Turned on by Marcus Ade, with 94 accounts held back on purpose."],
      ],
    },
    groups: [
      { label: "Waiting after step 1 · 4", items: [
        { id: "a1", name: "Bevan &amp; Co", sub: "asked 2 Sep · 9 days in the wait", shape: "batch",
          meta: "In the 14-day wait after step 1 · opened it, did not reply",
          why: ["Trial ended 4 August. Used the product on 6 days.", "Opened step 1 twice but has not answered."],
          did: ["Step 1 sent 2 September. Opened 2 September and again on the 4th.", "Step 2 is due on 16 September unless they reply first."] },
        { id: "a2", name: "Kestrel Labs", sub: "asked 2 Sep · 9 days in the wait", shape: "batch",
          meta: "In the 14-day wait after step 1 · not opened",
          why: ["Trial ended 29 July. Signed up and opened it once.", "In the half of the cohort that comes back 2% of the time."],
          did: ["Step 1 sent 2 September. Not opened.", "Step 2 is due on 16 September."] } ] },

      { label: "Waiting after step 2 · 8", items: [
        { id: "a3", name: "Marchmont", sub: "case study sent 2 Sep · not opened", shape: "batch",
          meta: "In the 14-day wait after step 2 · neither email opened",
          why: ["Trial ended 2 May. Signed up, opened it once, never came back.", "Two emails sent, neither opened."],
          did: ["Step 1 on 19 August. Not opened.", "Step 2 on 2 September with the reporting case study. Not opened.", "Step 3 is the discount, and it is due on 16 September."] },
        { id: "a4", name: "Trellis", sub: "case study sent 26 Aug · clicked", shape: "batch",
          meta: "In the 14-day wait after step 2 · clicked, did not reply",
          why: ["Trial ended 11 June. Used it on 7 days — the top third of the cohort.", "Clicked the case study on 27 August and read it for four minutes."],
          did: ["Step 1 on 12 August. Opened, no reply.", "Step 2 on 26 August. Clicked the next day, no reply since.", "Step 3 is due on 9 September. It is worth reaching them first."] } ] },

      { label: "At step 3, waiting on you · 12", tone: "warn", items: [
        { id: "a5", name: "Redwing", sub: "discount written 2 Sep · unsent", shape: "batch",
          meta: "Step 3 · in Kish's Gmail, unsent for 9 days",
          why: ["Trial ended 21 June. Used it on 11 days, the heaviest user in the cohort.", "Replied to nothing, but opened every email."],
          did: ["Steps 1 and 2 sent. Both opened, no reply.", "A 20% offer was written into Kish's Gmail on 2 September and has not been sent."] },
        { id: "a6", name: "Cassidy Group", sub: "discount written 26 Aug · unsent", shape: "batch",
          meta: "Step 3 · in Mia's Gmail, unsent for 16 days",
          why: ["Trial ended 3 May. Used it on 5 days.", "Asked about pricing during the trial and never got an answer."],
          did: ["Steps 1 and 2 sent. Step 1 opened.", "A 20% offer was written on 26 August. It has been sitting for over a fortnight."] } ] },

      { label: "Left — came back · 7", items: [
        { id: "a7", name: "Orvis", sub: "converted 3 Sep", shape: "batch",
          meta: "Left the machine on 3 September · converted",
          why: ["Trial ended 14 June. Used the product on 9 separate days.", "Opened the pricing page twice in August."],
          did: ["Step 1 on 19 August. Opened, no reply.", "Step 2 on 2 September with the reporting case study. Replied the next day asking about seats.", "Left the sequence at step 2. No discount was ever offered."] },
        { id: "a8", name: "Fenwick", sub: "converted 21 Aug", shape: "batch",
          meta: "Left the machine on 21 August · converted",
          why: ["Trial ended 30 April. Used it on 8 days."],
          did: ["Step 1 on 5 August. Replied within the hour.", "Left at step 1. The other two steps never ran."] } ] },

      { label: "Left — replied, didn't buy · 5", items: [
        { id: "a11", name: "Halverson", sub: "replied 14 Aug · said no", shape: "batch",
          meta: "Left the machine on 14 August · answered, and the answer was no",
          why: ["Trial ended 2 June. Used it on 6 days.", "Replied to step 1 within a day."],
          did: ["Step 1 on 12 August. Replied 14 August: they had bought something else in May.", "Left at step 1. No case study, no discount — there was nothing to win back."] } ] },

      { label: "Left — went silent · 60", items: [
        { id: "a9", name: "Pentworth", sub: "all three steps, no open", shape: "batch",
          meta: "Left the machine on 1 September · nothing was opened",
          why: ["Trial ended 12 March. Signed up, opened it once, never returned.", "Three emails, no open, no click, no reply."],
          did: ["Steps 1, 2 and 3 all sent. Nothing was opened.", "Stopped after step 3. It will not try again."] } ] },

    ] },

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
