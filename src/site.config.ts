/**
 * 功能说明：
 * 这是 Astro Pure 主题的站点配置文件，用于配置网站的基本信息、主题设置、集成功能等。
 * 包括网站标题、描述、导航菜单、页脚、评论系统、搜索功能等所有可定制的选项。
 */
import type { CardListData, Config, IntegrationUserConfig, ThemeUserConfig } from 'astro-pure/types'

// 主题配置
export const theme: ThemeUserConfig = {
  // [基础配置]
  /** 网站标题，将用于元数据和浏览器标签页标题 */
  title: 'Weather Cosmos',
  /** 作者名称，将用于首页和版权声明 */
  author: 'Weather',
  /** 网站描述元数据，可用于页面元数据 */
  description: 'Stay hungry, stay foolish, be water.',
  /** 网站默认图标，应为 `public/` 目录中图片的路径 */
  favicon: '/favicon/favicon.ico',
  /** 网站默认社交卡片图片，应为 `public/` 目录中图片的路径 */
  socialCard: '/images/social-card.png',
  /** 指定此站点的默认语言 */
  locale: {
    lang: 'zh-CN',
    attrs: 'zh_CN',
    // 日期语言环境
    dateLocale: 'zh-CN',
    dateOptions: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  },
  /** 设置要在主页上显示的 logo 图片 */
  logo: {
    src: '/src/assets/avatar.png',
    alt: 'Avatar'
  },

  titleDelimiter: '•', // 标题分隔符
  prerender: true, // 预渲染，禁用时 pagefind 搜索不受支持
  npmCDN: 'https://cdn.jsdelivr.net/npm', // NPM CDN 地址

  // 仍在测试中
  head: [
    /* Telegram 频道 */
    // {
    //   tag: 'meta',
    //   attrs: { name: 'telegram:channel', content: '@cworld0_cn' },
    //   content: ''
    // }
  ],
  customCss: [], // 自定义 CSS

  /** 配置网站的页眉 */
  header: {
    menu: [
      { title: 'Blog', link: '/blog' },
      { title: 'Docs', link: '/docs' },
      { title: 'Projects', link: '/projects' },
      { title: 'Links', link: '/links' },
      { title: 'About', link: '/about' }
    ]
  },

  /** 配置网站的页脚 */
  footer: {
    // 年份格式
    year: `© ${new Date().getFullYear()}`,
    // year: `© 2019 - ${new Date().getFullYear()}`,
    links: [
      // 备案链接，托管在国内服务器时可启用
      // {
      //   title: 'Moe ICP 114514',
      //   link: 'https://icp.gov.moe/?keyword=114514',
      //   style: 'text-sm' // Uno/TW CSS 类名
      // },
      // {
      //   title: 'Travelling',
      //   link: 'https://www.travellings.cn/go.html',
      //   style: 'text-sm'
      // },
      // 隐私政策链接
      {
        title: 'Site Policy',
        link: '/terms/list',
        pos: 2 // 位置设为 2 将追加到版权行
      }
    ],
    /** 启用在网站页脚中显示 "Astro & Pure theme powered" 链接 */
    credits: true,
    /** 此站点社交媒体账户的可选详细信息 */
    social: { github: 'https://github.com/Wea1her', telegram: 'https://t.me/jaycupup' }
  },

  // [内容配置]
  content: {
    /** 外部链接配置 */
    externalLinks: {
      content: ' ↗',
      /** 外部链接元素的属性 */
      properties: {
        style: 'user-select:none'
      }
    },
    /** 博客分页的每页大小（可选） */
    blogPageSize: 8,
    // 当前支持 weibo、x、bluesky
    share: ['weibo', 'x', 'bluesky'] // 分享平台
  }
}

// 集成功能配置
export const integ: IntegrationUserConfig = {
  // [友情链接]
  // https://astro-pure.js.org/docs/integrations/links
  links: {
    // 友链日志
    logbook: [],
    // 自己的链接信息
    applyTip: [
      { name: 'Name', val: theme.title },
      { name: 'Desc', val: theme.description || 'Null' },
      { name: 'Link', val: 'https://www.0xweather.com/' },
      { name: 'Avatar', val: 'https://gravatar.com/avatar/8c75e73e81e63a2c8c88d4e4ec0bb0a2' }
    ],
    // 在 `public/avatars/` 中缓存头像以改善用户体验
    cacheAvatar: false
  },
  // [搜索]
  pagefind: true, // 启用 Pagefind 搜索
  // 在页脚添加随机引用（默认在主页页脚）
  // 参见：https://astro-pure.js.org/docs/integrations/advanced#web-content-render
  // [引用]
  quote: {
    // - Hitokoto 一言
    // https://developer.hitokoto.cn/sentence/#%E8%AF%B7%E6%B1%82%E5%9C%B0%E5%9D%80
    // server: 'https://v1.hitokoto.cn/?c=i',
    // target: `(data) => (data.hitokoto || 'Error')`
    // - Quoteable
    // https://github.com/lukePeavey/quotable
    // server: 'http://api.quotable.io/quotes/random?maxLength=60',
    // target: `(data) => data[0].content || 'Error'`
    // - DummyJSON
    server: 'https://dummyjson.com/quotes/random',
    target: `(data) => (data.quote.length > 80 ? \`\${data.quote.slice(0, 80)}...\` : data.quote || 'Error')`
  },
  // [排版]
  // https://unocss.dev/presets/typography
  typography: {
    class: 'prose text-base',
    // 引用块字体样式 `normal` / `italic`（typography 默认为斜体）
    blockquoteStyle: 'italic',
    // 行内代码块样式 `code` / `modern`（typography 默认为 code）
    inlineCodeBlockStyle: 'modern'
  },
  // [灯箱]
  // 可以添加缩放效果的灯箱库
  // https://astro-pure.js.org/docs/integrations/others#medium-zoom
  mediumZoom: {
    enable: true, // 禁用将不加载整个库
    selector: '.prose .zoomable',
    options: {
      className: 'zoomable'
    }
  },
  // 评论系统
  waline: {
    enable: true, // 启用 Waline 评论
    // 服务端链接
    server: 'https://waline-sandy-five.vercel.app/',
    // 参考 https://waline.js.org/en/guide/features/emoji.html
    emoji: ['bmoji', 'weibo'],
    // 参考 https://waline.js.org/en/reference/client/props.html
    additionalConfigs: {
      // search: false,
      pageview: true, // 启用页面浏览量统计
      comment: true, // 启用评论
      locale: {
        reaction0: 'Like',
        placeholder: 'Welcome to comment. (Email to receive replies. Login is unnecessary)'
      },
      imageUploader: false // 禁用图片上传
    }
  }
}

// 条款内容配置
export const terms: CardListData = {
  title: 'Terms content',
  list: [
    {
      title: 'Privacy Policy',
      link: '/terms/privacy-policy'
    },
    {
      title: 'Terms and Conditions',
      link: '/terms/terms-and-conditions'
    },
    {
      title: 'Copyright',
      link: '/terms/copyright'
    },
    {
      title: 'Disclaimer',
      link: '/terms/disclaimer'
    }
  ]
}

// 合并配置并导出
const config = { ...theme, integ } as Config
export default config
