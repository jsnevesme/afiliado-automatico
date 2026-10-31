import React from 'react'
import { motion } from 'motion/react'

export function TimelineContent({
  as = 'div',
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}) {
  const Component = motion[as] || motion.div

  // Animação otimizada para máximo desempenho (GPU-accelerated, sem blur pesado)
  const defaultVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: (i || 0) * 0.06,
        duration: 0.4,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    }),
    hidden: {
      y: 14,
      opacity: 0,
    },
  }

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={customVariants || defaultVariants}
      custom={animationNum}
      className={className}
      {...props}
    >
      {children}
    </Component>
  )
}

export default TimelineContent
