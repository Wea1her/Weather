// 功能说明：Astro 项目的主配置文件，配置了站点基本信息、部署适配器、Markdown 渲染、
// 代码高亮、集成插件等核心功能，用于构建和部署博客网站。

// 导入 Astro Markdown 处理插件
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
// 导入 Vercel 部署适配器
import vercel from '@astrojs/vercel'
// 导入 Astro Pure 主题集成
import AstroPureIntegration from 'astro-pure'
// 导入 Astro 配置定义函数和字体提供商
import { defineConfig, fontProviders } from 'astro/config'
// 导入数学公式渲染插件
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
// 导入 Starlight 主题插件
import starlightThemeObsidian from 'starlight-theme-obsidian'

// 本地集成插件
// 导入自动链接标题插件
import rehypeAutolinkHeadings from './src/plugins/rehype-auto-link-headings.ts'
// Shiki 代码高亮相关
// 导入自定义 Shiki 转换器
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  updateStyle
} from './src/plugins/shiki-custom-transformers.ts'
// 导入官方 Shiki 转换器
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape
} from './src/plugins/shiki-offical/transformers.ts'
// 导入站点配置
import config from './src/site.config.ts'

// 导入 Starlight 集成
import starlight from '@astrojs/starlight';

// Astro 配置
// https://astro.build/config
export default defineConfig({
  // [基础配置]
  site: 'https://astro-pure.js.org', // 站点 URL
  // 部署到子路径
  // https://astro-pure.js.org/docs/setup/deployment#platform-with-base-path
  // base: '/astro-pure/',
  trailingSlash: 'never', // URL 不使用尾部斜杠
  // root: './my-project-directory', // 项目根目录
  server: { host: true }, // 服务器配置，允许局域网访问

  // [适配器配置]
  // https://docs.astro.build/en/guides/deploy/
  adapter: vercel(), // 使用 Vercel 适配器
  output: 'static', // 输出模式：静态生成（Starlight 需要）
  // 本地部署（独立模式）
  // adapter: node({ mode: 'standalone' }),
  // output: 'server',

  // [资源配置]
  image: {
    responsiveStyles: true, // 启用响应式样式
    service: {
      entrypoint: 'astro/assets/services/sharp' // 使用 Sharp 图片处理服务
    }
  },

  // [Markdown 配置]
  markdown: {
    remarkPlugins: [remarkMath], // Remark 插件：数学公式支持
    rehypePlugins: [
      [rehypeKatex, {}], // Rehype 插件：渲染 KaTeX 数学公式
      rehypeHeadingIds, // 为标题添加 ID
      [
        rehypeAutolinkHeadings, // 为标题添加锚点链接
        {
          behavior: 'append', // 在标题后追加链接
          properties: { className: ['anchor'] }, // 添加 CSS 类名
          content: { type: 'text', value: '#' } // 链接显示为 #
        }
      ]
    ],
    // 代码语法高亮配置
    // https://docs.astro.build/en/guides/syntax-highlighting/
    shikiConfig: {
      themes: {
        light: 'github-light', // 亮色主题
        dark: 'github-dark' // 暗色主题
      },
      transformers: [
        // 官方转换器
        transformerNotationDiff(), // 支持 diff 标记
        transformerNotationHighlight(), // 支持高亮标记
        transformerRemoveNotationEscape(), // 移除转义标记
        // 自定义转换器
        updateStyle(), // 更新样式
        addTitle(), // 添加标题
        addLanguage(), // 添加语言标签
        addCopyButton(2000), // 添加复制按钮（超时 2000ms）
        addCollapse(15) // 添加折叠功能（超过 15 行折叠）
      ]
    }
  },

  // [集成插件配置]
  integrations: [
    // Starlight 必须在 mdx 之前加载
    starlight({
      title: 'Khalil Docs',
    }), // Starlight 文档集成
    // astro-pure 会自动添加 sitemap, mdx 和 unocss
    // sitemap(),
    // mdx(),
    // 推荐使用压缩插件
    // https://docs.astro.build/en/guides/integrations-guide/partytown/
    AstroPureIntegration(config), // Astro Pure 主题集成
  ],

  // [实验性功能]
  experimental: {
    // 允许兼容的编辑器为内容集合条目提供智能感知功能
    // https://docs.astro.build/en/reference/experimental-flags/content-intellisense/
    contentIntellisense: true,
    // 启用 SVG 资源的 SVGO 优化
    // https://docs.astro.build/en/reference/experimental-flags/svg-optimization/
    svgo: true,
    // 启用字体预加载和优化
    // https://docs.astro.build/en/reference/experimental-flags/fonts/
    fonts: [
      {
        provider: fontProviders.fontshare(), // 字体提供商
        name: 'Satoshi', // 字体名称
        cssVariable: '--font-satoshi', // CSS 变量名
        // 默认包含:
        // weights: [400],
        // styles: ["normal", "italics"],
        // subsets: ["cyrillic-ext", "cyrillic", "greek-ext", "greek", "vietnamese", "latin-ext", "latin"],
        // fallbacks: ["sans-serif"],
        styles: ['normal', 'italic'], // 字体样式
        weights: [400, 500], // 字体粗细
        subsets: ['latin'] // 字符子集
      }
    ]
  }
})