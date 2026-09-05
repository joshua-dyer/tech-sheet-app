import { OTHER_PHYSICIAN_OPTION } from '../data/physicians.js';
import { escapeHtml, getDisplayValue, isFieldVisible, hasValue } from './printHelpers.js';

// A field prints if it has a value, or if it defines emptyPrintText — a
// non-diagnostic placeholder (e.g. Gallbladder's "No abnormalities noted")
// standing in for "the technologist checked, nothing was flagged". A diagram
// always prints — an unmarked reference image is still meaningful context,
// the same reasoning behind emptyPrintText fallbacks elsewhere.
function shouldPrintField(field) {
  if (field.type === 'diagram') return true;
  return hasValue(field) || Boolean(field.emptyPrintText);
}

// Flattens the diagram's live canvas (base image + strokes) into a static
// image via toDataURL — per DESIGN.md §8, print must preserve the red marks,
// not just the reference image.
function renderDiagramRow(field) {
  const canvas = document.getElementById(`diagram-canvas-${field.id}`);
  if (!canvas) return '';
  const dataUrl = canvas.toDataURL('image/png');
  return `<div class="print-diagram-row"><div class="print-label">${escapeHtml(field.label)}</div><img class="print-diagram-image" src="${dataUrl}" alt="${escapeHtml(field.label)}"></div>`;
}

function renderFieldRow(field) {
  if (field.type === 'diagram') return renderDiagramRow(field);

  // A checkbox can override its printed text when checked (e.g. "Hypervascularity
  // noted" instead of "Hypervascularity: Yes") — analogous to emptyPrintText,
  // just for the checked case instead of the empty one.
  const checkedOverride = field.type === 'checkbox' && hasValue(field) ? field.checkedPrintText : undefined;
  const value = checkedOverride ?? (hasValue(field) ? getDisplayValue(field) : field.emptyPrintText);
  if (field.omitPrintLabel) {
    return `<div class="print-row"><span class="print-value">${escapeHtml(value)}</span></div>`;
  }
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;
  return `<div class="print-row"><span class="print-label">${escapeHtml(label)}</span><span class="print-value">${escapeHtml(value)}</span></div>`;
}

// Returns '' (and is skipped entirely) when nothing in the section was ever
// filled in or triggered, so blank sections don't waste printed space —
// unless the section defines emptyPrintText (e.g. Pancreas), in which case
// that non-diagnostic placeholder prints in place of the omitted section. A
// section can set `printRender(section)` to fully replace this generic
// rendering with bespoke markup (e.g. Abdominal's Gallbladder/Murphy's Sign
// logic, defined in that sheet's own data file, not here) — this is the
// extension point sheet-specific print quirks should use instead of adding
// another section-id special-case to this shared engine.
function renderSectionHtml(section) {
  if (section.printRender) return section.printRender(section);

  const rows = section.fields
    .filter((field) => isFieldVisible(field) && shouldPrintField(field))
    .map(renderFieldRow)
    .join('');
  if (rows) {
    return `<section class="print-section"><h2>${escapeHtml(section.title)}</h2>${rows}</section>`;
  }
  if (section.emptyPrintText) {
    return `<section class="print-section"><h2>${escapeHtml(section.title)}</h2><div class="print-row"><span class="print-value">${escapeHtml(section.emptyPrintText)}</span></div></section>`;
  }
  return '';
}

// Same count renderSectionHtml would actually print: the section's own
// heading (1 row) plus either its field rows or a single emptyPrintText
// fallback row. Used to balance the two Findings columns by hand below —
// CSS column-count is deliberately avoided here; it collapses to a single
// column specifically during the real print/PDF pass in WebKit (Safari/iOS),
// even though it renders correctly on screen and in the interactive print
// preview (WebKit bugs 122214 and 156300). A section with a bespoke
// `printRender` should also set `printRowCount` — the generic field-counting
// below doesn't know how many rows a custom renderer actually produces.
function printableRowCount(section) {
  if (section.printRowCount) return section.printRowCount(section);

  const fieldRows = section.fields.filter(
    (field) => isFieldVisible(field) && shouldPrintField(field)
  ).length;
  if (fieldRows > 0) return fieldRows + 1;
  return section.emptyPrintText ? 2 : 0;
}

// Patient identity vs. this-visit details — confirmed grouping for the
// Demographics section's two print columns. Demographics is a shared section
// (see data/demographicsSection.js) reused by every sheet, so this grouping
// applies generically, not just to Abdominal.
const DEMOGRAPHICS_LEFT_IDS = ['lastName', 'firstName', 'patientId', 'dob', 'age', 'sex', 'sexOther'];
const DEMOGRAPHICS_RIGHT_IDS = ['examDate', 'orderingPhysician', 'indications', 'priorStudy', 'priorStudyDetail'];

function renderDemographicsHtml(section) {
  const visibleFields = section.fields.filter((field) => isFieldVisible(field) && shouldPrintField(field));
  const byId = new Map(visibleFields.map((field) => [field.id, field]));

  const leftFields = DEMOGRAPHICS_LEFT_IDS.map((id) => byId.get(id)).filter(Boolean);
  const rightFields = DEMOGRAPHICS_RIGHT_IDS.map((id) => byId.get(id)).filter(Boolean);

  // Safety net: any Demographics field not yet assigned to a column (e.g. a
  // future addition) still prints, alternating into whichever column it lands on.
  const placedIds = new Set([...DEMOGRAPHICS_LEFT_IDS, ...DEMOGRAPHICS_RIGHT_IDS]);
  visibleFields
    .filter((field) => !placedIds.has(field.id))
    .forEach((field, i) => (i % 2 === 0 ? leftFields : rightFields).push(field));

  if (leftFields.length === 0 && rightFields.length === 0) return '';

  const leftHtml = leftFields.map(renderFieldRow).join('');
  const rightHtml = rightFields.map(renderFieldRow).join('');

  return `<section class="print-section"><h2>${escapeHtml(section.title)}</h2><div class="demographics-columns"><div class="demographics-col">${leftHtml}</div><div class="demographics-col">${rightHtml}</div></div></section>`;
}

// Bespoke rather than the generic field-row renderer: this section always
// prints when the toggle is on — even with an empty impression, which is
// intentional (it flags that a review may have been missed) — and needs the
// signature-block layout (line + printed name) rather than label:value rows.
// Physician Interpretation is a shared section (data/interpretationSection.js)
// reused by every sheet, so this stays generic here rather than living in a
// per-sheet data file the way Abdominal's Gallbladder printRender does.
function renderInterpretationHtml(section) {
  const physicianField = section.fields.find((f) => f.id === 'interpretationPhysician');
  const physicianOtherField = section.fields.find((f) => f.id === 'interpretationPhysicianOther');
  const impressionField = section.fields.find((f) => f.id === 'interpretationText');

  const selectedPhysician = physicianField ? getDisplayValue(physicianField) : '';
  const physicianName =
    selectedPhysician === OTHER_PHYSICIAN_OPTION
      ? physicianOtherField
        ? getDisplayValue(physicianOtherField)
        : ''
      : selectedPhysician;

  const impressionText = impressionField ? getDisplayValue(impressionField) : '';

  return `<section class="print-section print-interpretation"><h2>${escapeHtml(section.title)}</h2><div class="interpretation-impression">${escapeHtml(impressionText)}</div><div class="signature-block"><div class="signature-line"></div><div class="signature-name">${escapeHtml(physicianName || '—')}</div></div></section>`;
}

export function openPrintView(schema) {
  const demographicsSection = schema.sections.find((s) => s.id === 'demographics');
  const interpretationSection = schema.sections.find((s) => s.id === 'interpretation');
  const commentsSection = schema.sections.find((s) => s.id === 'comments');
  const otherSections = schema.sections.filter(
    (s) => s.id !== 'demographics' && s.id !== 'interpretation' && s.id !== 'comments'
  );
  // A section opts into full page width (a wide table, a diagram image) via
  // `fullWidthPrint` rather than this shared engine hardcoding section ids —
  // any future sheet's own wide content can use the same mechanism.
  const columnSections = otherSections.filter((s) => !s.fullWidthPrint);
  const fullWidthFindingsSections = otherSections.filter((s) => s.fullWidthPrint);

  const toggleField = interpretationSection?.fields.find((f) => f.id === 'interpretationToggle');
  const interpretationEnabled = toggleField ? getDisplayValue(toggleField) === 'Yes' : false;

  // A signed Physician Interpretation makes this a report rather than a
  // blank working sheet, so the heading reflects that — only when enabled.
  const heading = `${schema.title} — ${interpretationEnabled ? 'Report' : 'Tech Sheet'}`;

  // Demographics (and Interpretation, when its toggle is on) run full-width up
  // top; the findings sections in between flow into two dense columns.
  // Technologist Comments trails as its own full-width block — unless
  // Physician Interpretation is enabled, in which case it takes that spot
  // instead and Comments is suppressed entirely, regardless of its content.
  const demographicsHtml = demographicsSection ? renderDemographicsHtml(demographicsSection) : '';
  const interpretationHtml = interpretationEnabled ? renderInterpretationHtml(interpretationSection) : '';
  const topHtml = [demographicsHtml, interpretationHtml].filter(Boolean).join('<hr class="print-divider">');
  const commentsHtml = interpretationEnabled
    ? ''
    : commentsSection
      ? renderSectionHtml(commentsSection)
      : '';

  // Greedy balance: walk Findings sections in schema order, always adding the
  // next one to whichever column currently has fewer accumulated rows. Kept
  // deterministic (no CSS reflow) so both columns render reliably in print.
  let leftRows = 0;
  let rightRows = 0;
  const leftSectionsHtml = [];
  const rightSectionsHtml = [];
  for (const section of columnSections) {
    const html = renderSectionHtml(section);
    if (!html) continue;
    const rows = printableRowCount(section);
    if (leftRows <= rightRows) {
      leftSectionsHtml.push(html);
      leftRows += rows;
    } else {
      rightSectionsHtml.push(html);
      rightRows += rows;
    }
  }
  const columnsHtml =
    leftSectionsHtml.length || rightSectionsHtml.length
      ? `<div class="print-columns"><div class="print-col">${leftSectionsHtml.join('')}</div><div class="print-col">${rightSectionsHtml.join('')}</div></div>`
      : '';

  const fullWidthFindingsHtml = fullWidthFindingsSections.map(renderSectionHtml).filter(Boolean);

  // Blocks are joined with a divider only where two real blocks meet, so an
  // empty Findings or Comments section never leaves a stray trailing rule.
  const blocks = [];
  if (topHtml) blocks.push(`<div class="print-fullwidth">${topHtml}</div>`);
  if (columnsHtml) blocks.push(`<h2 class="print-group-title">Findings</h2>${columnsHtml}`);
  for (const html of fullWidthFindingsHtml) blocks.push(`<div class="print-fullwidth">${html}</div>`);
  if (commentsHtml) blocks.push(`<div class="print-fullwidth">${commentsHtml}</div>`);
  const bodyHtml = blocks.join('<hr class="print-divider">');

  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(schema.title)} — Print</title>
<style>
  * { box-sizing: border-box; }
  /* Controls every rem-sized measurement below from one place — applies to
     every sheet's printout (this template is shared, not per-sheet) and is
     the main lever for fitting more content per page without hand-tuning
     each individual font-size/spacing rule. */
  html { font-size: 14px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1a1a1a;
    background: #fff;
    margin: 0.4in;
    font-size: 0.82rem;
    line-height: 1.25;
  }
  h1 { font-size: 1.15rem; margin: 0 0 0.6rem; }
  .print-fullwidth .print-section { break-inside: avoid; }
  .print-divider { border: none; border-top: 2px solid #333; margin: 0.5rem 0; }
  .print-group-title {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 2px solid #333;
    padding-bottom: 0.15rem;
    margin: 0 0 0.4rem;
  }
  .demographics-columns { display: flex; gap: 1.1rem; }
  .demographics-col { flex: 1; min-width: 0; }
  /* Deliberately flexbox, not CSS column-count: WebKit's print/PDF engine
     collapses multicol layouts to a single column during the actual print
     pass even though they render fine on screen (WebKit bugs 122214, 156300).
     Sections are pre-split into two explicit columns in JS instead. */
  .print-columns { display: flex; gap: 1.1rem; }
  .print-col { flex: 1; min-width: 0; }
  .print-section {
    margin-bottom: 0.5rem;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-section h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    border-bottom: 1px solid #999;
    padding-bottom: 0.1rem;
    margin: 0 0 0.2rem;
  }
  .print-row { display: flex; gap: 0.4rem; padding: 0.05rem 0; }
  .print-label { font-weight: 600; flex: 0 0 auto; }
  .print-label::after { content: ':'; }
  .print-value { white-space: pre-wrap; }
  .interpretation-impression { white-space: pre-wrap; min-height: 3em; margin: 0.4rem 0 1.2rem; }
  .signature-block { margin-top: 1.5rem; }
  .signature-line { width: 260px; border-top: 1px solid #333; margin-bottom: 0.2rem; }
  .signature-name { font-size: 0.85rem; }
  .print-diagram-row { margin-top: 0.3rem; }
  .print-diagram-image { display: block; max-width: 50%; height: auto; margin: 0 auto; }
  .print-nodule-grid { width: 100%; border-collapse: collapse; margin-top: 0.3rem; }
  .print-nodule-grid th, .print-nodule-grid td {
    border: 1px solid #999;
    padding: 0.2rem 0.35rem;
    text-align: left;
    font-size: 0.78rem;
  }
  @media print {
    body { margin: 0.35in; }
  }
</style>
</head>
<body>
<h1>${escapeHtml(heading)}</h1>
${bodyHtml}
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(doc);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}
