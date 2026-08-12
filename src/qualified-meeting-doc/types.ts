export interface FitValueCard {
  id: string
  eyebrow: string
  title: string
  description: string
  highlight?: string
  items?: string[]
  note?: string
}

export interface FitMetric {
  id: string
  index: string
  title: string
  question: string
  proves: string[]
  examples?: string[]
  windows?: string[]
  fallbackPath?: string[]
  note?: string
}

export interface FitQuestion {
  id: string
  index: string
  title: string
  question: string
  prompts: string[]
  fields: string[]
  decision: string[]
}

export interface FitDecision {
  id: string
  label: string
  title: string
  conditions: string[]
  fields?: string[]
}

export interface QualifiedMeetingContent {
  meeting: {
    name: string
    subtitle: string
    duration: string
    stage: string
  }
  purpose: {
    title: string
    subtitle: string
    body: string
    agenda: string[]
    flow: string[]
    footer: string[]
  }
  definition: {
    title: string
    statement: string
    flow: string[]
    paragraphs: string[]
    exclusions: string[]
  }
  values: {
    title: string
    cards: FitValueCard[]
  }
  outcomes: {
    title: string
    intro: string
    metrics: FitMetric[]
    question: string
    priorities: string[]
  }
  fit: {
    title: string
    subtitle: string
    questions: FitQuestion[]
  }
  sample: {
    title: string
    paragraphs: string[]
    actions: string[]
    evaluations: FitValueCard[]
    is: string
    isNot: string[]
    footer: string[]
  }
  decision: {
    title: string
    options: FitDecision[]
    summaryFields: string[]
    sampleFields: string[]
    close: string[]
  }
}
