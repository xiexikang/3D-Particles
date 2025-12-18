## 目标
- 加入风格预设管理（保存/应用/删除/导入/导出），参数包括圆圈半径/强度、Bloom 阈值/强度、粒子尺寸。
- 增强调试能力：显示 FPS、可调粒子数量、支持一键截图导出 PNG。

## 技术方案
- 预设管理
  - 新增 `src/utils/presets.ts`：localStorage 持久化，提供 `savePreset(name, data)`、`loadPresets()`、`deletePreset(name)`、`exportPresets()`、`importPresets(json)`。
  - 扩展 `TunePanel`：
    - “保存为预设”输入框 + 保存按钮
    - 预设列表（应用/删除）
    - 导入（文件选择）/导出（下载 JSON）
  - 状态驱动：在 `src/App.tsx` 维护当前参数对象，应用预设时批量设置相关 state 并联动场景。
- FPS 显示
  - 在 `ParticleScene` 内新增轻量 FPS 计算：每秒统计 `useFrame` 调用次数，提升到父层通过回调或直接在页面右上角渲染一个叠层标签。
- 粒子数量调节
  - 将 `Particles` 的常量 `PARTICLE_COUNT` 改为 prop `particleCount`（例如 10000–100000）。
  - 当 `particleCount` 变化时，销毁并重建 `positions/velocities/targets/colors` 四个缓冲与 `BufferGeometry`，并重新初始化。
  - 保持现有逻辑（流场/吸引/反中心/鼠标交互）不变。
- 截图导出
  - 在 `TunePanel` 增加“截图”按钮；在一个小型辅助组件中使用 `useThree()` 获取 `gl.domElement`，执行 `toDataURL('image/png')` 并通过 an `<a>` 下载保存。

## 界面交互
- 参数面板顶部保留预设按钮（沉浸柔光/爆火高亮/文物写实），其下新增预设管理区与调试区：
  - 预设管理：保存/列表（应用/删除）/导入/导出
  - 调试：FPS 显示、粒子数量滑块、截图按钮
- 底部上传区保持横向排列，保证上传与参数面板同时可见。

## 验证
- 切换与保存多个预设后，参数即时生效且持久化。
- 调整粒子数时页面稳定运行，桌面目标 ≥60FPS（根据机器自动调低粒子数）。
- 截图生成 PNG 文件，图像与当前画面一致。

## 风险与处理
- 粒子数量重建需谨慎释放旧几何与属性，避免内存泄漏；在重建前 `dispose()`。
- 截图在跨域图片时需注意 `gl.preserveDrawingBuffer` 或资源跨域设置；当前上传为本地 blob，不受 CORS 限制。