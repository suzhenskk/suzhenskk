# 仓库代码结构规范（建议）

> 当前仓库仅包含 `README.md`，尚未形成业务代码目录结构。本文档用于定义后续扩展时的统一规范。

## 1. 目录分层（通用）

```text
.
├─ README.md
├─ CODE_STRUCTURE.md          # 本规范文档
├─ docs/                      # 设计文档、接口说明、架构图
├─ src/                       # 核心源码
│  ├─ app/                    # 应用入口/启动逻辑
│  ├─ core/                   # 核心领域逻辑（尽量无框架依赖）
│  ├─ services/               # 业务服务层
│  ├─ adapters/               # 外部依赖适配层（DB/API/消息队列）
│  ├─ utils/                  # 通用工具（避免与业务强耦合）
│  └─ config/                 # 配置定义与加载
├─ tests/                     # 测试（按模块镜像 src）
├─ scripts/                   # 开发/构建/发布脚本
└─ .github/workflows/         # CI/CD 工作流
```

## 2. 命名规范

- 目录名：小写 + 中划线或下划线，保持仓库内一致。
- 文件名：语义化命名，避免 `temp`、`new`、`final` 等模糊名称。
- 类/结构体：`PascalCase`；函数/变量：`camelCase` 或按语言社区惯例。
- 测试文件：与被测文件同名后缀 `*.test` / `*_test`（按语言约定）。

## 3. 分层依赖规则

- `core` 不依赖 `adapters`。
- `services` 依赖 `core`，通过接口调用 `adapters`。
- `app` 仅做装配与启动，不承载复杂业务逻辑。
- 工具类 `utils` 保持无副作用，避免反向依赖业务模块。

## 4. 配置与环境

- 禁止将密钥、Token、密码提交到仓库。
- 使用 `.env.example` 提供配置样例。
- 按环境拆分配置（`dev/test/prod`），并在 `docs/` 记录差异。

## 5. 测试与质量门禁

- 单元测试优先覆盖 `core/services`。
- 为关键业务路径补充集成测试。
- 在 CI 中至少启用：格式检查、静态检查、单元测试。

## 6. 文档要求

- `README.md`：项目简介、启动方式、开发命令、目录说明。
- `docs/architecture.md`：架构图 + 依赖关系。
- `docs/contributing.md`：分支策略、提交规范、Code Review 要求。

## 7. 提交规范（建议）

- 推荐 `Conventional Commits`：
  - `feat:` 新功能
  - `fix:` 缺陷修复
  - `docs:` 文档更新
  - `refactor:` 重构
  - `test:` 测试相关
  - `chore:` 杂项（构建、配置等）

## 8. 当前仓库现状

- 目前仅有 `README.md`，建议优先补齐 `src/`、`tests/`、`docs/` 三类目录。
- 可先用最小模板初始化，再逐步按模块拆分。
