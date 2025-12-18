## 目标
- 默认无中心圆圈；任意形态（随机/图片/文字/GLB）都不出现亮圈。
- 提供总开关与预设“无圈展示”，随时恢复或关闭圆圈。

## 代码改动
- 场景（ParticleScene.tsx）：
  - 新增 props：ringBand、ringWidth、blendMode
  - 积分循环加入带状斥力：当 |d - voidRadius| < ringBand，按法线方向施加排斥，力度线性递减；与 antiCenterStrength 叠加
  - 片元着色器新增 uRingWidth：alpha *= (1.0 - smoothstep(uVoidRadius, uVoidRadius + uRingWidth, d))；圈内继续 discard
  - 材质混合联动：Additive/Normal 可切换
- 面板（TunePanel.tsx）：
  - 新增滑块：ringBand（3–10，默认6）、ringWidth（4–12，默认8）
  - 新增开关：混合模式（加法/普通）、总开关“隐藏中心圈”（一键关闭斥力/遮罩并提升 Bloom 阈值）
- 应用（App.tsx）：
  - 新增状态并传递：ringBand、ringWidth、blendMode
  - 新增预设“无圈展示”，默认应用（antiCenter/void 都关、半径/强度为0、ringBand=6、ringWidth=8、blendMode='normal'、bloomThreshold=0.6、pointSize=0.18）

## 验证
- 默认进场无圈；切换形态仍无圈
- 调整 ringBand/ringWidth 与 Bloom 阈值，圈不出现；混合模式 A/B 正常
- FPS 与交互稳定

## 风险与回退
- 保留普通点材质回退；总开关/预设可一键恢复旧表现