export interface ScrollRevealContentItem {
  title: string
  description: string
}

interface ScrollRevealContentProps {
  id: string
  heading: string
  items: ScrollRevealContentItem[]
  closingNote?: string
  className?: string
}

function StepList({ items, startIndex }: { items: ScrollRevealContentItem[]; startIndex: number }) {
  return (
    <ol className="story-process__list" aria-label="Process steps">
      {items.map(({ title, description }, index) => (
        <li className="story-process__step" key={title}>
          <span className="story-process__number" aria-hidden="true">{`STEP ${String(startIndex + index + 1).padStart(2, '0')}`}</span>
          <span className="story-process__rail" aria-hidden="true" />
          <div className="story-process__copy">
            <h3 className="story-process__step-heading">{title}</h3>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function ScrollRevealContent({ id, heading, items, closingNote, className = '' }: ScrollRevealContentProps) {
  const firstPageItems = items.slice(0, 2)
  const finalPageItems = items.slice(2)

  return (
    <>
      <article id={id} className={`story-screen story-screen--steps story-screen--steps-first ${className}`}>
        <div className="story-process__content">
          <h2 className="story-heading story-process__eyebrow">How FC Works</h2>
          <h2 className="story-process__heading">{heading}</h2>
          <StepList items={firstPageItems} startIndex={0} />
        </div>
      </article>
      <article className={`story-screen story-screen--steps story-screen--steps-final ${className}`} aria-label="How FC works, final step">
        <div className="story-process__content story-process__content--final">
          <h2 className="story-heading story-process__eyebrow">How FC Works</h2>
          <StepList items={finalPageItems} startIndex={2} />
          {closingNote && <p className="story-process__closing-note">{closingNote}</p>}
        </div>
      </article>
    </>
  )
}

export default ScrollRevealContent
