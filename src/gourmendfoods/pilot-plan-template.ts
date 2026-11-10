import pilotPlanDocument from './gift-challenge.html?raw'

type TemplateConfig = {
  bodyMarkup: string
  css: string
  scripts: string[]
  fontLinks: string[]
}

export function extractPilotPlanConfig(source = pilotPlanDocument): TemplateConfig {
  const document = new DOMParser().parseFromString(source, 'text/html')
  const css = [...document.querySelectorAll('style')].map((style) => style.textContent || '').join('\n')
  const scripts = [...document.body.querySelectorAll('script')].map((script) => script.textContent || '')
  const fontLinks = [...document.head.querySelectorAll('link[href]')]
    .map((link) => link.getAttribute('href') || '')
    .filter((href) => href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com'))

  document.body.querySelectorAll('script').forEach((script) => script.remove())

  document.querySelectorAll<HTMLAnchorElement>('#contents .presentation-outline a[href^="#"]').forEach((link) => {
    const number = link.querySelector('.presentation-outline-number')?.textContent?.trim()
    const slide = document.getElementById(link.hash.slice(1))
    if (!number || !slide?.matches('.hommio-deck > section')) return

    const label = slide.querySelector(':scope > .slide-topline > span, .presentation-chapter-label')
    if (label) {
      label.prepend(`${number} · `)
      return
    }

    const heading = document.getElementById(slide.getAttribute('aria-labelledby') ?? '')
    if (!heading) return

    const marker = document.createElement('span')
    marker.className = 'slide-contents-number'
    marker.textContent = number
    heading.prepend(marker)
  })

  // Keep scroll targets at viewport size; only their contents are scaled.
  document.querySelectorAll('.hommio-deck > section').forEach((slide) => {
    const content = document.createElement('div')
    content.className = 'desktop-slide-content'
    content.append(...slide.childNodes)
    slide.append(content)
  })

  return {
    bodyMarkup: document.body.innerHTML,
    css,
    scripts: scripts.filter(Boolean),
    fontLinks,
  }
}
