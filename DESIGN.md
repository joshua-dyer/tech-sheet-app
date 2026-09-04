# Tech Sheet App — Design Doc

## 1. Purpose
Internal web app for ultrasound technologists to fill out digital tech
sheets during patient studies, replacing paper forms. Sleek, professional,
fast to use. Phase 1 covers the Abdominal Ultrasound sheet only; the
architecture should anticipate additional ultrasound-type sheets being
added later (~15 total, 8 common).

## 2. Color Palette

| Role | Color | Hex |
|---|---|---|
| Background (primary) | Charcoal/Navy | 26335E  |
| Background (card/section) | Slightly ligher than primary bg, for depth | 394D8F |
| Text (primary) | Soft White | E9EBF0 |
| Text (secondary/label) | muted gray-white, lower emphasis | AFB0B3 |
| Accent | Links, active states | FAA946 |
| Error/validation | Attention-getting  | 9E0202 |

## 3. Typography
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

## 4. Layout Principles
- Organized into clearly labeled sections: Demographics, then each organ/
  finding area
- Related measurements for a single organ (Aorta, Kidneys, Pancreas) are
  grouped into a horizontal row within a labeled card/sub-section
- Standalone single measurements (Liver, CBD, Spleen) are single fields
- Numeric fields: `<input type="number">`, unit (cm) shown via label, not
  typed by user
- Conditional/dependent fields:
  - Number fields reveal dependents ON BLUR (not while typing)
  - Selection fields (dropdown, radio, checkbox) reveal dependents ON
    CHANGE (immediately)
  - Revealed fields should animate in smoothly (not just jump/reflow)
- Mobile-friendly, but primary usage is expected on desktop/tablet in a
  clinical setting


## 5. Navigation & Multi-Sheet Architecture

### Structure
- Each tech sheet is its own standalone HTML page (e.g. index.html for
  Abdominal, thyroid.html for Thyroid), not a single-page app. This
  keeps each sheet's codebase independently readable and self-contained.
- Shared behaviors (Clear button + confirmation modal, print/PDF export
  mechanism, Demographics field pattern, general card/section styling)
  live in shared CSS/JS files, referenced by every sheet page — not
  duplicated per-file, but not merged into a single-page app either.

### Nav Menu
- A persistent nav bar/menu, present on every sheet page, listing all
  available tech sheets, allowing the tech to switch between them
- Visually consistent with the card-based, dense-but-clean language
  established for Research Directory and this app generally
- The current/active sheet should be visually indicated in the nav
  (matching the active-state pattern already used elsewhere)

### Switching Behavior
- Since each sheet is a separate page, switching sheets is a normal page
  navigation (link/anchor), not a JS state swap
- Before navigating away, if the current sheet has any entered data,
  trigger the same Clear confirmation modal used for the Clear button
  (per Section 6) — framed appropriately (e.g. "You have unsaved data
  on this sheet. Switching sheets will lose this data. Continue?")
  rather than assuming data loss is silent
- If the current sheet is empty, navigate directly with no confirmation
  needed

### Phase Scope
- This phase builds: the nav menu itself, the Abdominal sheet (already
  complete) properly wired into the nav, and a Thyroid sheet SHELL
  (page exists, Demographics + nav work, but full Thyroid field content
  per Section 8 is a separate, subsequent prompt)





## 6. Field Behavior Rules
- Aorta: dissection/iliacs fields reveal ONCE if any of Prox/Mid/Dist is
  ≥3.5cm, regardless of which segment triggers it
- Sex field options: Male, Female, Non-binary, Transgender Male,
  Transgender Female, Choose not to identify, Other (reveals a short
  free-text field)
- Technologist Comments: free-text large textarea in phase 1
- Physician Interpretation: toggle/checkbox reveals a text area; content
  work deferred


## 7. Data Actions (Print/PDF & Clear)

### Print / PDF Export
- A button triggers export of the current form data
- Implementation: open a new window/tab containing a clean, print-
  formatted HTML/CSS view of the filled data, then call window.print()
  so the tech can choose "Save as PDF" via the browser's native print
  dialog. Do not use a JS PDF-generation library for this phase.
- The new window/tab should retain the rendered data on screen (not
  auto-close after printing) so the tech can visually review for errors
  before closing it or saving.

### Clear Button
- Empties all fields on the current sheet
- Gated behind a custom confirmation modal (styled to match the app's
  palette — not a plain browser confirm() dialog), asking the tech to
  confirm before clearing
- Built as a reusable function: switching to a different tech sheet
  type (future phase) will call this same clear behavior before loading
  the new sheet

### Physician Interpretation Section

- A checkbox/toggle enables the Physician Interpretation section on the
  entry screen (always visible/editable regardless of checkbox state)
- When enabled, reveals:
  - A physician name dropdown, defaulting to "Other - enter manually"
    on load (since no names are pre-populated yet) — selecting this
    option reveals a text field for manual entry. The dropdown list
    itself should be built from a simple array/list structure so
    specific physician names can be added later without restructuring
  - A text field for the Physician's Impression content
- Print behavior:
  - Only affects the PRINT output — Technologist Comments remains fully
    visible/editable on the entry screen at all times
  - If the checkbox is checked, Technologist Comments is suppressed
    from print entirely, and the Physician Interpretation section is
    shown in its place — even if the impression text is blank (this is
    intentional: an empty section signals to the tech that something
    was missed)
  - The Physician Interpretation section is positioned at the top of
    the print output, directly below Demographics and before the
    Ultrasound Findings section
  - The physician's name (selected or manually entered) prints as part
    of this section
  - Below the impression text, with clear visual spacing (not crammed
    against the text), include a signature line, with the physician's
    name printed just beneath it — a standard signature block
  - If the checkbox is unchecked, print output is unchanged from
    current behavior (Technologist Comments appears in its normal
    position)

## 8. Diagram Markup Feature (Thyroid, Carotid, Arterial sheets)

Some sheets (not Abdominal) include a fixed anatomical diagram that
technologists freehand-mark to indicate points of interest. This section
defines the shared behavior for that feature across all sheets that use
it.

### Assets
- Diagrams are simple, abstract, standard (not patient-specific) images
- Provided as transparent-background PNGs

### Activation
- Each diagram has an "Enable Markup" checkbox, unchecked by default
- When unchecked, the diagram is static/inert — no drawing possible,
  no interference with normal form navigation
- When checked, the diagram becomes an active drawing surface
- Clicking/touching outside the image boundary while active
  automatically unchecks "Enable Markup" (assumes the tech is moving on
  to other fields)

### Input handling
- Must support Apple Pencil, mouse, trackpad, and direct touch
  equivalently — implement via the Pointer Events API rather than
  separate mouse/touch handlers, to avoid inconsistent behavior across
  devices

### Drawing behavior
- Freehand strokes only — no typed/keyboard text input
- Color: bright red, fixed (not user-selectable)
- Each stroke is tracked as a discrete, undoable unit (not flattened
  into a single static image while editing)
- Thyroid sheet: technologist draws a circle plus a freehand-written
  number (e.g. "1") to correspond with a nodule table elsewhere on the
  sheet — this is a purely manual/visual convention, NOT auto-numbered,
  and does NOT link/sync to the table programmatically
- Carotid/Arterial sheets: technologist draws freehand scribble marks
  directly over the area of plaque/stenosis — no numbering, anatomical
  meaning is clear from placement and reinforced in Technologist
  Comments
- Often no marks are made at all if there's nothing to flag — this must
  remain fully optional with no required interaction

### Undo / Clear
- "Undo" removes the most recently drawn stroke only
- "Clear" removes all strokes on that diagram
- Both should be scoped per-diagram if a sheet has more than one

### Print / PDF output
- The diagram and all drawn strokes must be flattened into a single
  static image for print (e.g. via canvas export) and preserved in the
  print/PDF output
- The red stroke color MUST be preserved in print/PDF output — this is
  a deliberate exception to typical print-color-reduction practices,
  since many sites keep these as PDFs/digital images rather than
  printing on paper, and the red is functionally important for
  visibility, not decorative

## 9. Thyroid Sheet — Fields & Scoring

### Lobe Measurements
- Right Lobe: Length, Width, Height (cm) — grouped horizontally, same
  pattern as Abdominal's Kidney sections
- Right Lobe Volume: auto-calculated, read-only display field
  = Length × Width × Height × 0.479
- Left Lobe: Length, Width, Height (cm) — same grouping and auto-volume
  calculation as Right Lobe
- Isthmus Diameter (mm)

### Appearance Section
- Overall Texture: radio buttons — Homogeneous / Inhomogeneous
- Hypervascularity: checkbox
- Print behavior: this section always prints an Overall Texture line.
  If Hypervascularity is checked, add a "Hypervascularity noted" line
  to this section; if unchecked, print nothing additional. (Note: both
  fields are good candidates for Phase 2 auto-population into
  Technologist Comments, deferred per existing Phase 2 scope.)

### Diagram Markup
Uses the shared Diagram Markup feature defined in Section 7. The
thyroid diagram contains two views (transverse butterfly + longitudinal)
in a single image; markup is a single canvas over the full image with
no per-view awareness needed. Technologists may draw the same numbered
nodule circle on both views.

### Nodule Table
- Dynamic, repeatable table. Starts with a single blank row and an
  "Add Row" button to append additional rows as needed.
- Each row includes a "Delete Row" control to remove that row directly
  (faster than manually clearing a mis-entered row).
- Columns: Nodule #, Size (mm), Composition, Echogenicity,
  Taller-than-wide, Margins, Echogenic Foci, Total Points, TIRADS Level
- Nodule # auto-numbers based on row position/order
- Size: manual entry (dimensions, e.g. axial x transverse x
  longitudinal in mm, matching the paper sheet's "__x__x__" format)
- Composition, Echogenicity, Taller-than-wide, Margins, and Echogenic
  Foci are each a DROPDOWN (not radio buttons, to keep table rows
  compact) with options matching the Scoring Key below. Each dropdown
  option should display its point value alongside the label (e.g.
  "Solid (2 pts)"), and once selected, the row should visibly show
  that value contributing to the total — this must be transparent and
  traceable, not a hidden calculation, since some interpreting
  physicians review and adjust scoring live while reading directly from
  this page.
- Total Points: auto-summed from the five scored dropdowns for that row,
  read-only, updates live as selections change
- TIRADS Level: auto-derived from Total Points per the Scoring Key
  below, read-only, updates live

### Scoring Key
Displayed below the table, compact/small text, columns aligned to match
the table above:

| Category | Options → Points |
|---|---|
| Composition | Cystic/Spongiform: 0, Mixed: 1, Solid: 2 |
| Echogenicity | Anechoic: 0, Hyperechoic/Isoechoic: 1, Hypoechoic: 2, Very Hypoechoic: 3 |
| Taller-than-wide | No: 0, Yes: 3 |
| Margins | Smooth/Ill-defined: 0, Lobulated/Irregular: 2, Extra-thyroid extension: 3 |
| Echogenic Foci | None/Comet-tail: 0, Macro: 1, Peripheral: 2, Punctate: 3 |

TIRADS Level from Total Points:
- <2: Benign
- 2: TR2 — Not Suspicious
- 3: TR3 — Mildly Suspicious
- 4–6: TR4 — Moderately Suspicious
- 7+: TR5 — Highly Suspicious

### Print Behavior
- Blank rows are omitted from print entirely
- If the table's first/only row is unfilled, omit the entire Nodule
  Table section from print (headers, scoring key, everything)
- "Add Row" / "Delete Row" controls never appear in print, regardless
  of table content




  ## 10. Explicitly Out of Scope (Phase 1)
- Auto-population of Technologist Comments based on measurement values
  (Liver >16.5cm, Kidney Cortex <1.3cm, Spleen ≥13cm) — this is planned
  for Phase 2, after the visual/layout design is finalized. Do not
  implement the auto-population logic yet, but the Technologist Comments
  field should exist as a plain textarea now.
- Physician Interpretation content/workflow
- Additional ultrasound sheet types beyond Abdominal are not part of this
  phase's build, but Thyroid (with the diagram markup feature from
  Section 7) is the planned next phase, to begin after Abdominal has
  been tested in real use.
- Data persistence via backend/database (export is handled via the
  Print/PDF feature in Section 6, not stored anywhere at this time)
- Any backend, database, or account system

## 11. Architecture Note
Build with reuse in mind: this is the first of ~15 planned tech sheets
(8 common). Favor a reusable field/section component pattern over
one-off hand-coded HTML per form, so future sheet types can be added
primarily as configuration/content rather than new engineering.