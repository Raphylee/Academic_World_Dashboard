# Academic World Dashboard

## Overview

Full-stack Academic World research intelligence dashboard designed to demonstrate graduate/PhD-level database systems mastery. Queries three databases — MySQL (relational), MongoDB (document), Neo4j (graph) — using advanced techniques appropriate for each paradigm.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React + Vite (Tailwind CSS, recharts, react-force-graph-2d, framer-motion)
- **Databases**: MySQL 8, MongoDB, Neo4j
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Database Connection

Databases must be running locally at:
- MySQL: `127.0.0.1:3306` (database: `academicworld`, user: `root`, password: `test_root`)
- MongoDB: `mongodb://localhost:27017/academicworld`
- Neo4j: `neo4j://127.0.0.1:7687` (user: `neo4j`, password: `Ilovecs411`)

Environment variables (set in Replit Secrets):
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `MONGODB_URI`
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── lib/        # DB connection helpers (mysql.ts, mongo.ts, neo4j.ts)
│   │       └── routes/     # mysql.ts, mongo.ts, neo4j.ts, health.ts
│   └── dashboard/          # React+Vite frontend
│       └── src/
│           ├── pages/      # home, mysql-explorer, mongo-explorer, neo4j-explorer
│           └── components/ # layout, network-graph, ui/
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   └── api-zod/            # Generated Zod schemas
```

## Graduate-Level Database Features

### MySQL Explorer (Relational)
Each widget is labeled with the SQL technique it showcases:

| Widget | Technique |
|--------|-----------|
| Publication Trend | GROUP BY year + WHERE (keyword filter) |
| Top Keywords | JOIN + GROUP BY + ORDER BY |
| **Faculty H-Index Leaderboard** | **CTE + ROW_NUMBER() Window Function** |
| **Keyword Co-occurrence** | **Self-Join on publication_keyword** |
| **University Research Profile** | **Multi-level Aggregation + Correlated Subquery** |
| Faculty Search + Publications | Simple JOIN + LIKE search |
| Saved Keywords | DDL (CREATE IF NOT EXISTS) + DML CRUD |

### MongoDB Explorer (Document)
Each widget is labeled with the aggregation pipeline operator:

| Widget | Technique |
|--------|-----------|
| **Global Research Activity** | **$group by year (full collection scan)** |
| Publication Search | $regex text search on documents |
| **Venue Citation Impact** | **$group + $sort + $project (pipeline)** |
| Keyword Deep Dive (stats) | $group + $avg + $sum |
| Faculty Expertise Ranking | $unwind + $match + $sort |

### Neo4j Explorer (Graph)
Each widget is labeled with the graph query pattern:

| Widget | Technique |
|--------|-----------|
| Collaboration Network | Ego Graph: 1-hop MATCH pattern |
| **Degree Centrality Leaderboard** | **Degree Centrality: COUNT(DISTINCT coauthor)** |
| **Research Cluster Discovery** | **MATCH (f)-[:RESEARCH_INTEREST]->(k) pattern** |
| Shortest Path Finder | shortestPath() — graph-native BFS |
| Semantic Keyword Cloud | Graph traversal: MATCH (f)-[:RESEARCH_INTEREST]->(k) |

## API Endpoints

All at `/api/*`:

### MySQL (`/api/mysql/`)
- `GET /top-keywords?limit=10`
- `GET /faculty-search?q=name&limit=10`
- `GET /faculty-publications?facultyId=1&limit=10`
- `GET /keyword-trend?keyword=machine+learning`
- `GET /top-universities?limit=10`
- `GET /faculty-hindex?limit=15` — Window functions + CTE
- `GET /keyword-cooccurrence?keyword=nlp&limit=12` — Self-join
- `GET /university-profile?limit=10` — Multi-level aggregation
- `GET /favorite-keywords`
- `POST /favorite-keywords` body: `{keyword}`
- `DELETE /favorite-keywords/:id`

### MongoDB (`/api/mongo/`)
- `GET /publication-details?q=query&limit=10`
- `GET /faculty-keyword-scores?keyword=nlp&limit=10`
- `GET /keyword-stats?keyword=nlp`
- `GET /top-cited?limit=10`
- `GET /venue-analysis?limit=15` — Multi-stage aggregation pipeline
- `GET /year-activity` — Full collection scan $group

### Neo4j (`/api/neo4j/`)
- `GET /collaboration-network?facultyName=name&depth=1`
- `GET /faculty-keywords?facultyName=name&limit=15`
- `GET /keyword-experts?keyword=nlp&limit=10`
- `GET /research-path?from=alice&to=bob`
- `GET /network-centrality?limit=15` — Degree centrality
- `GET /research-clusters?keyword=nlp&limit=20` — Graph pattern matching

## Development

```bash
# Install dependencies
pnpm install

# Start API server (with hot-rebuild)
pnpm --filter @workspace/api-server run dev

# Start dashboard frontend
pnpm --filter @workspace/dashboard run dev

# Regenerate API client after spec changes
pnpm --filter @workspace/api-spec run codegen
```
