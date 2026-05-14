# PixelWallpaper AI

> AI 像素风壁纸生成器 - 致敬 FC/SFC 时代的像素艺术

一款面向像素风爱好者的 PC 桌面端壁纸管理应用，支持 AI 生成和手动上传，一键设为桌面壁纸。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Tech](https://img.shields.io/badge/tech-Electron%20%2B%20Vue%203-brightgreen.svg)

## ✨ 功能特性

### 🎨 AI 壁纸生成
- **快速生成**：6 个预设模板一键生成（FC城堡、RPG村庄、太空射击等）
- **自定义生成**：分辨率、色彩、场景风格、像素密度、构图方式自由组合
- **像素风增强**：自动注入像素风关键词，确保生成效果
- **多 AI 提供商**：支持通义万相、OpenAI DALL-E、Stability AI、自定义服务

### 📤 手动上传
- 拖拽或点击上传本地图片
- 自动标注来源（AI生成/手动上传）
- 支持添加描述标签和原作者信息
- 统一管理 AI 生成和手动收集的图片

### 🖼️ 壁纸管理
- 画廊展示：网格/列表视图切换
- 智能筛选：按来源、时间、关键词搜索
- 一键操作：设为桌面壁纸、保存到指定位置、删除
- 系统托盘：快速随机切换壁纸

### ⚙️ 灵活配置
- AI 服务配置：API Key、模型选择、自定义地址
- 默认生成参数：分辨率、像素密度、风格
- 应用设置：自动保存、自动设壁纸、命名格式
- 数据管理：配置导入/导出、重置、清除

### 📊 用量统计
- 本月/今日生成次数
- 累计花费估算
- 已保存壁纸数量
- 快捷跳转阿里云额度查询

## 🚀 快速开始

### 环境要求
- [Node.js](https://nodejs.org/) 18+ 
- npm 9+

### 安装运行

#### 方式一：双击启动（推荐）
```
双击运行「启动应用.bat」
```
首次运行会自动安装依赖。

#### 方式二：命令行启动
```bash
# 安装依赖
npm install

# 启动开发模式
npm run electron:dev
```

#### 方式三：PowerShell 启动
```powershell
# 执行启动脚本
.\start.ps1
```

### 构建打包
```bash
# 构建生产版本
npm run electron:build
```
构建完成后，安装包位于 `dist/` 目录。

## 📁 项目结构

```
pixel-wallpaper/
├── electron/                 # Electron 主进程
│   ├── main.cjs             # 主进程入口
│   └── preload.cjs          # 预加载脚本（安全桥接）
├── src/
│   ├── components/          # Vue 组件
│   │   ├── Generator.vue    # 壁纸生成页
│   │   ├── Gallery.vue      # 壁纸画廊
│   │   ├── Settings.vue     # 设置面板
│   │   └── UsageStats.vue   # 用量统计栏
│   ├── services/            # 服务层
│   │   ├── tauri-service.ts # Electron IPC 封装
│   │   ├── ai-service.ts    # AI 服务抽象
│   │   ├── tongyi-service.ts# 通义万相实现
│   │   ├── openai-service.ts# OpenAI DALL-E 实现
│   │   └── config-service.ts# 配置存储
│   ├── stores/              # Pinia 状态管理
│   │   ├── generator.ts     # 生成器状态
│   │   └── settings.ts      # 设置状态
│   ├── types/               # TypeScript 类型
│   ├── router/              # 路由配置
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── public/                  # 静态资源
├── 启动应用.bat             # Windows 启动脚本
├── start.ps1               # PowerShell 启动脚本
├── package.json            # 项目配置
└── README.md               # 本文件
```

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Electron 28 | 跨平台桌面应用 |
| 前端框架 | Vue 3 + TypeScript | 组合式 API，类型安全 |
| 构建工具 | Vite 5 | 快速开发体验 |
| 状态管理 | Pinia | Vue 官方推荐 |
| 路由 | Vue Router 4 | SPA 路由 |
| UI 样式 | 原生 CSS | 像素风主题 |
| AI 服务 | 通义万相 / OpenAI | 多提供商支持 |
| 打包 | electron-builder | 生成安装包 |

## 📝 配置说明

### AI 服务配置
1. 打开「设置」页面
2. 选择 AI 提供商（推荐通义万相）
3. 填入 API Key
   - 通义万相：[阿里云百炼控制台](https://bailian.console.aliyun.com/)
   - OpenAI：[OpenAI Platform](https://platform.openai.com/)
4. 选择模型，保存配置

### 壁纸保存路径
默认保存路径：`~/PixelWallpaper/wallpapers/`

## 🔒 安全说明

- API Key 使用 XOR 加密存储于本地
- 所有图片仅存储在本地，不上传云端
- Electron 安全最佳实践（contextIsolation、IPC 白名单）
- 路径遍历防护

## 🐛 常见问题

### Q: 双击「启动应用.bat」没有反应？
A: 请确保已安装 Node.js，且 PowerShell 可用。也可以尝试在命令行运行 `npm run electron:dev`。

### Q: 生成图片失败？
A: 检查：1) API Key 是否正确配置；2) 网络连接；3) AI 服务额度是否充足。

### Q: 设为壁纸无效？
A: Windows 系统需要允许 PowerShell 执行脚本。应用已使用 `-ExecutionPolicy Bypass` 参数。

### Q: 如何切换 AI 提供商？
A: 在「设置」→「AI 服务配置」中选择其他提供商并配置相应 API Key。

## 📄 文档

- [产品需求文档 (PRD)](./PixelWallpaper_AI_PRD_v1.2.docx)
- [通义万相 API 文档](https://help.aliyun.com/zh/dashscope/)
- [Electron 文档](https://www.electronjs.org/)
- [Vue 3 文档](https://vuejs.org/)

## 📜 开源协议

[MIT License](./LICENSE)

## 🙏 致谢

- 致敬 FC/SFC 时代的经典像素游戏
- 感谢通义万相、OpenAI 等 AI 服务提供商
- 感谢 Electron 和 Vue 社区

---

Made with ❤️ for pixel art lovers
