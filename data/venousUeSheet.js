import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml, getDisplayValue, hasRealData } from '../js/printHelpers.js';

const COMPRESSION_OPTIONS = ['Good', 'Fair', 'Poor'];
const FLOW_OPTIONS = ['Normal', 'Reduced', 'None Visualized'];
const THROMBUS_OPTIONS = ['Negative', 'Partial', 'Chronic', 'Positive'];

// Unlike every other vessel-table sheet, this one is single-sided — these
// studies are almost always ordered unilaterally (unlike every other
// vessel-table study, which is almost always bilateral), so there's no
// Right/Left split in the table itself; the standalone Laterality radio
// below records which side was actually examined, and the table stays a
// single set of Compression/Flow/Thrombus columns per vessel.
function vesselRowFields(vesselId) {
  return [
    {
      id: `${vesselId}Compression`,
      label: 'Compression',
      type: 'select',
      options: COMPRESSION_OPTIONS,
      defaultValue: 'Good',
    },
    {
      id: `${vesselId}Flow`,
      label: 'Flow',
      type: 'select',
      options: FLOW_OPTIONS,
      defaultValue: 'Normal',
    },
    {
      id: `${vesselId}Thrombus`,
      label: 'Thrombus',
      type: 'select',
      options: THROMBUS_OPTIONS,
      defaultValue: 'Negative',
    },
  ];
}

const VESSEL_ROWS = [
  { id: 'internalJugular', label: 'Internal Jugular' },
  { id: 'subclavian', label: 'Subclavian' },
  { id: 'axillary', label: 'Axillary' },
  { id: 'brachial', label: 'Brachial' },
  { id: 'basilic', label: 'Basilic' },
  { id: 'ulnar', label: 'Ulnar' },
  { id: 'radial', label: 'Radial' },
];

const vesselRowsWithFields = VESSEL_ROWS.map((row) => ({ ...row, fields: vesselRowFields(row.id) }));
const vesselFields = vesselRowsWithFields.flatMap((row) => row.fields);

// Same structural helper as Venous LE's renderTablePrint — kept as its
// own in-file copy per this codebase's convention.
function renderTablePrint(section) {
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

export const venousUeSheet = {
  id: 'venousUe',
  title: 'Venous Doppler Upper Extremities',
  sections: [
    demographicsSection,
    {
      id: 'laterality',
      title: 'Laterality',
      fields: [{ id: 'laterality', label: 'Laterality', type: 'radio', options: ['Right', 'Left'] }],
    },
    {
      id: 'vesselAssessment',
      title: 'Vessel Assessment',
      layout: 'table',
      tableColumns: ['Compression', 'Flow', 'Thrombus'],
      tableRows: vesselRowsWithFields.map((row) => ({
        label: row.label,
        fieldIds: row.fields.map((f) => f.id),
      })),
      fields: vesselFields,
      fullWidthPrint: true,
      printRender: renderTablePrint,
    },
    commentsSection,
    interpretationSection,
  ],
};
