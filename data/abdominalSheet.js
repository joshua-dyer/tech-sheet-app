export const abdominalSheet = {
  id: 'abdominal',
  title: 'Abdominal Ultrasound',
  sections: [
    {
      id: 'demographics',
      title: 'Demographics',
      fields: [
        { id: 'lastName', label: 'Last Name', type: 'text' },
        { id: 'firstName', label: 'First Name', type: 'text' },
        { id: 'patientId', label: 'ID', type: 'text' },
        { id: 'examDate', label: 'Date of Exam', type: 'date' },
        { id: 'dob', label: 'Date of Birth', type: 'date' },
        {
          id: 'sex',
          label: 'Sex',
          type: 'select',
          options: [
            'Male',
            'Female',
            'Non-binary',
            'Transgender Male',
            'Transgender Female',
            'Choose not to identify',
            'Other',
          ],
          reveal: { targetIds: ['sexOther'], condition: (value) => value === 'Other' },
        },
        { id: 'sexOther', label: 'Please specify', type: 'text', hiddenByDefault: true },
        { id: 'age', label: 'Age', type: 'computed' },
        { id: 'orderingPhysician', label: 'Ordering Physician', type: 'text' },
        { id: 'indications', label: 'Indications', type: 'text' },
        {
          id: 'priorStudy',
          label: 'Prior Study',
          type: 'radio',
          options: ['Yes', 'No'],
          reveal: { targetIds: ['priorStudyDetail'], condition: (value) => value === 'Yes' },
        },
        {
          id: 'priorStudyDetail',
          label: 'Prior Study Date',
          type: 'date',
          hiddenByDefault: true,
        },
      ],
    },
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
          options: ['Stones', 'Sludge', 'Wall Thickening', 'Pericholecystic Fluid'],
          // Reflects that the technologist didn't flag anything — not a
          // clinical assertion, which remains the physician's call.
          emptyPrintText: 'No abnormalities noted',
        },
      ],
    },
    {
      id: 'murphy',
      title: "Murphy's Sign",
      fields: [
        { id: 'murphySign', label: "Murphy's Sign", type: 'radio', options: ['Positive', 'Negative'] },
      ],
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
      fields: [
        { id: 'pancreasHead', label: 'Head', type: 'number', unit: 'cm', row: true },
        { id: 'pancreasBody', label: 'Body', type: 'number', unit: 'cm', row: true },
        { id: 'pancreasTail', label: 'Tail', type: 'number', unit: 'cm', row: true },
        { id: 'pancreasDuct', label: 'Duct', type: 'number', unit: 'cm', row: true },
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
    {
      id: 'comments',
      title: 'Technologist Comments',
      fields: [
        // Auto-population from measurement thresholds (Liver >16.5cm, Kidney
        // Cortex <1.3cm, Spleen ≥13cm) is planned for Phase 2 — not implemented yet.
        { id: 'comments', label: 'Technologist Comments', type: 'textarea', large: true },
      ],
    },
    {
      id: 'interpretation',
      title: 'Physician Interpretation',
      fields: [
        {
          id: 'interpretationToggle',
          label: 'Include Physician Interpretation',
          type: 'checkbox',
          reveal: { targetIds: ['interpretationText'], condition: (value) => value === true },
        },
        {
          id: 'interpretationText',
          label: 'Physician Interpretation',
          type: 'textarea',
          large: true,
          hiddenByDefault: true,
        },
      ],
    },
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
