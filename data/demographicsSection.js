// Shared across every sheet type — not organ-specific. Imported by each
// sheet's data file (e.g. data/abdominalSheet.js, data/thyroidSheet.js)
// rather than duplicated, so field ids/behavior stay identical everywhere
// js/printView.js's Demographics print-column grouping depends on them.
export const demographicsSection = {
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
};
