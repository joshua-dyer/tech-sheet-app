import { flattenFields } from './formRenderer.js';

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
  const modal = document.getElementById('confirmModal');
  const cancelBtn = document.getElementById('modalCancel');
  const confirmBtn = document.getElementById('modalConfirm');
  if (!clearBtn || !modal || !cancelBtn || !confirmBtn) return;

  let lastFocused = null;

  const trapFocus = (event) => {
    if (event.key === 'Escape') {
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = modal.querySelectorAll('button');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    confirmBtn.focus();
    document.addEventListener('keydown', trapFocus);
  }

  function closeModal() {
    modal.hidden = true;
    document.removeEventListener('keydown', trapFocus);
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  clearBtn.addEventListener('click', openModal);
  cancelBtn.addEventListener('click', closeModal);
  confirmBtn.addEventListener('click', () => {
    clearSheet(schema);
    closeModal();
  });
}
