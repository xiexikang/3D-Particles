## 目标
- 在参数面板上提供更直观的“中心圈”大小控制：半径、强度、位置偏移（X/Y）、边缘软硬（0=锐利，1=柔和）。
- 恢复预设按钮：沉浸柔光 / 爆火高亮 / 文物写实，一键切换参数并联动场景。
- 可选“遮罩空洞”开关：即使物理上有粒子，中心圈半径也绝对生效（视觉层面屏蔽）。

## 改动文件
- `src/App.tsx`
  - 新增状态：`voidRadius`、`voidCenter: {x,y}`、`voidSoftness`、`voidMaskEnabled`。
  - 预设回调 `applyPreset(name)` 继续存在（已接线）；扩展为同时设置 `voidRadius/voidSoftness`（与现有 antiCenter/bloom/pointSize 配合）。
  - 将新状态作为 props 传给 `TunePanel` 与 `ParticleScene`。
- `src/components/TunePanel.tsx`
  - 新增 UI：
    - 数值输入框：中心圈半径（精确输入；范围 0–40）。
    - 滑块：中心圈强度（0–2）；边缘软硬（0–1）。
    - 位置偏移：X/Y（-20–20）。
    - 遮罩空洞开关（布尔）。
  - 保留：预设按钮、反中心开关、Bloom 阈值/强度、粒子尺寸、粒子数量、FPS、截图。
- `src/components/ParticleScene.tsx`
  - 若 `voidMaskEnabled=true`：使用 `ShaderMaterial` 渲染 Points，实现“中心遮罩”。
    - uniforms：`uVoidCenter(vec2)`、`uVoidRadius(float)`、`uVoidSoftness(float)`。
    - 顶点：计算世界坐标传给片元（`vWorldPos`）。
    - 片元：按 `distance(vWorldPos.xy, uVoidCenter)` 对 alpha 做 `smoothstep` 或 `discard`，形成硬/软边圈；与现有加法混合兼容。
  - 若 `voidMaskEnabled=false`：沿用当前 `PointsMaterial` 与反中心斥力逻辑（`antiCenterRadius/Strength`）。

## 参数映射建议
- 预设（应用即批量设置）：
  - 沉浸柔光：`antiCenterRadius=12`、`antiCenterStrength=0.6`、`bloomThreshold=0.5`、`bloomIntensity=0.7`、`pointSize=0.18`、`voidRadius=10`、`voidSoftness=0.4`、`voidMaskEnabled=true`。
  - 爆火高亮：`antiCenterRadius=10`、`antiCenterStrength=0.4`、`bloomThreshold=0.25`、`bloomIntensity=1.2`、`pointSize=0.25`、`voidRadius=8`、`voidSoftness=0.2`、`voidMaskEnabled=true`。
  - 文物写实：`antiCenterRadius=6`、`antiCenterStrength=0.5`、`bloomThreshold=0.6`、`bloomIntensity=0.4`、`pointSize=0.15`、`voidRadius=6`、`voidSoftness=0.6`、`voidMaskEnabled=true`。

## 验证
- 拖动/输入“半径/强度/软硬/X/Y”后，圈大小与边缘过渡即时变化；遮罩开关能确保视觉圈绝对生效。
- 切换三种预设时，风格与圈表现稳定。
- 图片/GLB 上传、FPS、截图、Bloom 效果不受影响。

## 风险与回退
- ShaderMaterial 仅在遮罩开关启用时使用；关闭时回退到现有材质与逻辑，保证稳定性。
- 性能风险小：遮罩计算为简单距离与 `smoothstep`，对 3–10 万粒子影响可控。