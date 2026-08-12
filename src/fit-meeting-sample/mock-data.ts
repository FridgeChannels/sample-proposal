import type { FitMeetingSampleContent } from './types'

// Using mockData; dev team will replace with real API hook useFetchFitMeetingSample().
export const fitMeetingSampleContent: FitMeetingSampleContent = {
  purpose: {
    eyebrow: 'FIRST CONVERSATION · 15–20 MINUTES',
    title: 'Could FC Add a New Retention Channel for Your Brand?',
    subtitle: 'A fit conversation—not a product pitch or Pilot commitment.',
    agenda: [
      'Understand what FC is',
      'See how FC may support retention',
      'Confirm four business-fit questions',
      'Decide Fit, Follow-up or No-fit',
      'Choose whether to receive a working Sample',
    ],
    flow: ['Understand FC', 'Confirm Fit', 'Experience the Sample'],
    footer: ['No clear fit? We stop here.', 'Clear fit? The next step is simply to experience the Sample.'],
  },
  fitSignalQuestions: [
    'Is your product used or replenished frequently enough for an in-home reminder to matter?',
    'Is improving repeat purchase, replenishment or subscription performance a current priority?',
    'Could a persistent household touchpoint add something your current Email, SMS or Loyalty programs cannot?',
  ],
  values: {
    eyebrow: 'WHAT FC MAY ADD',
    title: 'How FC Creates Value for Your Brand?',
    items: [
      {
        id: 'exposure',
        index: '01',
        title: 'Generate 3,600+ brand exposure opportunities per year',
      },
      {
        id: 'signals',
        index: '02',
        title:
          'Capture household usage signals, including consumption progress, inventory status, replenishment intent, product preferences, and more',
      },
      {
        id: 'conversion',
        index: '03',
        title: 'Turn purchase intent into a completed order in under 10 seconds',
      },
      {
        id: 'marginal-cost',
        index: '04',
        title: 'Reduce the marginal cost of additional customer touchpoints to nearly zero',
      },
    ],
  },
  closingPrompt: 'Want to try it?',
  qualification: {
    eyebrow: 'BUSINESS FIT · FOUR QUESTIONS',
    title: 'Could FC Work in Your Business?',
    subtitle: 'We only need four answers to confirm customer, ownership and operational fit.',
    questions: [
      {
        id: 'dtc-scale',
        index: '01',
        title: 'DTC Scale',
        question: 'Approximately how many orders do you ship each month through your owned DTC channels?',
        prompts: [
          'More than 1,000 owned-DTC orders per month?',
          'More than 1,000 active subscription customers?',
          'How much is owned DTC versus Amazon or retail?',
        ],
        captureFields: ['Owned-DTC monthly orders', 'Active subscriptions', 'Primary DTC channel'],
        fitSignal: 'Fit when owned-DTC orders or active subscriptions exceed 1,000. Amazon FBA does not count as owned DTC.',
      },
      {
        id: 'retention-setup',
        index: '02',
        title: 'Retention Setup',
        question: 'Who owns retention, lifecycle or CRM—and what programs are currently in place?',
        prompts: [
          'What is running across Email, SMS, Loyalty or Subscription?',
          'Which KPI matters most right now?',
          'Second order, replenishment, churn, win-back or another outcome?',
        ],
        captureFields: ['Retention owner', 'Current programs', 'Primary KPI', 'Current challenge'],
        fitSignal: 'Fit requires a relevant retention priority and a clear owner or team.',
      },
      {
        id: 'owner-access',
        index: '03',
        title: 'Owner Access',
        question: 'Are you responsible for this KPI, or should someone else be involved?',
        prompts: [
          'If not, would you introduce the retention, lifecycle or CRM owner?',
          'May FC contact that owner directly?',
        ],
        captureFields: ['Current attendee', 'Retention owner', 'Introduction required', 'Next contact'],
        fitSignal: 'Fit when the owner is present, an introduction is committed, or direct contact is approved.',
      },
      {
        id: 'operational-fit',
        index: '04',
        title: 'Operational Feasibility',
        question: 'How are DTC orders fulfilled, and could a Magnet be added to selected shipments?',
        prompts: [
          'In-house warehouse, 3PL or Amazon FBA?',
          'Can you select a specific SKU, cohort or order type?',
          'Can a lightweight Magnet be added during pick-and-pack?',
        ],
        captureFields: ['Fulfillment model', 'Warehouse / 3PL', 'Insert capability', 'Known constraints'],
        fitSignal: 'In-house or insert-capable 3PL may fit. Amazon FBA-only fulfillment does not.',
      },
    ],
  },
  decision: {
    eyebrow: 'DECISION · NO PRESSURE',
    title: 'Is There Enough Fit to Experience the Sample?',
    subtitle: 'Choose the next step that matches what we confirmed together.',
    options: [
      {
        id: 'fit',
        eyebrow: 'FIT',
        title: 'Send the Sample',
        description: 'The business, owner and fulfillment conditions are clear enough to experience FC.',
        conditions: ['DTC scale confirmed', 'Retention priority identified', 'Owner path confirmed', 'Insert path appears feasible'],
        action: 'Yes — send the Sample',
      },
      {
        id: 'follow-up',
        eyebrow: 'POTENTIAL FIT',
        title: 'Confirm One Missing Item',
        description: 'There may be a fit, but one specific answer or owner is still needed.',
        conditions: ['Name the missing information', 'Assign one responsible person', 'Agree one completion date'],
        action: 'Confirm one item first',
      },
      {
        id: 'no-fit',
        eyebrow: 'NO-FIT',
        title: 'Stop Here',
        description: 'FC is not relevant or operationally feasible right now.',
        conditions: ['Scale below threshold', 'No viable owner path', 'Fulfillment cannot support an insert', 'No relevant retention priority'],
        action: 'No-fit — stop progression',
      },
    ],
    sampleFields: ['Sample recipient', 'Company', 'Shipping address', 'City / State / ZIP', 'Country', 'Phone number'],
    reassurance: [
      'A working Sample Magnet helps you evaluate the physical and digital experience.',
      'Receiving the Sample does not commit you to a Pilot, purchase or another meeting.',
      'If it does not feel relevant after you experience it, we stop there.',
    ],
  },
}
