import { useEffect, useState } from 'react'
import { snFromLocation } from '../config'
import {
  aboutPageUrlForSn,
  fetchMagnetExperience,
  type MagnetExperience,
} from '../../shared/magnetExperience'

export function AboutFridgeChannelView({
  active,
  experience,
}: {
  active: boolean
  experience: MagnetExperience | null
}) {
  const sn = snFromLocation()
  const [resolvedExperience, setResolvedExperience] = useState<MagnetExperience>(experience || 'dtc')

  useEffect(() => {
    if (experience) {
      setResolvedExperience(experience)
      return
    }
    let cancelled = false
    void fetchMagnetExperience(sn).then((next) => {
      if (!cancelled) setResolvedExperience(next)
    })
    return () => {
      cancelled = true
    }
  }, [experience, sn])

  const src = aboutPageUrlForSn(resolvedExperience, sn)
  const isAsinAbout = resolvedExperience === 'asin_plus'

  return (
    <main className={`about-fridgechannel-view${isAsinAbout ? ' is-asin-about' : ''}${active ? '' : ' is-preserved-hidden'}`} aria-hidden={!active}>
      <iframe
        src={src}
        title={isAsinAbout ? 'FC ASIN+' : 'About FridgeChannel'}
        loading="eager"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
      />
    </main>
  )
}
