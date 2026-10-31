// Minimalus node:test ir node:assert/strict pakaitalas naršyklei.
// Leidžia paleisti tuos pačius testus be Node: atidaryti tests/browser/index.html.

export const results = [];

export function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: e && e.message ? e.message : String(e) });
  }
}

function fail(msg) { throw new Error(msg); }

function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => deepEq(a[k], b[k]));
}

const assert = {
  ok(v, msg) { if (!v) fail(msg || `Tikėtasi tiesos, gauta ${v}`); },
  equal(a, b, msg) { if (a !== b) fail(msg || `${JSON.stringify(a)} !== ${JSON.stringify(b)}`); },
  notEqual(a, b, msg) { if (a === b) fail(msg || `${JSON.stringify(a)} === ${JSON.stringify(b)}`); },
  deepEqual(a, b, msg) { if (!deepEq(a, b)) fail(msg || `${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); },
};

export default assert;
