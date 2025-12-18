## 目标与范围
- 预设管理：保存/应用/删除/导入/导出参数（中心圆圈半径/强度、Bloom 阈值/强度、粒子尺寸）。
- 调试能力：右上显示 FPS、粒子数量滑块（10k–100k）、截图 PNG。
- 不改动现有上传与粒子采样逻辑，保持兼容。

## 新增与修改文件
- 新增 `src/utils/presets.ts`：
  - `savePreset(name, data)`、`loadPresets()`、`deletePreset(name)`、`exportPresets()`、`importPresets(json)`；使用 `localStorage`。
- 修改 `src/components/TunePanel.tsx`：
  - 在现有参数面板中新增：
    - 文本框 + 「保存为预设」按钮
    - 预设列表（下拉或列表，含「应用」「删除」按钮）
    - 「导出预设」「导入预设」按钮（文件选择）
    - 「粒子数量」滑块与数值展示
    - 「截图 PNG」按钮
  - 通过 props 将事件回调给 `App.tsx`。
- 修改 `src/App.tsx`：
  - 维护 `presets` 状态与当前参数对象；实现保存/应用/删除/导入/导出逻辑并传给 `TunePanel`。
  - 新增 `particleCount` 状态（默认如 30000），绑定到场景组件。
  - 实现「截图」回调：调用场景内暴露的截图函数或通过 `useThree` 的引用获取 `canvas`。
- 修改 `src/components/ParticleScene.tsx`：
  - 接受 `particleCount` prop；当其变化时重建 `positions/velocities/targets/colors` 与 `BufferGeometry`，并 `dispose()` 旧资源。
  - 新增轻量 FPS 统计并通过一个叠层元素（或回调）在右上角显示。

## 交互与数据结构
- 预设结构：`{ name, antiCenterEnabled, antiCenterRadius, antiCenterStrength, bloomThreshold, bloomIntensity, pointSize }`
- 粒子数量：滑块范围 10000–100000；变更触发几何重建。
- 截图：从 WebGL canvas 取 `toDataURL('image/png')`，创建下载链接保存。

## 验证清单
- 预设：保存→刷新后仍存在；应用/删除正常；导出得到 JSON；导入合并到列表。
- FPS：数值每秒更新，随粒子数量变化合理。
- 粒子数量：切换不同数量，无错误与卡顿；桌面目标 ≥60FPS（根据硬件调整）。
- 截图：生成 PNG 与当前画面一致；跨域资源不报错（本地 blob 安全）。

## 风险与应对
- 几何重建需 `dispose()` 防止内存泄漏；在重建前释放旧 `BufferAttribute` 与 `BufferGeometry`。
- 截图性能：避免频繁截图；按钮触发一次性执行。

## 交付
- 增强的参数面板（含预设管理、粒子数量与截图）与场景联动。
- 文档化使用说明（参数含义、预设管理操作、粒子数量与截图使用方式）。