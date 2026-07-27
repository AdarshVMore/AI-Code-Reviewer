'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'motion/react'
import { useCodeGraph } from '@/hooks/useCodeGraph'
import { EmptyState, TileWaveSkeleton, TileWaveSkeletonPage } from '@/components/ui'
import { FORCE_LOADING } from '@/lib/forceLoading'
import { Network } from 'lucide-react'

const GraphCanvas = dynamic(() => import('reagraph').then((m) => m.GraphCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center p-4">
      <TileWaveSkeleton height={64} className="max-w-md" />
    </div>
  ),
})

const SEVERITY_COLOR: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
  none: '#5b6af0',
}

interface CodeGraphViewProps {
  repoId: string
}


export function CodeGraphView({ repoId }: CodeGraphViewProps) {
  const { nodes, edges, loading, error } = useCodeGraph(repoId)
  const [selected, setSelected] = useState<string | null>(null)

  const graphNodes = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        label: n.label,
        fill: SEVERITY_COLOR[n.severity] ?? SEVERITY_COLOR.none,
        size: n.type === 'repo' ? 10 : 4 + Math.min(n.issueCount, 8),
        data: n,
      })),
    [nodes],
  )

  const graphEdges = useMemo(
    () => edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    [edges],
  )

  const selectedNode = nodes.find((n) => n.id === selected)

  if (FORCE_LOADING || loading) {
    return (
      <div className="h-[420px]">
        <TileWaveSkeletonPage layout="graph" className="h-full px-0 py-0" />
      </div>
    )
  }

  if (error) {
    return <div className="h-[420px] flex items-center justify-center text-sm text-text-secondary">{error}</div>
  }

  if (nodes.length <= 1) {
    return (
      <div className="h-[420px]">
        <EmptyState
          message="No hotspots yet."
          subMessage="Once the AI flags issues across a few PRs, this graph lights up with the files that need the most attention."
          icon={Network}
        />
      </div>
    )
  }

  return (
    <div className="relative h-[420px] rounded-xl overflow-hidden border border-border-hairline bg-bg-surface/40">
      <GraphCanvas
        nodes={graphNodes}
        edges={graphEdges}
        layoutType="forceDirected2d"
        edgeArrowPosition="none"
        labelType="auto"
        animated
        onNodeClick={(node: { id: string }) => setSelected(node.id)}
        onCanvasClick={() => setSelected(null)}
      />

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="glass-overlay absolute bottom-3 left-3 right-3 sm:right-auto sm:w-72 rounded-xl p-4"
          >
            <p className="font-mono text-xs text-brand truncate">{selectedNode.fullPath ?? selectedNode.label}</p>
            <p className="text-sm text-text-primary mt-1">
              {selectedNode.type === 'repo' ? `${selectedNode.issueCount} total flagged issues` : `${selectedNode.issueCount} flagged issue${selectedNode.issueCount === 1 ? '' : 's'}`}
            </p>
            {selectedNode.categories && selectedNode.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedNode.categories.map((c) => (
                  <span key={c} className="text-xs font-mono px-2 py-0.5 rounded-full border border-border-hairline text-text-secondary capitalize">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
