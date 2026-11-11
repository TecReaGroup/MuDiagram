export const LANGUAGES = ['zh-CN', 'en-US'] as const;
export const DEFAULT_LANGUAGE: Language = 'zh-CN';

export type Language = (typeof LANGUAGES)[number];

// The Chinese table is the source of truth for keys; other languages must cover every one.
const ZH_CN_MESSAGES = {
  'common.close': '关闭',
  'common.rename': '重命名',
  'common.loading': '加载中…',
  'common.noMatchingProject': '没有符合条件的图表。',

  'time.justNow': '刚刚',
  'time.today': '今天 {time}',

  'project.untitled': '未命名图表',
  'project.name': '图表名称',
  'project.public': '公开',
  'project.private': '私有',
  'project.moveToTrash': '移到回收站',

  'library.allProjects': '全部图表',
  'library.trash': '回收站',
  'library.newProject': '新建图表',
  'library.search': '搜索图表',
  'library.empty': '还没有图表，点击「新建图表」开始绘制。',
  'library.folderMissing': '文件夹不存在或已被删除。',
  'library.visibility.all': '全部',
  'library.sortOrder': '排序方式',
  'library.sort.updated': '最近修改',
  'library.sort.created': '最近创建',
  'library.sort.name': '名称',

  'folder.list': '文件夹',
  'folder.new': '新建文件夹',
  'folder.newName': '新文件夹名称',
  'folder.empty': '还没有文件夹',
  'folder.name': '文件夹名称',
  'folder.rename': '重命名文件夹',
  'folder.delete': '删除文件夹',
  'folder.deleteShort': '删除',
  'folder.confirmDelete': '删除文件夹「{name}」？其中的图表不会被删除。',
  'folder.moveTo': '移动到文件夹',
  'folder.none': '不放入文件夹',

  'trash.description': '删除的图表会在这里保留一段时间，到期后自动彻底删除。',
  'trash.empty': '回收站是空的。',
  'trash.restore': '恢复',
  'trash.deletePermanently': '彻底删除',
  'trash.confirmDelete': '彻底删除图表「{name}」？此操作无法撤销。',
  'trash.purgeIn': '{when}彻底删除',
  'trash.purgeSoon': '即将彻底删除',

  'editor.backToLibrary': '返回全部图表',
  'editor.allChangesSaved': '所有更改已保存',
  'editor.saved': '已保存',
  'editor.share': '分享',
  'editor.isPublic': '已公开',

  'ai.assistant': 'AI 助手',
  'ai.newChat': '新对话',
  'ai.toolDone': '已更新图表',
  'ai.toolFailed': '绘制失败',
  'ai.toolRunning': '正在绘制…',
  'ai.inputPlaceholder': '描述你想怎么修改图表…',
  'ai.inputHint': 'Enter 发送 · Shift+Enter 换行',
  'ai.send': '发送',

  'share.public': '公开分享',
  'share.publicHint': '任何拿到链接的人都可以查看和下载',
  'share.privateHint': '当前仅自己可见',
  'share.page': '分享页面',
  'share.drawioFile': 'Draw.io 源文件',
  'share.svgImage': 'SVG 图片',
  'share.pngImage': 'PNG 图片',
  'share.copyLink': '复制链接',
  'share.copyNamedLink': '复制{label}链接',

  'sharePage.updatedAt': '更新于 {time}',
  'sharePage.preview': '分享图表预览',
  'sharePage.madeWith': '使用 MuDiagram 创建',

  'settings.title': '设置',
  'settings.ai.title': 'AI 模型',
  'settings.ai.description': '配置 AI 助手生成图表时使用的模型服务。',
  'settings.ai.model': '模型',
  'settings.ai.apiKeyEnv': 'API Key 环境变量',
  'settings.language.title': '语言',
  'settings.language.description': '选择界面显示的语言。',
  'settings.language.zh-CN': '简体中文',
  'settings.language.en-US': '英语',
  'settings.about.title': '关于',
  'settings.about.description': '关于 MuDiagram。',
  'settings.about.tagline': '用一句话生成可编辑的 draw.io 架构图',
} as const;

export type MessageKey = keyof typeof ZH_CN_MESSAGES;

const EN_US_MESSAGES: Record<MessageKey, string> = {
  'common.close': 'Close',
  'common.rename': 'Rename',
  'common.loading': 'Loading…',
  'common.noMatchingProject': 'No diagrams match.',

  'time.justNow': 'Just now',
  'time.today': 'Today {time}',

  'project.untitled': 'Untitled diagram',
  'project.name': 'Diagram name',
  'project.public': 'Public',
  'project.private': 'Private',
  'project.moveToTrash': 'Move to trash',

  'library.allProjects': 'All diagrams',
  'library.trash': 'Trash',
  'library.newProject': 'New diagram',
  'library.search': 'Search diagrams',
  'library.empty': 'No diagrams yet. Click “New diagram” to start drawing.',
  'library.folderMissing': 'This folder does not exist or has been deleted.',
  'library.visibility.all': 'All',
  'library.sortOrder': 'Sort by',
  'library.sort.updated': 'Last modified',
  'library.sort.created': 'Last created',
  'library.sort.name': 'Name',

  'folder.list': 'Folders',
  'folder.new': 'New folder',
  'folder.newName': 'New folder name',
  'folder.empty': 'No folders yet',
  'folder.name': 'Folder name',
  'folder.rename': 'Rename folder',
  'folder.delete': 'Delete folder',
  'folder.deleteShort': 'Delete',
  'folder.confirmDelete': 'Delete folder “{name}”? The diagrams in it will not be deleted.',
  'folder.moveTo': 'Move to folder',
  'folder.none': 'No folder',

  'trash.description': 'Deleted diagrams stay here for a while, then are deleted permanently.',
  'trash.empty': 'The trash is empty.',
  'trash.restore': 'Restore',
  'trash.deletePermanently': 'Delete permanently',
  'trash.confirmDelete': 'Permanently delete “{name}”? This cannot be undone.',
  'trash.purgeIn': 'Deleted permanently {when}',
  'trash.purgeSoon': 'Deleted permanently soon',

  'editor.backToLibrary': 'Back to all diagrams',
  'editor.allChangesSaved': 'All changes saved',
  'editor.saved': 'Saved',
  'editor.share': 'Share',
  'editor.isPublic': 'Public',

  'ai.assistant': 'AI assistant',
  'ai.newChat': 'New chat',
  'ai.toolDone': 'Diagram updated',
  'ai.toolFailed': 'Drawing failed',
  'ai.toolRunning': 'Drawing…',
  'ai.inputPlaceholder': 'Describe how to change the diagram…',
  'ai.inputHint': 'Enter to send · Shift+Enter for a new line',
  'ai.send': 'Send',

  'share.public': 'Public sharing',
  'share.publicHint': 'Anyone with the link can view and download',
  'share.privateHint': 'Only visible to you',
  'share.page': 'Share page',
  'share.drawioFile': 'Draw.io source file',
  'share.svgImage': 'SVG image',
  'share.pngImage': 'PNG image',
  'share.copyLink': 'Copy link',
  'share.copyNamedLink': 'Copy {label} link',

  'sharePage.updatedAt': 'Updated {time}',
  'sharePage.preview': 'Shared diagram preview',
  'sharePage.madeWith': 'Made with MuDiagram',

  'settings.title': 'Settings',
  'settings.ai.title': 'AI model',
  'settings.ai.description': 'Configure the model service the AI assistant uses to generate diagrams.',
  'settings.ai.model': 'Model',
  'settings.ai.apiKeyEnv': 'API key environment variable',
  'settings.language.title': 'Language',
  'settings.language.description': 'Choose the language of the interface.',
  'settings.language.zh-CN': 'Simplified Chinese',
  'settings.language.en-US': 'English',
  'settings.about.title': 'About',
  'settings.about.description': 'About MuDiagram.',
  'settings.about.tagline': 'Turn one sentence into an editable draw.io architecture diagram',
};

export const MESSAGES: Record<Language, Record<MessageKey, string>> = {
  'zh-CN': ZH_CN_MESSAGES,
  'en-US': EN_US_MESSAGES,
};

/** Each language's name written in that language, so it stays recognizable whatever the UI language is. */
export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};
