import { SHEETS } from '../data/sheets.js';
import { hasUnsavedChanges } from './clearForm.js';
import { showConfirmModal } from './confirmModal.js';

// Renders the persistent sheet-switcher nav into #navMount from the shared
// sheet registry (data/sheets.js) as a <select> — stays compact as more
// sheets are added, rather than a growing row of buttons/links — and guards
// navigation away from a sheet with unsaved changes, reusing the same
// confirmation modal the Clear button uses (DESIGN.md §5) rather than a
// plain browser confirm().
export function initNav(schema, currentSheetId) {
  const nav = document.getElementById('navMount');
  if (!nav) return;

  const currentSheet = SHEETS.find((sheet) => sheet.id === currentSheetId);

  nav.innerHTML = '';
  const select = document.createElement('select');
  select.className = 'site-nav-select';
  select.setAttribute('aria-label', 'Switch tech sheet');

  for (const sheet of SHEETS) {
    const option = document.createElement('option');
    option.value = sheet.href;
    option.textContent = sheet.label;
    if (sheet.id === currentSheetId) option.selected = true;
    select.appendChild(option);
  }

  select.addEventListener('change', () => {
    const targetHref = select.value;

    if (!hasUnsavedChanges(schema)) {
      window.location.href = targetHref;
      return;
    }

    showConfirmModal({
      title: 'Leave this sheet?',
      message: 'You have unsaved data on this sheet. Switching sheets will lose this data. Continue?',
      confirmLabel: 'Leave',
      onConfirm: () => {
        window.location.href = targetHref;
      },
      onCancel: () => {
        if (currentSheet) select.value = currentSheet.href;
      },
    });
  });

  nav.appendChild(select);
}
