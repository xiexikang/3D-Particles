## 目标
- 将底部操作栏改为三段Tab栏：`图片上传`、`GLB上传`、`文字输入`
- 默认展示选中Tab的内容，其它Tab内容隐藏，减少占位并提升清晰度
- 保持现有上传与配置功能不变（回调、状态沿用）

## UI改动
- 在面板标题下新增Tab切换条：三个按钮（或Chip）并排，当前Tab高亮
- 面板主体仅渲染当前Tab对应的内容；每个Tab内容沿用现有Section
- 继续保留“收起/展开”按钮；展开时显示当前Tab内容，收起时仅显示标题与Tab条

## 状态与逻辑
- 在`UploadPanel`中新增`selectedTab`状态：`'image'|'glb'|'text'`
- Tab按钮点击时设置`selectedTab`
- 可选：初始Tab根据`mode`或最近一次选择（`localStorage`）决定

## JSX调整
- 将当前三个`section`拆分为三个片段：
  - 图片上传片段：拖拽/选择图片、适配模式、颜色保真、两列的阈值与增强等
  - GLB上传片段：拖拽/选择GLB、预设模型按钮
  - 文字输入片段：输入框、预设文字按钮
- 在主体处通过`selectedTab`条件渲染对应片段

## 样式
- 新增`.tabs`与`.tab`样式：
  - `.tabs`：`display: flex; gap: 8px; flex-wrap: wrap;`
  - `.tab`：复用`.btn`或`.chip`风格；`.tab.active`高亮
- 保留现有`.two-col`两列布局以维持紧凑占位
- 可选优化：为面板内容新增滚动限制（如`max-height: 45vh; overflow: auto;`）防止遮挡主体画面

## 交互与可用性
- Tab切换不影响现有回调；上传成功后仍触发`onImageUrl`/`onGltfUrl`/`onTextSubmit`
- 键盘可用性：Tab按钮可聚焦与回车触发；输入框保持Enter提交文字

## 集成影响
- `App.tsx`无需修改现有回调传递与状态使用；仅`UploadPanel`内部控制展示
- 如需与`mode`联动（例如选择GLB后自动切到GLBTab），可在上传成功后设置`selectedTab`为对应项（可选）

## 验证
- 本地运行查看：三个Tab切换、上传与预设功能均正常
- 窄屏下Tab条换行，内容两列自动回落为单列

## 交付
- 修改`UploadPanel.tsx`：新增Tab条、状态与条件渲染
- 修改`styles.css`：新增`.tabs`、`.tab`（复用现有风格）以及可选滚动限制样式
- 不改动现有功能逻辑，仅UI结构与样式调整