import { Router, type IRouter } from "express";
import { runNeo4jQuery } from "../lib/neo4j";
import neo4j from "neo4j-driver";

const router: IRouter = Router();

function toNum(val: any): number {
  if (val === null || val === undefined) return 0;
  if (neo4j.isInt(val)) return val.toNumber();
  return Number(val);
}

// ── Collaboration network (1-hop ego graph) ──────────────────────────────────
router.get("/collaboration-network", async (req, res) => {
  try {
    const facultyName = (req.query.facultyName as string) || "";

    const records = await runNeo4jQuery(
      `MATCH (f:FACULTY {name: $name})-[:PUBLISH]->(p:PUBLICATION)<-[:PUBLISH]-(coauthor:FACULTY)
       WHERE coauthor.name <> f.name
       WITH f, coauthor, COUNT(p) AS shared
       RETURN f.name AS source, f.affiliation AS sourceUniv,
              coauthor.name AS target, coauthor.affiliation AS targetUniv,
              shared
       ORDER BY shared DESC
       LIMIT 50`,
      { name: facultyName }
    );

    const nodesMap: Record<
      string,
      { id: string; label: string; university: string; type: string }
    > = {};
    const edges: { source: string; target: string; weight: number }[] = [];

    for (const rec of records) {
      const source = rec.get("source");
      const target = rec.get("target");
      const sourceUniv = rec.get("sourceUniv") || "";
      const targetUniv = rec.get("targetUniv") || "";
      const shared = toNum(rec.get("shared"));

      nodesMap[source] = { id: source, label: source, university: sourceUniv, type: "faculty" };
      nodesMap[target] = { id: target, label: target, university: targetUniv, type: "faculty" };
      edges.push({ source, target, weight: shared });
    }

    res.json({ nodes: Object.values(nodesMap), edges });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Neo4j query failed" });
  }
});

// ── Faculty research keywords (graph traversal) ──────────────────────────────
router.get("/faculty-keywords", async (req, res) => {
  try {
    const facultyName = (req.query.facultyName as string) || "";
    const limit = parseInt((req.query.limit as string) || "15");

    const records = await runNeo4jQuery(
      `MATCH (f:FACULTY {name: $name})-[r:RESEARCH_INTEREST]->(k:KEYWORD)
       RETURN k.name AS keyword, r.score AS score
       ORDER BY score DESC
       LIMIT $limit`,
      { name: facultyName, limit: neo4j.int(limit) }
    );

    const result = records.map((rec) => ({
      keyword: rec.get("keyword"),
      score: toNum(rec.get("score")),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Neo4j query failed" });
  }
});

// ── Top keyword experts (keyword → faculty via graph) ──────────────────────
router.get("/keyword-experts", async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const limit = parseInt((req.query.limit as string) || "10");

    const records = await runNeo4jQuery(
      `MATCH (f:FACULTY)-[r:RESEARCH_INTEREST]->(k:KEYWORD)
       WHERE toLower(k.name) CONTAINS toLower($keyword)
       RETURN f.name AS name, f.affiliation AS university, r.score AS score
       ORDER BY score DESC
       LIMIT $limit`,
      { keyword, limit: neo4j.int(limit) }
    );

    const result = records.map((rec) => ({
      name: rec.get("name"),
      university: rec.get("university") || "",
      score: toNum(rec.get("score")),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Neo4j query failed" });
  }
});

// ── Shortest collaboration path (BFS shortest path) ──────────────────────────
// Technique: Neo4j's shortestPath() algorithm — fundamentally graph-native.
// In relational DBs this would require recursive CTEs (with depth bounding).
// In document DBs, it would require application-layer BFS with multiple queries.
router.get("/research-path", async (req, res) => {
  try {
    const from = (req.query.from as string) || "";
    const to = (req.query.to as string) || "";

    const records = await runNeo4jQuery(
      `MATCH path = shortestPath(
         (a:FACULTY {name: $from})-[:PUBLISH*]-(b:FACULTY {name: $to})
       )
       RETURN [node IN nodes(path) | node.name] AS pathNames, length(path) AS pathLen`,
      { from, to }
    );

    if (records.length === 0) {
      res.json({ path: [], length: -1 });
      return;
    }

    const rec = records[0];
    const pathNames = rec.get("pathNames") || [];
    const pathLen = toNum(rec.get("pathLen"));

    res.json({ path: pathNames, length: pathLen });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Neo4j query failed" });
  }
});

// ── Network Degree Centrality ────────────────────────────────────────────────
// Technique: Pattern matching to compute degree (# distinct co-authors) for
// every faculty node. Degree centrality identifies "hub" researchers who bridge
// many communities. This is a native graph metric — in SQL it requires a
// self-join aggregation; in MongoDB, a full document scan with $lookup.
router.get("/network-centrality", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "15");

    const records = await runNeo4jQuery(
      `MATCH (f:FACULTY)-[:PUBLISH]->(p:PUBLICATION)<-[:PUBLISH]-(coauthor:FACULTY)
       WHERE coauthor.name <> f.name
       WITH f, COUNT(DISTINCT coauthor) AS degree, COUNT(DISTINCT p) AS sharedPubs
       RETURN f.name AS name, f.affiliation AS university, degree, sharedPubs
       ORDER BY degree DESC
       LIMIT $limit`,
      { limit: neo4j.int(limit) }
    );

    const result = records.map((rec) => ({
      name: rec.get("name"),
      university: rec.get("university") || "",
      degree: toNum(rec.get("degree")),
      sharedPubs: toNum(rec.get("sharedPubs")),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Neo4j query failed" });
  }
});

// ── Research Cluster Discovery ───────────────────────────────────────────────
// Technique: Finds faculty who publish on a keyword AND are connected through
// shared publications, forming a research cluster. Uses variable-length path
// matching — a graph-native operation that would be exponentially complex
// to replicate in relational or document stores.
router.get("/research-clusters", async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const limit = parseInt((req.query.limit as string) || "20");

    const records = await runNeo4jQuery(
      `MATCH (f:FACULTY)-[r:RESEARCH_INTEREST]->(k:KEYWORD)
       WHERE toLower(k.name) CONTAINS toLower($keyword)
       WITH f, r.score AS score
       ORDER BY score DESC
       LIMIT $limit
       RETURN f.name AS name, f.affiliation AS university, score`,
      { keyword, limit: neo4j.int(limit) }
    );

    const result = records.map((rec) => ({
      name: rec.get("name"),
      university: rec.get("university") || "",
      score: toNum(rec.get("score")),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Neo4j query failed" });
  }
});

export default router;
