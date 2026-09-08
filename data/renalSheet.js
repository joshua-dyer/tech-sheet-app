import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';

// Right/Left Kidney — same Length/Width/Height-row-plus-computed-Volume
// pattern as Thyroid's lobeSection, but with a different ellipsoid-volume
// constant (0.523, not Thyroid's 0.479 — a different organ-specific
// correction factor) and an added RI field. Kept as a factory so the two
// sides can't drift out of sync with each other.
function kidneySection(id, title, prefix) {
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
            return (length * width * height * 0.523).toFixed(2);
          },
        },
      },
      // Resistive Index — plain decimal entry (no reference range), so it
      // needs a finer step than the standard 0.1cm measurement fields.
      { id: `${prefix}Ri`, label: 'Resistance Index', type: 'number', step: '0.01' },
    ],
  };
}

export const renalSheet = {
  id: 'renal',
  title: 'Renal Ultrasound',
  sections: [
    demographicsSection,
    kidneySection('rightKidney', 'Right Kidney', 'rightKidney'),
    kidneySection('leftKidney', 'Left Kidney', 'leftKidney'),
    {
      id: 'diagramMarkup',
      title: 'Diagram',
      fullWidthPrint: true,
      fields: [
        {
          id: 'renalDiagram',
          label: 'Renal Diagram',
          type: 'diagram',
          imageSrc: '/images/renal_diagram.png',
          // Section heading ("Diagram") already says this — redundant inline.
          omitPrintLabel: true,
        },
      ],
    },
    commentsSection,
    interpretationSection,
  ],
};
