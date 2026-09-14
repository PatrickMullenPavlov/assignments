/* A DOM small enough to load the modules that touch one, and to fire a click.

   check.mjs could not see builder.js at all, because importing it throws
   without a document — so a ReferenceError inside a template sat there
   through two commits while every other check stayed green. The button did
   nothing and nothing said so.

   This is not a browser. It is enough to prove a module loads, a handler
   registers, and the markup a click produces is not empty. */

const handlers = { click: [], change: [], submit: [], keydown: [] };

export const el = (over = {}) => ({
  innerHTML: "",
  dataset: {},
  style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, replaceChildren() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener(type, fn) { (handlers[type] ??= []).push(fn); },
  removeEventListener() {},
  setAttribute() {}, removeAttribute() {}, toggleAttribute() {},
  focus() {}, contains: () => true, closest: () => null, matches: () => false,
  ...over,
});

const drawer = el();

globalThis.document = {
  querySelector: (s) => (s === "#drawer" || s === "#scrim" ? drawer : null),
  querySelectorAll: () => [],
  createElement: () => el(),
  addEventListener(type, fn) { (handlers[type] ??= []).push(fn); },
  body: el(),
};
globalThis.window = { addEventListener() {}, location: { pathname: "/", search: "" } };
globalThis.location = globalThis.window.location;
globalThis.history = { replaceState() {} };

/** Fire a click whose target answers to one selector, carrying a dataset.
   `data` is what the handler will read off the matched element — the click
   on an example chip needs its index, or nothing renders. */
export function click(selector, data = {}) {
  const hit = el({ dataset: data });
  const target = el({ closest: (s) => (s === selector ? hit : null), dataset: data });
  for (const fn of handlers.click) {
    try {
      fn({ target, preventDefault() {} });
    } catch (e) {
      return e;
    }
  }
  return null;
}

export const drawerHTML = () => drawer.innerHTML;
export const counts = () => ({ click: handlers.click.length });
