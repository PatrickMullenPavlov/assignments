/* One drawer, shared.

   Needs you built its own; the assignment report needs the same thing for
   "who were the 41?". Rather than a second implementation, this owns the
   element, the scrim, the open/close and Escape — callers supply markup
   and attach their own delegated click handler to the element.          */

let drawer = document.querySelector("#drawer");
let scrim = document.querySelector("#scrim");

if (!scrim) {
  scrim = document.createElement("div");
  scrim.id = "scrim";
  scrim.dataset.open = "false";
  document.body.append(scrim);
}
if (!drawer) {
  drawer = document.createElement("aside");
  drawer.id = "drawer";
  drawer.dataset.open = "false";
  drawer.setAttribute("aria-label", "Detail");
  document.body.append(drawer);
}

const closers = new Set();

export const drawerEl = drawer;

export function showDrawer(html, onClose) {
  drawer.innerHTML = html;
  drawer.dataset.open = "true";
  scrim.dataset.open = "true";
  if (onClose) closers.add(onClose);
  drawer.querySelector("[data-close]")?.focus();
}

export function hideDrawer() {
  drawer.dataset.open = "false";
  scrim.dataset.open = "false";
  closers.forEach((fn) => fn());
  closers.clear();
}

scrim.addEventListener("click", hideDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.dataset.open === "true") hideDrawer();
});
drawer.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) hideDrawer();
});
