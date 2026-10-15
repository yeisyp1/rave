// Renderiza el texto de legal_documents: "## " titulo, "- " vineta, el resto parrafo.
const LegalTextVW = ({ content }) => {
  const blocks = []
  String(content || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim()
    if (!line) return
    if (line.startsWith('## ')) blocks.push({ type: 'h', text: line.slice(3) })
    else if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'ul') last.items.push(line.slice(2))
      else blocks.push({ type: 'ul', items: [line.slice(2)] })
    } else blocks.push({ type: 'p', text: line })
  })

  return blocks.map((b, i) => {
    if (b.type === 'h') return <h2 key={i}>{b.text}</h2>
    if (b.type === 'ul') return <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
    return <p key={i}>{b.text}</p>
  })
}

export default LegalTextVW
