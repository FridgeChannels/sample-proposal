import { extractGiftChallengeConfig } from '../template/gift-challenge-template'
import { fitMeetingSampleContent } from './mock-data'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function renderValueSectionContent(): string {
  const { values } = fitMeetingSampleContent
  const cards = values.items
    .map(
      (item) => `
        <article class="retention-value-card">
          <span>${escapeHtml(item.index)}</span>
          <h3>${escapeHtml(item.title)}</h3>
        </article>`,
    )
    .join('')

  return `
    <div class="wrap retention-value-layout reveal">
      <header class="retention-value-heading">
        <h2 id="comparison-title">${escapeHtml(values.title)}</h2>
      </header>
      <div class="retention-value-grid">${cards}</div>
    </div>`
}

function renderQualificationSection(): string {
  const { qualification } = fitMeetingSampleContent
  const questions = qualification.questions
    .map(
      (question) => `
        <article class="qualification-card">
          <header>
            <span>${escapeHtml(question.index)}</span>
            <div>
              <h3>${escapeHtml(question.question)}</h3>
            </div>
          </header>
        </article>`,
    )
    .join('')

  return `
    <section class="qualification-section" id="qualification" aria-labelledby="qualification-title">
      <div class="wrap reveal">
        <header class="qualification-heading">
          <h2 id="qualification-title">${escapeHtml(qualification.title)}</h2>
        </header>
        <div class="qualification-grid">${questions}</div>
      </div>
    </section>`
}

function renderClosingPromptSection(): string {
  return `
    <section class="closing-prompt-section demo-slide" id="closing-prompt" aria-labelledby="closing-prompt-title">
      <div class="wrap reveal">
        <h2 id="closing-prompt-title">${escapeHtml(fitMeetingSampleContent.closingPrompt)}</h2>
      </div>
    </section>`
}

export function createFitMeetingSampleConfig() {
  const template = extractGiftChallengeConfig()
  const document = new DOMParser().parseFromString(`<body>${template.bodyMarkup}</body>`, 'text/html')
  const main = document.querySelector('main')

  if (!main) {
    throw new Error('Sample template is missing its main element.')
  }

  main.querySelectorAll('#mission, .pilot-section, .footer-slide').forEach((section) => section.remove())

  const hero = main.querySelector('.hero')
  const heroTitle = hero?.querySelector('h1')
  const heroSubtitle = hero?.querySelector('.hero-sub')
  const heroBody = hero?.querySelector('.hero-body')
  const heroVideo = hero?.querySelector('video')
  if (heroTitle) heroTitle.innerHTML = '<span>Meet <em>Fridge Channel</em></span>'
  if (heroSubtitle) {
    heroSubtitle.textContent =
      'FC (Fridge Channel) is a company focused on helping DTC brands improve customer retention.'
  }
  if (heroBody) {
    heroBody.innerHTML = `
      <span class="hero-sequence hero-sequence--3">Through branded NFC fridge magnets and tap-activated Web Apps, FC creates persistent in-home customer touchpoints that drive repeat purchases, capture household usage signals, and strengthen long-term customer value.</span>`
  }
  heroVideo?.removeAttribute('autoplay')
  heroVideo?.setAttribute('preload', 'metadata')
  const heroSupportingCopy = hero?.querySelector('.hero-supporting-copy')
  if (hero && heroSupportingCopy) {
    const definitionSection = document.createElement('section')
    definitionSection.className = 'hero-definition-section demo-slide'
    definitionSection.id = 'fc-definition'
    definitionSection.setAttribute('aria-label', 'Fridge Channel retention definition')
    const definitionWrap = document.createElement('div')
    definitionWrap.className = 'wrap'
    definitionWrap.append(heroSupportingCopy)
    definitionSection.append(definitionWrap)
    hero.after(definitionSection)
  }

  const valueSection = main.querySelector('#moat')
  if (valueSection) {
    valueSection.className = 'retention-value-section'
    valueSection.setAttribute('aria-labelledby', 'comparison-title')
    valueSection.innerHTML = renderValueSectionContent()
    const retentionLoopSection = main.querySelector('#team')
    retentionLoopSection?.before(valueSection)
  }

  const retentionLoopTitle = main.querySelector('#retention-loop-title')
  if (retentionLoopTitle) retentionLoopTitle.textContent = 'How it works?'

  const qualificationTemplate = document.createElement('template')
  qualificationTemplate.innerHTML = renderQualificationSection()
  main.append(qualificationTemplate.content)

  const closingPromptTemplate = document.createElement('template')
  closingPromptTemplate.innerHTML = renderClosingPromptSection()
  main.append(closingPromptTemplate.content)

  return {
    ...template,
    bodyMarkup: document.body.innerHTML,
  }
}
