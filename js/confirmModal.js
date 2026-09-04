// Generic confirmation modal shared by the Clear button (js/clearForm.js) and
// the nav's unsaved-data guard (js/nav.js). The markup in each sheet's HTML
// is a blank shell (#modalTitle/#modalMessage/#modalConfirm start empty) —
// showConfirmModal fills it in per invocation rather than each caller having
// its own modal instance/copy of the focus-trap logic.

let currentOnConfirm = null;
let currentOnCancel = null;
let lastFocused = null;

function getModalEls() {
  return {
    modal: document.getElementById('confirmModal'),
    title: document.getElementById('modalTitle'),
    message: document.getElementById('modalMessage'),
    cancelBtn: document.getElementById('modalCancel'),
    confirmBtn: document.getElementById('modalConfirm'),
  };
}

function closeModal() {
  const { modal } = getModalEls();
  if (!modal) return;
  modal.hidden = true;
  document.removeEventListener('keydown', trapFocus);
  if (lastFocused instanceof HTMLElement) lastFocused.focus();
}

// Closing via Cancel/Escape (as opposed to Confirm) runs onCancel — e.g. the
// nav's dropdown reverts to the current sheet when the user backs out.
function dismiss() {
  const callback = currentOnCancel;
  closeModal();
  currentOnConfirm = null;
  currentOnCancel = null;
  callback?.();
}

function trapFocus(event) {
  const { modal } = getModalEls();
  if (event.key === 'Escape') {
    dismiss();
    return;
  }
  if (event.key !== 'Tab' || !modal) return;
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
}

export function showConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const { modal, title: titleEl, message: messageEl, confirmBtn } = getModalEls();
  if (!modal || !titleEl || !messageEl || !confirmBtn) return;

  titleEl.textContent = title;
  messageEl.textContent = message;
  confirmBtn.textContent = confirmLabel;
  currentOnConfirm = onConfirm;
  currentOnCancel = onCancel;

  lastFocused = document.activeElement;
  modal.hidden = false;
  confirmBtn.focus();
  document.addEventListener('keydown', trapFocus);
}

export function initConfirmModal() {
  const { cancelBtn, confirmBtn } = getModalEls();
  if (!cancelBtn || !confirmBtn) return;

  cancelBtn.addEventListener('click', dismiss);
  confirmBtn.addEventListener('click', () => {
    const callback = currentOnConfirm;
    closeModal();
    currentOnConfirm = null;
    currentOnCancel = null;
    callback?.();
  });
}
