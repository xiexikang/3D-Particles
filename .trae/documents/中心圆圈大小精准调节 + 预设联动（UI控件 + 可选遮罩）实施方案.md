## UI增强（TunePanel）
- 新增控件：
  - 中心圈半径：滑块 + 数值输入（0–40），即改即生效
  - 中心圈强度：滑块（0–2），控制中心斥力力度
  - 边缘软硬：滑块（0–1），遮罩开启时控制边缘过渡
  - 位置偏移：X/Y 数值（±20），圈不必在正中心
  - 遮罩空洞开关：布尔，开启后视觉层面屏蔽中心区域
- 保留：预设按钮（沉浸柔光/爆火高亮/文物写实）、反中心开关、Bloom 阈值/强度、粒子尺寸、粒子数量、FPS、截图

## 应用层（App）
- 新增状态：`voidRadius:number`、`voidCenter:{x:number,y:number}`、`voidSoftness:number`、`voidMaskEnabled:boolean`
- 扩展预设映射：应用预设时同时设置上述遮罩参数与现有 antiCenter/bloom/pointSize
- 将新状态通过 props 传给 Scene 与 TunePanel

## 场景层（ParticleScene）
- 遮罩实现（启用时）：使用 `ShaderMaterial` 渲染 Points
  - uniforms：`uVoidCenter(vec2)`、`uVoidRadius(float)`、`uVoidSoftness(float)`、`uPointSize(float)`
  - 顶点着色器：输出世界坐标 `vWorldPos`，设置 `gl_PointSize = uPointSize * devicePixelRatio`
  - 片元着色器：
    - 计算 `d = distance(vWorldPos.xy, uVoidCenter)`
    - `alpha *= smoothstep(uVoidRadius - uVoidSoftness, uVoidRadius, d)`（硬/软边可控）
    - 保留 `vertexColors`，并使用 `AdditiveBlending`、`depthWrite=false`
- 关闭遮罩：沿用当前 `PointsMaterial` 与反中心斥力逻辑（`antiCenterRadius/Strength`）

## 预设参数建议
- 沉浸柔光：antiCenterRadius=12、antiCenterStrength=0.6、bloomThreshold=0.5、bloomIntensity=0.7、pointSize=0.18、voidRadius=10、voidSoftness=0.4、voidMaskEnabled=true
- 爆火高亮：antiCenterRadius=10、antiCenterStrength=0.4、bloomThreshold=0.25、bloomIntensity=1.2、pointSize=0.25、voidRadius=8、voidSoftness=0.2、voidMaskEnabled=true
- 文物写实：antiCenterRadius=6、antiCenterStrength=0.5、bloomThreshold=0.6、bloomIntensity=0.4、pointSize=0.15、voidRadius=6、voidSoftness=0.6、voidMaskEnabled=true

## 验证与性能
- 调节半径/强度/软硬/X/Y 后圈大小与边缘即时变化；遮罩开关保证视觉圈绝对生效
- 预设切换稳定；上传图片/GLB、FPS、截图、Bloom 正常
- 性能：遮罩为简单距离+smoothstep，对 3–10 万粒影响可控；如需更高粒子数可再做 GPU 计算优化

## 交付
- 更新 TunePanel、App 状态与 ParticleScene 渲染逻辑
- 不影响已有功能；保留回退路径（关闭遮罩即回到旧材质/斥力方案）

请确认，我将按此方案实现并联调