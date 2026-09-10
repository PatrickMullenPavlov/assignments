import { ACCOUNTS, SETS, count, pct } from "./cohort.js";
import { LOGS, BLIND_RUNS, WRITELOG } from "./logs.js";
import { RENEWALS, TOTAL, INSIDE_90, FALLING, money } from "./renewals.js";
import { CHAMPIONS, SET, byKind, arm, armBack, rate, KIND_KEYS, KIND, WATCHED } from "./champions.js";

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

/* CALL PACKS — a sequence of prep for recurring customer calls.
   Its own shape rather than a second use of `sequence`, which belongs to
   the ranked dialling list. Sharing one renderer between two different
   things is how the drafts screen ended up wearing a grid's copy. */

const DIR = { up: "up", down: "down", flat: "flat" };

CANVAS.packs = (it) => `
  <h2>${it.name}</h2>
  <p class="canvas-meta">${it.meta}</p>
  <div class="seq-index">
    ${it.parts
      .map(
        (p) => `<span class="seq-chip"><span class="d${p.read ? " read" : ""}"></span>${p.account}<em>${p.when}</em></span>`,
      )
      .join("")}
  </div>

  <div class="canvas-body wide">
    ${it.parts
      .map(
        (p) => `
      <article class="pack">
        <header>
          <span class="seq-when">${p.when}</span>
          <span class="seq-name">${p.account}</span>
          <span class="pack-person">${p.person}</span>
          <span class="seq-meta">${p.money} · renews ${p.renews} · last spoke ${p.lastSpoke}</span>
          <span class="seq-state">${p.read ? "Read" : "Not opened"}</span>
        </header>

        ${p.waiting ? `<p class="pack-waiting">${p.waiting}</p>` : ""}

        <div class="pack-grid">
          <section>
            <h3>What moved since ${p.lastSpoke}</h3>
            <ul class="moved">
              ${p.changed
                .map(
                  (c) => `<li class="${c.dir}">
                    <span class="mv-d">${c.date}</span>
                    <span class="mv-t">${c.text}</span>
                  </li>`,
                )
                .join("")}
            </ul>
          </section>

          <section>
            <h3>What you said you'd do</h3>
            <ul class="promises">
              ${p.promises
                .map(
                  (q) => `<li class="${q.state}"><span class="pr-s">${
                    q.state === "missed" ? "not done" : q.state === "done" ? "done" : "open"
                  }</span><span>${q.text}</span></li>`,
                )
                .join("")}
            </ul>
            ${
              p.asked.length
                ? `<h3>What they asked for</h3>
                   <ul class="promises">
                     ${p.asked.map((q) => `<li class="${q.state}"><span class="pr-s">${q.state === "missed" ? "unanswered" : "open"}</span><span>${q.text}</span></li>`).join("")}
                   </ul>`
                : ""
            }
          </section>

          <section class="pack-who">
            <h3>On the call</h3>
            ${p.people
              .filter((x) => x.onCall)
              .map((x) => `<div class="who"><span class="who-n">${x.name}</span><span class="who-r">${x.role}</span><span class="who-s">${x.note}</span></div>`)
              .join("")}
            <h3>Not on it, and matters</h3>
            ${p.people
              .filter((x) => !x.onCall)
              .map((x) => `<div class="who quiet"><span class="who-n">${x.name}</span><span class="who-r">${x.role}</span><span class="who-s">${x.note}</span></div>`)
              .join("")}
          </section>
        </div>

        <div class="pack-agenda">
          <section>
            <h3>What to raise</h3>
            <ol class="agenda">
              ${p.raise.map((r) => `<li><span class="ag-w">${r.what}</span><span class="ag-y">${r.why}</span></li>`).join("")}
            </ol>
          </section>
          <section>
            <h3>Leave it</h3>
            <p class="pack-leave">${p.leave}</p>
          </section>
        </div>
      </article>`,
      )
      .join("")}
  </div>`;

/* CHASE QUIET CHAMPIONS — the subject is a person, and "quiet" is four
   different things. The outage is a banner on top of the report, not the
   report itself: this has been live since June and most of what it knows
   was learned before it went blind. */

const chasedBack = () => CHAMPIONS.filter((c) => c.chased && c.returned);
const aloneBack = () => CHAMPIONS.filter((c) => !c.chased && c.returned);

CANVAS.chase = () => `
  <div class="canvas-head">
    <div>
      <h2>Chase quiet champions</h2>
      <p class="canvas-verdict"><strong>Stuck, and misjudged.</strong> It has been blind for ${BLIND_RUNS} runs — but the three months before that say it works, for one of the four reasons a champion goes quiet.</p>
      <p class="canvas-meta">Live since 19 June · every weekday, 6:40 am · watches ${WATCHED} champions · ${CHAMPIONS.length} have gone quiet since it started</p>
    </div>
    <div class="canvas-actions tight">
      <button class="btn primary" type="button">Reconnect HubSpot</button>
      <button class="btn" type="button">Edit</button>
    </div>
  </div>

  <div class="outage">
    <span class="outage-t">Blind since 29 August.</span>
    It cannot read HubSpot, so it has checked nobody for ${BLIND_RUNS} runs. Three champions crossed 30 days quiet in that window and nobody was told —
    <button class="door" type="button" data-log="blind">see the runs</button> or
    <button class="door" type="button" data-log="invisible">the ${WATCHED} it can't look at</button>.
    Everything below is what it learned before that, and it still holds.
  </div>

  <div class="def-strip">
    <div class="def">
      <h3>A champion is</h3>
      <p>The person at an account who has <strong>replied most in the last 180 days</strong> — not whoever HubSpot has flagged. Those disagree on 11 of the ${WATCHED} it watches.</p>
      <span class="def-where">A judgement Trig makes. The CRM flag is often two people out of date.</span>
    </div>
    <div class="def">
      <h3>Quiet is</h3>
      <p><strong>30 days</strong> with no reply, no open and no login. Not 30 days without us contacting them — 30 days of nothing from their side.</p>
      <span class="def-where">Set in the cohort, not here.</span>
    </div>
  </div>

  <h3 class="canvas-h">What it does when someone goes quiet</h3>
  <ol class="flowsteps">
    <li class="trigger">
      <span class="fs-n">T</span>
      <span class="fs-b"><span class="fs-t">A champion hits 30 days with nothing from their side</span>
        <span class="fs-s">checked every weekday against everyone it watches</span></span>
      <span class="fs-through">${CHAMPIONS.length} since June</span>
      <span class="fs-tag">trigger</span>
    </li>
    <li class="wait"><span>first, it checks why</span><span class="wait-here">and this is where it goes wrong</span></li>
    <li class="send">
      <span class="fs-n">1</span>
      <span class="fs-b"><span class="fs-t">Send a short question from the account owner</span>
        <span class="fs-s">no pitch — “anything I should know?”</span></span>
      <span class="fs-through">${SET.chased().length} sent</span>
      <span class="fs-tag">sends itself</span>
    </li>
    <li class="wait"><span>then 10 days, if nothing</span></li>
    <li class="needs">
      <span class="fs-n">2</span>
      <span class="fs-b"><span class="fs-t">Hand it to the account owner</span>
        <span class="fs-s">it stops. A second automated nudge to a silent person is noise.</span></span>
      <span class="fs-through">14 handed over</span>
      <span class="fs-tag">needs you</span>
    </li>
  </ol>
  <p class="canvas-after">It sends once and then stops. What it does <em>not</em> do is check why they went quiet before sending — which is the whole finding below.</p>

  <h3 class="canvas-h">Did it work</h3>
  <div class="held">
    <div><span class="held-n">${rate(chasedBack(), SET.chased())}</span><span class="held-l">came back after a nudge — ${chasedBack().length} of ${SET.chased().length}</span></div>
    <div><span class="held-n quiet">${rate(aloneBack(), SET.leftAlone())}</span><span class="held-l">came back with no nudge at all — ${aloneBack().length} of ${SET.leftAlone().length}</span></div>
    <p class="held-say">Read like that, chasing is worse than doing nothing. That reading is wrong, and the table below is why.</p>
  </div>

  <h3 class="canvas-h">Why they went quiet, and whether chasing helped</h3>
  <div class="table set-table chase-table" style="--set-cols:190px 62px 116px 116px 1fr">
    <div class="row head">
      <span>Why they went quiet</span><span>How many</span><span>Chased</span><span>Left alone</span><span>What that means</span>
    </div>
    ${[
      ["risk", "Chase them. This is the entire value of the assignment, and it is buried in the average."],
      ["delegated", "Don't. They handed over and the account is fine — a nudge reads as not paying attention."],
      ["left", "Neither. Six people who had left the company, still listed in the CRM. This is a data job."],
      ["seasonal", "Wait. Four of five came back on their own, and waiting costs nothing."],
    ]
      .map(
        ([k, meaning]) => `
      <div class="row item${k === "risk" ? " hot" : ""}">
        <span><strong>${KIND[k].short}</strong><em>${KIND[k].tell}</em></span>
        <span class="ch-n"><button class="door" type="button" data-champ="${k}">${byKind(k).length}</button></span>
        <span class="ch-r ${k === "risk" ? "good" : ""}">${rate(armBack(k, true), arm(k, true))}<em>${armBack(k, true).length} of ${arm(k, true).length}</em></span>
        <span class="ch-r ${k === "delegated" || k === "seasonal" ? "good" : ""}">${rate(armBack(k, false), arm(k, false))}<em>${armBack(k, false).length} of ${arm(k, false).length}</em></span>
        <span>${meaning}</span>
      </div>`,
      )
      .join("")}
  </div>

  <div class="finding">
    <p><strong>The average is hiding two opposite results.</strong> When the account has gone quiet as well, a nudge brings them back ${rate(armBack("risk", true), arm("risk", true))} of the time against ${rate(armBack("risk", false), arm("risk", false))} left alone — better than anything else running. When they have simply delegated, chasing them does <em>worse</em> than silence, ${rate(armBack("delegated", true), arm("delegated", true))} against ${rate(armBack("delegated", false), arm("delegated", false))}.</p>
    <p>It sends the same email to both, because it never asks why. Adding that one check before step 1 would take ${arm("delegated", true).length + arm("left", true).length} of the ${SET.chased().length} nudges out of the world and leave the ones that work.</p>
    <div class="canvas-actions"><button class="btn primary" type="button">Add the check before step 1</button><button class="btn" type="button">Show me the ${arm("delegated", true).length} it shouldn't have chased</button></div>
  </div>

  <h3 class="canvas-h">Run by run</h3>
  <div class="table set-table runs-table" style="--set-cols:126px 78px 76px 82px 1fr">
    <div class="row head"><span>Run</span><span>Checked</span><span>Went quiet</span><span>Nudged</span><span>Outcome</span></div>
    <div class="row change bad"><span class="cl-d">29 Aug</span><span class="cl-t">The HubSpot token expired. Every run since has finished in three seconds having read nothing, and none of them said so.</span></div>
    ${[
      ["28 Aug 6:40 am", "18", "1", "1", "Sam Idowu at Ardent Rail — nudged, no reply"],
      ["27 Aug 6:40 am", "18", "0", "0", "nothing crossed the line"],
      ["26 Aug 6:40 am", "18", "2", "1", "one delegated, correctly left alone"],
      ["22 Aug 6:40 am", "17", "1", "1", "Ruth Ellery at Halcyon — replied the next day"],
      ["19 Aug 6:40 am", "17", "0", "0", "nothing crossed the line"],
    ]
      .map((r) => `<div class="row item">${r.map((c) => `<span>${c}</span>`).join("")}</div>`)
      .join("")}
    <div class="row change good"><span class="cl-d">14 Aug</span><span class="cl-t">Step 2 changed from a second automated nudge to a handover. Replies to the first nudge were unaffected; complaints stopped.</span></div>
    <div class="row change"><span class="cl-d">19 Jun</span><span class="cl-t">Turned on by Marcus Ade, watching 12 champions. Now 18.</span></div>
  </div>`;

/* the people behind a kind of quiet */
CANVAS.champs = (kind) => {
  const rows = byKind(kind);
  return `
    <header>
      <div>
        <p class="drawer-kind">${KIND[kind].short}</p>
        <h2>${rows.length} champions</h2>
        <p>${KIND[kind].tell}</p>
      </div>
      <button class="icon-btn" type="button" data-close aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>
    <div class="drawer-body">
      <ul class="acct-list">
        ${rows
          .map(
            (c) => `<li>
              <span class="al-name">${c.name}</span>
              <span class="al-where">${c.days} days quiet</span>
              <span class="al-sub">${c.account} · £${c.value}k · ${c.state}</span>
            </li>`,
          )
          .join("")}
      </ul>
    </div>`;
};

/* ---------------------------------------------------------------- depth
   A subject, in the third pane. One way back, because there is no column 2
   here to hold your place. */

const backTo = (label) =>
  `<button class="back-pane" type="button" data-back-pane>
     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
     ${label}
   </button>`;

CANVAS.renewalPane = (name) => {
  const r = RENEWALS.find((x) => x.account === name);
  return `
    ${backTo("All seven accounts")}
    <div class="canvas-head">
      <div>
        <h2>${r.account}</h2>
        <p class="canvas-meta">${r.valueLabel} · renews ${r.renewsLabel} · notice shuts ${r.noticeLabel}, ${r.daysToNotice} days away · ${r.owner}</p>
      </div>
      <div class="canvas-actions tight">
        <button class="btn primary" type="button">Open the account</button>
        <button class="btn" type="button">Add to Thursday's call</button>
      </div>
    </div>

    <div class="canvas-cols" style="margin-top:16px">
      <div>
        <h3 class="canvas-h" style="margin-top:0">What happened to the sponsor</h3>
        <p class="rn-p">${r.sponsor}</p>
        <h3 class="canvas-h">Who is left</h3>
        <p class="rn-p"><strong>${r.replies}</strong>, ${r.repliesRole} — last replied ${r.lastReply}. ${r.engaged} of ${r.known} named contacts have replied to anything in 90 days.</p>
      </div>
      <div>
        <h3 class="canvas-h" style="margin-top:0">Already in flight</h3>
        <p class="rn-p">${r.inFlight}</p>
        <h3 class="canvas-h">What this looks like to me</h3>
        <p class="rn-p verdict-p">${r.verdict}</p>
      </div>
    </div>

    <h3 class="canvas-h">How the account is behaving</h3>
    <div class="table set-table rn-behaviour" style="--set-cols:190px 84px 96px 1fr">
      <div class="row head"><span>Marker</span><span>Them</span><span>Normal</span><span>What we can see</span></div>
      ${r.behaviour
        .map(
          (b) => `<div class="row item">
            <span>${b[0]}</span>
            <span class="rn-figure ${b[3]}">${TREND[b[3]]} ${b[1]}</span>
            <span class="q">${b[2]}</span>
            <span>${b[4]}</span>
          </div>`,
        )
        .join("")}
    </div>`;
};

/* One of the 96. Built only from the fields the cohort actually holds —
   band, position, opened, clicked, what, when — and the band's return rate
   is read off the same list the report counts, so the two cannot disagree. */
CANVAS.trialPane = (name) => {
  const a = ACCOUNTS.find((x) => x.name === name);
  if (!a) return backTo("The report") + `<p class="rn-p">No record for that account in this run.</p>`;

  // step 3 is written, not sent; a reply stops the sequence where it stood
  const sent =
    a.position === "wait1" ? 1
    : a.position === "wait2" || a.position === "step3" ? 2
    : a.position === "silent" ? 3
    : /step 1/.test(a.what) ? 1
    : 2;

  const steps = [
    ["1", "Ask what stopped them", sent >= 1, a.opened ? "opened" : "not opened"],
    ["2", "The closest case study", sent >= 2, a.clicked ? "clicked" : a.opened ? "opened, no click" : "not opened"],
    [
      "3",
      "20% for the first year",
      sent >= 3 || a.position === "step3",
      a.position === "step3" ? "written, unsent" : sent >= 3 ? "not opened" : "never reached",
    ],
  ];

  const bandRate = pct(a.band + "-back", a.band);
  const bandSize = count(a.band);
  const waiting = ["wait1", "wait2", "step3"].includes(a.position);

  return `
    ${backTo("The report")}
    <div class="canvas-head">
      <div>
        <h2>${a.name}</h2>
        <p class="canvas-meta">${a.bandLabel} · ${a.positionLabel} · last moved ${a.when}</p>
      </div>
      <div class="canvas-actions tight">
        ${a.position === "step3" ? `<button class="btn primary" type="button">Put the offer in my Gmail</button>` : ""}
        <button class="btn" type="button">Open the account</button>
      </div>
    </div>

    <div class="canvas-cols" style="margin-top:16px">
      <div>
        <h3 class="canvas-h" style="margin-top:0">Why it picked them up</h3>
        <ul class="ev">
          <li>Their trial ended without converting, inside the window this run swept.</li>
          <li>${a.bandLabel} — ${bandSize} accounts did that, and ${bandRate} of them came back.</li>
          <li>Nobody had contacted them since.</li>
        </ul>
      </div>
      <div>
        <h3 class="canvas-h" style="margin-top:0">Where they are now</h3>
        <p class="rn-p"><strong>${a.positionLabel}</strong> — ${a.what.charAt(0).toLowerCase() + a.what.slice(1)}, as of ${a.when}.</p>
        ${
          a.position === "step3"
            ? `<p class="rn-p">The offer is written and sitting unsent. It has been there since ${a.when}, and it is one of ${count("step3")} like it.</p>`
            : a.replied
            ? `<p class="rn-p">They replied, so the sequence stopped where it stood. Nothing further was sent.</p>`
            : waiting
            ? `<p class="rn-p">Still inside the sequence. The next step runs on its own — nothing is waiting on you here.</p>`
            : `<p class="rn-p">All three steps ran and none landed. They are out of the sequence and will not be written to again.</p>`
        }
      </div>
    </div>

    <h3 class="canvas-h">What it did here</h3>
    <ol class="flowsteps">
      ${steps
        .map(
          ([n, t, ran, outcome]) => `
        <li class="${!ran ? "trigger" : n === "3" && a.position === "step3" ? "needs" : "send"}">
          <span class="fs-n">${n}</span>
          <span class="fs-b">
            <span class="fs-t">${t}</span>
            <span class="fs-s">${!ran ? "never reached" : n === "3" && a.position === "step3" ? "drafted, not sent" : "sent"}</span>
          </span>
          <span class="fs-through">${outcome}</span>
          <span class="fs-tag">${!ran ? "—" : n === "3" && a.position === "step3" ? "needs you" : "sent itself"}</span>
        </li>`,
        )
        .join("")}
    </ol>`;
};

/* THE WEEK — a calendar of recurring customer calls. Days expand and
   collapse; a call opens its pack in the drawer. The pack itself is
   unchanged, it has just stopped being the top level. */

/* An agenda in column 2: the same groups, narrowed. The pack it selects
   is a SUBJECT, so it belongs in the third pane, not a drawer. */
CANVAS.agendaCol2 = (run, selected) => `
  <div class="a2-figures">
    ${run.agenda.figures.map((f) => `<div><span class="a2-n">${f[0]}</span><span class="a2-l">${f[1]}</span></div>`).join("")}
  </div>
  ${run.groups
    .map(
      (g) => `
    <section class="a2-group" data-open>
      <button class="a2-head" type="button" data-day-toggle>
        <svg class="wk-caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        <span class="a2-d">${g.label}</span>
        <span class="a2-c">${g.count}</span>
      </button>
      <div class="a2-items">
        ${g.items
          .map(
            (c) =>
              c.open === false
                ? `<div class="a2-item flat"><span class="a2-lead">${c.lead}</span><span class="a2-b"><span class="a2-t">${c.title}</span><span class="a2-s">${c.headline}</span></span></div>`
                : `<button class="a2-item${c.id === selected ? " on" : ""}" type="button" data-item="${c.id}">
                     <span class="a2-lead">${c.lead}</span>
                     <span class="a2-b">
                       <span class="a2-t">${c.title}${c.state === "Not opened" ? '<i class="a2-dot"></i>' : ""}</span>
                       <span class="a2-s">${c.person || c.headline}</span>
                     </span>
                   </button>`,
          )
          .join("")}
      </div>
    </section>`,
    )
    .join("")}`;

CANVAS.agenda = (it) => `
  <div class="canvas-head">
    <div>
      <h2>${it.name}</h2>
      <p class="canvas-meta">${it.meta}</p>
    </div>
  </div>

  <div class="wk-summary">
    ${it.figures.map((f) => `<div><span class="rn-n">${f[0]}</span><span class="rn-l">${f[1]}</span></div>`).join("")}
    <p class="rn-say">${it.say}</p>
  </div>

  ${it.groups
    .map(
      (g) => `
    <section class="wk-day"${g.collapsed ? "" : " data-open"}>
      <button class="wk-head" type="button" data-day-toggle>
        <svg class="wk-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        <span class="wk-d">${g.label}</span>
        ${g.sub ? `<span class="wk-date">${g.sub}</span>` : ""}
        <span class="wk-n">${g.count}</span>
        ${g.meta ? `<span class="wk-v">${g.meta}</span>` : ""}
        ${g.note ? `<span class="wk-note">${g.note}</span>` : ""}
      </button>
      <div class="wk-calls">
        ${g.items
          .map(
            (c) => `
          <button class="wk-call${c.open === false ? " flat" : ""}" type="button"${c.open === false ? "" : ` data-pack="${c.id}"`}>
            <span class="wk-time">${c.lead}</span>
            <span class="wk-body">
              <span class="wk-acct">${c.title}${c.person ? `<em>${c.person}</em>` : ""}</span>
              <span class="wk-line">${c.headline}</span>
            </span>
            <span class="wk-meta">${c.right ?? ""}</span>
            ${c.state ? `<span class="wk-state${c.state === "Not opened" ? " unread" : ""}">${c.state}</span>` : "<span></span>"}
            ${c.flag ? `<span class="wk-flag">${c.flag}</span>` : ""}
          </button>`,
          )
          .join("")}
      </div>
    </section>`,
    )
    .join("")}`;


/* a dialling pack — what you need in the thirty seconds before you ring */
CANVAS.dial = (id) => {
  const p = DIALS[id];
  return `
    <header>
      <div>
        <p class="drawer-kind">Number ${p.rank} today · ${p.mins}</p>
        <h2>${p.account}</h2>
        <p>${p.person} · ${p.meta}</p>
      </div>
      <button class="icon-btn" type="button" data-close aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>
    <div class="drawer-body">
      ${p.flag ? `<p class="pack-waiting flush">${p.flag} — deal with it before you dial, not after.</p>` : ""}

      <h3>Why it is number ${p.rank}</h3>
      <p class="rn-p">${p.why}</p>

      <h3>How to open</h3>
      <p class="opener">“${p.opener}”</p>

      <h3>Have these ready</h3>
      <ul class="ev">${p.ready.map((r) => `<li>${r}</li>`).join("")}</ul>

      <h3>Last time you spoke</h3>
      <p class="rn-p">${p.last}</p>

      <h3>If it goes badly</h3>
      <p class="rn-p">${p.ifno}</p>
    </div>`;
};

/* one call's pack, in the drawer */
CANVAS.pack = (id) => {
  const p = WEEKCALLS[id];
  return `
    <header>
      <div>
        <p class="drawer-kind">${p.when}</p>
        <h2>${p.account}</h2>
        <p>${p.person} · ${p.money} · renews ${p.renews} · last spoke ${p.lastSpoke}</p>
      </div>
      <button class="icon-btn" type="button" data-close aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>
    <div class="drawer-body">
      ${p.waiting ? `<p class="pack-waiting flush">${p.waiting}</p>` : ""}

      <h3>What moved since ${p.lastSpoke}</h3>
      <ul class="moved">
        ${p.changed.map((c) => `<li class="${c.dir}"><span class="mv-d">${c.date}</span><span class="mv-t">${c.text}</span></li>`).join("")}
      </ul>

      <h3>What you said you'd do</h3>
      <ul class="promises">
        ${p.promises.map((q) => `<li class="${q.state}"><span class="pr-s">${q.state === "missed" ? "not done" : q.state === "done" ? "done" : "open"}</span><span>${q.text}</span></li>`).join("")}
      </ul>

      ${
        p.asked.length
          ? `<h3>What they asked for</h3>
             <ul class="promises">
               ${p.asked.map((q) => `<li class="${q.state}"><span class="pr-s">${q.state === "missed" ? "unanswered" : "open"}</span><span>${q.text}</span></li>`).join("")}
             </ul>`
          : ""
      }

      <h3>On the call</h3>
      ${p.people.filter((x) => x.onCall).map((x) => `<div class="who"><span class="who-n">${x.name}</span><span class="who-r">${x.role}</span><span class="who-s">${x.note}</span></div>`).join("")}
      <h3>Not on it, and matters</h3>
      ${p.people.filter((x) => !x.onCall).map((x) => `<div class="who quiet"><span class="who-n">${x.name}</span><span class="who-r">${x.role}</span><span class="who-s">${x.note}</span></div>`).join("")}

      <h3>What to raise</h3>
      <ol class="agenda">
        ${p.raise.map((r) => `<li><span class="ag-w">${r.what}</span><span class="ag-y">${r.why}</span></li>`).join("")}
      </ol>

      <h3>Leave it</h3>
      <p class="pack-leave">${p.leave}</p>
    </div>`;
};

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
            (a) => `<li class="deep" data-trial="${a.name}" role="button" tabindex="0">
              <span class="al-name">${a.name}</span>
              <span class="al-where">${a.positionLabel}</span>
              <span class="al-sub">${a.bandLabel} · ${a.what} · ${a.when}</span>
            </li>`,
          )
          .join("")}
      </ul>
    </div>`;
};


/* RENEWALS WITH NO SPONSOR — which accounts, and enough about each to
   decide which one Thursday goes on. The order is stated and derived:
   value over the weeks left before the notice window shuts. */

const TREND = { rising: "↑", falling: "↓", flat: "→", stalled: "→" };

export const DIALS = {
  "halcyon-d": {
    "rank": "1",
    "account": "Halcyon",
    "person": "Ruth Ellery",
    "meta": "£142k · renews 12 Nov · last spoke 22 August",
    "mins": "12 min",
    "why": "Both ops admins gone 43 days and the renewal is 10 weeks out. Highest value at risk on the book.",
    "opener": "Ruth — before Monday, can I ask who picked up the reporting when Priya and Tom came off?",
    "ready": [
      "Ticket 4412, open nine days with no reply from us",
      "The seat count: 42 to 40 on 27 August",
      "That API traffic is up 40% and you don't know who is driving it"
    ],
    "last": "22 August. She asked about SSO pricing and never got an answer — lead with that if it comes up.",
    "ifno": "If she has no time: the one question worth the call is who replaced the two admins. Everything else can wait.",
    "flag": null
  },
  "ferrovia-d": {
    "rank": "2",
    "account": "Ferrovia",
    "person": "Marc Oyelaran",
    "meta": "£96k · renews 3 Dec · last spoke 19 August",
    "mins": "10 min",
    "why": "Eight days from go-live and it hasn't moved since 21 August. Three emails, no reply to any.",
    "opener": "Marc — we're eight days out and I'd rather ask than guess. What's actually holding this up?",
    "ready": [
      "The go-live checklist, and which two items are outstanding",
      "That six other contacts have never replied to anything",
      "The assignment stopped chasing on 6 September — this is now a person's job"
    ],
    "last": "19 August. He replied then and nothing since. Three automated emails have gone out in between.",
    "ifno": "If he says it's paused: get a date and who owns it. A vague 'soon' here is how this becomes a churn in December.",
    "flag": "Handed over"
  },
  "kestrel-d": {
    "rank": "3",
    "account": "Kestrel Group",
    "person": "Jo Bergström",
    "meta": "£61k · renews 19 Dec · last spoke 14 August",
    "mins": "8 min",
    "why": "Two nudges unopened, and a draft is already sitting in your Gmail. Ring first, then send it.",
    "opener": "Jo — I noticed both admin accounts came off in August. Rather than guess who picked it up, can you point me at them?",
    "ready": [
      "Both admins left on 12 August and nobody has been added",
      "She is a CFO, which makes her the sponsor if she'll take it",
      "The draft in your Gmail, so you can send it straight after"
    ],
    "last": "14 August. She replied. The two nudges since were never opened.",
    "ifno": "If she pushes back: the ask is a name, not a meeting. One admin account is a five-minute fix.",
    "flag": "Draft unsent"
  },
  "meridian-d": {
    "rank": "4",
    "account": "Meridian Health",
    "person": "Alex Renn",
    "meta": "£88k · renews 22 May · last spoke 26 August",
    "mins": "8 min",
    "why": "Ticket 4412 has been open nine days with no reply from us. They will raise it on Thursday if you don't.",
    "opener": "Alex — before Thursday, I want to get ahead of something rather than have you raise it.",
    "ready": [
      "4412 and why it has sat for nine days",
      "The proposal that has been finished and unsent for six",
      "That Dana left in July and nothing was handed over"
    ],
    "last": "26 August. He asked for a summary of the original commitments, twice. Still not sent.",
    "ifno": "If he is short: send the proposal on the call. Six days is already the story.",
    "flag": null
  },
  "talia-d": {
    "rank": "5",
    "account": "Talia Foods",
    "person": "Jo Bergström",
    "meta": "£61k · renews 14 Jan · last spoke 1 September",
    "mins": "10 min",
    "why": "Renewal is six weeks out with no exec sponsor named, and they passed 80% of seats on 1 September.",
    "opener": "Jo — two quick things before the renewal, and neither is a problem.",
    "ready": [
      "80% of seats, and what happens at 100%",
      "That the sponsor named in March left in June",
      "The seat forecast you sent on 2 September"
    ],
    "last": "1 September. Healthy account, nothing outstanding from either side.",
    "ifno": "If she has no name to give: ask who signs the renewal. That is the sponsor whether they call it that or not.",
    "flag": null
  },
  "redwing-d": {
    "rank": "6",
    "account": "Redwing",
    "person": "Cara Milne",
    "meta": "£46k · trial ended 21 June · last spoke 19 August",
    "mins": "6 min",
    "why": "A 20% offer was written nine days ago and never sent. Decide what you're doing before you ring.",
    "opener": "Cara — you've opened everything I've sent and replied to none of it, so I'll just ask directly.",
    "ready": [
      "She used the trial on 11 days — the heaviest in her cohort",
      "The offer, if you decide to send it",
      "That price is probably not the blocker"
    ],
    "last": "19 August. She opened it. No reply, and none to anything since.",
    "ifno": "If she is not interested: say so and stop. Opening every email and replying to none usually means someone else decides.",
    "flag": "Offer unsent"
  },
  "ardent-d": {
    "rank": "7",
    "account": "Ardent Rail",
    "person": "Sam Idowu",
    "meta": "£39k · renews 2 Feb · last spoke 6 August",
    "mins": "6 min",
    "why": "Thirty-four days silent from the only contact who has ever engaged. A clear no is worth more than another quarter.",
    "opener": "Sam — I'd rather ask straight out than keep sending things. Is this still a priority for you?",
    "ready": [
      "The integration timeline you promised on 6 August and never sent",
      "His API rate-limit question, also unanswered",
      "That six other contacts have engaged with nothing since May"
    ],
    "last": "6 August. He asked two questions and got neither answered. That may be the whole story.",
    "ifno": "If he says it isn't a priority: get that in writing and stop. It frees the time and it is honest.",
    "flag": "Watcher blind"
  },
  "pike-d": {
    "rank": "8",
    "account": "Pike & Rowe",
    "person": "Ben Achebe",
    "meta": "£47k · renews 3 Mar · last spoke 14 August",
    "mins": "5 min",
    "why": "Hiring two analytics engineers, which is a warm reason to call rather than a problem to fix.",
    "opener": "Ben — saw you're hiring two analytics engineers. When they land they'll ask the same three questions everyone does.",
    "ready": [
      "The onboarding pack for new analysts",
      "That they have two contacts in total, half the median for this size",
      "Nothing commercial — this is a relationship call"
    ],
    "last": "14 August. Nothing outstanding.",
    "ifno": "If it is a bad time: ask who the new hires will report to. That is the second name you need.",
    "flag": null
  }
};

export const WEEKCALLS = {
  "halcyon": {
    "id": "halcyon",
    "day": "Monday",
    "time": "10:00",
    "account": "Halcyon",
    "person": "Ruth Ellery, VP Operations",
    "money": "£142k",
    "renews": "12 Nov",
    "lastSpoke": "22 August",
    "read": false,
    "headline": "Reporting stopped 43 days ago, both ops admins gone, renewal in 10 weeks",
    "changed": [
      {
        "date": "2 Sep",
        "dir": "up",
        "text": "API calls passed 4,000 a week, up 40% since June. Someone has built something on it."
      },
      {
        "date": "30 Aug",
        "dir": "down",
        "text": "Ticket 4412 opened. Nine days, no reply from us."
      },
      {
        "date": "27 Aug",
        "dir": "down",
        "text": "Two ops admin seats removed, 42 to 40. Both opened reports weekly."
      },
      {
        "date": "19 Aug",
        "dir": "up",
        "text": "Seats in use reached 94% and have stayed there for three weeks."
      },
      {
        "date": "28 Jul",
        "dir": "down",
        "text": "Reporting stopped entirely — 0 a week, against 11 through July."
      }
    ],
    "promises": [
      {
        "state": "missed",
        "text": "Send the reporting workflow doc. Eighteen days ago, still not sent."
      },
      {
        "state": "done",
        "text": "Introduce them to the ops team at Corvus. Done 26 August."
      },
      {
        "state": "done",
        "text": "Confirm the renewal date. Confirmed as 12 November."
      }
    ],
    "asked": [
      {
        "state": "missed",
        "text": "SSO pricing, asked on 22 August. Never answered."
      },
      {
        "state": "open",
        "text": "Ticket 4412 — a reporting export bug. Nine days, no reply."
      }
    ],
    "people": [
      {
        "name": "Ruth Ellery",
        "role": "champion · VP Operations",
        "note": "replies within a day, every time. Last reply 22 Aug.",
        "onCall": true
      },
      {
        "name": "Marc Oyelaran",
        "role": "admin",
        "note": "replied 19 Aug. Not invited, and he owns the reporting.",
        "onCall": false
      },
      {
        "name": "Priya Shah, Tom Vale",
        "role": "were the ops admins",
        "note": "both seats removed 27 Aug. Neither replaced.",
        "onCall": false
      }
    ],
    "leave": "Don't open on the renewal number. Ruth has no budget authority, and leading with it will stall the four things she can actually answer.",
    "waiting": "A draft to Ruth has been in your Gmail since yesterday. Send it before the call or it reads as an afterthought.",
    "flag": "Draft unsent",
    "raise": [
      {
        "what": "Who replaced the two ops admins?",
        "why": "If nobody did, the seat drop and the reporting drop are one story, not two."
      },
      {
        "what": "Get ahead of 4412",
        "why": "Nine days with no reply from us. Better you raise it than she does."
      },
      {
        "what": "Who is calling the API?",
        "why": "Traffic up 40% while the interface went silent. Somebody is building on this and you don't know who."
      },
      {
        "what": "Name an exec sponsor",
        "why": "Ten weeks to renewal and there still isn't one. The last two that renewed without one dropped a tier."
      }
    ],
    "when": "Monday 10:00"
  },
  "brightsea": {
    "id": "brightsea",
    "day": "Monday",
    "time": "11:30",
    "account": "Brightsea",
    "person": "Ana Rehn, VP Operations",
    "money": "£58k",
    "renews": "8 Jun",
    "lastSpoke": "4 September",
    "read": true,
    "headline": "Raised a Series B on 2 September — the ops team is about to double",
    "changed": [
      {
        "date": "2 Sep",
        "dir": "up",
        "text": "Announced a Series B. Headcount plans not yet shared."
      },
      {
        "date": "21 Aug",
        "dir": "up",
        "text": "Weekly active users up from 12 to 19 since July."
      },
      {
        "date": "4 Aug",
        "dir": "flat",
        "text": "Seats unchanged at 20 since March."
      }
    ],
    "promises": [
      {
        "state": "open",
        "text": "Send the scaling guide. Agreed on 4 September, not yet sent."
      }
    ],
    "asked": [],
    "people": [
      {
        "name": "Ana Rehn",
        "role": "champion · VP Operations",
        "note": "replied 4 Sep. Quick, always.",
        "onCall": true
      },
      {
        "name": "Nobody in finance",
        "role": "—",
        "note": "a Series B means finance will get a say. We know none of them.",
        "onCall": false
      }
    ],
    "leave": "Don't quote seat pricing on this call. Ask what they're planning first, or the conversation becomes a negotiation before it's a plan.",
    "waiting": null,
    "flag": null,
    "raise": [
      {
        "what": "Congratulate, then ask what changes",
        "why": "The raise was a week ago. The plan is being made now, not in January."
      },
      {
        "what": "Ask who joins in the next quarter",
        "why": "Seats have been flat at 20 all year and 19 people are active. They will run out."
      },
      {
        "what": "Get a finance name",
        "why": "A raise puts finance in the loop. We don't know anyone there."
      }
    ],
    "when": "Monday 11:30"
  },
  "corvus": {
    "id": "corvus",
    "day": "Monday",
    "time": "15:00",
    "account": "Corvus",
    "person": "Marta Lind, Head of Data",
    "money": "£74k",
    "renews": "8 Apr",
    "lastSpoke": "3 September",
    "read": true,
    "headline": "One seat from a hard stop, and finance started using it unsold",
    "changed": [
      {
        "date": "4 Sep",
        "dir": "up",
        "text": "Seats hit 23 of 24. One left."
      },
      {
        "date": "28 Aug",
        "dir": "up",
        "text": "Finance started using it. Nobody sold to finance."
      },
      {
        "date": "19 Aug",
        "dir": "up",
        "text": "Reports passed 15 a week, above anything in the band."
      }
    ],
    "promises": [
      {
        "state": "done",
        "text": "Send the expansion brief. Sent 7 September."
      }
    ],
    "asked": [
      {
        "state": "open",
        "text": "Whether finance can have their own workspace. Asked 3 September."
      }
    ],
    "people": [
      {
        "name": "Marta Lind",
        "role": "exec sponsor · Head of Data",
        "note": "named on day 19 and on every call since.",
        "onCall": true
      },
      {
        "name": "Ren Kapoor",
        "role": "finance lead",
        "note": "four of his team have been using it since 28 Aug. Never contacted.",
        "onCall": false
      }
    ],
    "leave": "Don't lead with the upsell number. Ask what finance is doing first — the number is easier once they've described the value themselves.",
    "waiting": null,
    "flag": null,
    "raise": [
      {
        "what": "They are one seat from a hard stop",
        "why": "23 of 24 for three weeks. This stops being a growth conversation the day it hits 24."
      },
      {
        "what": "Ask what finance is doing with it",
        "why": "Four people, unsold, since 28 August. Worth about £28k a year at your standard rate."
      },
      {
        "what": "Offer Ren a workspace",
        "why": "He asked on 3 September and nobody answered."
      }
    ],
    "when": "Monday 15:00"
  },
  "cobalt": {
    "id": "cobalt",
    "day": "Tuesday",
    "time": "14:00",
    "account": "Cobalt Systems",
    "person": "Marta Lind, Head of Data",
    "money": "£88k",
    "renews": "3 Mar",
    "lastSpoke": "1 September",
    "read": true,
    "headline": "Going well and nobody has told her — she's three weeks into the role",
    "changed": [
      {
        "date": "21 Aug",
        "dir": "up",
        "text": "Weekly active users passed 30 for the first time, up from 24 in July."
      },
      {
        "date": "14 Aug",
        "dir": "up",
        "text": "Ren Kapoor added as an admin. First new admin since March."
      },
      {
        "date": "2 Aug",
        "dir": "up",
        "text": "Cleared onboarding on day 26, four days inside the normal window."
      },
      {
        "date": "19 Jul",
        "dir": "down",
        "text": "No exec sponsor named since the deal closed. Day 34 of adoption."
      }
    ],
    "promises": [
      {
        "state": "done",
        "text": "Send the saved-reports walkthrough. Sent 2 September, opened twice."
      },
      {
        "state": "open",
        "text": "Introduce Ren to support. Not done — he still hasn't been contacted."
      }
    ],
    "asked": [
      {
        "state": "open",
        "text": "Whether reporting can be scheduled weekly. Answered informally; nothing written down."
      }
    ],
    "people": [
      {
        "name": "Marta Lind",
        "role": "champion · Head of Data",
        "note": "new in the role three weeks ago. Replied 3 Sep.",
        "onCall": true
      },
      {
        "name": "Ren Kapoor",
        "role": "admin",
        "note": "added 14 Aug — the first new admin since March. Never contacted.",
        "onCall": false
      }
    ],
    "leave": "Nothing to hold back. This is the one call this week where you can spend the time asking rather than explaining.",
    "waiting": null,
    "flag": null,
    "raise": [
      {
        "what": "Say the numbers back to her",
        "why": "This account is going well and nobody has told her. She is three weeks into the role."
      },
      {
        "what": "Ask what Ren is going to own",
        "why": "He is the first new admin since March and has never been contacted by anyone here."
      },
      {
        "what": "Name a sponsor",
        "why": "Day 34 of a stage that clears in 45. It is the only marker off-pattern."
      }
    ],
    "when": "Tuesday 14:00"
  },
  "trellis": {
    "id": "trellis",
    "day": "Tuesday",
    "time": "16:00",
    "account": "Trellis",
    "person": "Nina Okafor, Operations admin",
    "money": "£33k",
    "renews": "19 May",
    "lastSpoke": "12 August",
    "read": true,
    "headline": "Clicked the case study on 27 August and has said nothing since",
    "changed": [
      {
        "date": "27 Aug",
        "dir": "up",
        "text": "Clicked the reporting case study and read it for four minutes."
      },
      {
        "date": "14 Aug",
        "dir": "flat",
        "text": "Weekly active users steady at 11, at the bottom of the band."
      },
      {
        "date": "2 Aug",
        "dir": "down",
        "text": "Passed 80% of seats and nobody has raised it."
      }
    ],
    "promises": [
      {
        "state": "missed",
        "text": "Send seat options. Promised 12 August, four weeks ago."
      }
    ],
    "asked": [],
    "people": [
      {
        "name": "Nina Okafor",
        "role": "admin",
        "note": "replies eventually. Last reply 12 Aug.",
        "onCall": true
      }
    ],
    "leave": "Don't apologise at length for the seat options. Send them, mention it once, move on.",
    "waiting": null,
    "flag": null,
    "raise": [
      {
        "what": "Send the seat options you promised in August",
        "why": "Four weeks. Do it before the call, not after."
      },
      {
        "what": "Ask about the case study",
        "why": "She read it properly on 27 August and then went quiet. Something in it landed."
      }
    ],
    "when": "Tuesday 16:00"
  },
  "meridian": {
    "id": "meridian",
    "day": "Wednesday",
    "time": "11:00",
    "account": "Meridian Health",
    "person": "Alex Renn, Director of Ops",
    "money": "£88k",
    "renews": "22 May",
    "lastSpoke": "26 August",
    "read": true,
    "headline": "A proposal has been finished and unsent for six days",
    "changed": [
      {
        "date": "3 Sep",
        "dir": "down",
        "text": "Renewal proposal finished and not sent. Six days."
      },
      {
        "date": "28 Aug",
        "dir": "down",
        "text": "Ticket volume doubled in August, all of it from one team."
      },
      {
        "date": "14 Jul",
        "dir": "flat",
        "text": "Usage flat for four quarters at 22 of 30 seats."
      }
    ],
    "promises": [
      {
        "state": "missed",
        "text": "Write up what was agreed with Dana. Asked for on 26 August, not done."
      },
      {
        "state": "done",
        "text": "Get him admin access. Done 27 August."
      }
    ],
    "asked": [
      {
        "state": "missed",
        "text": "A summary of the original commitments. Asked twice, never sent."
      }
    ],
    "people": [
      {
        "name": "Alex Renn",
        "role": "inherited the account in July",
        "note": "the previous sponsor never handed over. Replied 26 Aug.",
        "onCall": true
      },
      {
        "name": "Dana Whitlock",
        "role": "the previous sponsor",
        "note": "left in July. Everything agreed with her is undocumented.",
        "onCall": false
      }
    ],
    "leave": "Don't push for an uplift. Flat usage for four quarters won't support it, and asking turns a renewal into a negotiation.",
    "waiting": "A renewal proposal has been finished and unsent for six days. It is in your Gmail.",
    "flag": "Proposal unsent",
    "raise": [
      {
        "what": "Send the proposal before the call",
        "why": "Six days old. Arriving after the conversation reads as an afterthought."
      },
      {
        "what": "Ask what he inherited and what he was never told",
        "why": "Dana left in July and nothing was written down. He is guessing."
      },
      {
        "what": "The ticket spike is one team",
        "why": "Volume doubled in August from a single team. Find out which before it becomes the renewal story."
      }
    ],
    "when": "Wednesday 11:00"
  },
  "northwind": {
    "id": "northwind",
    "day": "Wednesday",
    "time": "13:30",
    "account": "Northwind Rail",
    "person": "Tom Verity, Head of Ops",
    "money": "£112k",
    "renews": "30 Jun",
    "lastSpoke": "28 August",
    "read": false,
    "headline": "Hiring three ops analysts — the biggest account with no plan against it",
    "changed": [
      {
        "date": "1 Sep",
        "dir": "up",
        "text": "Posted three ops analyst roles."
      },
      {
        "date": "18 Aug",
        "dir": "flat",
        "text": "Usage steady at 34 of 40 seats since June."
      },
      {
        "date": "4 Aug",
        "dir": "down",
        "text": "Tom is the only contact and he is leaving in November."
      }
    ],
    "promises": [
      {
        "state": "open",
        "text": "Map who replaces Tom. Raised internally on 28 August, nothing done."
      }
    ],
    "asked": [],
    "people": [
      {
        "name": "Tom Verity",
        "role": "Head of Ops",
        "note": "leaving in November. Nobody has been introduced.",
        "onCall": true
      }
    ],
    "leave": "Don't let this be a status call. The only thing that matters is a second name before November.",
    "waiting": null,
    "flag": null,
    "raise": [
      {
        "what": "Ask who takes over from Tom",
        "why": "He leaves in November and the renewal is in June. Right now the account has one contact and he is going."
      },
      {
        "what": "Three analysts are joining",
        "why": "Onboarding them is the natural reason to be introduced to whoever replaces him."
      },
      {
        "what": "Nothing about price",
        "why": "Get the relationship mapped first."
      }
    ],
    "when": "Wednesday 13:30"
  },
  "redwing": {
    "id": "redwing",
    "day": "Wednesday",
    "time": "16:30",
    "account": "Redwing",
    "person": "Cara Milne, Head of RevOps",
    "money": "£46k",
    "renews": "11 Nov",
    "lastSpoke": "19 August",
    "read": false,
    "headline": "A 20% offer has been sitting unsent in your Gmail for nine days",
    "changed": [
      {
        "date": "2 Sep",
        "dir": "down",
        "text": "A discount offer was written and never sent. Nine days."
      },
      {
        "date": "21 Jun",
        "dir": "flat",
        "text": "Trial ended without converting. Used the product on 11 days — the heaviest in its cohort."
      }
    ],
    "promises": [
      {
        "state": "missed",
        "text": "Send the discount offer. Written 2 September, still unsent."
      }
    ],
    "asked": [],
    "people": [
      {
        "name": "Cara Milne",
        "role": "Head of RevOps",
        "note": "opened every email, replied to none.",
        "onCall": true
      }
    ],
    "leave": "Don't lead with the discount. She used the product for eleven days — the value is established, the price isn't the blocker.",
    "waiting": null,
    "flag": null,
    "raise": [
      {
        "what": "Decide on the offer before the call",
        "why": "It has been written for nine days. Send it or bin it, but don't arrive with it undecided."
      },
      {
        "what": "She opened everything and replied to nothing",
        "why": "That is interest without permission to act. Ask directly what would need to be true."
      }
    ],
    "when": "Wednesday 16:30"
  },
  "talia": {
    "id": "talia",
    "day": "Thursday",
    "time": "09:30",
    "account": "Talia Foods",
    "person": "Jo Bergström, Operations admin",
    "money": "£61k",
    "renews": "14 Jan",
    "lastSpoke": "1 September",
    "read": true,
    "headline": "Passed 80% of seats, and six weeks out with no sponsor",
    "changed": [
      {
        "date": "1 Sep",
        "dir": "up",
        "text": "Passed 80% of seats. Nothing breaks at 100%, but it is worth knowing first."
      },
      {
        "date": "19 Aug",
        "dir": "up",
        "text": "New admin added, already opening reports weekly."
      },
      {
        "date": "1 Jul",
        "dir": "flat",
        "text": "Usage flat since July, which is normal for them."
      }
    ],
    "promises": [
      {
        "state": "done",
        "text": "Send the seat forecast. Sent 2 September."
      }
    ],
    "asked": [],
    "people": [
      {
        "name": "Jo Bergström",
        "role": "admin",
        "note": "replied 1 Sep. The only person who has ever replied.",
        "onCall": true
      },
      {
        "name": "Nobody",
        "role": "exec sponsor",
        "note": "named in March, gone in June, nobody since.",
        "onCall": false
      }
    ],
    "leave": "Don't fill the half hour. Ending early on a healthy account is a signal in itself.",
    "waiting": null,
    "flag": null,
    "raise": [
      {
        "what": "The seat threshold is a conversation, not a bill",
        "why": "80% with six weeks to renewal. Raise it now and it isn't a surprise later."
      },
      {
        "what": "Name a sponsor",
        "why": "Six weeks out and there hasn't been one since June. Late, but not too late."
      },
      {
        "what": "Nothing else",
        "why": "This is a short call and there is no third thing worth its time."
      }
    ],
    "when": "Thursday 09:30"
  },
  "kestrel": {
    "id": "kestrel",
    "day": "Thursday",
    "time": "14:00",
    "account": "Kestrel Group",
    "person": "Jo Bergström, CFO",
    "money": "£61k",
    "renews": "19 Dec",
    "lastSpoke": "14 August",
    "read": false,
    "headline": "No admin at all since 12 August, and a draft is waiting in your Gmail",
    "changed": [
      {
        "date": "2 Sep",
        "dir": "down",
        "text": "Two nudges sent, neither opened."
      },
      {
        "date": "20 Aug",
        "dir": "down",
        "text": "Weekly active users fell below the band."
      },
      {
        "date": "12 Aug",
        "dir": "down",
        "text": "Both admins left. Nobody has been added since."
      }
    ],
    "promises": [
      {
        "state": "missed",
        "text": "Offer help replacing the admins. Raised internally 14 August, nothing sent."
      }
    ],
    "asked": [],
    "people": [
      {
        "name": "Jo Bergström",
        "role": "CFO",
        "note": "replied 14 Aug. A CFO, which makes her the sponsor if she'll take it.",
        "onCall": true
      }
    ],
    "leave": "Don't mention the two unopened nudges. They didn't land; saying so makes the call about us.",
    "waiting": "A draft is in your Gmail from this morning.",
    "flag": "Draft unsent",
    "raise": [
      {
        "what": "They have no admin at all",
        "why": "Both left on 12 August. This is a concrete thing to offer help with rather than a vague check-in."
      },
      {
        "what": "Ask her to be the sponsor",
        "why": "She is a CFO and she replies. The renewal is 19 December with nobody named."
      }
    ],
    "when": "Thursday 14:00"
  },
  "ardent": {
    "id": "ardent",
    "day": "Friday",
    "time": "15:00",
    "account": "Ardent Rail",
    "person": "Sam Idowu, COO",
    "money": "£39k",
    "renews": "2 Feb",
    "lastSpoke": "6 August",
    "read": false,
    "headline": "34 days silent from the only contact who has ever engaged",
    "changed": [
      {
        "date": "5 Sep",
        "dir": "down",
        "text": "Sam crossed 30 days quiet. Nobody was told — Chase quiet champions is blind."
      },
      {
        "date": "6 Aug",
        "dir": "down",
        "text": "Last thing he opened. Nothing since."
      },
      {
        "date": "12 Jul",
        "dir": "flat",
        "text": "Seats unchanged since June. Usage low but steady."
      }
    ],
    "promises": [
      {
        "state": "missed",
        "text": "Send the integration timeline. Promised on 6 August, five weeks ago."
      }
    ],
    "asked": [
      {
        "state": "missed",
        "text": "Whether the API rate limit can be raised. Asked 6 August, unanswered."
      }
    ],
    "people": [
      {
        "name": "Sam Idowu",
        "role": "COO · the only engaged contact",
        "note": "hasn't opened anything in 34 days, against a 30-day line.",
        "onCall": true
      },
      {
        "name": "Six other named contacts",
        "role": "in HubSpot",
        "note": "none has engaged since May.",
        "onCall": false
      }
    ],
    "leave": "Don't apologise for the silence or lead with the unanswered API question. Ask the direct question while you have him.",
    "waiting": "The assignment that watches this has been blind since 29 August. Nothing was sent and nothing was flagged.",
    "flag": "Watcher blind",
    "raise": [
      {
        "what": "Ask directly whether this is still a priority",
        "why": "Thirty-four days silent from the only person engaged. The polite version wastes the call."
      },
      {
        "what": "Get a second name",
        "why": "Six other contacts, none engaged since May. One contact on a renewal is thin."
      },
      {
        "what": "If he has moved on, say so",
        "why": "A clear no is worth more than another quarter of chasing."
      }
    ],
    "when": "Friday 15:00"
  }
};

CANVAS.renewals = () => `
  <div class="canvas-head">
    <div>
      <h2>Where we have no exec sponsor before renewal</h2>
      <p class="canvas-meta">Rebuilt every Monday · nothing saved, no new object created · +2 in, −1 out this week</p>
    </div>
  </div>

  <div class="rn-summary">
    <div><span class="rn-n">${money(TOTAL)}</span><span class="rn-l">renews with nobody senior named</span></div>
    <div><span class="rn-n">${INSIDE_90}</span><span class="rn-l">are inside 90 days of their notice window</span></div>
    <div><span class="rn-n">${FALLING}</span><span class="rn-l">have usage falling as well</span></div>
    <p class="rn-say">Ordered by what you lose over the time left to save it — value divided by the weeks before notice. Halcyon is £28k a week; Pike &amp; Rowe is £2k.</p>
  </div>

  <div class="table rn-table">
    <div class="row head">
      <span>Account</span><span>Value</span><span>Notice shuts</span><span>Who replies</span>
      <span>Contacts</span><span>Usage</span><span>Why they're thin</span><span></span>
    </div>
    ${RENEWALS.map(
      (r) => `
      <div class="row item rn" data-renewal="${r.account}">
        <span class="rn-acct">${r.account}<em>${r.owner}</em></span>
        <span class="rn-val">${r.valueLabel}<em>${money(r.exposure)}/wk</em></span>
        <span class="rn-when">${r.noticeLabel}<em>${r.daysToNotice} days</em></span>
        <span class="rn-who">${r.replies}<em>${r.repliesRole} · last replied ${r.lastReply}</em></span>
        <span class="rn-contacts">${r.engaged} of ${r.known}<em>reply to anything</em></span>
        <span class="rn-usage ${r.usage}">${TREND[r.usage]} ${r.usage}<em>${r.usageNote}</em></span>
        <span class="rn-why">${r.sponsor}</span>
        <span class="rn-go"><button class="btn sm" type="button" tabindex="-1">Look</button></span>
      </div>`,
    ).join("")}
  </div>

  <p class="canvas-after">A judgement I made: someone counts as a live contact only if they have replied in the last 90 days. HubSpot lists 4 more at Halcyon; none has ever answered, so I left them out. Count them and this drops to 3 accounts.</p>`;

/* One account, in the drawer: the behaviour behind the row. */
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
      <div class="row item draft${r.flag ? " flagged" : ""}">
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

/* THE WRITE LOG — what failed, what changed, then the shape of the rest. */
CANVAS.writes = () => {
  const W = WRITELOG;
  const routine = W.composition.reduce((s, c) => s + c[1], 0);
  const most = Math.max(...W.composition.map((c) => c[1]));
  return `
    <header>
      <div>
        <h2>${W.written} records written today</h2>
        <p>Since ${W.since} · ${W.attempted} attempted, ${W.rejected} rejected · only the ${W.rejected} need you</p>
      </div>
      <button class="icon-btn" type="button" data-close aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>
    <div class="drawer-body">

      <h3>${W.rejected} did not go through</h3>
      ${W.failures
        .map(
          (f) => `
        <div class="wl-fail">
          <div class="wl-fail-top">
            <span class="wl-acct">${f.account}</span>
            <span class="wl-obj">${f.object}</span>
            <span class="wl-when">${f.when}</span>
          </div>
          <p class="wl-err">${f.error}</p>
          <p class="wl-detail">${f.detail}</p>
          <dl class="wl-kv">
            <dt>Queued, not lost</dt><dd>${f.queued}</dd>
            <dt>What it costs meanwhile</dt><dd>${f.cost}</dd>
          </dl>
        </div>`,
        )
        .join("")}
      <div class="canvas-actions"><button class="btn primary" type="button">Map the field once</button><button class="btn" type="button">Stop writing to Salesforce</button></div>
      <p class="wl-note">All three are the same field, added on 2 September. Mapping it once releases every queued write on the next run.</p>

      <h3>${W.consequential.length} of the ${W.written} changed something</h3>
      <p class="wl-note top">These moved a stage, a date, an amount or an owner — the writes that change a number somebody reports on. The other ${routine} recorded what happened without changing anything.</p>
      <div class="table set-table wl-table" style="--set-cols:56px 130px 84px 180px 1fr">
        <div class="row head"><span>Time</span><span>Account</span><span>Field</span><span>Change</span><span>Because</span></div>
        ${W.consequential
          .map((c) => `<div class="row item">${c.map((x, i) => `<span${i === 3 ? ' class="wl-change"' : ""}>${x}</span>`).join("")}</div>`)
          .join("")}
      </div>

      <h3>What the other ${routine} were</h3>
      <div class="wl-comp">
        ${W.composition
          .map(
            (c) => `
          <div class="wl-row">
            <span class="wl-kind">${c[0]}</span>
            <span class="wl-bar"><span style="width:${Math.round((c[1] / most) * 100)}%"></span></span>
            <span class="wl-n">${c[1]}</span>
            <span class="wl-where">${c[3]}</span>
          </div>`,
          )
          .join("")}
      </div>

      <h3>Where they went</h3>
      <ul class="promises">
        ${W.systems.map((x) => `<li class="${x[1] === 20 ? "missed" : "done"}"><span class="pr-s">${x[1]}</span><span>${x[0]} — ${x[2]}</span></li>`).join("")}
      </ul>

      <h3>Which accounts got the most</h3>
      <div class="wl-comp tight">
        ${W.byAccount
          .map(
            (a) => `<div class="wl-row">
              <span class="wl-kind">${a[0]}</span>
              <span class="wl-bar"><span style="width:${Math.round((a[1] / W.byAccount[0][1]) * 100)}%"></span></span>
              <span class="wl-n">${a[1]}</span>
              <span class="wl-where"></span>
            </div>`,
          )
          .join("")}
      </div>
      <p class="wl-note">Roughly what you would expect — the five you worked hardest today. A single account taking a third of the writes is usually a loop, not a busy day.</p>

      <p class="wl-trust">${W.trust}</p>
      <p class="wl-note"><button class="door" type="button" data-log="writes">See the raw feed instead</button> — every record, newest first. Rarely the thing you want.</p>
    </div>`;
};

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

  "Prep my 1:1s": { layout: "sequence", run: "Today, 6:40 am · 1m 42s · closed", noun: "Your week",
    agenda: { name: "Your week", meta: "Eleven recurring customer calls, 14 to 18 September. Each pack is built at 6:40 am from what moved, what you promised, and what they asked for.", say: "Ordered by the diary, not by importance — the packs do the prioritising inside each day. Open a call to read its pack.", figures: [["11", "calls this week"], ["£802k", "of book in the room"], ["5", "packs you haven't opened"]] },
    groups: [
      {
            "label": "Monday",
            "sub": "14 September",
            "count": "3 calls",
            "meta": "£274k",
            "note": "1 pack unread",
            "items": [
                  {
                        "id": "halcyon",
                        "lead": "10:00",
                        "title": "Halcyon",
                        "person": "Ruth Ellery",
                        "headline": "Reporting stopped 43 days ago, both ops admins gone, renewal in 10 weeks",
                        "right": "£142k",
                        "state": "Not opened",
                        "flag": "Draft unsent",
                        "shape": "pack"
                  },
                  {
                        "id": "brightsea",
                        "lead": "11:30",
                        "title": "Brightsea",
                        "person": "Ana Rehn",
                        "headline": "Raised a Series B on 2 September — the ops team is about to double",
                        "right": "£58k",
                        "state": "Read",
                        "flag": null,
                        "shape": "pack"
                  },
                  {
                        "id": "corvus",
                        "lead": "15:00",
                        "title": "Corvus",
                        "person": "Marta Lind",
                        "headline": "One seat from a hard stop, and finance started using it unsold",
                        "right": "£74k",
                        "state": "Read",
                        "flag": null,
                        "shape": "pack"
                  }
            ]
      },
      {
            "label": "Tuesday",
            "sub": "15 September",
            "count": "2 calls",
            "meta": "£121k",
            "note": "",
            "items": [
                  {
                        "id": "cobalt",
                        "lead": "14:00",
                        "title": "Cobalt Systems",
                        "person": "Marta Lind",
                        "headline": "Going well and nobody has told her — she's three weeks into the role",
                        "right": "£88k",
                        "state": "Read",
                        "flag": null,
                        "shape": "pack"
                  },
                  {
                        "id": "trellis",
                        "lead": "16:00",
                        "title": "Trellis",
                        "person": "Nina Okafor",
                        "headline": "Clicked the case study on 27 August and has said nothing since",
                        "right": "£33k",
                        "state": "Read",
                        "flag": null,
                        "shape": "pack"
                  }
            ]
      },
      {
            "label": "Wednesday",
            "sub": "16 September",
            "count": "3 calls",
            "meta": "£246k",
            "note": "2 packs unread",
            "items": [
                  {
                        "id": "meridian",
                        "lead": "11:00",
                        "title": "Meridian Health",
                        "person": "Alex Renn",
                        "headline": "A proposal has been finished and unsent for six days",
                        "right": "£88k",
                        "state": "Read",
                        "flag": "Proposal unsent",
                        "shape": "pack"
                  },
                  {
                        "id": "northwind",
                        "lead": "13:30",
                        "title": "Northwind Rail",
                        "person": "Tom Verity",
                        "headline": "Hiring three ops analysts — the biggest account with no plan against it",
                        "right": "£112k",
                        "state": "Not opened",
                        "flag": null,
                        "shape": "pack"
                  },
                  {
                        "id": "redwing",
                        "lead": "16:30",
                        "title": "Redwing",
                        "person": "Cara Milne",
                        "headline": "A 20% offer has been sitting unsent in your Gmail for nine days",
                        "right": "£46k",
                        "state": "Not opened",
                        "flag": null,
                        "shape": "pack"
                  }
            ]
      },
      {
            "label": "Thursday",
            "sub": "17 September",
            "count": "2 calls",
            "meta": "£122k",
            "note": "1 pack unread",
            "items": [
                  {
                        "id": "talia",
                        "lead": "09:30",
                        "title": "Talia Foods",
                        "person": "Jo Bergström",
                        "headline": "Passed 80% of seats, and six weeks out with no sponsor",
                        "right": "£61k",
                        "state": "Read",
                        "flag": null,
                        "shape": "pack"
                  },
                  {
                        "id": "kestrel",
                        "lead": "14:00",
                        "title": "Kestrel Group",
                        "person": "Jo Bergström",
                        "headline": "No admin at all since 12 August, and a draft is waiting in your Gmail",
                        "right": "£61k",
                        "state": "Not opened",
                        "flag": "Draft unsent",
                        "shape": "pack"
                  }
            ]
      },
      {
            "label": "Friday",
            "sub": "18 September",
            "count": "1 call",
            "meta": "£39k",
            "note": "1 pack unread",
            "items": [
                  {
                        "id": "ardent",
                        "lead": "15:00",
                        "title": "Ardent Rail",
                        "person": "Sam Idowu",
                        "headline": "34 days silent from the only contact who has ever engaged",
                        "right": "£39k",
                        "state": "Not opened",
                        "flag": "Watcher blind",
                        "shape": "pack"
                  }
            ]
      }
],
  },


  "Rank today's list before dialling": { layout: "sequence", run: "Today, 6:40 am · gone at 6 pm", noun: "Today's list, ranked",
    agenda: { name: "Today's list, ranked", meta: "Looked at all 61 accounts at 6:40 am. Eight are worth the morning. Gone at 6 pm — a fresh one is built tomorrow.", say: "Ranked by what today changes, not by value. The last group is what it deliberately left off, and why.", figures: [["8", "worth ringing today"], ["65 min", "for all of them"], ["53", "have nothing new"]] },
    groups: [
      {
            "label": "Ring these first",
            "sub": "before 10:00",
            "count": "3 calls",
            "meta": "about 30 min",
            "note": "today matters for all three",
            "items": [
                  {
                        "id": "halcyon-d",
                        "lead": "1",
                        "title": "Halcyon",
                        "person": "Ruth Ellery",
                        "headline": "Both ops admins gone 43 days and the renewal is 10 weeks out. Highest value at risk on the book.",
                        "right": "12 min",
                        "state": null,
                        "flag": null,
                        "shape": "dial"
                  },
                  {
                        "id": "ferrovia-d",
                        "lead": "2",
                        "title": "Ferrovia",
                        "person": "Marc Oyelaran",
                        "headline": "Eight days from go-live and it hasn't moved since 21 August. Three emails, no reply to any.",
                        "right": "10 min",
                        "state": null,
                        "flag": "Handed over",
                        "shape": "dial"
                  },
                  {
                        "id": "kestrel-d",
                        "lead": "3",
                        "title": "Kestrel Group",
                        "person": "Jo Bergström",
                        "headline": "Two nudges unopened, and a draft is already sitting in your Gmail. Ring first, then send it.",
                        "right": "8 min",
                        "state": null,
                        "flag": "Draft unsent",
                        "shape": "dial"
                  }
            ]
      },
      {
            "label": "Rest of the morning",
            "sub": "",
            "count": "3 calls",
            "meta": "about 24 min",
            "note": "",
            "items": [
                  {
                        "id": "meridian-d",
                        "lead": "4",
                        "title": "Meridian Health",
                        "person": "Alex Renn",
                        "headline": "Ticket 4412 has been open nine days with no reply from us. They will raise it on Thursday if you don't.",
                        "right": "8 min",
                        "state": null,
                        "flag": null,
                        "shape": "dial"
                  },
                  {
                        "id": "talia-d",
                        "lead": "5",
                        "title": "Talia Foods",
                        "person": "Jo Bergström",
                        "headline": "Renewal is six weeks out with no exec sponsor named, and they passed 80% of seats on 1 September.",
                        "right": "10 min",
                        "state": null,
                        "flag": null,
                        "shape": "dial"
                  },
                  {
                        "id": "redwing-d",
                        "lead": "6",
                        "title": "Redwing",
                        "person": "Cara Milne",
                        "headline": "A 20% offer was written nine days ago and never sent. Decide what you're doing before you ring.",
                        "right": "6 min",
                        "state": null,
                        "flag": "Offer unsent",
                        "shape": "dial"
                  }
            ]
      },
      {
            "label": "If you have time",
            "sub": "",
            "count": "2 calls",
            "meta": "about 11 min",
            "note": "",
            "items": [
                  {
                        "id": "ardent-d",
                        "lead": "7",
                        "title": "Ardent Rail",
                        "person": "Sam Idowu",
                        "headline": "Thirty-four days silent from the only contact who has ever engaged. A clear no is worth more than another quarter.",
                        "right": "6 min",
                        "state": null,
                        "flag": "Watcher blind",
                        "shape": "dial"
                  },
                  {
                        "id": "pike-d",
                        "lead": "8",
                        "title": "Pike & Rowe",
                        "person": "Ben Achebe",
                        "headline": "Hiring two analytics engineers, which is a warm reason to call rather than a problem to fix.",
                        "right": "5 min",
                        "state": null,
                        "flag": null,
                        "shape": "dial"
                  }
            ]
      },
      {
            "label": "Left off on purpose",
            "sub": "53 accounts",
            "count": "4 worth saying",
            "meta": "",
            "note": "",
            "items": [
                  {
                        "id": null,
                        "lead": "—",
                        "title": "Corvus",
                        "person": "",
                        "headline": "You speak to Marta on Monday at 15:00. Ringing today duplicates the call.",
                        "right": "",
                        "state": null,
                        "flag": null,
                        "open": false
                  },
                  {
                        "id": null,
                        "lead": "—",
                        "title": "Lowen &amp; Bray",
                        "person": "",
                        "headline": "Nina said “not now, try me in the new year” on 19 August. A second approach in three weeks costs more than it gains.",
                        "right": "",
                        "state": null,
                        "flag": null,
                        "open": false
                  },
                  {
                        "id": null,
                        "lead": "—",
                        "title": "Brightsea",
                        "person": "",
                        "headline": "They raised last week and a meeting ask is already drafted and waiting on your approval. Send that first.",
                        "right": "",
                        "state": null,
                        "flag": null,
                        "open": false
                  },
                  {
                        "id": null,
                        "lead": "—",
                        "title": "Cobalt Systems",
                        "person": "",
                        "headline": "Nothing has changed since you spoke on 1 September.",
                        "right": "",
                        "state": null,
                        "flag": null,
                        "open": false
                  }
            ]
      }
],
  },


  /* ---- GRID — collapses to one table ------------------------------------ */

  "Confirm exec sponsor involvement before renewal": { layout: "grid", run: "Monday 8 Sep, 6:40 am", single: { shape: "renewals" } },

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
    proof: [["412", "records written today", "6 of them changed something · 3 more did not go through", "WRITES"],
            ["41,000", "this quarter", "against 38,200 last quarter", "quarter"],
            ["3", "writes rejected", "all three Salesforce, same required field — one fix releases all three", "WRITES"],
            ["0", "people opened its output", "there is no output to open"]],
    cost: null,
    normally: "grid",
    normallyNote: "The log itself is a table you can open, but nobody does — and nobody should have to." } },

  /* ---- BATCH — column 2 stays -------------------------------------------- */

  "Chase quiet champions": { layout: "batch", run: "Today, 6:40 am · 3s · produced nothing", single: { shape: "chase" } },

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
