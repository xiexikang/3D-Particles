## 目标
- 将整体风格升级为暗色、科技感、AI氛围：玻璃拟态、霓虹渐变、微光与粒子协同。
- 强化品牌感与可用性：统一组件样式、提升层次与信息结构、保留现有功能与性能。

## 现状概览
- 入口：`index.html` → `src/main.tsx` → `src/App.tsx`（搜索确认）。
- 渲染栈：`React` + `@react-three/fiber` + `three`，后期 `Bloom`（`src/components/ParticleScene.tsx:427-429`）。
- 样式：主要为内联 style（`src/App.tsx:74-81`、上传/调参面板）。
- 粒子：颜色为蓝青区间随机（`src/components/ParticleScene.tsx:56-58`），支持遮罩/空洞（`voidRadius` 等，`src/components/ParticleScene.tsx:24`、`289-297`、`381-393`）。

## 设计语言
- 颜色：深背景（#0b0b12 基础保留），高光强调色使用蓝紫/青紫渐变（AI 常见色域）。
- 材质：半透明卡片 + 背景模糊 + 微光边框；统一动效曲线与阴影层次。
- 字体：无全局字体 → 引入现代无衬线（如 `Inter`）与等宽（如 `JetBrains Mono`）以增强技术感。
- 背景：渐变+噪声+网格细线叠加，弱动效响应鼠标/音频以呼应粒子。

## 技术实现
1) 全局主题与变量
- 新增 `src/styles.css`，定义 CSS 变量：`--bg`、`--panel-bg`、`--panel-border`、`--text`、`--accent`、`--accent-2`、`--glow` 等。
- 在 `src/main.tsx` 引入全局样式；`index.html` 引入字体与 favicon。
- 建立轻量 `ThemeContext`（`src/theme.tsx`），支持切换 `AI 模式` 与持久化（`localStorage`）。

2) 组件化基础 UI
- 新建 `src/components/ui/`：`Button`、`Card`、`Slider`、`Toggle`、`Badge`，以类名+CSS 变量驱动，替换 `App` 内联样式（保持现有 DOM 结构与功能）。
- 统一按钮尺寸/间距/状态（hover/active/focus），滑块轨道与手柄样式一致化。

3) 布局与视觉升级
- 顶部工具栏改为品牌区：左侧品牌/标题渐变字，右侧工具按钮（`爆裂/回流`、`随机云海`、`麦克风`）。
- 右侧调参面板采用分组卡片、分割线与分节标题；数值标签对齐，提升信息可读性。
- 底部上传面板改为 3 卡片栅格，拖拽区采用发光虚线与图标；输入框玻璃拟态+占位符提示。

4) 粒子与后期的“AI”色彩钩子
- 在 `ParticleScene` 增加可选 `accentHueRange` 或 `accentColor` prop，用于替代当前随机色域（参考 `src/components/ParticleScene.tsx:56-58`）。
- 点材质小幅发光、与 `Bloom` 联动；在 `image/text` 模式放大点径（已有逻辑 `src/components/ParticleScene.tsx:423`）。
- 可选：将 `shaderFragment` 颜色乘以强调色权重，进一步统一色调（参考 `src/components/ParticleScene.tsx:264-285`）。

5) 背景层
- 使用 CSS 绘制径向渐变 + 细线网格 + 微噪声叠加；少量鼠标视差（CSS transform），无额外 Canvas。
- 保留 `Canvas` 背景色设置（`src/components/ParticleScene.tsx:410-413`），在最外层叠加背景层以不影响 3D。

6) 交互细节
- 全局动效：过渡 160ms、缓动 `cubic-bezier(.2,.8,.2,1)`；悬停轻微发光、焦点可见。
- `FPS` 徽章样式提升（源于 `onFps` 回调，`src/App.tsx:20`、传递 `:116-117`）。
- 尊重 `prefers-reduced-motion`，在 CSS 中降低动效。

## 文件改动清单
- `index.html`：添加字体 `<link>`、`<meta theme-color>`、`<link rel="icon">`。
- `src/main.tsx`：引入 `styles.css`，挂载 `ThemeProvider`。
- `src/styles.css`：新增全局主题、背景层、基础组件样式。
- `src/theme.tsx`：新增主题上下文（模式切换/持久化）。
- `src/components/ui/*`：新增基础 UI 组件。
- `src/App.tsx`：替换内联样式为类名；新增品牌区与 AI 模式开关；保持现有状态与逻辑（引用点位参见 `src/App.tsx:74-81`、`82-107`、`108-121`）。
- `src/components/ParticleScene.tsx`：新增强调色 prop；颜色生成处与着色器处接受变量（参见 `src/components/ParticleScene.tsx:56-58`、`264-285`、`381-393`）。

## 验证与性能
- 视觉验证：深浅对比、组件统一性、色域一致性、光晕不过曝。
- 功能验证：上传/文字/GLTF、麦克风驱动、预设与遮罩参数（`App` 状态绑定）。
- 性能监测：`FPS` 维持原水平；若下降，回退动效与阴影、降低背景层复杂度。

## 风险与回滚
- 风格迁移可能带来少量样式冲突：按组件分层，支持逐步切换。
- 若强调色不合适，保留原随机方案作为回退；粒子颜色与 `Bloom` 保持上限限制。

## 下一步
- 我将按上述清单创建主题与基础组件，并逐步替换现有内联样式；为 `ParticleScene` 增加强调色钩子，确保不破坏现有模式与性能。请确认后开始实施。