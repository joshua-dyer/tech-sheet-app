import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml, getDisplayValue, hasRealData } from '../js/printHelpers.js';

const COMPRESSION_OPTIONS = ['Good', 'Fair', 'Poor'];
const FLOW_OPTIONS = ['Normal', 'Reduced', 'None Visualized'];
const THROMBUS_OPTIONS = ['Negative', 'Partial', 'Chronic', 'Positive'];

// Studies are typically negative, so every dropdown defaults to its
// first/normal option — a tech completes an unremarkable exam by only
// touching fields that actually need to change. Vessel is the row here
// (unlike Carotid's Vessel Panels, where side is the row), so side is
// folded into each field id instead.
function vesselRowFields(vesselId) {
  return ['Right', 'Left'].flatMap((side) => [
    {
      id: `${vesselId}${side}Compression`,
      label: 'Compression',
      type: 'select',
      options: COMPRESSION_OPTIONS,
      defaultValue: 'Good',
    },
    {
      id: `${vesselId}${side}Flow`,
      label: 'Flow',
      type: 'select',
      options: FLOW_OPTIONS,
      defaultValue: 'Normal',
    },
    {
      id: `${vesselId}${side}Thrombus`,
      label: 'Thrombus',
      type: 'select',
      options: THROMBUS_OPTIONS,
      defaultValue: 'Negative',
    },
  ]);
}

const VESSEL_ROWS = [
  { id: 'commonIliac', label: 'Common Iliac' },
  { id: 'commonFemoral', label: 'Common Femoral' },
  { id: 'superficialFemoral', label: 'Superficial Femoral' },
  { id: 'popliteal', label: 'Popliteal' },
  { id: 'posteriorTibial', label: 'Posterior Tibial' },
];

const vesselRowsWithFields = VESSEL_ROWS.map((row) => ({ ...row, fields: vesselRowFields(row.id) }));
const vesselFields = vesselRowsWithFields.flatMap((row) => row.fields);

const INSUFFICIENCY_OPTIONS = ['No', 'Yes'];

function insufficiencyRowFields(rowId) {
  return ['Right', 'Left'].flatMap((side) => [
    {
      id: `${rowId}${side}Insufficiency`,
      label: 'Insufficiency?',
      type: 'select',
      options: INSUFFICIENCY_OPTIONS,
      defaultValue: 'No',
    },
    {
      id: `${rowId}${side}MaxReflux`,
      label: 'Maximum Reflux',
      unit: 'ms',
      type: 'number',
    },
  ]);
}

const INSUFFICIENCY_ROWS = [
  { id: 'deepVeins', label: 'Deep Veins' },
  { id: 'superficialVeins', label: 'Superficial Veins' },
];

const insufficiencyRowsWithFields = INSUFFICIENCY_ROWS.map((row) => ({ ...row, fields: insufficiencyRowFields(row.id) }));
const insufficiencyFields = insufficiencyRowsWithFields.flatMap((row) => row.fields);

// Shared by both tables below — structurally identical (a row-label column
// plus N data columns read straight off getDisplayValue) so this is written
// once as an in-file helper rather than duplicated, same category of reuse
// as Carotid's own renderVesselPanelsPrint.
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

export const venousLeSheet = {
  id: 'venousLe',
  title: 'Venous Doppler Lower Extremities',
  sections: [
    demographicsSection,
    {
      id: 'vesselAssessment',
      title: 'Vessel Assessment',
      layout: 'table',
      tableColumns: [
        'Right Compression',
        'Right Flow',
        'Right Thrombus',
        'Left Compression',
        'Left Flow',
        'Left Thrombus',
      ],
      tableRows: vesselRowsWithFields.map((row) => ({
        label: row.label,
        fieldIds: row.fields.map((f) => f.id),
      })),
      fields: vesselFields,
      fullWidthPrint: true,
      printRender: renderTablePrint,
    },
    {
      id: 'venousInsufficiency',
      title: 'Venous Insufficiency Assessment',
      layout: 'table',
      tableColumns: [
        'Right Insufficiency?',
        'Right Max Reflux (ms)',
        'Left Insufficiency?',
        'Left Max Reflux (ms)',
      ],
      tableRows: insufficiencyRowsWithFields.map((row) => ({
        label: row.label,
        fieldIds: row.fields.map((f) => f.id),
      })),
      fields: insufficiencyFields,
      fullWidthPrint: true,
      printRender: renderTablePrint,
    },
    commentsSection,
    interpretationSection,
  ],
};
