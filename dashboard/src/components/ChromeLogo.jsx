import React from 'react'

export default function ChromeLogo({ className = 'h-5 w-5', size }) {
  const style = size ? { width: size, height: size } : undefined
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <linearGradient id="chrome-grad-red" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d93025" />
          <stop offset="1" stopColor="#ea4335" />
        </linearGradient>
        <linearGradient id="chrome-grad-yellow" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fcc934" />
          <stop offset="1" stopColor="#fbbc04" />
        </linearGradient>
        <linearGradient id="chrome-grad-green" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1e8e3e" />
          <stop offset="1" stopColor="#34a853" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="23.9947" r="12" fill="#ffffff" />
      <path
        d="M24 12H44.7812a23.9939 23.9939 0 0 0-41.5639.0029L13.6079 30l.0093-.0024A11.9852 11.9852 0 0 1 24 12Z"
        fill="url(#chrome-grad-red)"
      />
      <circle cx="24" cy="24" r="9.5" fill="#1a73e8" />
      <path
        d="M34.3913 30.0029 24.0007 48A23.994 23.994 0 0 0 44.78 12.0031H23.9989l-.0025.0093A11.985 11.985 0 0 1 34.3913 30.0029Z"
        fill="url(#chrome-grad-yellow)"
      />
      <path
        d="M13.6086 30.0031 3.218 12.006A23.994 23.994 0 0 0 24.0025 48L34.3931 30.0029l-.0067-.0068a11.9852 11.9852 0 0 1-10.776 6.6715 11.9853 11.9853 0 0 1-9.9939-5.3854Z"
        fill="url(#chrome-grad-green)"
      />
    </svg>
  )
}
