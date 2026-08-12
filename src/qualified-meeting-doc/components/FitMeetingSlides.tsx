import type {
  FitDecision,
  FitMetric,
  FitQuestion,
  FitValueCard,
  QualifiedMeetingContent,
} from '../types'

interface SlideShellProps {
  number: string
  label: string
  title: string
  children: React.ReactNode
  className?: string
}

const SlideShell: React.FC<SlideShellProps> = ({ number, label, title, children, className = '' }) => (
  <section className={`fit-slide ${className}`} id={`slide-${number}`} aria-labelledby={`slide-${number}-title`}>
    <div className="fit-slide__inner">
      <header className="fit-slide__header">
        <p className="fit-kicker">
          <span>{number.padStart(2, '0')}</span> / {label}
        </p>
        <h2 id={`slide-${number}-title`}>{title}</h2>
      </header>
      {children}
      <p className="fit-page-number">FC / {number.padStart(2, '0')}</p>
    </div>
  </section>
)

interface PurposeSlideProps {
  content: QualifiedMeetingContent['purpose']
  meeting: QualifiedMeetingContent['meeting']
}

export const PurposeSlide: React.FC<PurposeSlideProps> = ({ content, meeting }) => (
  <SlideShell number="1" label="MEETING PURPOSE" title={content.title} className="fit-slide--purpose">
    <div className="purpose-layout">
      <div className="purpose-copy">
        <p className="fit-subtitle">{content.subtitle}</p>
        <p className="purpose-statement">{content.body}</p>
        <ol className="agenda-list">
          {content.agenda.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item}
            </li>
          ))}
        </ol>
      </div>
      <aside className="purpose-rail" aria-label="Meeting progression">
        <div className="meeting-meta">
          <span>{meeting.duration}</span>
          <span>{meeting.stage}</span>
        </div>
        <div className="purpose-flow">
          {content.flow.map((step, index) => (
            <div className="purpose-flow__step" key={step}>
              <strong>{step}</strong>
              {index < content.flow.length - 1 && <span aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
      </aside>
    </div>
    <div className="fit-footer-statement">
      {content.footer.map((line) => (
        <strong key={line}>{line}</strong>
      ))}
    </div>
  </SlideShell>
)

interface DefinitionSlideProps {
  content: QualifiedMeetingContent['definition']
}

export const DefinitionSlide: React.FC<DefinitionSlideProps> = ({ content }) => (
  <SlideShell number="2" label="WHAT FC IS" title={content.title}>
    <p className="definition-statement">{content.statement}</p>
    <div className="definition-layout">
      <div className="definition-visual">
        <img src="/pics/dtc-cmo-pics/dtctap.png" alt="Customer tapping an FC Magnet attached to a refrigerator" />
        <span>PHYSICAL ENTRY POINT</span>
      </div>
      <div className="definition-flow" aria-label="FridgeChannels customer journey">
        {content.flow.map((step, index) => (
          <div className="definition-flow__step" key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
    </div>
    <div className="definition-notes">
      <div>
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <ul>
        {content.exclusions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  </SlideShell>
)

const ValueCard: React.FC<{ card: FitValueCard }> = ({ card }) => (
  <article className="value-card">
    <p className="fit-card-kicker">{card.eyebrow}</p>
    <h3>{card.title}</h3>
    <p>{card.description}</p>
    {card.highlight && <strong className="value-card__highlight">{card.highlight}</strong>}
    {card.items && (
      <ul>
        {card.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )}
    {card.note && <small>{card.note}</small>}
  </article>
)

interface ValueSlideProps {
  content: QualifiedMeetingContent['values']
}

export const ValueSlide: React.FC<ValueSlideProps> = ({ content }) => (
  <SlideShell number="3" label="VALUE" title={content.title}>
    <div className="value-grid">
      {content.cards.map((card) => (
        <ValueCard key={card.id} card={card} />
      ))}
    </div>
  </SlideShell>
)

const MetricCard: React.FC<{ metric: FitMetric }> = ({ metric }) => (
  <article className="metric-card">
    <div className="metric-card__top">
      <span>{metric.index}</span>
      <h3>{metric.title}</h3>
    </div>
    <p className="metric-question">{metric.question}</p>
    <div className="metric-block">
      <strong>WHAT IT PROVES</strong>
      <ul>
        {metric.proves.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
    {metric.examples && (
      <div className="metric-tags">
        {metric.examples.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    )}
    {metric.windows && (
      <div className="window-row" aria-label="Primary window options">
        {metric.windows.map((window) => (
          <strong key={window}>{window}</strong>
        ))}
      </div>
    )}
    {metric.fallbackPath && (
      <div className="fallback-path">
        {metric.fallbackPath.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    )}
    {metric.note && <small>{metric.note}</small>}
  </article>
)

interface OutcomesSlideProps {
  content: QualifiedMeetingContent['outcomes']
}

export const OutcomesSlide: React.FC<OutcomesSlideProps> = ({ content }) => (
  <SlideShell number="4" label="WHAT FC CAN HELP TEST" title={content.title}>
    <p className="fit-intro">{content.intro}</p>
    <div className="metric-grid">
      {content.metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
    <div className="priority-strip">
      <strong>{content.question}</strong>
      <div>
        {content.priorities.map((priority) => (
          <span key={priority}>{priority}</span>
        ))}
      </div>
    </div>
  </SlideShell>
)

const FitQuestionCard: React.FC<{ question: FitQuestion }> = ({ question }) => (
  <article className="fit-question-card">
    <div className="fit-question-card__heading">
      <span>{question.index}</span>
      <div>
        <p>{question.title}</p>
        <h3>{question.question}</h3>
      </div>
    </div>
    <div className="fit-question-card__columns">
      <div>
        <strong>ASK</strong>
        <ul>
          {question.prompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </div>
      <div>
        <strong>CAPTURE</strong>
        <div className="field-list">
          {question.fields.map((field) => (
            <span key={field}>{field}:</span>
          ))}
        </div>
      </div>
      <div>
        <strong>FIT SIGNAL</strong>
        <ul>
          {question.decision.map((decision) => (
            <li key={decision}>{decision}</li>
          ))}
        </ul>
      </div>
    </div>
  </article>
)

interface FitQuestionsSlideProps {
  content: QualifiedMeetingContent['fit']
}

export const FitQuestionsSlide: React.FC<FitQuestionsSlideProps> = ({ content }) => (
  <SlideShell number="5" label="BUSINESS FIT" title={content.title} className="fit-slide--dense">
    <p className="fit-subtitle">{content.subtitle}</p>
    <div className="fit-question-grid">
      {content.questions.map((question) => (
        <FitQuestionCard key={question.id} question={question} />
      ))}
    </div>
  </SlideShell>
)

interface SampleSlideProps {
  content: QualifiedMeetingContent['sample']
}

export const SampleSlide: React.FC<SampleSlideProps> = ({ content }) => (
  <SlideShell number="6" label="WHY EXPERIENCE THE SAMPLE" title={content.title}>
    <div className="sample-layout">
      <div className="sample-object">
        <img src="/pics/DIsplayProcessPics/front_back.png" alt="Front and back views of a working FC Sample Magnet" />
        <div className="sample-object__label">
          <span>WHAT THE SAMPLE IS</span>
          <strong>{content.is}</strong>
        </div>
      </div>
      <div className="sample-content">
        <div className="sample-lead">
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="sample-columns">
          <div>
            <p className="fit-card-kicker">WHAT YOU CAN DO</p>
            <ul className="action-list">
              {content.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="fit-card-kicker">WHAT YOU CAN EVALUATE</p>
            <div className="evaluation-list">
              {content.evaluations.map((evaluation) => (
                <div key={evaluation.id}>
                  <span>{evaluation.eyebrow}</span>
                  <strong>{evaluation.title}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="not-strip">
          {content.isNot.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
    <div className="fit-footer-statement">
      {content.footer.map((line) => (
        <strong key={line}>{line}</strong>
      ))}
    </div>
  </SlideShell>
)

const DecisionCard: React.FC<{ decision: FitDecision }> = ({ decision }) => (
  <article className={`decision-card decision-card--${decision.id}`}>
    <p>{decision.label}</p>
    <h3>{decision.title}</h3>
    <ul>
      {decision.conditions.map((condition) => (
        <li key={condition}>{condition}</li>
      ))}
    </ul>
    {decision.fields && (
      <div className="decision-fields">
        {decision.fields.map((field) => (
          <span key={field}>{field}:</span>
        ))}
      </div>
    )}
  </article>
)

interface DecisionSlideProps {
  content: QualifiedMeetingContent['decision']
}

export const DecisionSlide: React.FC<DecisionSlideProps> = ({ content }) => (
  <SlideShell number="7" label="DECISION & NEXT STEP" title={content.title} className="fit-slide--decision">
    <div className="decision-grid">
      {content.options.map((decision) => (
        <DecisionCard key={decision.id} decision={decision} />
      ))}
    </div>
    <div className="capture-grid">
      <div className="capture-panel">
        <p className="fit-card-kicker">FIT SUMMARY</p>
        <div className="capture-fields capture-fields--summary">
          {content.summaryFields.map((field) => (
            <span key={field}>{field}</span>
          ))}
        </div>
      </div>
      <div className="capture-panel">
        <p className="fit-card-kicker">SAMPLE INFORMATION</p>
        <div className="capture-fields">
          {content.sampleFields.map((field) => (
            <span key={field}>{field}</span>
          ))}
        </div>
      </div>
    </div>
    <div className="decision-close">
      {content.close.map((paragraph, index) =>
        index === content.close.length - 1 ? <strong key={paragraph}>{paragraph}</strong> : <p key={paragraph}>{paragraph}</p>,
      )}
    </div>
  </SlideShell>
)
