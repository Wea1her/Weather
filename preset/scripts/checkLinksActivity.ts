/**
 * 友链活跃度检测脚本
 * 检测友链网站的最近更新时间，如果超过半年没更新则移动到 inactive-links
 *
 * 检测方式：
 * 1. 尝试获取 RSS/Atom feed
 * 2. 检查页面的 Last-Modified 响应头
 * 3. 解析页面中的日期信息
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type Friend = {
  name: string
  intro: string
  link: string
  avatar: string
  lastChecked?: string
  lastActive?: string
  status?: 'active' | 'inactive' | 'unreachable'
  avatar_cache?: {
    hash: string
    path: string
  }
}

type CheckResult = {
  reachable: boolean
  lastActive: Date | null
}

type FriendGroup = {
  id_name: string
  desc: string
  link_list: Friend[]
}

type LinksJson = {
  friends: FriendGroup[]
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')
const linksJsonPath = path.join(projectRoot, 'public', 'links.json')

// 半年的毫秒数
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

// 常见的 RSS/Atom feed 路径
const FEED_PATHS = [
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/feed',
  '/rss',
  '/index.xml',
  '/feed/atom',
  '/feed/rss'
]

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LinkChecker/1.0; +https://github.com/user/repo)'
      }
    })
    return response
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// 从 RSS/Atom feed 中提取最新文章日期
function extractDateFromFeed(xml: string): Date | null {
  // 匹配常见的日期标签
  const datePatterns = [
    /<pubDate>([^<]+)<\/pubDate>/i,
    /<published>([^<]+)<\/published>/i,
    /<updated>([^<]+)<\/updated>/i,
    /<dc:date>([^<]+)<\/dc:date>/i,
    /<lastBuildDate>([^<]+)<\/lastBuildDate>/i
  ]

  const dates: Date[] = []

  for (const pattern of datePatterns) {
    const matches = xml.matchAll(new RegExp(pattern.source, 'gi'))
    for (const match of matches) {
      const dateStr = match[1]?.trim()
      if (dateStr) {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          dates.push(date)
        }
      }
    }
  }

  if (dates.length === 0) return null

  // 返回最新的日期
  return dates.reduce((latest, current) => (current > latest ? current : latest))
}

// 从 HTML 页面提取日期信息
function extractDateFromHtml(html: string): Date | null {
  // 匹配常见的日期格式
  const datePatterns = [
    // ISO 格式: 2024-01-15
    /(\d{4}-\d{2}-\d{2})/g,
    // 中文格式: 2024年1月15日
    /(\d{4})年(\d{1,2})月(\d{1,2})日/g,
    // 英文格式: January 15, 2024
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi
  ]

  const dates: Date[] = []

  // ISO 格式
  const isoMatches = html.matchAll(/(\d{4}-\d{2}-\d{2})/g)
  for (const match of isoMatches) {
    const date = new Date(match[1])
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2020) {
      dates.push(date)
    }
  }

  // 中文格式
  const cnMatches = html.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)
  for (const match of cnMatches) {
    const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2020) {
      dates.push(date)
    }
  }

  if (dates.length === 0) return null

  // 返回最新的日期
  return dates.reduce((latest, current) => (current > latest ? current : latest))
}

async function checkSiteActivity(url: string): Promise<CheckResult> {
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url

  // 先检查网站是否可访问
  const mainResponse = await fetchWithTimeout(baseUrl, 10000)
  if (!mainResponse) {
    console.log(`  ❌ 网站无法访问（连接超时或失败）`)
    return { reachable: false, lastActive: null }
  }

  if (!mainResponse.ok) {
    console.log(`  ❌ 网站返回错误状态码: ${mainResponse.status}`)
    return { reachable: false, lastActive: null }
  }

  // 1. 尝试获取 RSS/Atom feed
  for (const feedPath of FEED_PATHS) {
    const feedUrl = baseUrl + feedPath
    const response = await fetchWithTimeout(feedUrl, 10000)

    if (response?.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (
        contentType.includes('xml') ||
        contentType.includes('rss') ||
        contentType.includes('atom')
      ) {
        const xml = await response.text()
        const date = extractDateFromFeed(xml)
        if (date) {
          console.log(`  [RSS] 从 ${feedPath} 获取到最新日期: ${date.toISOString().split('T')[0]}`)
          return { reachable: true, lastActive: date }
        }
      }
    }
  }

  // 2. 检查主页的 Last-Modified 响应头
  const lastModified = mainResponse.headers.get('last-modified')
  if (lastModified) {
    const date = new Date(lastModified)
    if (!isNaN(date.getTime())) {
      console.log(`  [Header] Last-Modified: ${date.toISOString().split('T')[0]}`)
      return { reachable: true, lastActive: date }
    }
  }

  // 3. 从页面内容提取日期
  const html = await mainResponse.text()
  const date = extractDateFromHtml(html)
  if (date) {
    console.log(`  [HTML] 从页面提取到日期: ${date.toISOString().split('T')[0]}`)
    return { reachable: true, lastActive: date }
  }

  return { reachable: true, lastActive: null }
}

async function main() {
  console.log('🔍 开始检测友链活跃度...\n')

  const raw = await readFile(linksJsonPath, 'utf-8')
  const links = JSON.parse(raw) as LinksJson

  // 找到各个分组
  const activeGroup = links.friends.find((g) => g.id_name === 'cf-links')
  const inactiveGroup = links.friends.find((g) => g.id_name === 'inactive-links')

  if (!activeGroup || !inactiveGroup) {
    console.error('❌ 找不到 cf-links 或 inactive-links 分组')
    process.exit(1)
  }

  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - SIX_MONTHS_MS)
  const today = now.toISOString().split('T')[0]

  const toMoveToInactive: Friend[] = []
  const toMoveToActive: Friend[] = []

  // 检查活跃分组中的友链
  console.log('📋 检查活跃友链:')
  for (const friend of activeGroup.link_list) {
    console.log(`\n检测: ${friend.name} (${friend.link})`)

    const result = await checkSiteActivity(friend.link)
    friend.lastChecked = today

    if (!result.reachable) {
      // 网站无法访问
      friend.status = 'unreachable'
      console.log(`  ⚠️ 网站无法访问，将移至 Bad Status`)
      toMoveToInactive.push(friend)
    } else if (result.lastActive) {
      friend.lastActive = result.lastActive.toISOString().split('T')[0]

      if (result.lastActive < sixMonthsAgo) {
        friend.status = 'inactive'
        console.log(`  ⚠️ 超过半年未更新，将移至 Bad Status`)
        toMoveToInactive.push(friend)
      } else {
        friend.status = 'active'
        console.log(`  ✅ 活跃`)
      }
    } else {
      console.log(`  ❓ 无法检测到更新日期，保持原状`)
    }
  }

  // 检查不活跃分组中的友链（看是否恢复活跃）
  console.log('\n\n📋 检查不活跃友链（检测是否恢复）:')
  for (const friend of inactiveGroup.link_list) {
    console.log(`\n检测: ${friend.name} (${friend.link})`)

    const result = await checkSiteActivity(friend.link)
    friend.lastChecked = today

    if (!result.reachable) {
      // 网站仍无法访问
      friend.status = 'unreachable'
      console.log(`  ⏸️ 网站仍无法访问`)
    } else if (result.lastActive) {
      friend.lastActive = result.lastActive.toISOString().split('T')[0]

      if (result.lastActive >= sixMonthsAgo) {
        friend.status = 'active'
        console.log(`  🎉 已恢复活跃，将移回正常分组`)
        toMoveToActive.push(friend)
      } else {
        friend.status = 'inactive'
        console.log(`  ⏸️ 仍不活跃`)
      }
    } else {
      // 网站可访问但无法检测日期，如果之前是 unreachable 则恢复
      if (friend.status === 'unreachable') {
        friend.status = 'active'
        console.log(`  🎉 网站已恢复访问，将移回正常分组`)
        toMoveToActive.push(friend)
      } else {
        console.log(`  ❓ 无法检测到更新日期，保持原状`)
      }
    }
  }

  // 执行移动
  for (const friend of toMoveToInactive) {
    const idx = activeGroup.link_list.indexOf(friend)
    if (idx > -1) {
      activeGroup.link_list.splice(idx, 1)
      inactiveGroup.link_list.push(friend)
    }
  }

  for (const friend of toMoveToActive) {
    const idx = inactiveGroup.link_list.indexOf(friend)
    if (idx > -1) {
      inactiveGroup.link_list.splice(idx, 1)
      activeGroup.link_list.push(friend)
    }
  }

  // 保存结果
  const serialised = `${JSON.stringify(links, null, 2)}\n`
  if (serialised !== raw) {
    await writeFile(linksJsonPath, serialised, 'utf-8')
    console.log('\n\n✅ links.json 已更新')
    console.log(`   移至不活跃: ${toMoveToInactive.length} 个`)
    console.log(`   恢复活跃: ${toMoveToActive.length} 个`)
  } else {
    console.log('\n\n✅ 无需更新')
  }
}

main().catch((error) => {
  console.error('❌ 执行失败:', error)
  process.exitCode = 1
})
