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
    {
      id: 'age',
      label: 'Age',
      type: 'computed',
      compute: {
        dependsOn: ['dob', 'examDate'],
        formula: (dobStr, examDateStr) => {
          const dob = dobStr ? new Date(dobStr) : null;
          const examDate = examDateStr ? new Date(examDateStr) : null;
          if (!dob || !examDate || Number.isNaN(dob.getTime()) || Number.isNaN(examDate.getTime())) {
            return null;
          }
          let age = examDate.getUTCFullYear() - dob.getUTCFullYear();
          const hadBirthdayByExam =
            examDate.getUTCMonth() > dob.getUTCMonth() ||
            (examDate.getUTCMonth() === dob.getUTCMonth() && examDate.getUTCDate() >= dob.getUTCDate());
          if (!hadBirthdayByExam) age -= 1;
          return age >= 0 ? String(age) : null;
        },
      },
    },
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
