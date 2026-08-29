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

  ## 7. Explicitly Out of Scope (Phase 1)
- Auto-population of Technologist Comments based on measurement values
  (Liver >16.5cm, Kidney Cortex <1.3cm, Spleen ≥13cm) — this is planned
  for Phase 2, after the visual/layout design is finalized. Do not
  implement the auto-population logic yet, but the Technologist Comments
  field should exist as a plain textarea now.
- Physician Interpretation content/workflow
- Additional ultrasound sheet types beyond Abdominal
- Data persistence via backend/database (export is handled via the
  Print/PDF feature in Section 6, not stored anywhere at this time)
- Any backend, database, or account system

## 8. Architecture Note
Build with reuse in mind: this is the first of ~15 planned tech sheets
(8 common). Favor a reusable field/section component pattern over
one-off hand-coded HTML per form, so future sheet types can be added
primarily as configuration/content rather than new engineering.