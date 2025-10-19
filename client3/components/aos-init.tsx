'use client'

import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

export function AOSInit() {
  useEffect(() => {
    AOS.init({
      duration: 800, // Animation duration in milliseconds
      once: false,   // Whether animation should happen only once
      offset: 120,   // Offset (in px) from the original trigger point
      delay: 0,      // Values from 0 to 3000, with step 50ms
      easing: 'ease-in-out', // Default easing for AOS animations
    })
  }, [])

  return null // This component doesn't render anything
}