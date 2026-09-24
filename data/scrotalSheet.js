import { demographicsSection } from './demographicsSection.js';
import { commentsSection } from './commentsSection.js';
import { interpretationSection } from './interpretationSection.js';

// Right/Left Testicle share the same Length/Height/Width + computed
// Volume + Epididymis Appearance shape — same pattern as Renal's
// kidneySection/Pelvic's pelvicOrganSection factories. 0.523 is the same
// ellipsoid-volume constant used by Kidney/Uterus/Ovary Volume elsewhere,
// kept consistent rather than introducing a fourth distinct constant.
function testicleSection(id, title, prefix) {
  return {
    id,
    title,
    rowLabel: 'Measurements',
    fields: [
      { id: `${prefix}Length`, label: 'Length', type: 'number', unit: 'cm', row: true },
      { id: `${prefix}Height`, label: 'Height', type: 'number', unit: 'cm', row: true },
      { id: `${prefix}Width`, label: 'Width', type: 'number', unit: 'cm', row: true },
      {
        id: `${prefix}Volume`,
        label: 'Volume',
        type: 'computed',
        unit: 'cm³',
        compute: {
          dependsOn: [`${prefix}Length`, `${prefix}Height`, `${prefix}Width`],
          formula: (lengthStr, heightStr, widthStr) => {
            const length = parseFloat(lengthStr);
            const height = parseFloat(heightStr);
            const width = parseFloat(widthStr);
            if ([length, height, width].some((n) => Number.isNaN(n))) return null;
            return (length * width * height * 0.523).toFixed(2);
          },
        },
      },
      { id: `${prefix}EpididymisAppearance`, label: 'Epididymis Appearance', type: 'text' },
    ],
  };
}

export const scrotalSheet = {
  id: 'scrotal',
  title: 'Scrotal Ultrasound',
  sections: [
    demographicsSection,
    testicleSection('rightTesticle', 'Right Testicle', 'rightTesticle'),
    testicleSection('leftTesticle', 'Left Testicle', 'leftTesticle'),
    commentsSection,
    interpretationSection,
  ],
};
