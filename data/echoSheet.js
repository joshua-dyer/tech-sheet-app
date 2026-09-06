import { demographicsSection } from './demographicsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml, getDisplayValue, hasValue } from '../js/printHelpers.js';

// Row-major order (not DESIGN.md's column-major listing) so the CSS grid's
// default left-to-right, top-to-bottom fill matches the paper form's actual
// 3-column arrangement: RV/LVIDd/Effusion, LA/IVS/LVPW, PA sys. press/Ejc.
// Fr/PA, Ao/AoV/RVW. Reference ranges are shown via the existing `unit`
// label mechanism (e.g. "RV (20–30 mm)") — adjusted per the practice's
// current values, not the older paper form's (RV was "<27", RVW was "<5").
const TWO_D_MMODE_FIELDS = [
  { id: 'rv', label: 'RV', type: 'number', unit: '20–30 mm' },
  { id: 'lvidd', label: 'LVIDd', type: 'number', unit: '37–56 mm' },
  { id: 'effusion', label: 'Effusion', type: 'number', unit: 'mm Depth' },
  { id: 'la', label: 'LA', type: 'number', unit: '19–39 mm' },
  { id: 'ivs', label: 'IVS', type: 'number', unit: '6–11 mm' },
  { id: 'lvpw', label: 'LVPW', type: 'number', unit: '6–11 mm' },
  { id: 'paSysPress', label: 'PA sys. press', type: 'number', unit: 'mmHg' },
  // Free text, not numeric — commonly entered as a range (e.g. "55-60").
  { id: 'ejcFr', label: 'Ejc. Fr', type: 'text', unit: '%' },
  { id: 'pa', label: 'PA', type: 'number', unit: '15–21 mm' },
  { id: 'ao', label: 'Ao', type: 'number', unit: '20–37 mm' },
  { id: 'aoV', label: 'AoV', type: 'number', unit: '15–36 mm' },
  { id: 'rvw', label: 'RVW', type: 'number', unit: '5–6 mm' },
];

const VALVE_STRUCTURE_OPTIONS = ['Normal', 'Sclerotic', 'Prolapse', 'Other - See Below'];

const DOPPLER_TABLE_COLUMNS = ['Valve Structure', 'Peak Velocity (cm/s)', 'Valve Area (cm²)', 'MeanPG (mmHg)'];

const mvFields = [
  { id: 'mvStructure', label: 'Valve Structure', type: 'select', options: VALVE_STRUCTURE_OPTIONS, defaultValue: 'Normal' },
  // Entered directly by the tech as one combined "E/A" value (e.g. "120/65")
  // — not split into separate fields.
  { id: 'mvPeakVelocity', label: 'Peak Velocity', type: 'text' },
  { id: 'mvValveArea', label: 'Valve Area', type: 'number' },
  { id: 'mvMeanPG', label: 'MeanPG', type: 'number' },
];
const avFields = [
  { id: 'avStructure', label: 'Valve Structure', type: 'select', options: VALVE_STRUCTURE_OPTIONS, defaultValue: 'Normal' },
  { id: 'avPeakVelocity', label: 'Peak Velocity', type: 'number' },
  { id: 'avValveArea', label: 'Valve Area', type: 'number' },
  { id: 'avMeanPG', label: 'MeanPG', type: 'number' },
];

// A field still sitting at its own declared defaultValue (Valve Structure,
// defaulted to Normal) doesn't count as "real" data for omission purposes —
// otherwise the section could never be detected as blank, since that
// default is applied at render time before the tech touches anything (same
// fix as Carotid's Vessel Panels needed for Stenosis Location).
function hasRealData(field) {
  if (!hasValue(field)) return false;
  return field.defaultValue === undefined || getDisplayValue(field) !== field.defaultValue;
}

// Bespoke — see js/printView.js's `section.printRender` extension point
// (same pattern as Carotid's Vessel Panels). "Other - See Below" prints
// as-is (no nested manual-entry field to resolve, per the simplified
// on-screen behavior — the finding goes in Technologist Comments instead).
function renderDopplerPrint(section) {
  const fieldsById = new Map(section.fields.map((field) => [field.id, field]));
  if (!section.fields.some((field) => hasRealData(field))) return '';

  const headerCells = ['', ...section.tableColumns].map((h) => `<th>${escapeHtml(h)}</th>`).join('');

  const bodyRows = section.tableRows
    .map((row) => {
      const cells = row.fieldIds
        .map((fieldId) => {
          const field = fieldsById.get(fieldId);
          const value = field ? getDisplayValue(field) : '';
          return `<td>${escapeHtml(value || '—')}</td>`;
        })
        .join('');
      return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`;
    })
    .join('');

  return `<section class="print-section"><h2>${escapeHtml(section.title)}</h2><table class="print-data-grid"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></section>`;
}

// Two paragraphs, matching the paper form's starter text exactly — joined
// with a blank line so it displays/prints as two separate paragraphs.
const STARTER_COMMENTS_TEXT = [
  'The ejection fraction is visually estimated between %.',
  'The IVC showed normal respiratory collapse. The visualized portions of the Abdominal Aorta and Aortic Arch measure normal in vessel diameter.',
].join('\n\n');

// Deliberately NOT the shared data/commentsSection.js — this sheet needs
// default starter text, which other sheets must not get. Kept as its own
// section object (same id/field-id as the shared version, 'comments', so
// js/printView.js's Comments-suppression-on-Interpretation logic still
// works unmodified) rather than adding an option to the shared component.
const echoCommentsSection = {
  id: 'comments',
  title: 'Technologist Comments',
  fields: [
    {
      id: 'comments',
      label: 'Technologist Comments',
      type: 'textarea',
      large: true,
      defaultValue: STARTER_COMMENTS_TEXT,
      omitPrintLabel: true,
    },
  ],
};

export const echoSheet = {
  id: 'echo',
  title: 'Echocardiogram',
  sections: [
    demographicsSection,
    {
      id: 'twoDMMode',
      title: '2D M-Mode Dimensions',
      layout: 'grid',
      gridColumns: 3,
      fields: TWO_D_MMODE_FIELDS,
    },
    {
      id: 'doppler',
      title: 'Doppler',
      layout: 'table',
      tableColumns: DOPPLER_TABLE_COLUMNS,
      tableRows: [
        { label: 'MV', fieldIds: mvFields.map((f) => f.id) },
        { label: 'AV', fieldIds: avFields.map((f) => f.id) },
      ],
      fields: [...mvFields, ...avFields],
      printRender: renderDopplerPrint,
      printRowCount: () => 3,
    },
    {
      id: 'examQuality',
      title: 'Exam Quality',
      fields: [{ id: 'examQuality', label: 'Exam Quality', type: 'select', options: ['Good', 'Fair', 'Poor'] }],
    },
    echoCommentsSection,
    interpretationSection,
  ],
};
