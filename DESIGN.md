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

## 5. Field Behavior Rules
- Aorta: dissection/iliacs fields reveal ONCE if any of Prox/Mid/Dist is
  ≥3.5cm, regardless of which segment triggers it
- Sex field options: Male, Female, Non-binary, Transgender Male,
  Transgender Female, Choose not to identify, Other (reveals a short
  free-text field)
- Technologist Comments: free-text large textarea in phase 1
- Physician Interpretation: toggle/checkbox reveals a text area; content
  work deferred


## 6. Data Actions (Print/PDF & Clear)

### Print / PDF Export
- A button triggers export of the current form data
- Implementation: open a new window/tab containing a clean, print-
  formatted HTML/CSS view of the filled data, then call window.print()
  so the tech can choose "Save as PDF" via the browser's native print
  dialog. Do not use a JS PDF-generation library for this phase.
- The new window/tab should retain the rendered data on screen (not
  auto-close after printing) so the tech can visually review for errors
  before closing it or saving.

### Print Layout Reordering
- If the Physician Interpretation field has content, it is rendered
  directly under the Demographics section, followed by all remaining
  findings/comments data
- If Physician Interpretation is empty (only Technologist Comments is
  filled), the print layout keeps the original on-screen field order

### Clear Button
- Empties all fields on the current sheet
- Gated behind a custom confirmation modal (styled to match the app's
  palette — not a plain browser confirm() dialog), asking the tech to
  confirm before clearing
- Built as a reusable function: switching to a different tech sheet
  type (future phase) will call this same clear behavior before loading
  the new sheet

## 7. Diagram Markup Feature (Thyroid, Carotid, Arterial sheets)

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

  ## 8. Explicitly Out of Scope (Phase 1)
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

## 9. Architecture Note
Build with reuse in mind: this is the first of ~15 planned tech sheets
(8 common). Favor a reusable field/section component pattern over
one-off hand-coded HTML per form, so future sheet types can be added
primarily as configuration/content rather than new engineering.