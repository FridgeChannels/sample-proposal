import giftChallengeDocument from './gift-challenge.html?raw'

type TemplateConfig = {
  bodyMarkup: string
  css: string
  scripts: string[]
  fontLinks: string[]
}

export function extractGiftChallengeConfig(source = giftChallengeDocument): TemplateConfig {
  const document = new DOMParser().parseFromString(source, 'text/html')
  const css = [...document.querySelectorAll('style')].map((style) => style.textContent || '').join('\n')
  const scripts = [...document.body.querySelectorAll('script')].map((script) => script.textContent || '')
  const fontLinks = [...document.head.querySelectorAll('link[href]')]
    .map((link) => link.getAttribute('href') || '')
    .filter((href) => href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com'))

  document.body.querySelectorAll('script').forEach((script) => script.remove())

  return {
    bodyMarkup: document.body.innerHTML,
    css,
    scripts: scripts.filter(Boolean),
    fontLinks,
  }
}
