import { useEffect, useState } from 'react'
import { fetchCodeGraph, CodeGraphNode, CodeGraphEdge } from '@/lib/api/repos'

export function useCodeGraph(repoId: string) {
  const [nodes, setNodes] = useState<CodeGraphNode[]>([])
  const [edges, setEdges] = useState<CodeGraphEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!repoId) return
    setLoading(true)
    fetchCodeGraph(repoId)
      .then((data) => {
        setNodes(data.nodes)
        setEdges(data.edges)
      })
      .catch(() => setError('Failed to load code graph'))
      .finally(() => setLoading(false))
  }, [repoId])

  return { nodes, edges, loading, error }
}
