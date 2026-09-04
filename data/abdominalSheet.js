import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';
import { escapeHtml, getCheckedGroupValues } from '../js/printHelpers.js';

const POSITIVE_MURPHY_OPTION = "Positive Murphy's Sign";
const NEGATIVE_MURPHY_TEXT = "Negative Murphy's Sign";

// Murphy's Sign is folded into the Gallbladder checkbox-group rather than its
// own section, so it needs bespoke print logic instead of the plain
// checked-or-not summary the generic renderer gives every other
// checkbox-group: a positive reading is itself an abnormal finding, so it
// prints as-is with no "No abnormalities noted" fallback; a negative reading
// always appends "Negative Murphy's Sign" — even when nothing else is
// checked, in which case it follows the emptyPrintText fallback instead.
function renderGallbladderPrint(section) {
  const findingsField = section.fields.find((f) => f.id === 'gallbladderFindings');
  const checked = getCheckedGroupValues(findingsField);
  const isPositive = checked.includes(POSITIVE_MURPHY_OPTION);
  const value = isPositive
    ? checked.join(', ')
    : `${checked.length > 0 ? checked.join(', ') : findingsField.emptyPrintText}, ${NEGATIVE_MURPHY_TEXT}`;

  return `<section class="print-section"><h2>${escapeHtml(section.title)}</h2><div class="print-row"><span class="print-label">${escapeHtml(findingsField.label)}</span><span class="print-value">${escapeHtml(value)}</span></div></section>`;
}

export const abdominalSheet = {
  id: 'abdominal',
  title: 'Abdominal Ultrasound',
  sections: [
    demographicsSection,
    {
      id: 'aorta',
      title: 'Abd. Aorta',
      rowLabel: 'Measurements',
      fields: [
        { id: 'aortaProx', label: 'Proximal', type: 'number', unit: 'cm', row: true },
        { id: 'aortaMid', label: 'Mid', type: 'number', unit: 'cm', row: true },
        { id: 'aortaDist', label: 'Distal', type: 'number', unit: 'cm', row: true },
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
      id: 'liver',
      title: 'Liver',
      fields: [{ id: 'liverLength', label: 'Liver Length', type: 'number', unit: 'cm' }],
    },
    {
      id: 'gallbladder',
      title: 'Gallbladder',
      fields: [
        {
          id: 'gallbladderFindings',
          label: 'Findings',
          type: 'checkbox-group',
          options: [
            'Stones',
            'Sludge',
            'Wall Thickening',
            'Pericholecystic Fluid',
            "Positive Murphy's Sign",
          ],
          // Reflects that the technologist didn't flag anything — not a
          // clinical assertion, which remains the physician's call. Print
          // logic for this field also appends/negates Murphy's Sign — see
          // this section's printRender below.
          emptyPrintText: 'No abnormalities noted',
        },
      ],
      printRender: renderGallbladderPrint,
      printRowCount: () => 2,
    },
    {
      id: 'portalVein',
      title: 'Portal Vein',
      fields: [
        {
          id: 'portalVein',
          label: 'Portal Vein',
          type: 'radio',
          options: ['Normal', 'Dilated'],
          reveal: { targetIds: ['portalVeinMeasurement'], condition: (value) => value === 'Dilated' },
        },
        {
          id: 'portalVeinMeasurement',
          label: 'Portal Vein Diameter',
          type: 'number',
          unit: 'cm',
          hiddenByDefault: true,
        },
        {
          id: 'portalVeinFlow',
          label: 'Portal Vein Flow',
          type: 'radio',
          options: ['Hepatopedal', 'Hepatofugal'],
        },
      ],
    },
    {
      id: 'cbd',
      title: 'CBD',
      fields: [{ id: 'cbd', label: 'CBD', type: 'number', unit: 'cm' }],
    },
    {
      id: 'pancreas',
      title: 'Pancreas',
      rowLabel: 'Measurements',
      // Printed when no measurement was entered and Poorly Visualized wasn't
      // checked — same non-diagnostic-placeholder pattern as Gallbladder's
      // field-level emptyPrintText, applied here at the section level since
      // "no Pancreas entry" spans several independent fields, not one.
      emptyPrintText: 'No abnormalities noted',
      fields: [
        { id: 'pancreasHead', label: 'Head', type: 'number', unit: 'cm', row: true },
        { id: 'pancreasBody', label: 'Body', type: 'number', unit: 'cm', row: true },
        { id: 'pancreasTail', label: 'Tail', type: 'number', unit: 'cm', row: true },
        { id: 'pancreasDuct', label: 'Duct', type: 'number', unit: 'cm', row: true },
        {
          id: 'pancreasPoorlyVisualized',
          label: 'Poorly Visualized',
          type: 'checkbox',
        },
      ],
    },
    {
      id: 'rightKidney',
      title: 'Right Kidney',
      rowLabel: 'Measurements',
      fields: [
        { id: 'rkLength', label: 'Length', type: 'number', unit: 'cm', row: true },
        { id: 'rkWidth', label: 'Width', type: 'number', unit: 'cm', row: true },
        { id: 'rkHeight', label: 'Height', type: 'number', unit: 'cm', row: true },
        { id: 'rkCortex', label: 'Cortex', type: 'number', unit: 'cm', row: true },
      ],
    },
    {
      id: 'leftKidney',
      title: 'Left Kidney',
      rowLabel: 'Measurements',
      fields: [
        { id: 'lkLength', label: 'Length', type: 'number', unit: 'cm', row: true },
        { id: 'lkWidth', label: 'Width', type: 'number', unit: 'cm', row: true },
        { id: 'lkHeight', label: 'Height', type: 'number', unit: 'cm', row: true },
        { id: 'lkCortex', label: 'Cortex', type: 'number', unit: 'cm', row: true },
      ],
    },
    {
      id: 'spleen',
      title: 'Spleen',
      fields: [{ id: 'spleenLength', label: 'Spleen Length', type: 'number', unit: 'cm' }],
    },
    {
      id: 'other',
      title: 'Other',
      fields: [{ id: 'otherFindings', label: 'Other Findings', type: 'textarea' }],
    },
    commentsSection,
    interpretationSection,
  ],
  groupReveals: [
    {
      id: 'aortaReveal',
      triggerFieldIds: ['aortaProx', 'aortaMid', 'aortaDist'],
      targetIds: ['aortaDissection', 'aortaIliacs'],
      condition: (values) => values.some((v) => parseFloat(v) >= 3.5),
    },
  ],
};
