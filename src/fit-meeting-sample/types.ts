export interface MeetingPurposeContent {
  eyebrow: string
  title: string
  subtitle: string
  agenda: string[]
  flow: string[]
  footer: string[]
}

export interface QualificationQuestion {
  id: string
  index: string
  title: string
  question: string
  prompts: string[]
  captureFields: string[]
  fitSignal: string
}

export interface FitDecisionOption {
  id: 'fit' | 'follow-up' | 'no-fit'
  eyebrow: string
  title: string
  description: string
  conditions: string[]
  action: string
}

export interface RetentionValue {
  id: string
  index: string
  title: string
}

export interface FitMeetingSampleContent {
  purpose: MeetingPurposeContent
  fitSignalQuestions: string[]
  values: {
    eyebrow: string
    title: string
    items: RetentionValue[]
  }
  closingPrompt: string
  qualification: {
    eyebrow: string
    title: string
    subtitle: string
    questions: QualificationQuestion[]
  }
  decision: {
    eyebrow: string
    title: string
    subtitle: string
    options: FitDecisionOption[]
    sampleFields: string[]
    reassurance: string[]
  }
}
