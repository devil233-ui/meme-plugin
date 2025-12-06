import fs from 'node:fs/promises'
import path from 'node:path'

import chalk from 'chalk'

import { Version  } from '#components'
import { Utils } from '#models'

const startTime = Date.now()
let apps

try {
  Utils.Tools.init()
  logger.info(chalk.bold.cyan(`[${Version.Plugin_AliasName}] 🎉 表情包数据初始化成功！`))
} catch (error) {
  logger.error(chalk.bold.red(`[${Version.Plugin_AliasName}] 💥 表情包数据初始化失败！错误详情：${error.message}`))
}

try {
  const files = (await fs.readdir(`${Version.Plugin_Path}/apps`))
    .filter(file => file.endsWith('.js'))

  const ret = await Promise.allSettled(
    files.map(async (file) => {
      const filePath = path.resolve(`${Version.Plugin_Path}/apps/${file}`)
      const startModuleTime = Date.now()

      try {
        const module = await import(`file://${filePath}`)
        const endModuleTime = Date.now()
        const loadTime = endModuleTime - startModuleTime

        logger.debug(
          chalk.rgb(0, 255, 255)(`[${Version.Plugin_AliasName}]`) +
          chalk.green(` 🚀 ${file.replace('.js', '')}`) +
          chalk.rgb(255, 223, 0)(` 加载时间: ${loadTime} ms`)
        )

        return module
      } catch (error) {
        logger.error(
          chalk.bgRgb(255, 0, 0).white.bold(' ❌ 载入插件错误：') +
          chalk.redBright(` ${file.replace('.js', '')} `) +
          ' 🚫'
        )
        logger.debug(chalk.red(`📄 错误详情： ${error.message}`))

        return null
      }
    })
  )

  apps = {}

  files.forEach((file, i) => {
    const name = file.replace('.js', '')

    if (ret[i].status !== 'fulfilled' || !ret[i].value) {
      return
    }

    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
  })

  const endTime = Date.now()
  const loadTime = endTime - startTime

  let loadTimeColor = chalk.green.bold
  if (loadTime < 500) {
    loadTimeColor = chalk.rgb(144, 238, 144).bold
  } else if (loadTime < 1000) {
    loadTimeColor = chalk.rgb(255, 215, 0).bold
  } else {
    loadTimeColor = chalk.red.bold
  }

  logger.info(chalk.bold.rgb(0, 255, 0)('========= 🌟🌟🌟 ========='))
  logger.info(
    chalk.bold.blue('📦 当前运行环境: ') +
    chalk.bold.white(`${Version.Bot_Name}`) +
    chalk.gray(' | ') +
    chalk.bold.green('🏷️ 运行版本: ') +
    chalk.bold.white(`${Version.Bot_Version}`)
  )

  logger.info(
    chalk.bold.rgb(255, 215, 0)(`✨ ${Version.Plugin_AliasName} `) +
    chalk.bold.rgb(255, 165, 0).italic(Version.Plugin_Version) +
    chalk.rgb(255, 215, 0).bold(' 载入成功 ^_^')
  )
  logger.info(loadTimeColor(`⏱️ 载入耗时：${loadTime} ms`))
  logger.info(chalk.green.bold('========================='))

} catch (error) {
  logger.error(chalk.red.bold(`❌ 初始化失败: ${error}`))
}

export { apps }
