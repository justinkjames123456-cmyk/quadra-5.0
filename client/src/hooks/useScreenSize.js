import { useState, useEffect } from 'react'

const breakpoints = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
}

export function useScreenSize() {
  const [size, setSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  })

  useEffect(() => {
    const mqs = {
      mobile:  window.matchMedia(breakpoints.mobile),
      tablet:  window.matchMedia(breakpoints.tablet),
      desktop: window.matchMedia(breakpoints.desktop),
    }

    const update = () => setSize({
      isMobile:  mqs.mobile.matches,
      isTablet:  mqs.tablet.matches,
      isDesktop: mqs.desktop.matches,
      width: window.innerWidth,
    })

    Object.values(mqs).forEach(mq => mq.addEventListener('change', update))
    update()
    return () => Object.values(mqs).forEach(mq => mq.removeEventListener('change', update))
  }, [])

  return size
}
