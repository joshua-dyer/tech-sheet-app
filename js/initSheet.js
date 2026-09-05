import { renderSheet } from './formRenderer.js';
import { initReveals } from './fieldReveal.js';
import { initComputedFields } from './computedFields.js';
import { initDiagramMarkup } from './diagramMarkup.js';
import { initDynamicTables } from './dynamicTable.js';
import { initClearButton, recordInitialState } from './clearForm.js';
import { initConfirmModal } from './confirmModal.js';
import { initNav } from './nav.js';
import { openPrintView } from './printView.js';

// The bootstrap sequence every sheet page runs. Kept in its own module (not
// folded into js/app.js) specifically so importing it has no side effects —
// each sheet's own tiny entry script (js/app.js for Abdominal,
// js/thyroidApp.js for Thyroid) is the only place that actually calls this,
// with its own schema and sheet id.
export function initSheet(schema, sheetId) {
  const mount = document.getElementById('sheetMount');
  renderSheet(schema, mount);
  recordInitialState(schema);
  initReveals(schema);
  initComputedFields(schema);
  initDiagramMarkup(schema);
  initDynamicTables(schema);
  initConfirmModal();
  initClearButton(schema);
  initNav(schema, sheetId);

  document.getElementById('printBtn')?.addEventListener('click', () => {
    openPrintView(schema);
  });
}
