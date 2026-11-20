// CN: 仅比较上下两组对偶向量的浅黄色，保留 Dual 文字的深金色。
// EN: Compare paler yellows for both sets of dual vectors, retaining the dark-gold Dual label.
export const dualYellows = {
  light: { title: 'A · Pale yellow · #FFEBBB', color: '#ffebbb' },
  lighter: { title: 'B · Lighter yellow · #FFF0D0', color: '#fff0d0' },
  lightest: { title: 'C · Lightest yellow · #FFF6E5', color: '#fff6e5' },
};

export function applyDualYellow(scene, name) {
  const color = dualYellows[name]?.color;
  if (!color) throw new Error('Unknown dual yellow: '+name);
  for (const e of scene.elements) {
    if (e.type !== 'rectangle' || e.strokeColor !== 'transparent') continue;
    if (e.groupIds.includes('result') && [28,34].includes(e.width) || e.groupIds.includes('coarse') && e.width === 24.25) e.backgroundColor = color;
  }
  return scene;
}
