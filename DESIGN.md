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

## Default Values & Print Inclusion (Cross-Sheet Rule)

Some select fields declare a defaultValue representing a genuine normal/
expected clinical finding (e.g. Carotid's Stenosis Location = N/A,
Venous's Compression = Good) — this is a real answer, not a placeholder,
and exists so a tech can complete a normal study quickly.

Rule: a field sitting at its declared default does not, by itself, count
as "real data" when deciding whether an otherwise-untouched section
should appear in print. But once a section is included in print (because
something in it has genuinely changed), every field in it — including
ones still at their default — prints its current value normally.

This is implemented once, generically, in the shared print engine
(js/printHelpers.js) — sheet-specific files should not reimplement this
comparison locally.


## 8. Diagram Markup Feature (Thyroid, Carotid, Arterial, and Renal sheets)

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
- Diagrams always print, regardless of whether any strokes were drawn. An unmarked diagram is clinically meaningful (confirms the area was
  evaluated with nothing to flag), unlike the Nodule Table, which is
  omitted when empty since it has no equivalent "nothing to report"
  meaning on its own.

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



## 10. Carotid Sheet — Fields

### Vessel Panels (Right and Left)
- Rendered as a horizontal table (mirroring the Nodule Table's use of a
  real <table> for column alignment), one row set per side
- Fields per side: Subclavian, CCA (Systolic + Diastolic), ICA
  (Systolic + Diastolic), ECA, Vertebral — all velocities in cm/s
- Stenosis Location: dropdown (ICA / ECA / CCA / Bulb), defaults to ICA
- % Obstruction: free text field (not strictly numeric — accommodates
  ranges, "near occlusion," "undetectable," etc.)
- CA/CCA Ratio: computed field using the existing computedFields
  mechanism — formula: ICA Systolic ÷ CCA Systolic. Displays "—" if
  either input is missing/invalid, same convention as Thyroid's Volume
  field.

### Diagram Markup
- Uses the shared Diagram Markup feature (Section 7)
- Image: /images/carotid_diagram.png
- Unlike Thyroid's numbered-nodule convention, Carotid markup is
  unconstrained freehand scribbling anywhere on or beyond the image
  bounds — findings such as carotid body tumors may need marking
  outside the drawn vessel anatomy

### Reference Table
- Static clinical reference (Degree of Stenosis / ICA PSV / Plaque
  Estimate / ICA:CCA Ratio / ICA EDV), visible on-screen only, omitted
  from print — same treatment as Thyroid's Scoring Key


## 11. Echocardiogram Sheet — Fields

### 2D M-Mode Dimensions
Grid layout matching the paper sheet's 3-column arrangement. Reference
ranges shown as part of each field's label.

| Field | Range | Unit |
|---|---|---|
| RV | 20–30 | mm |
| LA | 19–39 | mm |
| PA sys. press | (none) | mmHg |
| Ao | 20–37 | mm |
| LVIDd | 37–56 | mm |
| IVS | 6–11 | mm |
| Ejc. Fr | (none) | % — free text (entered as a range, e.g. "55-60") |
| AoV | 15–36 | mm |
| Effusion | (none) | mm Depth |
| LVPW | 6–11 | mm |
| PA | 15–21 | mm |
| RVW | 5–6 | mm |

### Doppler
Two valve rows only (TV and PV are no longer used and are omitted
entirely, not just hidden).

| Valve | Fields |
|---|---|
| MV | Valve Structure (dropdown: Normal / Sclerotic / Prolapse / Other → reveals free text), Peak Velocity (free text, entered as "E/A" string e.g. "120/65"), Valve Area (cm²), MeanPG (mmHg) |
| AV | Valve Structure (same dropdown), Peak Velocity (single numeric value), Valve Area (cm²), MeanPG (mmHg) |

### Exam Quality
Dropdown: Good / Fair / Poor

### Technologist Comments — default starter text
Unlike other sheets, this field is pre-populated on load with standard
starter text (fully editable/replaceable):

> "The ejection fraction is visually estimated between %."
>
> "The IVC showed normal respiratory collapse. The visualized portions
> of the Abdominal Aorta and Aortic Arch measure normal in vessel
> diameter."

Clear resets this field back to the starter text (its default state),
not to fully blank — consistent with how other defaulted fields (e.g.
Sex, Physician dropdown) already reset to their default on Clear rather
than to an empty/unset state.


## 12. Venous Doppler Lower Extremity Sheet — Fields
No diagram markup on this sheet.
We need to name our files to specify venousLe to be prepared for Le and Ue versions of doppler studies. 

### Vessel Assessment Table
Five fixed rows (Common Iliac, Common Femoral, Superficial Femoral,
Popliteal, Posterior Tibial), each with six dropdown cells (Right and
Left, each with Compression/Flow/Thrombus) — layout: 'table' pattern,
same mechanism as Carotid's Vessel Panels. No add/delete rows.

Dropdown options, each defaulting to its first (normal) option:
- Compression: Good / Fair / Poor
- Flow: Normal / Reduced / None Visualized
- Thrombus: Negative / Partial / Chronic / Positive

### Venous Insufficiency Assessment
Two fixed rows (Deep Veins, Superficial Veins), each with Right and Left
columns containing: Insufficiency? (Yes/No dropdown, defaults to No)
and Maximum Reflux (numeric, ms). Same layout: 'table' pattern.

Rationale for defaulting to normal/negative findings throughout this
sheet: exams are typically negative studies, and defaulting to normal
lets a tech complete an unremarkable exam by only touching the fields
that actually need to change.

### Comments / Interpretation
Standard shared commentsSection and interpretationSection, unchanged —
the paper form's "Impression" label refers to the same Physician
Interpretation behavior already established elsewhere; Technologist
Comments is rarely used on this sheet in practice (studies are read
same-day), but the field/component is unchanged.

## 13. Renal Sheet — Fields & Scoring

### Renal Measurements
- Right Kidney: Length, Width, Height (cm) — grouped horizontally, same pattern as Abdominal's Kidney sections
- Right Kidney Volume: auto-calculated, read-only display field
  = Length × Width × Height × 0.523
- Left Kidney mirrors the same form entry fields.


## 14. Arterial Doppler LE Sheet — Fields

Naming convention: this sheet documents lower-extremity arterial
anatomy, so it follows the LE/UE naming convention established with
Venous — id `arterialLe`, file names `arterialLe.html` /
`data/arterialLeSheet.js` / `js/arterialLeApp.js`, nav label "Arterial
Doppler LE".

### Header Field
- Maximum Brachial Systolic Pressure (mmHg) — a single shared value,
  not per-side; used as the denominator for both ABI calculations below

### Vessel Table
layout: 'table' pattern (same mechanism as Carotid's Vessel Panels and
Venous's tables). Nine fixed rows, no add/delete:

C.Iliac, C.Femoral, S.Femoral, P.Femoral, Popliteal, P.Tibial (prox),
P.Tibial (dist), A.Tibial (dist), Peroneal

Each row has Right and Left columns, each containing:
- Velocity (cm/s) — number
- Phasicity — dropdown: Tri / Bi / Mono / No Flow Detected
- Pressure (mmHg) — number

### ABI (Ankle-Brachial Index)
One computed, read-only field per side (Right ABI, Left ABI), displayed
side by side. Formula per side:ABI = MAX(P.Tibial dist Pressure, A.Tibial dist Pressure,
Peroneal Pressure) ÷ Maximum Brachial Systolic Pressure


Uses the existing computedFields mechanism — dependsOn the three
side-specific pressure fields plus the shared Maximum Brachial field.
Displays "—" if Maximum Brachial is missing/zero, or if none of the
three source pressures have a value.

### Reference Ranges
Static reference display (static-table field type, same mechanism as
Carotid's Reference Table) — on-screen only, omitted from print:

| ABI Range | Interpretation |
|---|---|
| 1.3 – 1.0 | Normal |
| 1.0 – 0.9 | Borderline |
| 0.9 – 0.5 | Mild – Moderate |
| < 0.5 | Severe |
| > 1.3 | Suggests calcified vessel walls |

### Diagram Markup
Uses the shared Diagram Markup feature (Section 7). Image:
/images/arterial_diagram.png. Freehand, unconstrained strokes — same
convention as Carotid and Renal (not Thyroid's numbered-circle
convention).

### Shared Sections
Demographics, Technologist Comments, Physician Interpretation — standard
shared components, no sheet-specific behavior.


## 15. Abdominal Duplex Sheet — Fields

A variant of the Abdominal sheet adding Doppler measurements. Built by
extending Abdominal's existing sections rather than duplicating them —
Liver, Gallbladder, Portal Vein, CBD, Pancreas, Spleen, Other,
Demographics, Comments, and Interpretation are identical and reused
directly from data/abdominalSheet.js's exports.

### Additions to Abdominal Aorta
- Peak Systolic Velocity (cm/s) — added as a fourth field alongside the
  existing Prox/Mid/Dist measurements, in the same card (grouped
  together since these are all taken as part of the same aortic
  assessment). Does not affect the existing Dissection/Involves Iliacs
  reveal logic, which remains driven by diameter (Prox/Mid/Dist), not
  velocity.

### Additions to Right/Left Kidney
- Resistance Index — added to each existing Kidney section (alongside
  Length/Width/Height/Cortex), same field convention as the Renal
  sheet's RI (number input, step 0.01, no reference range).

### New: Right/Left Renal Artery sections
Placed immediately after their corresponding Kidney section.
- Systolic Velocity (cm/s), Diastolic Velocity (cm/s) — two separate
  number fields
- Renal Artery:Aortic Ratio — computed, read-only, using the existing
  computedFields mechanism: Renal Artery Systolic ÷ Aortic Peak Systolic
  (same side). Displays "—" if either input is missing/invalid.

 
 ## 16. Abdominal Aorta Sheet — Fields

A focused variant covering only the Abdominal Aorta and Iliacs, built by
duplicating the original Aorta card structure rather than reusing the
old two-column Longitudinal/Transverse layout. Demographics,
Technologist Comments, and Physician Interpretation are reused as-is
from the shared sections.

### Aorta — Longitudinal
Prox, Mid, Dist (cm, step 0.1) — same structure as the original
Abdominal sheet's Aorta card, plus Peak Systolic Velocity (cm/s).

### Aorta — Transverse
Prox, Mid, Dist (cm, step 0.1) — same structure, no velocity field.

### Iliacs
Right Iliac and Left Iliac, each with two fields: Longitudinal (cm) and
Transverse (cm), step 0.1. Simpler shape than the Aorta cards (no
Prox/Mid/Dist breakdown).

### Dissection / Involves Iliacs reveal
Extends the original groupReveals mechanism from 3 trigger fields to 6:
if ANY of the six Aorta diameter measurements (Longitudinal Prox/Mid/
Dist, Transverse Prox/Mid/Dist) is ≥3.5cm, reveal Dissection? (Y/N) and
Involves Iliacs? (Y/N) once, evaluated the same way regardless of which
measurement/orientation triggered it. The Iliacs section itself has no
separate reveal logic — outlier findings there are documented in
Technologist Comments.



#### ---- Begin Uncommon Sheets ---- 


## 17. Pelvic Ultrasound Sheet — Fields

### History
- Previous Surgery: free text, single line (e.g. "Tubal Ligation",
  "Partial Hysterectomy", "Oophorectomy")
- Gravida, Para: integer fields, step 1, minimum 0, no upper bound

### LMC (Last Menstrual Cycle)
Radio group with three mutually exclusive options: Date / Menopausal /
N/A. Selecting "Date" reveals a date input field (on change, per the
standard selection-field reveal timing); selecting Menopausal or N/A
keeps the date field hidden.

### Uterus
Length, Height, Width (cm, step 0.1), plus computed read-only Volume
(cm³) = Length × Width × Height × 0.523 — same constant as the Renal
sheet's Kidney Volume (kept consistent rather than introducing a third
distinct volume constant).

### Right Ovary / Left Ovary
Same structure as Uterus: Length, Height, Width (cm, step 0.1), plus
computed Volume using the same 0.523 formula.

 
  ## 18. Explicitly Out of Scope (Phase 1)
- Auto-population of Technologist Comments based on measurement values
  (Liver >16.5cm, Kidney Cortex <1.3cm, Spleen ≥13cm) — this is planned
  for Phase 2, after the visual/layout design is finalized. Do not implement the auto-population logic yet, but the Technologist Comments field should exist as a plain textarea now.
- Data persistence via backend/database (export is handled via the
  Print/PDF feature in Section 6, not stored anywhere at this time)
- Any backend, database, or account system

## 19. Architecture Note
Build with reuse in mind: this is the first of ~15 planned tech sheets
(8 common). Favor a reusable field/section component pattern over
one-off hand-coded HTML per form, so future sheet types can be added
primarily as configuration/content rather than new engineering.


## 20. Verification & Testing Environment

This environment has no browser automation tooling available (no
Playwright, Puppeteer, or similar) — do not attempt to install any for
verification purposes. When you need to confirm actual rendered
appearance, layout, or print output, describe specifically what you'd
like checked and ask the user to verify it via Live Server — they are
generally available and near the console while work is in progress, so
this is a fast, low-friction way to get real visual confirmation.

Acceptable self-verification in the meantime: syntax validation (`node
--check`), tracing render logic by hand through the relevant
formRenderer.js/printView.js code paths, and confirming files serve
correctly over HTTP. These are useful and worth doing, but are not a
substitute for an actual visual check when one is warranted — be clear
about which category your verification falls into when reporting back.