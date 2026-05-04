export function debounce(fn, wait = 250) {
  const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
  let t = null;
  return (...args) => {
    g?.clearTimeout?.(t);
    t = g?.setTimeout?.(() => fn(...args), wait);
  };
}
