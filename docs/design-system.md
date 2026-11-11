# MuDiagram 设计系统

原则：中性的"墨水 + 纸面"界面，让图表成为屏幕上最醒目的东西。唯一的强调色（iris 紫）只用于 AI 与焦点，不做装饰。

- Token 定义：[styles.css](../src/styles.css)
- 复用控件样式：[control-class.ts](../src/shared/ui/control-class.ts)
- 品牌图形：[BrandMark.tsx](../src/shared/ui/BrandMark.tsx)（与 `public/favicon.svg` 几何一致）

## 1. 颜色 Token

只使用下列语义 token，不要写裸色值（`#xxx`、`gray-500` 等）。

| 分组 | Token | 值 | 用途 |
| --- | --- | --- | --- |
| 表面 | `canvas` | #f6f6f7 | 页面底色 |
| | `surface` | #ffffff | 卡片、面板、弹层 |
| | `sunken` | #f1f1f3 | 凹陷区：分段控件底、气泡、选中菜单项 |
| | `hover` | #ececef | 幽灵按钮 / 导航项 hover |
| 线条 | `line` | #e6e6ea | 默认边框、分隔线（全局默认 border 色） |
| | `line-strong` | #d4d4da | hover / 选中时的边框 |
| 文字 | `ink` | #17171c | 正文、标题、主按钮底色、导航选中底色 |
| | `ink-muted` | #5f5f6b | 次要文字、未选中导航、图标默认色 |
| | `ink-faint` | #8e8e99 | 提示、占位符、计数、元信息 |
| 品牌 | `brand` / `brand-soft` / `brand-ink` | #5b5bd6 / #efeffc / #3e3fb0 | AI 相关、焦点环、选中强调 |
| 状态 | `success` / `success-soft` | #18875a / #e5f4ec | 公开、已复制 |
| | `danger` / `danger-soft` | #cf3a35 / #fcebea | 删除、失败 |

`*-soft` 用作底色，同组深色用作其上的文字 / 图标。

## 2. 字体与字号

- 字体：`Geist` + `Noto Sans SC`（保证中文跨平台一致）；等宽 `Geist Mono` 用于 URL、模型名等机器字符串。
- body 默认 14px / 1.55；h1–h3 字距 -0.015em。

| 字号 | 用途 |
| --- | --- |
| 11px | 辅助提示（快捷键说明、等宽 URL） |
| `text-xs` 12px | 元信息、计数、字段说明 |
| 13px | 按钮、面板标题、紧凑列表正文 |
| 13.5px | AI 对话正文 |
| `text-sm` 14px | 导航项、输入框、卡片标题 |
| 15–16px | 品牌字标 |
| `text-xl` / `text-2xl` | 设置弹窗标题 |

字重只用 `font-medium`（控件、选中态）和 `font-semibold`（标题）。

## 3. 尺寸、圆角、间距

控件高度阶梯（同一行控件取同一档）：

| 档位 | 高度 | 圆角 | 典型用途 |
| --- | --- | --- | --- |
| sm | 28px `h-7` | `rounded-md` | 卡片内操作、列表内复制按钮、分段控件内项 |
| md | 32px `h-8` | `rounded-lg` | 默认按钮、工具栏 |
| lg | 36px `h-9` | `rounded-lg` | 导航项、表单提交 |
| xl | 40px `h-10` | `rounded-xl` | 输入框、搜索框、侧栏主操作 |

- 容器圆角：卡片 / 面板 `rounded-xl`，弹窗 `rounded-2xl`；嵌套时内层圆角比外层小一档。
- 图标：lucide，统一描边 1.75（全局设置）；按钮内 16px，sm 档 14px，xl 档 20px。
- 间距使用 Tailwind 4px 网格；列表项间 `space-y-0.5`~`space-y-1`，区块间 `mt-5`~`mt-7`。

## 4. 阴影与层级

| Token | 用途 |
| --- | --- |
| `shadow-xs` | 静止的卡片、按钮、面板 |
| `shadow-card` | 卡片 hover、选中的选项卡片 |
| `shadow-pop` | 浮层：菜单、分享面板、弹窗、移动端抽屉 |

## 5. 动效

- 时长：颜色/边框 150ms，位移/旋转 200ms；缓动 `--ease-out`。
- 入场：`animate-fade-in`（内容）、`animate-pop-in`（菜单、弹窗）、`animate-panel-in`（侧面板）。
- 已全局适配 `prefers-reduced-motion`。

## 6. 交互状态

- 焦点：一律使用 `FOCUS_RING`（仅键盘焦点显示品牌色环）；输入类使用 `FIELD_FOCUS_CLASS`（品牌边框 + 4px 柔光）。
- 选中：导航用 `aria-current="page"` 驱动（`ink` 实底白字）；分段控件用白底 + `shadow-xs`；选项卡片用 `line-strong` 边框 + `shadow-card` + 对勾。
- 禁用：`opacity-40` 且不可点击。
- 危险操作：静止时与普通按钮一致，hover 才显示 `danger` 色。

## 7. 复用控件（`shared/ui/control-class.ts`）

| 导出 | 说明 |
| --- | --- |
| `buttonClass(tone, size = 'md')` | 文字按钮。size：`md` / `lg` / `xl` |
| `iconButtonClass(tone = 'ghost', size = 'md')` | 纯图标按钮。size：`sm` / `md` / `lg` / `xl`；必须带 `aria-label`，建议带 `title` |
| `NAV_ITEM_CLASS` + `NAV_ITEM_COUNT_CLASS` | 侧栏导航项与尾部计数 |
| `SURFACE_CARD_CLASS` | 白底 + 边框 + `shadow-xs` 的卡片 / 面板外壳 |
| `FIELD_FOCUS_CLASS` | 输入框或其外层容器的焦点样式 |
| `FOCUS_RING` | 自定义可交互元素的键盘焦点环 |

tone 取值：

| tone | 外观 | 用途 |
| --- | --- | --- |
| `primary` | `ink` 实底白字 | 页面唯一主操作（新建图表、保存） |
| `secondary` | 白底描边 | 次要操作（分享） |
| `ghost` | 无底，hover 显示 `hover` 底 | 工具栏、面板头部、关闭 |
| `accent` | `brand-soft` 底 + `brand-ink` 字 | 已激活的 AI 相关开关 |
| `danger` | 同 ghost，hover 变红 | 删除 |

规则：

1. **不要在调用处覆盖尺寸 / 圆角 / 颜色**（如 `` `${iconButtonClass()} size-7` ``）。Tailwind 不保证冲突类的优先级，覆盖可能静默失效；需要新档位就加到查找表里。
2. 只允许追加布局类（`mt-auto`、`w-full`、`absolute top-5 right-5`、`md:hidden`）。
3. 新控件出现第 2–3 次时再抽到 `shared/ui`；只用一次的保持在所属 feature 内。

## 8. 尚未抽象的局部模式

以下目前只出现一次，保留在 feature 内，出现复用需求时再提取：

- 开关 Switch：`project-share/SharePanel.tsx`
- 分段控件 Tabs：`pages/library/LibraryPage.tsx`（`SharePage` 的下载格式组外观相近）
- 下拉菜单 + 点击外部 / Esc 关闭：`project-library/SortMenu.tsx`（编辑器的分享浮层将来可复用同一关闭逻辑）
- 状态标签 Chip：`ai-assistant/AiChatPanel.tsx`
- AI 输入框发送按钮：禁用态使用 `hover` 底而非半透明，刻意与 `buttonClass` 不同
