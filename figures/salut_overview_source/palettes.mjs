// CN: 配色只用于独立预览；D 保留原图颜色，用投影强调核心求解器。
// EN: Palettes are preview-only; D retains the original colors and emphasizes the core solver with a shadow.
export const palettes = {
  'color-filled': {
    title: 'B2 · Filled blue / yellow / purple', semantic: true,
    fill: '#d0e7fc', ink: '#355f85', border: '#738fa8',
    guaranteeFill: '#f0e5f3', guaranteeInk: '#766183', guaranteeBorder: '#b29cbb',
    memoryInk: '#766183', dualFill: '#ffe6a4', flowFill: '#bcd9f2',
    auxiliaryFill: '#e0edfa', underline: '#c3d9ee', outputFill: '#ffffff',
  },
  'blue-semantic': {
    title: 'A · Blue / grey', semantic: true,
    fill: '#d0e7fc', ink: '#355f85', border: '#738fa8',
    guaranteeFill: '#ffffff', guaranteeInk: '#355f85', guaranteeBorder: '#a5a9b5',
    memoryInk: '#355f85', dualFill: '#e5e7ec', flowFill: '#bcd9f2',
  },
  'color-semantic': {
    title: 'B · Blue / yellow / purple', semantic: true,
    fill: '#d0e7fc', ink: '#355f85', border: '#738fa8',
    guaranteeFill: '#f0e5f3', guaranteeInk: '#766183', guaranteeBorder: '#b29cbb',
    memoryInk: '#766183', dualFill: '#ffe6a4', flowFill: '#bcd9f2',
  },
  'blue-depth': {
    title: 'A · Soft blue', fill: '#cce2f5', ink: '#355f85',
    border: '#6989a6', guaranteeFill: '#edf4fa', auxiliary: '#eaf1f7',
    shadow: '#7894ae', memoryInk: '#355f85',
  },
  'lavender-depth': {
    title: 'B · Lavender', fill: '#e4ddf1', ink: '#66577e',
    border: '#9a8caf', guaranteeFill: '#f3eff8', auxiliary: '#e7eef7',
    shadow: '#9a8aaa', memoryInk: '#496987',
  },
  'sage-depth': {
    title: 'C · Soft teal', fill: '#d6e9e5', ink: '#426e68',
    border: '#86aaa3', guaranteeFill: '#edf5f2', auxiliary: '#e8eff5',
    shadow: '#7b9b96', memoryInk: '#496987',
  },
  'original-depth': {
    title: 'D · Original + shadow', shadow: '#7b91a5', original: true,
  },
};
