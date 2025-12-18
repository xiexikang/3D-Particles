## 问题定位
- 图片卡顿源：`setTargetsFromImage` 在主线程执行两次大循环（遍历 512×512 像素与按步长栅格采样），会阻塞 UI（src/components/ParticleScene.tsx:138–169）。
- GLB卡顿源：`GLTFLoader.loadAsync` 后遍历所有网格顶点并生成点集，同样在主线程做密集计算（src/components/ParticleScene.tsx:197–221），且当前顶点循环为 `i += 3`，与 `BufferAttribute.getX(i)` 的顶点索引语义不一致，存在不必要的遍历与内存压力。
- 资源 URL 未回收：通过 `URL.createObjectURL` 生成的本地 URL 未在替换后 `revokeObjectURL`，长期使用会造成内存增长（src/components/UploadPanel.tsx:30–60 与 src/App.tsx:100–123 的回调链）。

## 优化方案
### 1) 异步与分线程
- 图片解析：使用 `createImageBitmap(file)` 解码，再在 Web Worker 内用 `OffscreenCanvas` 完成缩放、亮度统计与采样，UI 主线程只接收结果。
- GLB解析：在 Worker 内执行点位采样（遍历 `position` 并按目标点数抽样），主线程只负责渲染更新；必要时可引入 `requestIdleCallback`/分批次 `setTimeout(0)` 逐段提交，避免一次性阻塞。

### 2) 采样策略与循环修正
- GLB顶点遍历修正：改为 `for (let i = 0; i < pos.count; i += sampleStep)`，其中 `sampleStep = Math.max(1, Math.floor(pos.count / targetSamples))`；读取 `pos.getX(i)/getY(i)/getZ(i)`（src/components/ParticleScene.tsx:205 附近）。
- 图片栅格步长：现有步长推导已合理（src/components/ParticleScene.tsx:154），把亮度统计与采样移动到 Worker；同时为超大图像保留 512 上限。

### 3) 解析管线加速（可选）
- GLTF 加速：若模型使用压缩，配置 `DRACOLoader` 与 `MeshoptDecoder`（只在存在相关扩展时生效），减少解析时间。

### 4) 资源释放与状态管理
- 在新文件选择后，`revokeObjectURL` 释放上一资源；并在替换模型/图片时 `dispose` 旧 `BufferGeometry/Material/Texture`，防止 GPU/内存累积。
- 增加 `loading` 状态与轻量提示，解析期间禁用部分按钮；解析完成后一次性更新粒子目标点，避免频繁 setState。

### 5) 小幅度防抖与分批更新
- 对大点集，将 `targets/colors` 的写入分批次提交（例如每 5–10k 点提交一次并 `await Promise.resolve()`），兼顾流畅度与总耗时。

## 验证与回归
- 用 4–8MB 的图片与 5–50MB 的 GLB 实测：选择动作应无明显卡顿，UI 可交互；解析时间以进度提示呈现。
- 观察 `FPS` 与 `粒子数量` 滑条：解析后运行帧率稳定不应显著下降。
- 重复选择与预设模型切换：内存不增长，DevTools Performance/Memory 无持续上升。

## 代码改动要点
- `src/components/ParticleScene.tsx`：修正 GLB 顶点抽样循环；加入分批提交与异步管线对接。
- `src/components/UploadPanel.tsx` 与 `src/App.tsx`：管理并回收 `ObjectURL`；新增 `loading` 状态到 UI。
- 新增 Worker 文件：`src/workers/imageSampler.ts`、`src/workers/gltfSampler.ts`，封装采样逻辑与消息协议。

请确认是否按以上方案实施。我将据此完成修改与验证。