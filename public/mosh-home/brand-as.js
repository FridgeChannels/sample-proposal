/** Optional display-brand rewrite: /mosh-home/?as=Gardencup replaces MOSH (any case) in visible UI. */
const params = new URLSearchParams(location.search)
const brandAs = (params.get('as') || '').trim()
if (!brandAs) {
  // no-op export for optional imports
} else {
  document.documentElement.dataset.brandAs = brandAs

  const MOSH_RE = /MOSH/gi
  const LOGO_RE = /(?:^|\/)(?:assets\/)?mosh\/logo\.svg(?:$|\?)/i
  const GARDENCUP_LOGO = '/gardencup/logos/gardencup-logo-dark-green.avif'
  const MOSH_SAMPLE = 'https://sample.fridgechannels.com/p/G5QD0W25PM'
  const SAMPLE_BY_BRAND = {
    gardencup: 'https://sample.fridgechannels.com/p/1XQ831G09R',
  }
  const sampleURL = SAMPLE_BY_BRAND[brandAs.toLowerCase()] || ''

  function rewriteText(value) {
    return String(value).replace(MOSH_RE, brandAs)
  }

  function rewriteAttr(el, name) {
    if (!el.hasAttribute(name)) return
    const next = rewriteText(el.getAttribute(name))
    if (next !== el.getAttribute(name)) el.setAttribute(name, next)
  }

  function rewriteLogo(img) {
    const src = img.getAttribute('src') || ''
    if (!LOGO_RE.test(src)) return
    img.src = GARDENCUP_LOGO
    if (!img.alt || /mosh/i.test(img.alt)) img.alt = brandAs
  }

  function rewriteSampleLink(anchor) {
    if (!sampleURL) return
    const href = anchor.getAttribute('href') || ''
    const isSample =
      anchor.classList.contains('mi-live-sample')
      || anchor.classList.contains('sg-sample-link')
      || href === MOSH_SAMPLE
      || /sample\.fridgechannels\.com\/p\/G5QD0W25PM/i.test(href)
    if (!isSample) return
    if (href !== sampleURL) anchor.setAttribute('href', sampleURL)
  }

  function walk(root) {
    if (!root || root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return
    const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
    const pending = []
    while (tree.nextNode()) pending.push(tree.currentNode)
    for (const node of pending) {
      if (node.nodeType === Node.TEXT_NODE) {
        const next = rewriteText(node.nodeValue)
        if (next !== node.nodeValue) node.nodeValue = next
        continue
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE' || node.tagName === 'NOSCRIPT') continue
      if (node.tagName === 'IMG') rewriteLogo(node)
      if (node.tagName === 'A') rewriteSampleLink(node)
      for (const name of ['alt', 'aria-label', 'title', 'placeholder']) rewriteAttr(node, name)
    }
  }

  const rewrite = () => walk(document)
  rewrite()

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData' && record.target?.nodeType === Node.TEXT_NODE) {
        const next = rewriteText(record.target.nodeValue)
        if (next !== record.target.nodeValue) record.target.nodeValue = next
        continue
      }
      if (record.type === 'attributes' && record.target?.nodeType === Node.ELEMENT_NODE) {
        if (record.attributeName === 'src' && record.target.tagName === 'IMG') rewriteLogo(record.target)
        else if (record.attributeName === 'href' && record.target.tagName === 'A') rewriteSampleLink(record.target)
        else if (record.attributeName) rewriteAttr(record.target, record.attributeName)
        continue
      }
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const next = rewriteText(node.nodeValue)
          if (next !== node.nodeValue) node.nodeValue = next
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          walk(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['alt', 'aria-label', 'title', 'placeholder', 'src', 'href'],
  })
}
