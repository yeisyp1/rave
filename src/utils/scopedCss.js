const splitTopLevel = (css) => {
  const blocks = []
  let depth = 0
  let start = 0

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        blocks.push(css.slice(start, i + 1))
        start = i + 1
      }
    }
  }

  return blocks
}

const scopeSelectorList = (selectorList, scope) =>
  selectorList
    .split(',')
    .map((raw) => {
      const selector = raw.trim()
      if (!selector) return null
      if (selector === '*') return `${scope}, ${scope} *`
      if (/^(html|body|:root)$/i.test(selector)) return scope
      if (/^(html|body)\b/i.test(selector)) return selector.replace(/^(html|body)/i, scope)
      if (/^\.dark\b/.test(selector)) {
        const rest = selector.replace(/^\.dark\s*/, '').trim()
        return rest ? `.dark ${scope} ${rest}` : `.dark ${scope}`
      }
      if (selector.startsWith(scope)) return selector
      return `${scope} ${selector}`
    })
    .filter(Boolean)
    .filter((selector, index, all) => all.indexOf(selector) === index)
    .join(', ')

const scopeBlock = (block, scope) => {
  const braceIndex = block.indexOf('{')
  if (braceIndex === -1) return block

  const prelude = block.slice(0, braceIndex).trim()
  const body = block.slice(braceIndex + 1, block.lastIndexOf('}'))

  if (prelude.startsWith('@')) {
    if (/^@(media|supports|layer|container)/i.test(prelude)) {
      return `${prelude}{${scopeCss(body, scope)}}`
    }
    return block
  }

  return `${scopeSelectorList(prelude, scope)}{${body}}`
}

export const scopeCss = (css, scope) =>
  splitTopLevel(css)
    .map((block) => scopeBlock(block, scope))
    .join('\n')
