'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'
import { BootLoader } from './BootLoader'

type TileWaveSkeletonProps = {
  className?: string
  height?: number
}

const TILE = 8
const GAP = 3
const PADDING = 3
const TILE_STEP = TILE + GAP

function tilesInSpan(span: number) {
  const available = span - PADDING * 2
  return Math.max(1, Math.floor((available + GAP) / TILE_STEP))
}

export function TileWaveSkeleton({
  className,
  height = 56,
}: TileWaveSkeletonProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(0)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const measure = (width: number) => setCols(tilesInSpan(width))
    measure(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rows = tilesInSpan(height)
  const tileCount = cols * rows

  return (
    <div
      ref={cardRef}
      role="status"
      aria-label="Loading"
      className={cn('tile-wave-card', className)}
      style={{ height }}
    >
      <div className="tile-wave-grid" aria-hidden>
        {Array.from({ length: tileCount }).map((_, i) => (
          <div key={i} className="tile-wave-cell" />
        ))}
      </div>
      <div className="tile-wave-sheen" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export type SkeletonLayout = 'dashboard' | 'repos' | 'ai-usage' | 'pr' | 'repo' | 'graph'

function PageBody({
  layout,
  className,
}: {
  layout: SkeletonLayout
  className?: string
}) {
  if (layout === 'dashboard') {
    return (
      <div className={cn('px-8 py-7 w-full', className)}>
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-3 w-28 mb-3" />
        <div className="space-y-2 mb-6">
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    )
  }

  if (layout === 'repos') {
    return (
      <div className={cn('px-8 py-7 w-full', className)}>
        <Skeleton className="h-3 w-40 mb-3" />
        <div className="space-y-2">
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
        </div>
      </div>
    )
  }

  if (layout === 'ai-usage') {
    return (
      <div className={cn('px-8 py-7 w-full', className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[220px] mb-8" />
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-[88px] mb-4" />
        <div className="space-y-2">
          <TileWaveSkeleton height={51} />
          <TileWaveSkeleton height={51} />
        </div>
      </div>
    )
  }

  if (layout === 'pr') {
    return (
      <div className={cn('px-8 py-7 w-full', className)}>
        <Skeleton className="h-3 w-36 mb-5" />
        <Skeleton className="h-7 w-2/3 mb-2" />
        <Skeleton className="h-3 w-48 mb-6" />
        <Skeleton className="h-[120px] mb-6" />
        <Skeleton className="h-3 w-28 mb-3" />
        <div className="space-y-2">
          <TileWaveSkeleton height={48} />
          <TileWaveSkeleton height={48} />
          <TileWaveSkeleton height={48} />
          <TileWaveSkeleton height={48} />
        </div>
      </div>
    )
  }

  if (layout === 'repo') {
    return (
      <div className={cn('px-8 py-7 w-full', className)}>
        <div className="flex gap-4 mb-6 border-b border-border-hairline">
          {['w-16', 'w-20', 'w-24', 'w-24', 'w-20', 'w-16'].map((w, i) => (
            <Skeleton key={i} className={cn('h-3 mb-2.5', w)} />
          ))}
        </div>
        <div className="space-y-2">
          <TileWaveSkeleton height={56} />
          <TileWaveSkeleton height={56} />
          <TileWaveSkeleton height={56} />
          <TileWaveSkeleton height={56} />
          <TileWaveSkeleton height={56} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-full', className)}>
      <Skeleton className="h-full min-h-[420px] w-full" />
    </div>
  )
}

export function TileWaveSkeletonPage({
  className,
  layout = 'dashboard',
}: {
  className?: string
  layout?: SkeletonLayout
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  if (!ready) return <BootLoader />

  return <PageBody layout={layout} className={className} />
}
