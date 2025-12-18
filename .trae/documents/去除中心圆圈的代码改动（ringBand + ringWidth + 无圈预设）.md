## 改动目标
- 默认不显示中心圆圈；提供一键“无圈展示”预设与总开关。
- 通过动力学带状斥力与着色器环形负增益，消除半径附近堆积带与亮边。

## 具体修改
- src/App.tsx：
  - 新增状态：`ringBand:number=6`、`ringWidth:number=8`、`blendMode:'additive'|'normal'='normal'`
  - 将以上状态传给 TunePanel 与 ParticleScene。
  - 新增预设“无圈展示”：`antiCenterEnabled=false`、`voidMaskEnabled=false`、`antiCenterRadius=0`、`antiCenterStrength=0`、`ringBand=6`、`ringWidth=8`、`blendMode='normal'`、`bloomThreshold=0.6`、`bloomIntensity=0.6`、`pointSize=0.18`；设为默认。
- src/components/TunePanel.tsx：
  - 新增滑块：`带状斥力范围 ringBand (3–10)`、`环形衰减宽度 ringWidth (4–12)`；新增开关：`混合模式 (加法/普通)`。
  - 将 Bloom 阈值默认值显示为 0.6（仍可调）。
- src/components/ParticleScene.tsx：
  - 在积分循环加入带状斥力：当 `abs(d - voidRadius) < ringBand`，按法线方向排斥，力度线性递减。
  - 片元着色器增加 `uRingWidth`：`ringFall = 1.0 - smoothstep(uVoidRadius, uVoidRadius + uRingWidth, d)`；`alpha *= ringFall`，圈内继续 `discard`。
  - 材质混合模式联动：根据 `blendMode` 切换 `AdditiveBlending` 或 `NormalBlending`（遮罩/普通点材质均适配）。

## 验证
- 默认进入无圈；在随机/图片/文字/GLB 形态下均无中心亮圈。
- 调整 `ringBand/ringWidth` 与 Bloom 阈值，圈不会出现；切换混合模式做 A/B 对比。

## 风险与回退
- 若设备对着色器敏感，保留普通点材质回退；通过总开关/预设可一键回退到旧表现。请确认后开始实现。