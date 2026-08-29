# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Static site, no build step, no dependencies, no package manifest. `js/app.js` is loaded as an ES module (`<script type="module">`), so `index.html` must be served over `http://`, not opened via `file://` — use VS Code's Live Server (or any static file server). There are no lint or test commands; verification is manual (see the Phase 1 plan's verification checklist if present, or exercise the form directly in a browser).

## Architecture

The form is schema-driven so future sheet types (Phase 1 covers Abdominal only; ~14 more are planned per `DESIGN.md` §8) can be added as new data files rather than hand-coded markup:

- `data/abdominalSheet.js` — the only Abdominal-specific file. Exports a plain object describing sections and fields (id, label, `type`, `unit`, `options`, `reveal`, `hiddenByDefault`, `row`). A new sheet type means writing a new file in this shape and pointing `js/app.js` at it.
- `js/formRenderer.js` — generic schema → DOM renderer. Dispatches on `field.type` (`text`/`number`/`date`/`select`/`radio`/`checkbox`/`checkbox-group`/`textarea`/`computed`) to build real, natively-focusable semantic elements (`<fieldset>`/`<legend>` for grouped rows and option groups, `<label for>` on every input — no div-based fake controls). `number` fields get `step="0.1"` (measurements are recorded in tenths of a centimeter). Also exports `flattenFields(schema)`, the shared helper other modules use to walk every field regardless of section.
- `js/fieldReveal.js` — generic conditional-reveal engine. A field's own `type` determines whether *it* fires reveals on `blur` (text/number/date) or `change` (select/radio/checkbox/checkbox-group) — this mapping is fixed and applies to any future schema, not just Abdominal. Reveal targets are looked up by `field-wrap-<id>` and shown/hidden via the `hidden` attribute (removes them from the tab order and a11y tree) plus a `.is-visible` class that CSS transitions for the animate-in (see the `.reveal-target` grid-rows trick in `css/styles.css`). The Aorta rule (any of three measurements ≥3.5cm) doesn't fit the generic one-trigger-per-field model, so it's handled as a `schema.groupReveals` entry instead — this is the pattern to extend if a future sheet needs another multi-field trigger.
- `js/ageCalculator.js` — one-off wiring (not schema-driven) for the Demographics Age `<output>`, recomputed on blur of DOB/Date-of-Exam.
- `js/clearForm.js` — `clearSheet(schema)` walks `flattenFields` to blank every field and re-collapse revealed sections; `initClearButton` wires the Clear button to a custom confirm modal (static markup in `index.html`, not `window.confirm()`). `clearSheet` takes a schema argument specifically so a future "switch sheet type" feature can call it before swapping schemas.
- `js/printView.js` — reads current values straight from the live DOM (no separate app-state object) and writes them into a new window with its own self-contained, print-friendly light theme (deliberately not the app's dark on-screen palette). Any field with no value is dropped from the printout entirely (not shown blank), and a section with nothing to print is skipped along with its heading — unless a field defines `emptyPrintText` (e.g. Gallbladder Findings' "No abnormalities noted"), a schema-level, non-diagnostic placeholder for "checked, nothing flagged" that prints in place of an empty checkbox-group. Layout is: Demographics (split into two fixed columns — see `DEMOGRAPHICS_LEFT_IDS`/`DEMOGRAPHICS_RIGHT_IDS`, a patient-identity vs. this-visit-details grouping) plus Physician Interpretation when it has content, both full-width up top; then a full-width "Findings" title followed by the remaining sections flowing into two CSS-column-count'd columns; Technologist Comments always trails as its own full-width block at the end. A divider rule is inserted only between blocks that actually rendered content. If Physician Interpretation has content it's promoted to right after Demographics; if empty, its section is omitted from the printout entirely rather than shown blank.
- `js/app.js` — bootstraps the above against `abdominalSheet` and wires the Print/Clear toolbar buttons.

When adding a field type or reveal pattern, extend the generic modules above rather than special-casing the Abdominal schema in the renderer/reveal engine — that reuse is the whole point of the schema-driven design.

## Project Purpose

Internal web app for ultrasound technologists to fill out digital "tech sheets" during patient studies, replacing paper/PDF forms currently in use. The form must respond to inputs dynamically (revealing conditional fields), generate a downloadable/printable PDF, and eventually support a preliminary interpretation workflow for physicians to sign off on or edit.

Phase 1 scope is the **Abdominal Ultrasound** sheet only, but the architecture must anticipate ~15 total sheet types (8 common) being added later — see Architecture Note below.

## Design Reference

Full design spec lives in [DESIGN.md](DESIGN.md). Key points future work must respect:

- **Architecture**: Favor a reusable field/section component pattern over one-off hand-coded HTML per form, so future sheet types can be added primarily as configuration/content rather than new engineering.
- **Color palette**: dark charcoal/navy background (`#26335E`), lighter card background (`#394D8F`), soft white text (`#E9EBF0`), muted gray-white secondary text (`#AFB0B3`), amber accent (`#FAA946`), red error/validation (`#9E0202`).
- **Typography**: system font stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Layout**: sections per organ/finding area; related measurements for one organ grouped in a horizontal row within a card; standalone measurements as single fields; numeric inputs use `<input type="number">` with the unit shown in the label, not typed by the user.
- **Conditional field reveal timing**: number fields reveal dependents on **blur** (not while typing); selection fields (dropdown/radio/checkbox) reveal dependents on **change** (immediately). Revealed fields animate in smoothly, no jump/reflow.
- **Field-specific rules**: Aorta dissection/iliacs fields reveal if Prox/Mid/Dist ≥ 3.5cm (any segment, checked on blur of any of the three) and **re-hide reactively** if a later edit brings all three back below the threshold — confirmed with the user over `DESIGN.md`'s more ambiguous "reveal ONCE" wording, which read as a single combined trigger check across the three fields rather than a permanent one-time reveal; Sex field has a fixed option list including a free-text reveal for "Other"; Prior Study's date field is a real `date` input (single specific date only, not a range/interval); Physician Interpretation is a toggle-revealed textarea (content/workflow deferred).
- **Print/PDF export**: opens a new window/tab with a clean print-formatted HTML/CSS view of the filled data and calls `window.print()` — do not use a JS PDF-generation library. The window stays open (doesn't auto-close) so the tech can review before saving/closing. Layout is intentionally denser than the on-screen form (see `js/printView.js` above for the current column/section structure) — the on-screen editing experience itself is never touched to achieve this.
- **Clear button**: clears all fields, gated behind a custom-styled confirmation modal (not a native `confirm()`), implemented as a reusable function so future sheet-switching can reuse it.
- **Explicitly out of scope for Phase 1**: auto-population of Technologist Comments from measurement thresholds (planned Phase 2 — do not implement yet, but the field must exist as a plain textarea), Physician Interpretation content/workflow, additional sheet types beyond Abdominal, and any backend/database/account system or persistence (export is print/PDF only).

When scaffolding the project or making structural decisions, prioritize the reusable field/section component pattern called out above — it's the core architectural constraint for this codebase.
