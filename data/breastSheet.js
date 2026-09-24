import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';

// Deliberately no BI-RADS-style scoring/findings table here (per
// DESIGN.md §18) — that judgment is left entirely to the interpreting
// physician; mass-level detail is documented as free text in Comments/
// Interpretation instead.
export const breastSheet = {
  id: 'breast',
  title: 'Breast Ultrasound',
  sections: [
    demographicsSection,
    {
      id: 'history',
      title: 'History',
      fields: [
        {
          id: 'historyOfBreastCancer',
          label: 'Patient History of Breast Cancer',
          type: 'radio',
          options: ['Yes', 'No'],
        },
      ],
    },
    {
      id: 'diagramMarkup',
      title: 'Diagram',
      fullWidthPrint: true,
      fields: [
        {
          id: 'breastDiagram',
          label: 'Breast Diagram',
          type: 'diagram',
          imageSrc: '/images/breast-diagram.png',
          omitPrintLabel: true,
        },
      ],
    },
    commentsSection,
    interpretationSection,
  ],
};
