// CN: 总框沿现有循环线外侧扩展，保持模块位置与循环线不变，避免人为增加留白。
// EN: Expand the overall frame just beyond the existing return path, retaining module positions and avoiding extra whitespace.
export function applyLayout(scene, name) {
  if (!['enclosed', 'solver-card', 'solver-marker', 'solver-handwritten', 'compact-support'].includes(name)) throw new Error('Unknown layout: ' + name);
  const frame = scene.elements.find(e => e.type === 'rectangle' && e.x === 45 && e.y === 22 && e.groupIds.length === 0);
  if (!frame) throw new Error('Overall frame not found');
  Object.assign(frame, { x: -6, width: 1199, height: 1270 });
  if (name !== 'enclosed') refineSolverCard(scene);
  if (['solver-marker', 'solver-handwritten', 'compact-support'].includes(name)) markSolverGuarantees(scene);
  if (['solver-handwritten', 'compact-support'].includes(name)) refineHandwrittenDetails(scene);
  if (name === 'compact-support') compactSupportLayout(scene, frame);
  return scene;
}

// CN: 弱化目标函数，将批注移至左上空白并沿菱形边法向指入，压缩模块之间的空白带。
// EN: De-emphasize the objective, annotate from the upper-left along the diamond-edge normal, and compress the inter-module gap.
function compactSupportLayout(scene, frame) {
  const formula = scene.elements.find(e => e.text === 'Restricted UOT compact');
  Object.assign(formula, { text: 'Restricted UOT support-focused', originalText: 'Restricted UOT support-focused', fontSize: 42, y: 245 });
  const termination = scene.elements.find(e => e.text === 'Finite termination');
  Object.assign(termination, { x: 595, y: 443, width: 275, customData: { anchor: 732.5 } });
  const marker = scene.elements.find(e => e.id === 'finite-termination-marker');
  Object.assign(marker, { x: 595, y: 460, width: 275 });
  const arrow = scene.elements.find(e => e.id === 'finite-termination-curved-arrow');
  Object.assign(arrow, {
    x: 852, y: 468, width: 50, height: 64,
    points: [[0, 0], [26, 8], [50, 64]], roughness: .45,
  });
  refineSupportGlyphs(scene);
  widenPrune(scene);
  centerInitialization(scene);
  const compress = y => y >= 644 ? y - 80 : y;
  for (const element of scene.elements) {
    if (element === frame) continue;
    const oldY = element.y;
    element.y = compress(oldY);
    if (element.points) {
      element.points = element.points.map(([x, y]) => [x, compress(oldY + y) - element.y]);
      const ys = element.points.map(([, y]) => y);
      element.height = Math.max(...ys) - Math.min(...ys);
    }
    if (element.text === 'No') element.y = 658;
  }
  frame.height -= 80;
}

// CN: 各行分别围绕 Initialization 面板中心对齐，修正括号、按钮和公式的不同偏移。
// EN: Center each initialization row within the panel, correcting the brace, button and formula offsets.
function centerInitialization(scene) {
  const center = 46 + 359 / 2;
  for (const e of scene.elements.filter(e => e.groupIds.includes('coarse'))) {
    e.y += 4;
    if (e.text === 'Coarse UOT' || e.text === 'Init' || e.text === 'Topₖ (σ⁰)') {
      e.x = center - e.width / 2;
      e.customData.anchor = center;
    } else if (e.id === 'diagram-154') {
      e.x = center - e.width / 2;
    } else if (e.id === 'diagram-152') {
      e.x = center - e.width / 2;
      e.points = [[0,0],[2,11],[21,12],[119,12],[131,20],[143,12],[241,12],[258,9],[262,0]];
    } else if (e.id === 'diagram-153') {
      e.x = center;
    } else {
      e.x -= 5;
      if (e.customData) e.customData.anchor -= 5;
    }
  }
}

// CN: 独立预览将 Init 按钮与其公式合为与 Pricing/Prune 相同的标题色带卡片。
// EN: For a separate preview, combine Init and its formula in a Pricing/Prune-style header-band card.
export function applyInitCard(scene) {
  const button = scene.elements.find(e => e.id === 'diagram-154');
  const band = structuredClone(scene.elements.find(e => e.id === 'diagram-157'));
  const frame = structuredClone(scene.elements.find(e => e.id === 'diagram-158'));
  const center = button.x + button.width / 2;
  Object.assign(frame, { id: 'init-preview-frame', x: center - 118, y: button.y, width: 236, height: 119, groupIds: ['coarse'] });
  Object.assign(band, { id: 'init-preview-band', x: center - 114, y: button.y + 3, width: 228, height: 57, groupIds: ['coarse'] });
  const index = scene.elements.indexOf(button);
  scene.elements.splice(index, 1, frame, band);
  const title = scene.elements.find(e => e.text === 'Init');
  title.fontSize = 41;
  // CN: 将卡片整体上移，使底部留白与 Pricing/Prune 一致，并缩短入箭头。
  // EN: Lift the card to match Pricing/Prune's bottom margin and shorten its incoming arrow.
  for (const e of [frame, band, title, scene.elements.find(e => e.text === 'Topₖ (σ⁰)')]) e.y -= 7;
  const arrow = scene.elements.find(e => e.id === 'diagram-153');
  arrow.height -= 7;
  arrow.points[arrow.points.length - 1][1] -= 7;
}

// CN: 将 Pricing 的部分宽度让给 Prune，保留两行并统一公式字号。
// EN: Transfer some Pricing width to Prune, retaining two lines with matching formula sizes.
function widenPrune(scene) {
  const transfer = 30;
  for (const e of scene.elements) {
    if (e.groupIds.includes('pricing')) {
      if (e.type === 'rectangle') e.width -= transfer;
      if (e.type === 'text') {
        e.x -= transfer / 2;
        e.customData.anchor -= transfer / 2;
      }
    }
    if (e.groupIds.includes('prune')) {
      if (e.type === 'rectangle') { e.x -= transfer; e.width += transfer; }
      if (e.type === 'text') {
        e.x -= transfer / 2;
        e.customData.anchor -= transfer / 2;
        if (['supp(X) ∪ ℬ ∪ 𝒱', '|𝒩₊| ≤ ⌈β(m + n)⌉'].includes(e.text)) e.fontSize = 38;
        if (e.text === 'supp(X) ∪ ℬ ∪ 𝒱') {
          e.text = '𝒩 ⊇ supp(X) ∪ ℬ ∪ 𝒱';
          e.originalText = e.text;
        }
        if (e.text === '|𝒩₊| ≤ ⌈β(m + n)⌉') {
          e.text = '|𝒩| ≤ ⌈β(m + n)⌉';
          e.originalText = e.text;
        }
      }
    }
    if (e.id === 'diagram-177') e.x -= transfer;
  }
  scene.elements = scene.elements.filter(e =>
    !(e.groupIds.includes('prune') && e.text === 'keep') && !['𝒩₀', '𝒩₊'].includes(e.text));
}

// CN: 五个正流量位置每行每列各一个；允许支撑包含它们及额外候选，不表示 UOT 的一般结构限制。
// EN: The illustrative five-flow pattern has one cell per row/column inside a larger support; it is not a general UOT restriction.
function refineSupportGlyphs(scene) {
  const primal = [[2, 0], [0, 1], [4, 2], [1, 3], [3, 4]];
  const support = [[2, 0], [4, 0], [0, 1], [1, 2], [4, 2], [1, 3], [3, 3], [3, 4]];
  const grid = scene.elements.find(e => e.groupIds.includes('support') && e.type === 'rectangle' && e.strokeColor !== 'transparent');
  const cellTemplate = scene.elements.find(e => e.groupIds.includes('support') && e.type === 'rectangle' && e.strokeColor === 'transparent');
  const hatchTemplate = scene.elements.find(e => e.groupIds.includes('support') && e.type === 'line' && e.strokeColor === '#4c9df0');
  const isSupportFill = e => e.groupIds.includes('support') && (
    e.type === 'rectangle' && e.strokeColor === 'transparent' ||
    e.type === 'line' && e.strokeColor === '#4c9df0'
  );
  scene.elements = scene.elements.filter(e => !isSupportFill(e));
  const fills = [];
  for (const [i, j] of support) {
    const x = grid.x + i * 36, y = grid.y + j * 36;
    const cell = structuredClone(cellTemplate);
    Object.assign(cell, { id: 'allowed-cell-'+i+'-'+j, x, y });
    fills.push(cell);
    for (let d = 8; d < 72; d += 10) {
      const u = Math.max(0, d - 36), v = Math.min(36, d), length = v - u;
      if (length <= 2) continue;
      const hatch = structuredClone(hatchTemplate);
      Object.assign(hatch, {
        id: 'allowed-hatch-'+i+'-'+j+'-'+d,
        x: x + u, y: y + d - u, width: length, height: length,
        points: [[0, 0], [length, -length]],
        seed: hatchTemplate.seed + i * 137 + j * 251 + d,
      });
      fills.push(hatch);
    }
  }
  scene.elements.splice(scene.elements.indexOf(grid), 0, ...fills);
  const primalCells = scene.elements.filter(e => e.groupIds.includes('result') &&
    e.type === 'rectangle' && e.strokeColor === 'transparent' && e.x >= 942 && e.y >= 198);
  if (primalCells.length !== 5) throw new Error('Expected five primal cells');
  primalCells.forEach((cell, index) => {
    const [i, j] = primal[index];
    Object.assign(cell, { x: 942 + i * 34.5, y: 198 + j * 33.2 });
  });
}

// CN: 放大核心公式与简写标签，使用与卡片标题一致的不规则色块及圆弧批注箭头。
// EN: Enlarge the formula/short labels and use irregular card-style highlights plus a curved annotation arrow.
function refineHandwrittenDetails(scene) {
  const formula = scene.elements.find(e => e.text === 'Restricted UOT objective');
  Object.assign(formula, { text: 'Restricted UOT compact', originalText: 'Restricted UOT compact', fontSize: 38, y: 246 });
  const markerTemplate = scene.elements.find(e => e.type === 'rectangle' && e.groupIds.includes('pricing') && e.strokeColor === 'transparent');
  scene.elements = scene.elements.filter(e => !(e.groupIds.includes('solver-guarantees') && e.type === 'line'));
  for (const [index, text, anchor, x, width] of [
    [0, 'Global conv.', 438, 337, 202],
    [1, 'Local linear', 664, 559, 210],
  ]) {
    const label = scene.elements.find(e => e.id === 'pduot-'+(index === 0 ? 'global' : 'local')+'-label');
    Object.assign(label, {
      text, originalText: text, x, y: 328, width, height: 43.75, fontSize: 35,
      customData: { anchor },
    });
    const marker = structuredClone(markerTemplate);
    Object.assign(marker, {
      id: 'solver-freehand-marker-'+index, x, y: 343, width, height: 28,
      backgroundColor: '#e6d4ed', roughness: 1.3, angle: index === 0 ? -.012 : .009,
      groupIds: ['solver-guarantees'],
    });
    scene.elements.splice(scene.elements.indexOf(label), 0, marker);
  }
  const termination = scene.elements.find(e => e.text === 'Finite termination');
  Object.assign(termination, {
    x: 637, y: 663, width: 280, height: 40, fontSize: 32,
    customData: { anchor: 777 },
  });
  const marker = structuredClone(markerTemplate);
  Object.assign(marker, {
    id: 'finite-termination-marker', x: 640, y: 680, width: 275, height: 27,
    backgroundColor: '#e6d4ed', roughness: 1.3, angle: -.014,
    groupIds: ['termination-annotation'],
  });
  scene.elements.splice(scene.elements.indexOf(termination), 0, marker);
  const arrow = structuredClone(scene.elements.find(e => e.type === 'arrow'));
  Object.assign(arrow, {
    id: 'finite-termination-curved-arrow', x: 919, y: 671, width: 33, height: 71,
    points: [[0, 0], [19, -28], [9, -51], [-14, -71]],
    roundness: { type: 2 }, roughness: 1.1, strokeWidth: 2.3,
    strokeColor: '#766183', groupIds: ['termination-annotation'],
  });
  scene.elements.push(arrow);
}

// CN: 收敛性质使用较大的缩写文字与手绘荧光笔笔触，不再套小框。
// EN: Use larger abbreviated guarantee labels over hand-drawn marker strokes instead of small boxes.
function markSolverGuarantees(scene) {
  const labels = scene.elements.filter(e => e.groupIds.includes('solver-guarantees') && e.type === 'text');
  const template = scene.elements.find(e => e.type === 'line' && e.strokeWidth === 12);
  scene.elements = scene.elements.filter(e => !e.groupIds.includes('solver-guarantees'));
  for (const [index, text, x, width, fontSize] of [
    [0, 'Global conv.', 346, 184, 31],
    [1, 'Local linear rate', 558, 212, 30],
  ]) {
    const marker = structuredClone(template);
    Object.assign(marker, {
      id: 'pduot-guarantee-marker-'+index, x, y: 355, width, height: 2,
      points: [[0, 0], [width * .5, -1], [width, -2]],
      strokeColor: '#e6d4ed', strokeWidth: 19, roughness: .25,
      groupIds: ['solver-guarantees'],
    });
    const label = labels[index];
    Object.assign(label, {
      text, originalText: text, x, y: 331, width, height: fontSize * 1.25, fontSize,
      customData: { anchor: x + width / 2 },
    });
    scene.elements.push(marker, label);
  }
}

// CN: 核心求解器使用蓝色标题带、白色正文和紫色保证标签；仅调整相关几何与连线。
// EN: Use a blue solver header, white body and purple guarantee badges; adjust only related geometry and connectors.
function refineSolverCard(scene) {
  const convergence = scene.elements.find(e => e.type === 'rectangle' && e.groupIds.includes('convergence'));
  const textTemplate = scene.elements.find(e => e.text === 'KKT convergence');
  scene.elements = scene.elements.filter(e => !e.groupIds.includes('memory') && !e.groupIds.includes('convergence') &&
    !(e.groupIds.includes('pduot') && ['X', 'X ≥ 0,   supp(X) ⊆ 𝒩'].includes(e.text)));
  for (const e of scene.elements) {
    if (e.groupIds.includes('support') || e.text === '𝒩₀') {
      e.x -= 30;
      if (e.customData) e.customData.anchor -= 30;
    }
    if (e.type === 'arrow' && e.x === 212 && e.y === 724) e.x -= 30;
    if (e.type === 'arrow' && e.x === 303 && e.y === 278) {
      e.x = 273;
      e.width = 39;
      e.points = [[0, 0], [39, 0]];
    }
    if (e.type === 'arrow' && e.points.length > 10 && e.y === 1077) {
      e.points[e.points.length - 1][0] -= 30;
    }
    if (!e.groupIds.includes('pduot')) continue;
    if (e.type === 'rectangle') Object.assign(e, { x: 316, width: 468, backgroundColor: '#ffffff' });
    if (e.text === 'PDUOT') {
      e.x -= 25;
      e.customData.anchor = 550;
    }
    if (e.text === 'min  Φ(X)') {
      Object.assign(e, { text: 'Restricted UOT objective', originalText: 'Restricted UOT objective', y: 251, fontSize: 29 });
      e.customData.anchor = 550;
    }
  }
  const solverIndex = scene.elements.findIndex(e => e.type === 'rectangle' && e.groupIds.includes('pduot'));
  const header = structuredClone(scene.elements[solverIndex]);
  Object.assign(header, {
    id: 'pduot-title-band', x: 320, y: 165, width: 460, height: 57,
    strokeColor: 'transparent', backgroundColor: '#d0e7fc',
  });
  scene.elements.splice(solverIndex + 1, 0, header);
  const formula = scene.elements.find(e => e.text === 'Restricted UOT objective');
  formula.x = 550 - formula.width / 2;
  for (const [id, text, x, width] of [
    ['global', 'Global convergence', 332, 212],
    ['local', 'Local linear rate', 556, 212],
  ]) {
    const box = structuredClone(convergence);
    Object.assign(box, { id: 'pduot-'+id+'-badge', x, y: 326, width, height: 43, strokeWidth: 2, groupIds: ['solver-guarantees'] });
    const label = structuredClone(textTemplate);
    Object.assign(label, {
      id: 'pduot-'+id+'-label', text, originalText: text,
      x, y: 333, width, height: 30, fontSize: 24,
      groupIds: ['solver-guarantees'], customData: { anchor: x + width / 2 },
    });
    scene.elements.push(box, label);
  }
}
