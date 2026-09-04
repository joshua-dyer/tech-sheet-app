import { PHYSICIAN_NAMES, OTHER_PHYSICIAN_OPTION } from './physicians.js';

// Shared across every sheet type — the physician sign-off workflow isn't
// organ-specific. js/printView.js's renderInterpretationHtml (and the
// toggle-driven Comments-suppression/print-promotion logic in
// openPrintView) both key off this section's fixed field ids, so any sheet
// using this section gets that print behavior automatically.
export const interpretationSection = {
  id: 'interpretation',
  title: 'Physician Interpretation',
  fields: [
    {
      id: 'interpretationToggle',
      label: 'Include Physician Interpretation',
      type: 'checkbox',
      reveal: {
        targetIds: ['interpretationPhysician', 'interpretationText'],
        condition: (value) => value === true,
      },
    },
    {
      id: 'interpretationPhysician',
      label: 'Physician Name',
      type: 'select',
      options: [...PHYSICIAN_NAMES, OTHER_PHYSICIAN_OPTION],
      defaultValue: OTHER_PHYSICIAN_OPTION,
      hiddenByDefault: true,
      reveal: {
        targetIds: ['interpretationPhysicianOther'],
        condition: (value) => value === OTHER_PHYSICIAN_OPTION,
      },
    },
    {
      id: 'interpretationPhysicianOther',
      label: "Enter Physician's Name",
      type: 'text',
      hiddenByDefault: true,
    },
    {
      id: 'interpretationText',
      label: "Physician's Impression",
      type: 'textarea',
      large: true,
      hiddenByDefault: true,
    },
  ],
};
