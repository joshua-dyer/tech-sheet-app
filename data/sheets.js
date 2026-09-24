// Single source of truth for which sheet pages exist — drives the nav
// (js/nav.js) and any future sheet-switcher UI. Add an entry here whenever a
// new standalone sheet page is added, with a `group` matching one of
// SHEET_GROUPS below.
export const SHEET_GROUPS = [
  { key: 'common', label: 'Common' },
  { key: 'uncommon', label: 'Uncommon' },
];

export const SHEETS = [
  { id: 'abdominal', label: 'Abdominal', href: 'index.html', group: 'common' },
  { id: 'abdominalDuplex', label: 'Abdominal Duplex', href: 'abdominalDuplex.html', group: 'common' },
  { id: 'thyroid', label: 'Thyroid', href: 'thyroid.html', group: 'common' },
  { id: 'carotid', label: 'Carotid', href: 'carotid.html', group: 'common' },
  { id: 'echo', label: 'Echo', href: 'echo.html', group: 'common' },
  { id: 'venousLe', label: 'Venous Doppler LE', href: 'venousLe.html', group: 'common' },
  { id: 'misc', label: 'Misc', href: 'misc.html', group: 'common' },
  { id: 'renal', label: 'Renal', href: 'renal.html', group: 'common' },
  { id: 'arterialLe', label: 'Arterial Doppler LE', href: 'arterialLe.html', group: 'common' },
  { id: 'abdominalAorta', label: 'Abdominal Aorta', href: 'abdominalAorta.html', group: 'common' },
  { id: 'pelvic', label: 'Pelvic Ultrasound', href: 'pelvic.html', group: 'uncommon' },
  { id: 'breast', label: 'Breast Ultrasound', href: 'breast.html', group: 'uncommon' },
  { id: 'scrotal', label: 'Scrotal Ultrasound', href: 'scrotal.html', group: 'uncommon' },
  { id: 'arterialUe', label: 'Arterial Doppler UE', href: 'arterialUe.html', group: 'uncommon' },
  { id: 'venousUe', label: 'Venous Doppler UE', href: 'venousUe.html', group: 'uncommon' },
];
