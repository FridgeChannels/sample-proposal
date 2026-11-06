import { useState } from 'react'
import { liveDemoUrlForSn, LIVE_DEMO_URL, snFromLocation } from '../config'
import { BottomNavBar } from '../../components/ui/bottom-nav-bar'
import { FloatingContactButton } from '../../shared/FloatingContactButton'

/**
 * Live demo iframe: same /p/{sn} shape as the customer sample URL,
 * with SN taken from the current path (or ?sn=) instead of a hardcoded value.
 */
export function LiveDemoView({
  active,
  aboutUrl,
}: {
  active: boolean
  aboutUrl: string
}) {
  const sn = snFromLocation()
  const src = sn ? liveDemoUrlForSn(sn) : LIVE_DEMO_URL
  const [currentTab, setCurrentTab] = useState<'live' | 'about' | 'contact'>('live')
  const [aboutMounted, setAboutMounted] = useState(false)

  const openAbout = () => {
    setAboutMounted(true)
    setCurrentTab('about')
  }

  return (
    <main className={`live-demo-view has-flow-cta${currentTab === 'about' ? ' is-about-site' : ''}${active ? '' : ' is-preserved-hidden'}`} aria-hidden={!active}>
      <iframe
        className={currentTab !== 'live' ? 'is-inactive' : undefined}
        src={src}
        title="FridgeChannel live demo"
        loading="eager"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
        aria-hidden={currentTab !== 'live'}
        tabIndex={currentTab !== 'live' ? -1 : undefined}
      />
      {aboutMounted && (
        <iframe
          className={currentTab !== 'about' ? 'is-inactive' : undefined}
          src={aboutUrl}
          title="About Hommio"
          loading="eager"
          allow="clipboard-read; clipboard-write; fullscreen"
          allowFullScreen
          aria-hidden={currentTab !== 'about'}
          tabIndex={currentTab !== 'about' ? -1 : undefined}
        />
      )}
      {currentTab === 'contact' && (
        <section className="contact-hommio-view" aria-label="Contact Hommio">
          <FloatingContactButton placement="page" />
        </section>
      )}
      <div className="flow-cta-bar">
        <BottomNavBar
          activeView={currentTab}
          onLive={() => setCurrentTab('live')}
          onAbout={openAbout}
          onContact={() => setCurrentTab('contact')}
        />
      </div>
    </main>
  )
}
