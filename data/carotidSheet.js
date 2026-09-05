import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml, getDisplayValue, hasValue } from '../js/printHelpers.js';

// Right/Left are fixed rows (no add/delete) of otherwise-ordinary fields
// with resolved, prefixed ids — same convention as Thyroid's
// rightLobeLength/leftLobeLength. Kept as a factory so the two sides can't
// drift out of sync with each other.
function vesselFields(prefix) {
  return [
    { id: `${prefix}Subclavian`, label: 'Subclavian', unit: 'cm/s', type: 'number' },
    { id: `${prefix}CcaSystolic`, label: 'CCA Systolic', unit: 'cm/s', type: 'number' },
    { id: `${prefix}CcaDiastolic`, label: 'CCA Diastolic', unit: 'cm/s', type: 'number' },
    { id: `${prefix}IcaSystolic`, label: 'ICA Systolic', unit: 'cm/s', type: 'number' },
    { id: `${prefix}IcaDiastolic`, label: 'ICA Diastolic', unit: 'cm/s', type: 'number' },
    { id: `${prefix}Eca`, label: 'ECA', unit: 'cm/s', type: 'number' },
    { id: `${prefix}Vertebral`, label: 'Vertebral', unit: 'cm/s', type: 'number' },
    {
      id: `${prefix}StenosisLocation`,
      label: 'Stenosis Location',
      type: 'select',
      // Most studies have no significant stenosis to document, so N/A is
      // the starting state rather than assuming ICA.
      options: ['N/A', 'ICA', 'ECA', 'CCA', 'Bulb'],
      defaultValue: 'N/A',
    },
    { id: `${prefix}Obstruction`, label: '% Obstruction', type: 'text' },
    {
      id: `${prefix}Ratio`,
      label: 'CA/CCA Ratio',
      type: 'computed',
      compute: {
        dependsOn: [`${prefix}IcaSystolic`, `${prefix}CcaSystolic`],
        formula: (icaStr, ccaStr) => {
          const ica = parseFloat(icaStr);
          const cca = parseFloat(ccaStr);
          if (Number.isNaN(ica) || Number.isNaN(cca) || cca === 0) return null;
          return (ica / cca).toFixed(2);
        },
      },
    },
  ];
}

const rightVesselFields = vesselFields('right');
const leftVesselFields = vesselFields('left');

// A field still sitting at its own declared defaultValue (Stenosis
// Location, defaulted to ICA) doesn't count as "real" data for omission
// purposes — otherwise the section could never be detected as blank, since
// that default is applied at render time before the tech touches anything.
function hasRealData(field) {
  if (!hasValue(field)) return false;
  return field.defaultValue === undefined || getDisplayValue(field) !== field.defaultValue;
}

// Bespoke — see js/printView.js's `section.printRender` extension point
// (same pattern as Thyroid's Nodule Table). Omits the whole section only if
// neither side has anything entered; unlike the Nodule Table there's no
// per-row omission since there are only ever exactly two, always-meaningful
// rows (Right/Left), not dynamically-added throwaway ones.
function renderVesselPanelsPrint(section) {
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

export const carotidSheet = {
  id: 'carotid',
  title: 'Carotid Ultrasound',
  sections: [
    demographicsSection,
    {
      id: 'vesselPanels',
      title: 'Vessel Panels',
      layout: 'table',
      tableColumns: [
        'Subclavian (cm/s)',
        'CCA Systolic (cm/s)',
        'CCA Diastolic (cm/s)',
        'ICA Systolic (cm/s)',
        'ICA Diastolic (cm/s)',
        'ECA (cm/s)',
        'Vertebral (cm/s)',
        'Stenosis Location',
        '% Obstruction',
        'CA/CCA Ratio',
      ],
      // Shorter headers for the printed table only — 10 data columns is
      // already tight on a printed page; on-screen keeps the fuller labels.
      printTableColumns: [
        'Subclav',
        'CCA Sys',
        'CCA Dia',
        'ICA Sys',
        'ICA Dia',
        'ECA',
        'Vert',
        'Location',
        '% Obstr',
        'Ratio',
      ],
      tableRows: [
        { label: 'Right', fieldIds: rightVesselFields.map((f) => f.id) },
        { label: 'Left', fieldIds: leftVesselFields.map((f) => f.id) },
      ],
      fields: [...rightVesselFields, ...leftVesselFields],
      fullWidthPrint: true,
      printRender: renderVesselPanelsPrint,
    },
    {
      id: 'diagramMarkup',
      title: 'Diagram',
      fullWidthPrint: true,
      fields: [
        {
          id: 'carotidDiagram',
          label: 'Carotid Diagram',
          type: 'diagram',
          imageSrc: '/images/carotid_diagram.png',
          omitPrintLabel: true,
        },
      ],
    },
    {
      id: 'referenceTable',
      title: 'Reference Table',
      fields: [
        {
          id: 'stenosisReference',
          type: 'static-table',
          columns: [
            'Degree of Stenosis',
            'ICA PSV (cm/sec)',
            'Plaque Estimate %',
            'ICA/CCA PSV Ratio',
            'ICA EDV (cm/sec)',
          ],
          // Transcribed verbatim from the practice's own paper form
          // (images/Carotid_Tech_Sheet_Reference.jpg) — on-screen reference
          // only; renders via the generic type, so it's automatically
          // omitted from print (see js/formRenderer.js's renderStaticTable).
          rows: [
            ['Normal', '< 180', 'None', '< 2.0', '< 40'],
            ['< 50%', '< 180', '< 50', '< 2.0', '< 40'],
            ['50 - 69%', '180 - 230', '> 50', '2.0 - 4.0', '40 - 100'],
            ['> 70', '> 230', '> 50', '> 4.0', '> 100'],
            ['Near Occlusion', 'High, low, or undetectable', 'Visible', 'Variable', 'Variable'],
          ],
        },
      ],
    },
    commentsSection,
    interpretationSection,
  ],
};
