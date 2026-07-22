import type { CodeGraph, GraphEdge, GraphNode } from "../ast/types.js";
import { isNeo4jConfigured, withNeo4jSession } from "./neo4j.js";

const WRITE_BATCH = 300;

let constraintsReady = false;

export function toRepoKey(owner: string, repo: string): string {
  return `${owner}/${repo}`.toLowerCase();
}

export async function ensureGraphConstraints(): Promise<boolean> {
  if (!isNeo4jConfigured()) return false;
  if (constraintsReady) return true;

  const result = await withNeo4jSession(async (session) => {
    await session.executeWrite(async (tx) => {
      await tx.run(`
        CREATE CONSTRAINT code_node_id IF NOT EXISTS
        FOR (n:CodeNode) REQUIRE n.id IS UNIQUE
      `);
    });
    return true;
  });

  constraintsReady = Boolean(result);
  return constraintsReady;
}

function serializeNodes(nodes: GraphNode[]) {
  return nodes.map((n) => ({
    id: n.id,
    kind: n.kind,
    repoKey: n.repoKey,
    name: n.name,
    filePath: n.filePath ?? null,
    nodeType: n.nodeType ?? null,
    fqn: n.fqn ?? null,
    startLine: n.startLine ?? null,
    endLine: n.endLine ?? null,
    exported: n.exported ?? false,
    vectorId: n.vectorId ?? null,
    content: n.content ?? null,
  }));
}

function serializeEdges(edges: GraphEdge[]) {
  return edges.map((e) => ({
    id: e.id,
    type: e.type.toUpperCase(),
    fromId: e.fromId,
    toId: e.toId,
    evidence: e.evidence ?? null,
  }));
}

/**
 * Replace one repository graph inside a single write transaction so a failed
 * write does not leave a half-deleted snapshot.
 */
export async function replaceRepositoryGraph(
  graph: CodeGraph,
): Promise<boolean> {
  const ready = await ensureGraphConstraints();
  if (!ready) return false;

  try {
    const ok = await withNeo4jSession(async (session) => {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `
          MATCH (n:CodeNode {repoKey: $repoKey})
          DETACH DELETE n
          `,
          { repoKey: graph.repoKey },
        );

        for (let i = 0; i < graph.nodes.length; i += WRITE_BATCH) {
          const batch = serializeNodes(graph.nodes.slice(i, i + WRITE_BATCH));
          await tx.run(
            `
            UNWIND $nodes AS node
            MERGE (n:CodeNode {id: node.id})
            SET n.kind = node.kind,
                n.repoKey = node.repoKey,
                n.name = node.name,
                n.filePath = node.filePath,
                n.nodeType = node.nodeType,
                n.fqn = node.fqn,
                n.startLine = node.startLine,
                n.endLine = node.endLine,
                n.exported = node.exported,
                n.vectorId = node.vectorId,
                n.content = node.content
            WITH n, node
            FOREACH (_ IN CASE WHEN node.kind = 'file' THEN [1] ELSE [] END | SET n:File)
            FOREACH (_ IN CASE WHEN node.kind = 'symbol' THEN [1] ELSE [] END | SET n:Symbol)
            FOREACH (_ IN CASE WHEN node.kind = 'external_module' THEN [1] ELSE [] END | SET n:ExternalModule)
            `,
            { nodes: batch },
          );
        }

        const byType = new Map<string, ReturnType<typeof serializeEdges>>();
        for (const edge of serializeEdges(graph.edges)) {
          if (!["DEFINES", "IMPORTS", "EXPORTS", "CALLS"].includes(edge.type)) {
            continue;
          }
          if (!byType.has(edge.type)) byType.set(edge.type, []);
          byType.get(edge.type)!.push(edge);
        }

        for (const [type, typedEdges] of byType) {
          for (let i = 0; i < typedEdges.length; i += WRITE_BATCH) {
            const batch = typedEdges.slice(i, i + WRITE_BATCH);
            await tx.run(
              `
              UNWIND $edges AS edge
              MATCH (a:CodeNode {id: edge.fromId})
              MATCH (b:CodeNode {id: edge.toId})
              MERGE (a)-[r:${type} {id: edge.id}]->(b)
              SET r.evidence = edge.evidence
              `,
              { edges: batch },
            );
          }
        }
      });
      return true;
    });

    if (!ok) return false;

    console.log(
      `Persisted Neo4j graph for ${graph.repoKey}: ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
    );
    return true;
  } catch (error) {
    console.error(
      `Failed to persist Neo4j graph for ${graph.repoKey}`,
      error,
    );
    return false;
  }
}

export type GraphNeighborMatch = {
  vectorId: string;
  nodeId: string;
  name: string;
  fqn?: string;
  filePath?: string;
  nodeType?: string;
  reason: string;
  edgeType?: string;
};

export async function findGraphNeighbors(options: {
  repoKey: string;
  changedFiles: string[];
  changedSymbols: string[];
  limit?: number;
}): Promise<GraphNeighborMatch[]> {
  if (!isNeo4jConfigured()) return [];

  const { repoKey, changedFiles, changedSymbols, limit = 24 } = options;

  try {
    const result = await withNeo4jSession(async (session) => {
      const queryResult = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (seed:CodeNode {repoKey: $repoKey})
          WHERE
            (
              seed.kind = 'symbol' AND (
                seed.filePath IN $changedFiles
                OR seed.name IN $changedSymbols
                OR seed.fqn IN $changedSymbols
                OR any(f IN $changedFiles WHERE seed.filePath ENDS WITH f OR f ENDS WITH coalesce(seed.filePath, ''))
              )
            )
            OR (
              seed.kind = 'file' AND (
                seed.filePath IN $changedFiles
                OR any(f IN $changedFiles WHERE seed.filePath ENDS WITH f OR f ENDS WITH coalesce(seed.filePath, ''))
              )
            )
          WITH DISTINCT seed
          OPTIONAL MATCH (seed)-[r]-(neighbor:CodeNode {repoKey: $repoKey})
          WHERE neighbor.kind = 'symbol' AND neighbor.vectorId IS NOT NULL
          WITH seed, neighbor, r
          WITH collect(DISTINCT CASE
            WHEN seed.kind = 'symbol' AND seed.vectorId IS NOT NULL THEN {
              vectorId: seed.vectorId,
              nodeId: seed.id,
              name: seed.name,
              fqn: seed.fqn,
              filePath: seed.filePath,
              nodeType: seed.nodeType,
              reason: 'changed_symbol',
              edgeType: null
            }
            ELSE null
          END) AS seedRows,
          collect(DISTINCT CASE
            WHEN neighbor IS NOT NULL THEN {
              vectorId: neighbor.vectorId,
              nodeId: neighbor.id,
              name: neighbor.name,
              fqn: neighbor.fqn,
              filePath: neighbor.filePath,
              nodeType: neighbor.nodeType,
              reason: 'graph_neighbor',
              edgeType: type(r)
            }
            ELSE null
          END) AS neighborRows
          WITH [row IN seedRows + neighborRows WHERE row IS NOT NULL] AS rows
          UNWIND rows AS row
          RETURN DISTINCT
            row.vectorId AS vectorId,
            row.nodeId AS nodeId,
            row.name AS name,
            row.fqn AS fqn,
            row.filePath AS filePath,
            row.nodeType AS nodeType,
            row.reason AS reason,
            row.edgeType AS edgeType
          LIMIT toInteger($limit)
          `,
          {
            repoKey,
            changedFiles,
            changedSymbols,
            limit,
          },
        ),
      );

      return queryResult.records.map((record) => ({
        vectorId: String(record.get("vectorId") ?? ""),
        nodeId: String(record.get("nodeId") ?? ""),
        name: String(record.get("name") ?? ""),
        fqn: (record.get("fqn") as string | null) ?? undefined,
        filePath: (record.get("filePath") as string | null) ?? undefined,
        nodeType: (record.get("nodeType") as string | null) ?? undefined,
        reason: String(record.get("reason") ?? "graph_neighbor"),
        edgeType: (record.get("edgeType") as string | null) ?? undefined,
      }));
    });

    return (result ?? []).filter((m) => m.vectorId);
  } catch (error) {
    console.error(`Neo4j neighbor lookup failed for ${repoKey}`, error);
    return [];
  }
}
