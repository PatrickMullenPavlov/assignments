/* The shell — logo bar, rail, sub-nav — rendered once and shared by every
   page, so four HTML files can't drift apart.

   Dashboard's sub-nav mirrors the sections on the dashboard itself, and
   each one opens a page dedicated to that content type. A section on the
   dashboard and its own page are the same list, composed differently.

   Interaction ported from frontend/src/layout/components/SideNav:
     - hovering a rail icon opens that section's panel immediately
     - leaving closes it after CLOSE_DELAY (150ms in the app)
     - moving into the panel cancels that timeout
     - pinned, hover no longer moves the panel; it shows the ACTIVE section
     - pinned puts the panel in the layout, unpinned it overlays           */

const CLOSE_DELAY = 150;

const SECTIONS = {
  dashboard: {
    name: "Dashboard",
    icon: "nav-accelerate.svg",
    items: [
      { id: "needs", label: "Needs you", href: "needs.html" },
      { id: "assignments", label: "Assignments", href: "assignments.html" },
      { id: "reports", label: "Reports", href: "reports.html" },
    ],
  },
  audiences: {
    name: "Audiences",
    icon: "nav-explore.svg",
    items: [
      { id: "organisations", label: "Organisations", href: "#" },
      { id: "people", label: "People", href: "#" },
      { id: "cohorts", label: "Cohorts", href: "#" },
    ],
  },
  journeys: {
    name: "Journeys",
    icon: "nav-reports.svg",
    items: [
      { id: "enterprise", label: "Enterprise onboarding", href: "#" },
      { id: "expansion", label: "Multi-product expansion", href: "#" },
      { id: "selfserve", label: "Self-serve", href: "#" },
    ],
  },
  settings: {
    name: "Settings",
    icon: "nav-integrations.svg",
    items: [
      { id: "teams", label: "Teams and people", href: "#" },
      { id: "integrations", label: "Integrations", href: "#" },
      { id: "policies", label: "Policies", href: "#" },
    ],
  },
};

const PIN_ICON =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18.7 19.5-7.5-7.5 7.5-7.5"/><path d="m11.2 19.5-7.5-7.5 7.5-7.5"/></svg>';

const activeSection = document.body.dataset.section ?? null;
const activePage = document.body.dataset.page ?? null;

/* --------------------------------------------------------------- markup */

const mount = document.querySelector("[data-shell]");

mount.insertAdjacentHTML(
  "beforebegin",
  `<div class="logobar"><a href="index.html"><img src="assets/trig.svg" alt="Trig"></a></div>`,
);

mount.insertAdjacentHTML(
  "afterbegin",
  `<nav class="rail" aria-label="Sections">
    ${Object.entries(SECTIONS)
      .map(
        ([id, s]) =>
          `<a href="${id === "dashboard" ? "index.html" : "#"}" data-section="${id}"${
            id === activeSection ? ' aria-current="page"' : ""
          } title="${s.name}"><img src="assets/${s.icon}" alt="${s.name}"></a>`,
      )
      .join("")}
  </nav>
  <aside class="subnav" data-open="false" aria-label="Section">
    <header>
      <h2></h2>
      <button class="pin" type="button" aria-pressed="false" title="Keep open">${PIN_ICON}</button>
    </header>
    <ul></ul>
  </aside>`,
);

/* ---------------------------------------------------------- interaction */

const rail = document.querySelector(".rail");
const panel = document.querySelector(".subnav");
const app = document.querySelector(".app");
const title = panel.querySelector("h2");
const list = panel.querySelector("ul");
const pinButton = panel.querySelector(".pin");

let hovered = null;
let pinned = false;
let closeTimer = null;

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function render() {
  const shown = pinned ? activeSection : hovered;
  app.dataset.pinned = String(pinned);

  if (!shown || !SECTIONS[shown]) {
    panel.dataset.open = "false";
    return;
  }

  const section = SECTIONS[shown];
  title.textContent = section.name;
  list.replaceChildren(
    ...section.items.map(({ id, label, href }) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      if (shown === activeSection && id === activePage) a.setAttribute("aria-current", "page");
      li.append(a);
      return li;
    }),
  );
  panel.dataset.open = "true";
}

rail.querySelectorAll("a[data-section]").forEach((link) => {
  link.addEventListener("mouseenter", () => {
    cancelClose();
    if (pinned) return;
    hovered = link.dataset.section;
    render();
  });
  link.addEventListener("mouseleave", () => {
    if (pinned) return;
    closeTimer = setTimeout(() => {
      hovered = null;
      render();
    }, CLOSE_DELAY);
  });
});

panel.addEventListener("mouseenter", cancelClose);
panel.addEventListener("mouseleave", () => {
  if (pinned) return;
  closeTimer = setTimeout(() => {
    hovered = null;
    render();
  }, CLOSE_DELAY);
});

pinButton.addEventListener("click", () => {
  pinned = !pinned;
  pinButton.setAttribute("aria-pressed", String(pinned));
  pinButton.title = pinned ? "Unpin" : "Keep open";
  if (!pinned) hovered = null;
  render();
});

render();
