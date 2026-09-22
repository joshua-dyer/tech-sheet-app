import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';

// Uterus/Right Ovary/Left Ovary share the same Length/Height/Width +
// computed Volume shape — same pattern as Renal's kidneySection factory.
// 0.523 is the same ellipsoid-volume constant used by Renal's Kidney
// Volume, kept consistent rather than introducing a third distinct
// constant (per DESIGN.md §17).
function pelvicOrganSection(id, title, prefix) {
  return {
    id,
    title,
    rowLabel: 'Measurements',
    fields: [
      { id: `${prefix}Length`, label: 'Length', type: 'number', unit: 'cm', row: true },
      { id: `${prefix}Height`, label: 'Height', type: 'number', unit: 'cm', row: true },
      { id: `${prefix}Width`, label: 'Width', type: 'number', unit: 'cm', row: true },
      {
        id: `${prefix}Volume`,
        label: 'Volume',
        type: 'computed',
        unit: 'cm³',
        compute: {
          dependsOn: [`${prefix}Length`, `${prefix}Height`, `${prefix}Width`],
          formula: (lengthStr, heightStr, widthStr) => {
            const length = parseFloat(lengthStr);
            const height = parseFloat(heightStr);
            const width = parseFloat(widthStr);
            if ([length, height, width].some((n) => Number.isNaN(n))) return null;
            return (length * width * height * 0.523).toFixed(2);
          },
        },
      },
    ],
  };
}

export const pelvicSheet = {
  id: 'pelvic',
  title: 'Pelvic Ultrasound',
  sections: [
    demographicsSection,
    {
      id: 'history',
      title: 'History',
      fields: [
        { id: 'previousSurgery', label: 'Previous Surgery', type: 'text' },
        { id: 'gravida', label: 'Gravida', type: 'number', step: '1', row: true },
        { id: 'para', label: 'Para', type: 'number', step: '1', row: true },
      ],
    },
    {
      id: 'lmc',
      title: 'LMC',
      fields: [
        {
          id: 'lmc',
          label: 'LMC',
          type: 'radio',
          options: ['Date', 'Menopausal', 'N/A'],
          reveal: { targetIds: ['lmcDate'], condition: (value) => value === 'Date' },
        },
        { id: 'lmcDate', label: 'LMC Date', type: 'date', hiddenByDefault: true },
      ],
    },
    pelvicOrganSection('uterus', 'Uterus', 'uterus'),
    pelvicOrganSection('rightOvary', 'Right Ovary', 'rightOvary'),
    pelvicOrganSection('leftOvary', 'Left Ovary', 'leftOvary'),
    commentsSection,
    interpretationSection,
  ],
};
