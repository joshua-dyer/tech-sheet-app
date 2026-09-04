// Single source of truth for which sheet pages exist — drives the nav
// (js/nav.js) and any future sheet-switcher UI. Add an entry here whenever a
// new standalone sheet page is added.
export const SHEETS = [
  { id: 'abdominal', label: 'Abdominal', href: 'index.html' },
  { id: 'thyroid', label: 'Thyroid', href: 'thyroid.html' },
];
