import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml, getDisplayValue, hasRealData } from '../js/printHelpers.js';

const PHASICITY_OPTIONS = ['Tri', 'Bi', 'Mono', 'No Flow Detected'];

// Vessel is the row, side is folded into each field id — same convention as
// Venous's vesselRowFields (data/venousLeSheet.js).
function vesselRowFields(vesselId) {
  return ['Right', 'Left'].flatMap((side) => [
    { id: `${vesselId}${side}Velocity`, label: 'Velocity', unit: 'cm/s', type: 'number' },
    { id: `${vesselId}${side}Phasicity`, label: 'Phasicity', type: 'select', options: PHASICITY_OPTIONS },
    { id: `${vesselId}${side}Pressure`, label: 'Pressure', unit: 'mmHg', type: 'number' },
  ]);
}

const VESSEL_ROWS = [
  { id: 'cIliac', label: 'C. Iliac' },
  { id: 'cFemoral', label: 'C. Femoral' },
  { id: 'sFemoral', label: 'S. Femoral' },
  { id: 'pFemoral', label: 'P. Femoral' },
  { id: 'popliteal', label: 'Popliteal' },
  { id: 'pTibialProx', label: 'P. Tibial (prox)' },
  { id: 'pTibialDist', label: 'P. Tibial (dist)' },
  { id: 'aTibialDist', label: 'A. Tibial (dist)' },
  { id: 'peroneal', label: 'Peroneal' },
];

const vesselRowsWithFields = VESSEL_ROWS.map((row) => ({ ...row, fields: vesselRowFields(row.id) }));
const vesselFields = vesselRowsWithFields.flatMap((row) => row.fields);

// Same structural helper as Venous's renderTablePrint — kept as its own
// in-file copy per this codebase's convention (each sheet's bespoke print
// logic lives in that sheet's own data file, not a shared abstraction).
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

// ABI = MAX(P.Tibial dist, A.Tibial dist, Peroneal pressures) ÷ Maximum
// Brachial Systolic Pressure — the generic computedFields engine already
// forwards `dependsOn` as raw values to an arbitrary formula function, so a
// max-of-three-plus-denominator shape needs no engine change, just this
// formula. '—' (returned as null) whenever the brachial denominator is
// missing/zero, or when none of the three source pressures have a value.
function abiField(id, prefix) {
  return {
    id,
    label: `${prefix} Ankle Brachial Index`,
    type: 'computed',
    row: true,
    compute: {
      dependsOn: [
        `pTibialDist${prefix}Pressure`,
        `aTibialDist${prefix}Pressure`,
        `peroneal${prefix}Pressure`,
        'maxBrachialSystolic',
      ],
      formula: (ptDistStr, atDistStr, peronealStr, brachialStr) => {
        const brachial = parseFloat(brachialStr);
        if (Number.isNaN(brachial) || brachial === 0) return null;
        const pressures = [ptDistStr, atDistStr, peronealStr].map(parseFloat).filter((n) => !Number.isNaN(n));
        if (pressures.length === 0) return null;
        return (Math.max(...pressures) / brachial).toFixed(2);
      },
    },
  };
}

export const arterialLeSheet = {
  id: 'arterialLe',
  title: 'Arterial Doppler Lower Extremities',
  sections: [
    demographicsSection,
    {
      id: 'vesselTable',
      title: 'Vessel Table',
      layout: 'table',
      tableColumns: [
        'Right Velocity (cm/s)',
        'Right Phasicity',
        'Right Pressure (mmHg)',
        'Left Velocity (cm/s)',
        'Left Phasicity',
        'Left Pressure (mmHg)',
      ],
      // Shorter headers for print — 6 data columns is already tight,
      // same rationale as Carotid's printTableColumns.
      printTableColumns: ['R Vel', 'R Phas', 'R Pres', 'L Vel', 'L Phas', 'L Pres'],
      tableRows: vesselRowsWithFields.map((row) => ({
        label: row.label,
        fieldIds: row.fields.map((f) => f.id),
      })),
      fields: vesselFields,
      fullWidthPrint: true,
      printRender: renderTablePrint,
    },
    {
      id: 'abi',
      title: 'Ankle Brachial Index',
      fields: [
        { id: 'maxBrachialSystolic', label: 'Maximum Brachial Systolic Pressure', unit: 'mmHg', type: 'number' },
        abiField('rightAbi', 'Right'),
        abiField('leftAbi', 'Left'),
      ],
    },
    {
      id: 'diagramMarkup',
      title: 'Diagram',
      fullWidthPrint: true,
      fields: [
        {
          id: 'arterialDiagram',
          label: 'Arterial Diagram',
          type: 'diagram',
          imageSrc: '/images/arterial_diagram.png',
          omitPrintLabel: true,
        },
      ],
    },
    {
      id: 'referenceRanges',
      title: 'Reference Ranges',
      fields: [
        {
          id: 'abiReference',
          type: 'static-table',
          columns: ['ABI Range', 'Interpretation'],
          // On-screen reference only — static-table is deliberately excluded
          // from getDisplayValue/print (see js/formRenderer.js).
          rows: [
            ['1.3 - 1.0', 'Normal'],
            ['1.0 - 0.9', 'Borderline'],
            ['0.9 - 0.5', 'Mild-Moderate'],
            ['< 0.5', 'Severe'],
            ['> 1.3', 'Suggests calcified vessel walls'],
          ],
        },
      ],
    },
    commentsSection,
    interpretationSection,
  ],
};
