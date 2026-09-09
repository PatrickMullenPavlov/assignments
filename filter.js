/* The teammate filter.

   "All" is the team. Picking a person re-scopes the page to their book.

   The hard part is that a Needs you row's subject decides whether a person
   filter even applies:

     account     has an owner — filter on it                    clean
     person      belongs to an account — filter on its owner    clean
     assignment  spans many books; the assignment has a creator,
                 not an owner                                   ambiguous
     tool        workspace-level, belongs to nobody             ambiguous

   Hiding the ambiguous two would be wrong: filter to Mia and "Chase quiet
   champions is blind" disappears, while 4 of her champions go unwatched
   and she never learns why. Showing them unchanged is also wrong — her
   list stops being hers.

   So a filter does not remove those rows, it RE-SCOPES them. HubSpot stays
   in Mia's list and reads "12 of your accounts have had nothing checked
   since 29 August" instead of "61 accounts". If a rep's share is zero, the
   row drops out — which is why Win back lapsed trials, whose cohort is
   empty, appears only under All.                                          */

export const REPS = ["Lazlo", "Mia", "Cabbage Mick", "Yan", "Kish"];

let current = "All";
const listeners = new Set();

export function currentRep() {
  return current;
}

export function onFilterChange(fn) {
  listeners.add(fn);
  fn(current);
}

function set(rep) {
  if (rep === current) return;
  current = rep;
  document.body.dataset.rep = rep;
  listeners.forEach((fn) => fn(current));
}

const tabs = document.querySelectorAll(".tabs a:not(.add)");
tabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();
    tabs.forEach((t) => t.removeAttribute("aria-current"));
    tab.setAttribute("aria-current", "true");
    set(tab.textContent.trim());
  });
});

document.body.dataset.rep = current;
