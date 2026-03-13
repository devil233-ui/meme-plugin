import { Config, Version } from '#components'
import { Utils } from '#models'

export class search extends plugin {
  constructor () {
    super({
      name: '清语表情:搜索',
      event: 'message',
      priority: -Infinity,
      rule: [ {
        reg: /^#?(?:(清语)?表情|meme(?:-plugin)?)搜索\s*(.+)\s*$/i,
        fnc: 'search'
      } ]
    })
  }

  async search (e) {
    if (!Config.meme.enable) return false
    try {
      const match = e.msg.match(this.rule[0].reg)
      const keyword = match[2].trim()

      if (!keyword) {
        await e.reply('请提供搜索的表情关键字', true)
        return true
      }

      // === 修改部分开始 ===
      // 1. 获取所有 key 及其对应的 keywords
      const allKeys = await Utils.Tools.getAllKeys()
      const keyToKeywordsMap = new Map()

      for (const key of allKeys) {
        const keywords = await Utils.Tools.getKeyWords(key) ?? []
        keyToKeywordsMap.set(key, keywords)
      }

      // 2. 搜索匹配的 keywords（扁平化所有 keywords 进行搜索）
      const allKeywords = Array.from(keyToKeywordsMap.values()).flat()
      const lowerCaseKeyword = keyword.toLowerCase()
      const matchedKeywords = allKeywords.filter(kw => 
        kw.toLowerCase().includes(lowerCaseKeyword)
      )

      if (matchedKeywords.length === 0) {
        await e.reply(`未找到与 "${keyword}" 相关的表情`, true)
        return true
      }

      // 3. 按 key 分组，并合并同一 key 的 keywords
      const resultMap = new Map()
      for (const kw of matchedKeywords) {
        for (const [key, keywords] of keyToKeywordsMap.entries()) {
          if (keywords.includes(kw)) {
            if (!resultMap.has(key)) {
              resultMap.set(key, [])
            }
            resultMap.get(key).push(kw)
          }
        }
      }

      // 4. 格式化输出：合并同一 key 的 keywords
      const formattedResults = []
      for (const [key, keywords] of resultMap.entries()) {
        formattedResults.push(keywords.join(' / '))
      }

      // 去重 + 排序
      const uniqueResults = [...new Set(formattedResults)].sort()

      // 5. 生成回复消息
      const replyMessage = uniqueResults
        .map((kw, index) => `${index + 1}. ${kw}`)
        .join('\n')

      await e.reply(replyMessage, true)
      return true
      // === 修改部分结束 ===

    } catch (error) {
      logger.error(`[${Version.Plugin_AliasName}] 搜索表情失败: ${error}`)
      await e.reply(`[${Version.Plugin_AliasName}] 搜索表情失败，请稍后重试`, true)
      return true
    }
  }
}