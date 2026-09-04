import { demographicsSection } from './demographicsSection.js';

// Shell only: lobe measurements, the nodule table/scoring, and the diagram
// markup feature (DESIGN.md §8-9) are a separate, upcoming build. Comments
// and Interpretation aren't added yet either, even though they're shared
// sections available via data/commentsSection.js and
// data/interpretationSection.js — they land alongside the full findings
// content next round, not in this nav/shell pass.
export const thyroidSheet = {
  id: 'thyroid',
  title: 'Thyroid Ultrasound',
  sections: [demographicsSection],
};
