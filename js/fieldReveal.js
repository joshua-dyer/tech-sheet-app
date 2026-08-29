import { flattenFields } from './formRenderer.js';

const REVEAL_EVENT_BY_TYPE = {
  text: 'blur',
  number: 'blur',
  date: 'blur',
  select: 'change',
  radio: 'change',
  checkbox: 'change',
  'checkbox-group': 'change',
};

export function revealElement(wrapper) {
  if (!wrapper.hidden) return;
  wrapper.hidden = false;
  requestAnimationFrame(() => wrapper.classList.add('is-visible'));
}

export function hideElement(wrapper) {
  if (wrapper.hidden) return;
  wrapper.classList.remove('is-visible');
  const finish = () => {
    wrapper.hidden = true;
    wrapper.removeEventListener('transitionend', finish);
  };
  wrapper.addEventListener('transitionend', finish);
  // Fallback in case transitionend never fires (e.g. reduced-motion settings).
  setTimeout(finish, 350);
}

function applyReveal(targetIds, isVisible) {
  for (const targetId of targetIds) {
    const wrapper = document.getElementById(`field-wrap-${targetId}`);
    if (!wrapper) continue;
    if (isVisible) revealElement(wrapper);
    else hideElement(wrapper);
  }
}

function getFieldValue(field) {
  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
    case 'select':
      return document.getElementById(field.id)?.value ?? '';
    case 'radio': {
      const checked = document.querySelector(`input[name="${field.id}"]:checked`);
      return checked ? checked.value : '';
    }
    case 'checkbox':
      return document.getElementById(field.id)?.checked ?? false;
    default:
      return null;
  }
}

function wireFieldReveal(field) {
  const evaluate = () => applyReveal(field.reveal.targetIds, field.reveal.condition(getFieldValue(field)));
  const eventName = REVEAL_EVENT_BY_TYPE[field.type];

  if (field.type === 'radio') {
    document.querySelectorAll(`input[name="${field.id}"]`).forEach((input) => {
      input.addEventListener(eventName, evaluate);
    });
  } else {
    document.getElementById(field.id)?.addEventListener(eventName, evaluate);
  }
}

function wireGroupReveal(group) {
  const evaluate = () => {
    const values = group.triggerFieldIds.map((id) => document.getElementById(id)?.value ?? '');
    applyReveal(group.targetIds, group.condition(values));
  };
  for (const id of group.triggerFieldIds) {
    document.getElementById(id)?.addEventListener('blur', evaluate);
  }
}

export function initReveals(schema) {
  for (const field of flattenFields(schema)) {
    if (field.reveal) wireFieldReveal(field);
  }
  for (const group of schema.groupReveals || []) {
    wireGroupReveal(group);
  }
}
