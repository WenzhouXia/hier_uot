// CN: 仅比较支撑斜线与正流量格子的蓝色深浅，不改变标题色带。
// EN: Compare blue depths for support hatching and primal cells only, retaining the header fills.
export const supportBlues = {
  mixed: { title: 'Selected · Support B / primal A', color: '#9fc3e3', flowColor: '#bfd8ef' },
  light: { title: 'A · Light blue · #BFD8EF', color: '#bfd8ef' },
  medium: { title: 'B · Medium blue · #9FC3E3', color: '#9fc3e3' },
  deep: { title: 'C · Deeper blue · #7FAED7', color: '#7faed7' },
};

export function applySupportBlue(scene, name) {
  const color = supportBlues[name]?.color;
  if (!color) throw new Error('Unknown support blue: '+name);
  for (const e of scene.elements) {
    if (e.id.startsWith('allowed-hatch-')) e.strokeColor = color;
    if (e.groupIds.includes('result') && e.type === 'rectangle' && e.strokeColor === 'transparent' && e.width === 34.5) e.backgroundColor = supportBlues[name].flowColor || color;
  }
  return scene;
}
