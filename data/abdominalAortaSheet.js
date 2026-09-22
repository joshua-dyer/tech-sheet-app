import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';

// Standalone (not built from data/abdominalSheet.js's aortaSection factory)
// since that factory bakes Dissection/Iliacs directly into one card — this
// sheet splits Aorta into two orientation cards (Longitudinal/Transverse)
// feeding a single shared reveal rule, a different shape than the original.
export const abdominalAortaSheet = {
  id: 'abdominalAorta',
  title: 'Abdominal Aorta Ultrasound',
  sections: [
    demographicsSection,
    {
      id: 'aortaLongitudinal',
      title: 'Aorta — Longitudinal',
      rowLabel: 'Measurements',
      fields: [
        { id: 'aortaLongProx', label: 'Proximal', type: 'number', unit: 'cm', step: '0.1', row: true },
        { id: 'aortaLongMid', label: 'Mid', type: 'number', unit: 'cm', step: '0.1', row: true },
        { id: 'aortaLongDist', label: 'Distal', type: 'number', unit: 'cm', step: '0.1', row: true },
        { id: 'aortaLongPsv', label: 'Peak Systolic Velocity', type: 'number', unit: 'cm/s', row: true },
        {
          id: 'aortaDissection',
          label: 'Dissection?',
          type: 'radio',
          options: ['Yes', 'No'],
          hiddenByDefault: true,
        },
        {
          id: 'aortaIliacs',
          label: 'Involves Iliacs?',
          type: 'radio',
          options: ['Yes', 'No'],
          hiddenByDefault: true,
        },
      ],
    },
    {
      id: 'aortaTransverse',
      title: 'Aorta — Transverse',
      rowLabel: 'Measurements',
      fields: [
        { id: 'aortaTransProx', label: 'Proximal', type: 'number', unit: 'cm', step: '0.1', row: true },
        { id: 'aortaTransMid', label: 'Mid', type: 'number', unit: 'cm', step: '0.1', row: true },
        { id: 'aortaTransDist', label: 'Distal', type: 'number', unit: 'cm', step: '0.1', row: true },
      ],
    },
    {
      id: 'rightIliac',
      title: 'Right Iliac',
      rowLabel: 'Measurements',
      fields: [
        { id: 'rightIliacLongitudinal', label: 'Longitudinal', type: 'number', unit: 'cm', step: '0.1', row: true },
        { id: 'rightIliacTransverse', label: 'Transverse', type: 'number', unit: 'cm', step: '0.1', row: true },
      ],
    },
    {
      id: 'leftIliac',
      title: 'Left Iliac',
      rowLabel: 'Measurements',
      fields: [
        { id: 'leftIliacLongitudinal', label: 'Longitudinal', type: 'number', unit: 'cm', step: '0.1', row: true },
        { id: 'leftIliacTransverse', label: 'Transverse', type: 'number', unit: 'cm', step: '0.1', row: true },
      ],
    },
    commentsSection,
    interpretationSection,
  ],
  groupReveals: [
    {
      id: 'aortaReveal',
      // Same condition as the original Abdominal sheet's rule (any segment
      // ≥3.5cm), just extended from 3 trigger fields to 6 — a pure config
      // change, since js/fieldReveal.js's wireGroupReveal already handles
      // triggerFieldIds of any length generically.
      triggerFieldIds: [
        'aortaLongProx',
        'aortaLongMid',
        'aortaLongDist',
        'aortaTransProx',
        'aortaTransMid',
        'aortaTransDist',
      ],
      targetIds: ['aortaDissection', 'aortaIliacs'],
      condition: (values) => values.some((v) => parseFloat(v) >= 3.5),
    },
  ],
};
