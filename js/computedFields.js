import { flattenFields } from './formRenderer.js';

// Generic engine for any `computed` field that declares `compute: { dependsOn,
// formula }` (mirrors the `reveal: { targetIds, condition }` shape already
// used elsewhere). Recomputes on blur of any dependency field — consistent
// with the app-wide "typed fields react on blur" convention — and writes
// '—' when the formula reports it can't compute yet (e.g. a dependency is
// still blank). One mechanism serves Age (date-diff) and Lobe Volume
// (l×w×h) identically; the math itself lives in the schema, not here.
function recomputeField(field) {
  const output = document.getElementById(field.id);
  if (!output) return;

  const values = field.compute.dependsOn.map((id) => document.getElementById(id)?.value ?? '');
  const result = field.compute.formula(...values);
  output.textContent = result === null || result === undefined || result === '' ? '—' : result;
}

export function initComputedFields(schema) {
  for (const field of flattenFields(schema)) {
    if (!field.compute) continue;
    const evaluate = () => recomputeField(field);
    for (const dependencyId of field.compute.dependsOn) {
      document.getElementById(dependencyId)?.addEventListener('blur', evaluate);
    }
  }
}
