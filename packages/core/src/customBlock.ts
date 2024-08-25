import JSON5 from 'json5'
import { parse as YAMLParser } from 'yaml'
import type { SFCBlock, SFCDescriptor } from '@vue/compiler-sfc'
import { parse as VueParser } from '@vue/compiler-sfc'
import { debug } from './utils'
import type { CustomBlock, ResolvedOptions } from './types'

export async function parseSFC(code: string): Promise<SFCDescriptor> {
  try {
    return (
      VueParser(code, {
        pad: 'space',
      }).descriptor
      // for @vue/compiler-sfc ^2.7
      || (VueParser as any)({
        source: code,
      })
    )
  }
  catch (error) {
    throw new Error(`[vite-plugin-uni-pages] Vue3's "@vue/compiler-sfc" is required. \nOriginal error: \n${error}`)
  }
}

export function parseCustomBlock(
  block: SFCBlock,
  filePath: string,
  options: ResolvedOptions,
): CustomBlock | undefined {
  const lang = block.lang ?? options.routeBlockLang
  const attr = {
    type: 'page',
    ...block.attrs,
  }
  let content: Record<string, any> | undefined
  debug.routeBlock(`use ${lang} parser`)

  if (lang === 'json5' || lang === 'jsonc') {
    try {
      content = JSON5.parse(block.content)
    }
    catch (err: any) {
      throw new Error(
        `Invalid JSON5 format of <${block.type}> content in ${filePath}\n${err.message}`,
      )
    }
  }
  else if (lang === 'json') {
    try {
      content = JSON.parse(block.content)
    }
    catch (err: any) {
      throw new Error(
        `Invalid JSON format of <${block.type}> content in ${filePath}\n${err.message}`,
      )
    }
  }
  else if (lang === 'yaml' || lang === 'yml') {
    try {
      content = YAMLParser(block.content)
    }
    catch (err: any) {
      throw new Error(
        `Invalid YAML format of <${block.type}> content in ${filePath}\n${err.message}`,
      )
    }
  }
  return {
    attr,
    content: content ?? {},
  }
}

export async function getRouteSfcBlock(parsedSFC: SFCDescriptor): Promise<SFCBlock | undefined> {
  return parsedSFC?.customBlocks.find(b => b.type === 'route')
}

export async function getRouteBlock(path: string, blockStr: SFCBlock | undefined, options: ResolvedOptions): Promise<CustomBlock | undefined> {
  if (!blockStr)
    return
  return parseCustomBlock(blockStr, path, options)
}
