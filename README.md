# Assignments

An interactive prototype of Trig's assignments surface — the dashboard, the
assignment navigator, and the builder. Vanilla ES modules, no framework and no
build step, so it runs from any static server.

## Running it

```bash
python3 serve.py
```

Then open <http://127.0.0.1:8123>.

`serve.py` is a plain `SimpleHTTPRequestHandler` that sends `Cache-Control:
no-store`. That matters: `python -m http.server` caches aggressively, and a
stale stylesheet looks exactly like a CSS bug you have already fixed.

## Where things are

| | |
|---|---|
| `index.html` | The dashboard: Needs you, Assignments, Reports |
| `assignments.html` · `needs.html` · `reports.html` | The same sections as their own pages |
| `shell.js` | Logo bar, rail and sub-nav, and the SideNav interaction |
| `assignments.js` | The nine assignments, the list, and the three-column navigator |
| `stepped.js` | Every canvas the navigator renders, plus the run data |
| `builder.js` | Add an Assignment: one question, then a brief you correct |
| `drawer.js` | One drawer, shared by every surface that needs one |
| `needs.js` · `reports.js` · `filter.js` | Needs action, reports, the teammate filter |
| `cohort.js` · `champions.js` · `renewals.js` · `logs.js` | Fixture data |
| `styles.css` | Tokens and components. No literal font sizes; one gutter token |

## Checks

```bash
node check.mjs
```

Everything on screen is computed from the fixtures rather than typed beside
them, so the arithmetic cannot drift. `check.mjs` holds the invariants that
rendering alone does not catch:

- every assignment opens to a pane, from every prior selection
- every count is a door, and every door resolves to a real set or log
- no pane renders drawer chrome, and every drawer can be closed
- every `data-*` hook is read by a handler or selected by the stylesheet
- every class in the markup has a rule
- the section gutter comes from `--gutter`, never a literal

It uses the app's own `resolve()` rather than a copy, because a check that
reimplements the thing it is checking will pass while the real path is broken.
