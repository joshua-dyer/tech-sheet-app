import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml, getDisplayValue, hasRealData } from '../js/printHelpers.js';

const FLOW_PATTERN_OPTIONS = ['Triphasic', 'Biphasic', 'Monophasic', 'No Flow Detected'];

// Vessel is the row, side is folded into each field id — same convention
// as Arterial LE's vesselRowFields (data/arterialLeSheet.js).
function vesselRowFields(vesselId) {
  return ['Right', 'Left'].flatMap((side) => [
    { id: `${vesselId}${side}Velocity`, label: 'Peak Systolic Velocity', unit: 'cm/s', type: 'number' },
    { id: `${vesselId}${side}FlowPattern`, label: 'Flow Pattern', type: 'select', options: FLOW_PATTERN_OPTIONS },
    { id: `${vesselId}${side}Pressure`, label: 'Segmental Pressure', unit: 'mmHg', type: 'number' },
  ]);
}

const VESSEL_ROWS = [
  { id: 'vertebral', label: 'Vertebral' },
  { id: 'subclavian', label: 'Subclavian' },
  { id: 'axillary', label: 'Axillary' },
  { id: 'brachial', label: 'Brachial' },
  { id: 'radial', label: 'Radial' },
  { id: 'ulnar', label: 'Ulnar' },
];

const vesselRowsWithFields = VESSEL_ROWS.map((row) => ({ ...row, fields: vesselRowFields(row.id) }));
const vesselFields = vesselRowsWithFields.flatMap((row) => row.fields);

// Same structural helper as Arterial LE's renderTablePrint — kept as its
// own in-file copy per this codebase's convention (each sheet's bespoke
// print logic lives in that sheet's own data file, not a shared
// abstraction).
function renderTablePrint(section) {
  const fieldsById = new Map(section.fields.map((field) => [field.id, field]));
  if (!section.fields.some((field) => hasRealData(field))) return '';

  const headerCells = ['', ...section.printTableColumns].map((h) => `<th>${escapeHtml(h)}</th>`).join('');

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

// WBI = MAX(Radial, Ulnar Segmental Pressure) ÷ Maximum Brachial Pressure
// (same side). Maximum Brachial Pressure is itself computed — the first
// two-stage computed chain in the app (see js/computedFields.js for how
// the engine cascades a computed field's recompute to any other computed
// field that depends on it, since a computed field's <output> control
// never fires the blur event the rest of the engine relies on).
function wbiField(id, prefix) {
  return {
    id,
    label: `${prefix} WBI`,
    type: 'computed',
    row: true,
    compute: {
      dependsOn: [`radial${prefix}Pressure`, `ulnar${prefix}Pressure`, 'maxBrachialPressure'],
      formula: (radialStr, ulnarStr, brachialStr) => {
        const brachial = parseFloat(brachialStr);
        if (Number.isNaN(brachial) || brachial === 0) return null;
        const pressures = [radialStr, ulnarStr].map(parseFloat).filter((n) => !Number.isNaN(n));
        if (pressures.length === 0) return null;
        return (Math.max(...pressures) / brachial).toFixed(2);
      },
    },
  };
}

export const arterialUeSheet = {
  id: 'arterialUe',
  title: 'Arterial Doppler Upper Extremities',
  sections: [
    demographicsSection,
    {
      id: 'vesselTable',
      title: 'Vessel Table',
      layout: 'table',
      tableColumns: [
        'Right Peak Systolic Velocity (cm/s)',
        'Right Flow Pattern',
        'Right Segmental Pressure (mmHg)',
        'Left Peak Systolic Velocity (cm/s)',
        'Left Flow Pattern',
        'Left Segmental Pressure (mmHg)',
      ],
      // Shorter headers for print — 6 data columns is already tight,
      // same rationale as Arterial LE's printTableColumns.
      printTableColumns: ['R PSV', 'R Flow', 'R Pres', 'L PSV', 'L Flow', 'L Pres'],
      tableRows: vesselRowsWithFields.map((row) => ({
        label: row.label,
        fieldIds: row.fields.map((f) => f.id),
      })),
      fields: vesselFields,
      fullWidthPrint: true,
      printRender: renderTablePrint,
    },
    {
      id: 'wbi',
      title: 'WBI (Wrist-Brachial Index)',
      fields: [
        {
          id: 'maxBrachialPressure',
          label: 'Maximum Brachial Pressure',
          type: 'computed',
          unit: 'mmHg',
          compute: {
            dependsOn: ['brachialRightPressure', 'brachialLeftPressure'],
            formula: (rightStr, leftStr) => {
              const pressures = [rightStr, leftStr].map(parseFloat).filter((n) => !Number.isNaN(n));
              if (pressures.length === 0) return null;
              return Math.max(...pressures).toFixed(2);
            },
          },
        },
        wbiField('rightWbi', 'Right'),
        wbiField('leftWbi', 'Left'),
      ],
    },
    {
      id: 'referenceRanges',
      title: 'Reference Ranges',
      fields: [
        {
          id: 'wbiReference',
          type: 'static-table',
          columns: ['WBI Range', 'Interpretation'],
          // On-screen reference only — static-table is deliberately excluded
          // from getDisplayValue/print (see js/formRenderer.js). No
          // calcified-vessel note (unlike Arterial LE's ABI table) — not
          // clinically expected in the brachial vessels.
          rows: [
            ['0.8 - 1.3', 'Normal'],
            ['< 0.8', 'Obstructive Disease'],
          ],
        },
      ],
    },
    commentsSection,
    interpretationSection,
  ],
};
