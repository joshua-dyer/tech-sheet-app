import { flattenFields } from './formRenderer.js';
import { getDisplayValue } from './printHelpers.js';
import { showConfirmModal } from './confirmModal.js';
import { resetDiagram } from './diagramMarkup.js';
import { resetDynamicTable } from './dynamicTable.js';

let initialSnapshot = null;

// Reuses getDisplayValue — the same per-field reader the print feature
// already uses — rather than field-by-field "is this empty" logic, which
// previously misfired on fields with a non-blank default value (e.g. the
// Physician Name dropdown defaults to "Other - enter manually") even on a
// freshly loaded page nobody had touched yet.
function captureSnapshot(schema) {
  const values = {};
  for (const field of flattenFields(schema)) {
    values[field.id] = getDisplayValue(field);
  }
  return JSON.stringify(values);
}

// Called once, right after the sheet renders, so later comparisons are
// against the true as-loaded state (including any field defaultValues).
export function recordInitialState(schema) {
  initialSnapshot = captureSnapshot(schema);
}

export function hasUnsavedChanges(schema) {
  if (initialSnapshot === null) return false;
  return captureSnapshot(schema) !== initialSnapshot;
}

export function clearSheet(schema) {
  for (const field of flattenFields(schema)) {
    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'textarea':
      case 'select': {
        const inputEl = document.getElementById(field.id);
        if (inputEl) inputEl.value = '';
        break;
      }
      case 'radio':
      case 'checkbox-group': {
        document.querySelectorAll(`input[name="${field.id}"]`).forEach((input) => {
          input.checked = false;
        });
        break;
      }
      case 'checkbox': {
        const inputEl = document.getElementById(field.id);
        if (inputEl) inputEl.checked = false;
        break;
      }
      case 'computed': {
        const outputEl = document.getElementById(field.id);
        if (outputEl) outputEl.textContent = '—';
        break;
      }
      case 'diagram':
        resetDiagram(field.id);
        break;
      case 'dynamic-table':
        resetDynamicTable(field.id);
        break;
      default:
        break;
    }

    if (field.hiddenByDefault) {
      const wrapper = document.getElementById(`field-wrap-${field.id}`);
      if (wrapper) {
        wrapper.classList.remove('is-visible');
        wrapper.hidden = true;
      }
    }
  }
}

export function initClearButton(schema) {
  const clearBtn = document.getElementById('clearBtn');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    showConfirmModal({
      title: 'Clear this sheet?',
      message: 'This will erase all entered data on this tech sheet. This cannot be undone.',
      confirmLabel: 'Clear Sheet',
      onConfirm: () => {
        clearSheet(schema);
        // The just-cleared state becomes the new baseline, so navigating
        // away right after Clear doesn't still warn about "unsaved" data.
        recordInitialState(schema);
      },
    });
  });
}
