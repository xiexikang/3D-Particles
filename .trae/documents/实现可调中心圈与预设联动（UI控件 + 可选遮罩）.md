## 要做的改动
- App（src/App.tsx）
  - 新增状态：voidMaskEnabled、voidRadius、voidCenterX、voidCenterY、voidSoftness
  - 扩展 applyPreset(name)：同时设置以上状态与现有 antiCenter/bloom/pointSize
  - 将以上状态作为 props 传入 TunePanel 与 ParticleScene
- 参数面板（src/components/TunePanel.tsx）
  - 新增控件：
    - 中心圈半径（滑块+数值输入，0–40）
    - 中心圈强度（滑块，0–2）
    - 边缘软硬（滑块，0–1）
    - 圈位置偏移 X/Y（数值输入，±20）
    - 遮罩空洞开关（布尔）
  - 保留预设按钮、反中心开关、Bloom 阈值/强度、粒子尺寸、粒子数量、FPS、截图
- 场景（src/components/ParticleScene.tsx）
  - 当 voidMaskEnabled=true：使用 ShaderMaterial 渲染 Points（保留 vertexColors/加法混合/depthWrite=false）
    - uniforms：uVoidCenter(vec2)、uVoidRadius(float)、uVoidSoftness(float)、uPointSize(float)
    - 顶点：输出 vWorldPos（世界坐标），gl_PointSize = uPointSize * devicePixelRatio
    - 片元：alpha *= smoothstep(uVoidRadius - uVoidSoftness, uVoidRadius, distance(vWorldPos.xy, uVoidCenter))；小于半径时透明（或 discard）
  - 当 voidMaskEnabled=false：沿用现有 PointsMaterial 与 antiCenterRadius/Strength 斥力逻辑

## 预设映射（点击即批量设置）
- 沉浸柔光：antiCenterRadius=12、antiCenterStrength=0.6、bloomThreshold=0.5、bloomIntensity=0.7、pointSize=0.18、voidRadius=10、voidSoftness=0.4、voidMaskEnabled=true
- 爆火高亮：antiCenterRadius=10、antiCenterStrength=0.4、bloomThreshold=0.25、bloomIntensity=1.2、pointSize=0.25、voidRadius=8、voidSoftness=0.2、voidMaskEnabled=true
- 文物写实：antiCenterRadius=6、antiCenterStrength=0.5、bloomThreshold=0.6、bloomIntensity=0.4、pointSize=0.15、voidRadius=6、voidSoftness=0.6、voidMaskEnabled=true

## 验证与回退
- 调节半径/强度/软硬/X/Y 后圈大小与边缘即时变化；遮罩开关可确保视觉圈绝对生效
- 预设切换稳定；上传图片/GLB、FPS、截图、Bloom 正常
- 关闭遮罩即回退到旧材质与斥力逻辑，保证稳定性