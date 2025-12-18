## 目标
- 移除独立的 `exploded` 状态，将“爆裂回流”改为 `effect='explode'` 控制
- 将“随机云海”改为 `effect='randomCloud'`，内部逻辑保证目标为随机分布
- 保留 `mode` 作为形态来源（文本/图片/GLTF），但顶部栏仅用 `effect` 切换特效

## 代码改动
- `src/App.tsx`
  - 删除 `exploded` state 与所有 `setExploded(false)` 调用
  - 顶部栏按钮：
    - 爆裂回流：切换 `effect` 在 `explode/none` 间，并设置 active
    - 随机云海：设置 `effect='randomCloud'` 并 active
    - 其他按钮使用现有 `effect` 机制
  - 传参：不再向 `ParticleScene` 传 `exploded`
  - 上传/文字/GLTF操作中原先复位爆裂：改为 `setEffect('none')`
- `src/components/ParticleScene.tsx`
  - 移除 `exploded` props 与相关逻辑块
  - 扩展 `effect` 枚举：加入 `'explode'|'randomCloud'`
  - `useEffect` 生成目标：依赖增加 `effect`，当 `effect==='randomCloud'` 时使用 `setRandomTargets()`
  - `useFrame` 速度场：当 `effect==='explode'` 时应用径向外推（原爆裂逻辑迁移）

## 验证
- 顶部栏统一以 `effect` 高亮与切换；随机云海与爆裂效果正常
- 文本/图片/GLTF形态仍可通过下方操作栏切换，不受 `effect` 改造影响
- 本地预览无报错，FPS 正常