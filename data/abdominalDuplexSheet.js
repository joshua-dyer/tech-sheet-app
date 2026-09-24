import {
  aortaSection,
  liverSection,
  gallbladderSection,
  portalVeinSection,
  umbilicalVeinSection,
  cbdSection,
  pancreasSection,
  rightKidneySection,
  leftKidneySection,
  spleenSection,
  otherSection,
  aortaGroupReveal,
} from './abdominalSheet.js';
import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';

// Renal Artery:Aortic Ratio = Renal Artery Systolic ÷ Aortic Peak Systolic
// (same side) — the shared Aortic Peak Systolic value lives on the Aorta
// section (added below via aortaSection's extraFields), not duplicated per
// side. Same "arbitrary 2-input formula, no engine change needed" shape as
// Carotid's CA/CCA Ratio and Renal's Volume.
function renalArterySection(id, title, prefix) {
  return {
    id,
    title,
    fields: [
      { id: `${prefix}RenalArterySystolic`, label: 'Systolic Velocity', type: 'number', unit: 'cm/s' },
      { id: `${prefix}RenalArteryDiastolic`, label: 'Diastolic Velocity', type: 'number', unit: 'cm/s' },
      {
        id: `${prefix}RenalArteryAorticRatio`,
        label: 'Renal Artery:Aortic Ratio',
        type: 'computed',
        compute: {
          dependsOn: [`${prefix}RenalArterySystolic`, 'aortaPeakSystolicVelocity'],
          formula: (renalStr, aorticStr) => {
            const renal = parseFloat(renalStr);
            const aortic = parseFloat(aorticStr);
            if (Number.isNaN(renal) || Number.isNaN(aortic) || aortic === 0) return null;
            return (renal / aortic).toFixed(2);
          },
        },
      },
    ],
  };
}

export const abdominalDuplexSheet = {
  id: 'abdominalDuplex',
  title: 'Abdominal Duplex Ultrasound',
  sections: [
    demographicsSection,
    aortaSection([
      { id: 'aortaPeakSystolicVelocity', label: 'Peak Systolic Velocity', unit: 'cm/s', type: 'number', row: true },
    ]),
    liverSection,
    gallbladderSection,
    portalVeinSection,
    umbilicalVeinSection,
    cbdSection,
    pancreasSection,
    rightKidneySection([{ id: 'rkRi', label: 'Resistance Index', type: 'number', step: '0.01' }]),
    renalArterySection('rightRenalArtery', 'Right Renal Artery', 'right'),
    leftKidneySection([{ id: 'lkRi', label: 'Resistance Index', type: 'number', step: '0.01' }]),
    renalArterySection('leftRenalArtery', 'Left Renal Artery', 'left'),
    spleenSection,
    otherSection,
    commentsSection,
    interpretationSection,
  ],
  groupReveals: [aortaGroupReveal],
};
