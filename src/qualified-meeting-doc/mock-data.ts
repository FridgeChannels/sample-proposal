import type { QualifiedMeetingContent } from './types'

// Using mockData; dev team will replace with real API hook useFetchQualifiedMeetingDoc().
export const qualifiedMeetingContent: QualifiedMeetingContent = {
  meeting: {
    name: 'FridgeChannels Fit Meeting',
    subtitle: 'Is FC Relevant to Your Retention Strategy?',
    duration: '15–20 MIN',
    stage: 'READY FOR OUTREACH → QUALIFIED & SAMPLE',
  },
  purpose: {
    title: 'Could FC Add a New Retention Channel for Your Brand?',
    subtitle: 'A 15-minute fit conversation—not a product pitch or Pilot commitment.',
    body: 'Today’s goal is to determine whether FridgeChannels is relevant to one of your current retention priorities.',
    agenda: [
      'What FC is',
      'What value FC may create',
      'What outcomes FC can help test',
      'Whether FC fits your DTC and fulfillment setup',
      'Whether it is worth experiencing a working Sample Magnet',
    ],
    flow: ['Understand FC', 'Confirm Fit', 'Experience the Sample'],
    footer: ['No clear fit? We stop here.', 'Clear fit? The next step is simply to experience the Sample.'],
  },
  definition: {
    title: 'A Measurable In-home Retention Channel for DTC Brands',
    statement:
      'FridgeChannels turns a physical Magnet delivered with a DTC order into a persistent, updateable and measurable retention channel inside the customer’s home.',
    flow: [
      'DTC Order',
      'FC Enters the Household',
      'Product-use or Replenishment Moment',
      'Customer TAP',
      'Content · Interaction · Personalized Perk',
      'Reorder · Renew · Review · Refer',
      'Measurable Customer Behavior',
    ],
    paragraphs: [
      'Unlike a traditional package insert, FC is designed to remain useful after unboxing.',
      'The physical Magnet stays in the home, while its digital experience can be updated with new content, interactions, rewards and calls to action.',
    ],
    exclusions: [
      'Not a traditional refrigerator magnet',
      'Not a one-time package insert',
      'Not a static coupon',
      'Not another paid-media placement',
    ],
  },
  values: {
    title: 'What FC May Add to Your Retention Stack',
    cards: [
      {
        id: 'presence',
        eyebrow: '01 · PERSISTENT HOUSEHOLD PRESENCE',
        title: 'Stay Present Beyond Unboxing',
        description: 'Create a persistent brand presence near product-use and replenishment moments.',
        highlight: 'Up to 3,600+ modeled in-home visibility opportunities per household per year',
        items: ['Approximately 10 refrigerator-area opportunities per day', '× 365 days'],
        note: 'Modeled visibility opportunities are not measured impressions, TAPs or purchases.',
      },
      {
        id: 'signals',
        eyebrow: '02 · HOUSEHOLD USAGE SIGNALS',
        title: 'Understand What Happens After Delivery',
        description:
          'Invite customers to voluntarily share signals that are difficult to observe after an order arrives.',
        items: ['Product usage progress', 'Inventory status', 'Replenishment intent', 'Product preference'],
        note: 'Understand who may need what action—and when.',
      },
      {
        id: 'reorder',
        eyebrow: '03 · LOWER-FRICTION REORDER PATH',
        title: 'Connect Intent to Action',
        description:
          'Use a TAP to connect a product-use or replenishment moment directly to the next customer action.',
        items: ['Reorder', 'Subscribe', 'Renew', 'Claim a perk', 'Review', 'Refer'],
        note:
          'FC is designed to shorten the path between customer intent and action. Actual order impact must be validated through a Pilot.',
      },
      {
        id: 'reusable',
        eyebrow: '04 · REUSABLE CUSTOMER TOUCHPOINT',
        title: 'Update Without Re-delivering',
        description:
          'Once FC is inside the household, its digital content can be refreshed without producing and delivering a new physical entry point.',
        items: [
          'Product education',
          'Replenishment',
          'Missions',
          'Personalized perks',
          'Seasonal campaigns',
          'Review and referral',
        ],
        note: 'One physical deployment can support multiple future customer interactions.',
      },
    ],
  },
  outcomes: {
    title: 'What Business Outcomes Can FC Help Test?',
    intro:
      'FC does not assume that household presence automatically creates retention. A Pilot tests whether the mechanism produces measurable customer behavior and business results.',
    metrics: [
      {
        id: 'repeat-engagement',
        index: '01',
        title: '30-Day Repeat Engaged Household Rate',
        question:
          'Of all households that received FC, how many completed meaningful interactions on at least two different days within 30 days?',
        proves: ['FC was retained', 'Customers chose to return', 'FC became a reusable household entry point'],
        examples: ['Submit a usage or inventory signal', 'Complete a mission', 'Claim a perk', 'Click a CTA'],
        note: 'Opening or refreshing the page alone does not count as a meaningful interaction.',
      },
      {
        id: 'zero-party',
        index: '02',
        title: 'Zero-Party Data Capture Rate',
        question:
          'Of the households shown a relevant interaction, how many voluntarily provided a usage, inventory, replenishment or preference signal?',
        proves: [
          'Customers will share household usage information',
          'The brand can identify replenishment intent',
          'Future content can become more relevant',
        ],
      },
      {
        id: 'second-order',
        index: '03',
        title: 'First-to-Second Order Conversion',
        question:
          'Of the eligible first-time customers who received FC, how many completed a second order within the agreed Primary Window?',
        proves: ['How many first-time customers reorder', 'How quickly they reorder', 'Second-order revenue per FC'],
        windows: ['45 Days', '60 Days', '90 Days'],
        fallbackPath: [
          'Complete order data → First-to-Second Order Conversion',
          'No complete order data → Coupon Redemption Rate',
          'No order or redemption data → Coupon Claim Rate / Reorder CTA Click-Through Rate',
        ],
        note: 'A claim or click cannot be presented as a completed purchase.',
      },
    ],
    question: 'Which outcome is most relevant to your current retention priorities?',
    priorities: [
      'Repeat household engagement',
      'Household usage signals',
      'First-to-second order conversion',
      'Replenishment',
      'Subscription renewal',
      'Another retention priority',
    ],
  },
  fit: {
    title: 'Could FC Work in Your Business?',
    subtitle: 'Four questions to confirm customer, ownership and operational fit.',
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
        fields: ['Owned-DTC monthly orders', 'Active subscription customers', 'Primary DTC channel'],
        decision: [
          'Fit: owned-DTC monthly orders > 1,000',
          'Or: active subscription customers > 1,000',
          'Amazon FBA orders do not count as owned DTC.',
        ],
      },
      {
        id: 'retention-setup',
        index: '02',
        title: 'Retention Setup',
        question: 'Who owns retention, lifecycle or CRM—and what programs are currently in place?',
        prompts: [
          'Who owns repeat purchase or subscription performance?',
          'What is running across Email, SMS, Loyalty or Subscription?',
          'Is the priority second order, replenishment, churn, win-back or another outcome?',
        ],
        fields: ['Retention owner', 'Current programs', 'Primary KPI', 'Current challenge'],
        decision: ['Confirm a clear owner, current retention motion and a priority KPI.'],
      },
      {
        id: 'owner-access',
        index: '03',
        title: 'Owner Access',
        question: 'Are you the person responsible for this KPI, or should someone else be involved?',
        prompts: [
          'If not: would you introduce us to the person who owns retention, lifecycle or CRM?',
        ],
        fields: ['Current attendee', 'Retention owner', 'Introduction required', 'Next contact'],
        decision: [
          'Current attendee is the owner',
          'Or they commit to an introduction',
          'Or FC may contact the owner directly',
        ],
      },
      {
        id: 'operations',
        index: '04',
        title: 'Operational Feasibility',
        question: 'How are your DTC orders fulfilled, and could a Magnet be added to selected shipments?',
        prompts: [
          'In-house warehouse, 3PL or Amazon FBA?',
          'Can you select a specific SKU, cohort or order type?',
          'Can a lightweight Magnet be added during pick-and-pack?',
          'Any packaging, compliance or 3PL constraints?',
        ],
        fields: ['Fulfillment model', 'Warehouse / 3PL', 'Insert capability', 'Target SKU or cohort', 'Known constraints'],
        decision: [
          'In-house → potentially feasible',
          '3PL → confirm insert capability',
          'FBA + controlled DTC → use controlled DTC orders',
          'Amazon FBA only → evaluate as disqualified',
        ],
      },
    ],
  },
  sample: {
    title: 'Why the Next Step Is a Physical Sample',
    paragraphs: [
      'FC is a physical-plus-digital customer experience. It is difficult to evaluate from slides alone.',
      'The Sample lets you experience what a customer would physically receive, see and do.',
    ],
    actions: [
      'Hold and evaluate the physical Magnet',
      'Place it in a real household environment',
      'TAP it with a phone',
      'Experience the digital content and interaction',
      'Share it with Retention, Brand, E-commerce and Operations teams',
    ],
    evaluations: [
      {
        id: 'physical',
        eyebrow: 'PHYSICAL RELEVANCE',
        title: 'Would a customer keep and use it?',
        description: '',
      },
      {
        id: 'brand',
        eyebrow: 'BRAND EXPERIENCE',
        title: 'Does the physical format meet your brand expectations?',
        description: '',
      },
      {
        id: 'simplicity',
        eyebrow: 'INTERACTION SIMPLICITY',
        title: 'Is the TAP experience easy enough for customers?',
        description: '',
      },
      {
        id: 'lasting-value',
        eyebrow: 'POST-UNBOXING VALUE',
        title: 'Does it offer more lasting value than a package insert?',
        description: '',
      },
      {
        id: 'internal',
        eyebrow: 'INTERNAL RELEVANCE',
        title: 'Is it worth exploring a brand-specific Live Demo or Pilot?',
        description: '',
      },
    ],
    is: 'A working FC Sample Magnet with Sample Content',
    isNot: ['Not a brand-specific Live Demo', 'Not a Final Sample', 'Not a Pilot commitment', 'Not a purchase commitment'],
    footer: [
      'Receiving the Sample does not commit you to a Pilot, purchase or another meeting.',
      'If it does not feel relevant after you experience it, we stop there.',
    ],
  },
  decision: {
    title: 'Is There Enough Fit to Experience the Sample?',
    options: [
      {
        id: 'fit',
        label: 'FIT',
        title: 'Send the Sample',
        conditions: [
          'DTC Scale confirmed',
          'Retention Setup confirmed',
          'Owner Access confirmed',
          'Operational feasibility confirmed',
          'Relevant retention opportunity identified',
          'Customer wants to experience the Sample',
        ],
      },
      {
        id: 'follow-up',
        label: 'POTENTIAL FIT',
        title: 'Confirm One Missing Item',
        conditions: [
          'Potential fit exists',
          'One required item remains unconfirmed',
          'A specific owner and completion date can be assigned',
        ],
        fields: ['Missing information', 'Responsible person', 'Required action', 'Target date'],
      },
      {
        id: 'no-fit',
        label: 'NO-FIT',
        title: 'Stop Progression',
        conditions: [
          'Owned-DTC scale below threshold',
          'No viable retention owner path',
          'Fulfillment cannot support the Magnet',
          'Amazon FBA is the only fulfillment channel',
          'No relevant retention priority',
          'Customer confirms FC is not relevant',
        ],
      },
    ],
    summaryFields: [
      'Target segment',
      'Retention problem',
      'Primary KPI',
      'Retention owner',
      'Relevant time window',
      'Initial FC use case',
    ],
    sampleFields: [
      'Sample recipient',
      'Company',
      'Shipping address',
      'City',
      'State',
      'ZIP code',
      'Country',
      'Phone number',
      'Sample quantity',
      'Expected shipping date',
    ],
    close: [
      'Based on what you’ve shared, FC may be relevant to your [TARGET SEGMENT], particularly around [RETENTION PROBLEM / KPI].',
      'Rather than asking you to evaluate it from slides, we’d like to send you a working Sample Magnet. You can TAP it, share it internally and decide whether the experience is relevant to your customers.',
      'There is no commitment to a Pilot or purchase. Would you be open to receiving one?',
    ],
  },
}
