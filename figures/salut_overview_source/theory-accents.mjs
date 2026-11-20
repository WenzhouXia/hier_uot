// CN: 理论标记的独立配色预览；不改变图中的其他语义颜色。
// EN: Independent theory-highlight previews, retaining all other semantic colors.
export const theoryAccents = {
  teal: { title: 'A · Muted teal', family: 'green', fill: '#d0e5dd', ink: '#3d786d', arrow: '#79a396' },
  mint: { title: 'B · Mint green', family: 'green', fill: '#cdebd7', ink: '#386c53', arrow: '#74a88c' },
  sage: { title: 'C · Sage green', family: 'green', fill: '#e0e9c8', ink: '#607044', arrow: '#96a16d' },
  apricot: { title: 'A · Apricot', fill: '#f7d6b0', ink: '#49433d', arrow: '#a5825f' },
  cream: { title: 'B · Cream yellow', fill: '#f6e6ae', ink: '#49463c', arrow: '#ac9756' },
  slate: { title: 'C · Soft slate blue', fill: '#dce5eb', ink: '#4f616d', arrow: '#8098a8' },
};

export function applyTheoryAccent(scene, name) {
  const accent = theoryAccents[name];
  if (!accent) throw new Error('Unknown theory accent: ' + name);
  for (const e of scene.elements) {
    if (e.groupIds.includes('solver-guarantees') || e.groupIds.includes('termination-annotation') || e.text === 'Finite termination') {
      if (e.type === 'rectangle') e.backgroundColor = accent.fill;
      else e.strokeColor = e.type === 'arrow' ? accent.arrow : accent.ink;
    }
  }
  return scene;
}
