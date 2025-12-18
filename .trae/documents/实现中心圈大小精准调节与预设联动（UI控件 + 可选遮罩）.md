## 目标
- 在参数面板新增更直观的中心圈控制：半径、强度、边缘软硬、位置偏移（X/Y），以及“遮罩空洞”开关。
- 恢复预设按钮（沉浸柔光/爆火高亮/文物写实），一键批量设置参数并联动场景。

## UI与状态
- TunePanel：
  - 新增控件：
    - 中心圈半径（滑块+数值输入，0–40）
    - 中心圈强度（滑块，0–2）
    - 边缘软硬（滑块，0–1）
    - 位置偏移 X/Y（数值输入，范围 ±20）
    - 遮罩空洞开关（布尔）
  - 保留：预设按钮、反中心开关、Bloom 阈值/强度、粒子尺寸、粒子数量、FPS、截图
- App：
  - 新增状态：`voidRadius:number`、`voidCenter:{x:number,y:number}`、`voidSoftness:number`、`voidMaskEnabled:boolean`
  - 预设 `applyPreset(name)` 扩展为同时设置上述遮罩参数（与现有 antiCenter/bloom/pointSize 一起）
  - 将这些状态以 props 传入 Scene

## 场景与渲染
- ParticleScene：
  - 若 `voidMaskEnabled=true`：使用自定义 `ShaderMaterial` 渲染 Points，实现中心遮罩
    - uniforms：`uVoidCenter(vec2)`、`uVoidRadius(float)`、`uVoidSoftness(float)`、`uPointSize(float)`
    - 顶点：输出 `vWorldPos`（世界坐标），设置 `gl_PointSize`
    - 片元：`alpha *= smoothstep(uVoidRadius - uVoidSoftness, uVoidRadius, distance(vWorldPos.xy, uVoidCenter))`；在小于半径时透明（或 discard），形成硬/软边圈
    - 保持 `vertexColors` 与 `AdditiveBlending`，兼容现有色彩与后期
  - 若 `voidMaskEnabled=false`：沿用当前 `PointsMaterial` 与反中心斥力逻辑（`antiCenterRadius/Strength`）

## 预设映射建议
- 沉浸柔光：antiCenterRadius=12、antiCenterStrength=0.6、bloomThreshold=0.5、bloomIntensity=0.7、pointSize=0.18、voidRadius=10、voidSoftness=0.4、voidMaskEnabled=true
- 爆火高亮：antiCenterRadius=10、antiCenterStrength=0.4、bloomThreshold=0.25、bloomIntensity=1.2、pointSize=0.25、voidRadius=8、voidSoftness=0.2、voidMaskEnabled=true
- 文物写实：antiCenterRadius=6、antiCenterStrength=0.5、bloomThreshold=0.6、bloomIntensity=0.4、pointSize=0.15、voidRadius=6、voidSoftness=0.6、voidMaskEnabled=true

## 验证
- 拖动/输入半径、强度、软硬、偏移，圈大小与边缘过渡即时变化；遮罩开关可保证视觉圈绝对生效
- 切换三种预设时，风格与圈表现稳定
- 图片/GLB 上传、FPS、截图与 Bloom 正常

## 说明与回退
- ShaderMaterial 仅在遮罩开关启用时生效；关闭开关即回退到现有材质与斥力逻辑，保证稳定性