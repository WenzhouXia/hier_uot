// CN: 绿色只区分本文方法与核心组件；既有蓝、黄、紫色语义保持不变。
// EN: Green identifies the method/core components; existing blue, yellow and purple roles are unchanged.
export const greenAccents = {
  teal: { title: 'A · Muted teal', ink: '#3d786d', fill: '#dcede7', border: '#86a79e', underline: '#bfd9d0' },
  sage: { title: 'B · Sage green', ink: '#617a48', fill: '#e5edd9', border: '#a0b18c' },
  forest: { title: 'C · Forest green', ink: '#38654d', fill: '#d7e8dc', border: '#87a28f' },
  mint: { title: 'D · Mint green', ink: '#2e876f', fill: '#d3f0e4', border: '#7fae9c' },
};

export function applyGreenAccent(scene, name) {
  const accent = greenAccents[name];
  if (!accent) throw new Error('Unknown green accent: ' + name);
  for (const element of scene.elements) {
    if (element.type === 'line' && element.strokeWidth === 12 && element.y === 90) element.strokeColor = accent.underline || accent.fill;
    if (['PDUOT', 'Spar'].includes(element.text)) element.strokeColor = accent.ink;
    if (element.id === 'pduot-title-band') element.backgroundColor = accent.fill;
    if (element.groupIds.includes('pduot') && element.type === 'rectangle' && element.strokeColor !== 'transparent') {
      element.strokeColor = accent.border;
    }
    if (element.groupIds.includes('spar') && element.type === 'rectangle') element.backgroundColor = accent.fill;
  }
  return scene;
}
