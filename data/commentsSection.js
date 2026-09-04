// Shared across every sheet type — Technologist Comments isn't organ-specific.
// js/printView.js suppresses this section from print by id ('comments')
// whenever Physician Interpretation is enabled, so any sheet using this
// section gets that behavior automatically.
export const commentsSection = {
  id: 'comments',
  title: 'Technologist Comments',
  fields: [
    // Auto-population from measurement thresholds (Liver >16.5cm, Kidney
    // Cortex <1.3cm, Spleen ≥13cm) is planned for Phase 2 — not implemented yet.
    {
      id: 'comments',
      label: 'Technologist Comments',
      type: 'textarea',
      large: true,
      // Section already has this exact title as its print heading.
      omitPrintLabel: true,
    },
  ],
};
