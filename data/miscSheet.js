import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';

// Catch-all for soft-tissue/MSK studies (shoulders, elbows, knees,
// lumps/bumps, etc.) that don't warrant their own dedicated sheet type.
// No findings section, no diagram — just the three shared sections exactly
// as they already work everywhere else.
export const miscSheet = {
  id: 'misc',
  title: 'Miscellaneous Ultrasound',
  sections: [demographicsSection, commentsSection, interpretationSection],
};
