import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml } from '../js/printHelpers.js';

function lobeSection(id, title, prefix) {
  return {
    id,
    title,
    rowLabel: 'Measurements',
    fields: [
      { id: `${prefix}Length`, label: 'Length', type: 'number', unit: 'cm', row: true },
      { id: `${prefix}Width`, label: 'Width', type: 'number', unit: 'cm', row: true },
      { id: `${prefix}Height`, label: 'Height', type: 'number', unit: 'cm', row: true },
      {
        id: `${prefix}Volume`,
        label: 'Volume',
        type: 'computed',
        unit: 'cm³',
        compute: {
          dependsOn: [`${prefix}Length`, `${prefix}Width`, `${prefix}Height`],
          formula: (lengthStr, widthStr, heightStr) => {
            const length = parseFloat(lengthStr);
            const width = parseFloat(widthStr);
            const height = parseFloat(heightStr);
            if ([length, width, height].some((n) => Number.isNaN(n))) return null;
            return (length * width * height * 0.479).toFixed(2);
          },
        },
      },
    ],
  };
}

// Composition/Echogenicity/Taller-than-wide/Margins/Echogenic Foci — the five
// TIRADS categories from DESIGN.md's Scoring Key. Each dropdown's rendered
// options ("Solid (2 pts)") and the printed Scoring Key both derive from this
// same data (js/formRenderer.js / this file's printRender), so they can't
// drift out of sync with each other.
const NODULE_COLUMNS = [
  { id: 'size', label: 'Size (mm)', type: 'text', placeholder: '__ x __ x __' },
  {
    id: 'composition',
    label: 'Composition',
    type: 'score-select',
    options: [
      { label: 'Cystic/Spongiform', points: 0 },
      { label: 'Mixed', points: 1 },
      { label: 'Solid', points: 2 },
    ],
  },
  {
    id: 'echogenicity',
    label: 'Echogenicity',
    type: 'score-select',
    options: [
      { label: 'Anechoic', points: 0 },
      { label: 'Hyperechoic/Isoechoic', points: 1 },
      { label: 'Hypoechoic', points: 2 },
      { label: 'Very Hypoechoic', points: 3 },
    ],
  },
  {
    id: 'tallerThanWide',
    label: 'Taller-than-wide',
    type: 'score-select',
    options: [
      { label: 'No', points: 0 },
      { label: 'Yes', points: 3 },
    ],
  },
  {
    id: 'margins',
    label: 'Margins',
    type: 'score-select',
    options: [
      { label: 'Smooth/Ill-defined', points: 0 },
      { label: 'Lobulated/Irregular', points: 2 },
      { label: 'Extra-thyroid extension', points: 3 },
    ],
  },
  {
    id: 'echogenicFoci',
    label: 'Echogenic Foci',
    type: 'score-select',
    options: [
      { label: 'None/Comet-tail', points: 0 },
      { label: 'Macro', points: 1 },
      { label: 'Peripheral', points: 2 },
      { label: 'Punctate', points: 3 },
    ],
  },
];
const NODULE_SCORE_COLUMN_IDS = NODULE_COLUMNS.filter((col) => col.type === 'score-select').map(
  (col) => col.id
);

function deriveTirads(points) {
  if (points < 2) return 'Benign';
  if (points === 2) return 'TR2 — Not Suspicious';
  if (points === 3) return 'TR3 — Mildly Suspicious';
  if (points <= 6) return 'TR4 — Moderately Suspicious';
  return 'TR5 — Highly Suspicious';
}

// Bespoke — see js/printView.js's `section.printRender` extension point.
// Reads the live table rows directly (not the field's hidden snapshot
// mirror, which only exists for unsaved-changes detection). A row counts as
// blank (and is omitted) only if Size is empty AND nothing was scored.
function renderNoduleTablePrint(section) {
  const tableField = section.fields.find((f) => f.id === 'noduleTable');
  const tbody = document.getElementById(`dt-body-${tableField.id}`);
  if (!tbody) return '';

  const rows = Array.from(tbody.children)
    .map((tr) => {
      const cells = {};
      for (const col of tableField.columns) {
        const cellEl = tr.querySelector(`[data-col="${col.id}"]`);
        if (!cellEl) {
          cells[col.id] = '';
        } else if (col.type === 'score-select') {
          cells[col.id] = cellEl.value !== '' ? cellEl.selectedOptions[0].textContent : '';
        } else {
          cells[col.id] = cellEl.value.trim();
        }
      }
      return {
        cells,
        totalText: tr.querySelector('.dt-total')?.textContent ?? '0',
        tiradsText: tr.querySelector('.dt-tirads')?.textContent ?? '—',
      };
    })
    .filter((row) => {
      const sizeFilled = row.cells.size !== '';
      const anyScored = tableField.scoreColumnIds.some((id) => row.cells[id] !== '');
      return sizeFilled || anyScored;
    });

  if (rows.length === 0) return '';

  const headerCells = ['Nodule #', ...tableField.columns.map((c) => c.label), 'Total Points', 'TIRADS Level']
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join('');

  const bodyRows = rows
    .map((row, index) => {
      const dataCells = tableField.columns
        .map((col) => `<td>${escapeHtml(row.cells[col.id] || '—')}</td>`)
        .join('');
      return `<tr><td>${index + 1}</td>${dataCells}<td>${escapeHtml(row.totalText)}</td><td>${escapeHtml(row.tiradsText)}</td></tr>`;
    })
    .join('');

  // Scoring Key is intentionally omitted from print (stays on-screen only) —
  // the table's Total Points/TIRADS Level columns already carry the scored
  // outcome, and dropping the key helps sheets fit on one printed page.
  return `<section class="print-section print-nodule-table"><h2>${escapeHtml(section.title)}</h2><table class="print-nodule-grid"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></section>`;
}

export const thyroidSheet = {
  id: 'thyroid',
  title: 'Thyroid Ultrasound',
  sections: [
    demographicsSection,
    lobeSection('rightLobe', 'Right Lobe', 'rightLobe'),
    lobeSection('leftLobe', 'Left Lobe', 'leftLobe'),
    {
      id: 'isthmus',
      title: 'Isthmus',
      fields: [{ id: 'isthmusDiameter', label: 'Isthmus Diameter', type: 'number', unit: 'mm' }],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      fields: [
        {
          id: 'overallTexture',
          label: 'Overall Texture',
          type: 'radio',
          options: ['Homogeneous', 'Inhomogeneous'],
        },
        {
          id: 'hypervascularity',
          label: 'Hypervascularity',
          type: 'checkbox',
          checkedPrintText: 'Hypervascularity noted',
          omitPrintLabel: true,
        },
      ],
    },
    {
      id: 'diagramMarkup',
      title: 'Diagram',
      fullWidthPrint: true,
      fields: [
        {
          id: 'thyroidDiagram',
          label: 'Thyroid Diagram',
          type: 'diagram',
          imageSrc: '/images/thyroid_diagram.png',
        },
      ],
    },
    {
      id: 'noduleTable',
      title: 'Nodule Table',
      fullWidthPrint: true,
      printRender: renderNoduleTablePrint,
      fields: [
        {
          id: 'noduleTable',
          type: 'dynamic-table',
          columns: NODULE_COLUMNS,
          scoreColumnIds: NODULE_SCORE_COLUMN_IDS,
          deriveTirads,
        },
      ],
    },
    commentsSection,
    interpretationSection,
  ],
};
