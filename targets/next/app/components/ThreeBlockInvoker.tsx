"use client"

import dynamic from 'next/dynamic'

const ThreeBlock = dynamic(() => import('./ThreeBlock'), {
  ssr: false
})

export default function ThreeBlockInvoker() {
  return (
    <div>
      <ThreeBlock />
    </div>
  )
}
