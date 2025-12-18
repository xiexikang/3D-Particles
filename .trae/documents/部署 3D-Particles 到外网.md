## 项目概况
- 技术栈：React + Three.js，构建工具 `vite`（见 `package.json:6-10`）
- 生产构建：`npm ci && npm run build`，产物目录 `dist`
- 开发服务器仅用于开发（`vite.config.ts:6-10` 配置了 `host: 0.0.0.0`, `port: 2025`）

## 部署方案（任选其一）
- 静态托管平台（推荐简单快速）：Vercel / Netlify / Cloudflare Pages / GitHub Pages
  - 配置构建命令：`npm ci && npm run build`
  - 产物目录：`dist`
  - 绑定域名并开启 HTTPS
- 自有服务器 + Nginx（可控性强）：
  1) 在本地或服务器（Node ≥ 18）执行构建
  2) 将 `dist` 拷贝到服务器路径（如 `/var/www/3d-particles`）
  3) Nginx 站点示例：
     ```
     server {
       listen 80;
       server_name example.com;
       root /var/www/3d-particles;
       location / { try_files $uri $uri/ /index.html; }
     }
     ```
  4) 申请并启用 HTTPS（Let’s Encrypt）
  5) 开放防火墙端口 80/443
- Docker（便于打包与迁移）：
  - 构建阶段镜像 `node:20`，运行阶段镜像 `nginx:alpine`
  - 将 `dist` 复制到 Nginx 静态目录并暴露 80（可配合 Compose）

## 子路径部署注意
- 如非根路径部署（例如 `https://example.com/particles/`），需在 `vite.config.ts` 设置 `base: '/particles/'`，以确保资源路径正确

## 你需要提供的内容
- 目标托管方式（平台或自有服务器）
- 域名或公网 IP（以及是否使用根路径或子路径）
- 平台账号或服务器访问信息（SSH 用户/端口/权限）
- DNS 控制权限（设置 A/CNAME 记录）
- HTTPS 证书（或允许自动签发 Let’s Encrypt）
- （如在中国大陆托管）域名备案情况

## 性能与稳定性
- 启用 gzip/Br 压缩与长缓存（指纹化静态资源可设长缓存，`index.html` 设短缓存）
- 不将开发服务器暴露为生产服务
- 可接入 CDN 提升全国或全球访问速度

## 验证与回滚
- 部署完成后进行健康检查与静态资源加载验证
- 保留上一个版本以快速回滚

## 后续可为你落地的改动
- 自动生成 Nginx 配置与 Dockerfile
- 增加 CI/CD（如 GitHub Actions）自动构建与发布
- 如需子路径，调整 `vite.config.ts` 的 `base` 并验证