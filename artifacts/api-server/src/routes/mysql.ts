import { Router, type IRouter } from "express";
import { getMysqlPool } from "../lib/mysql";

const router: IRouter = Router();

// ── Top keywords by publication count ──────────────────────────────────────
router.get("/top-keywords", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "10");
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT k.name AS keyword, COUNT(pk.publication_id) AS count
       FROM keyword k
       JOIN publication_keyword pk ON k.id = pk.keyword_id
       GROUP BY k.id, k.name
       ORDER BY count DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Faculty search ──────────────────────────────────────────────────────────
router.get("/faculty-search", async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    const limit = parseInt((req.query.limit as string) || "10");
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT f.id, f.name, f.position, u.name AS university, f.email, f.photo_url AS photoUrl
       FROM faculty f
       LEFT JOIN university u ON f.university_id = u.id
       WHERE f.name LIKE ?
       LIMIT ?`,
      [`%${q}%`, limit]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Faculty publications ────────────────────────────────────────────────────
router.get("/faculty-publications", async (req, res) => {
  try {
    const facultyId = parseInt((req.query.facultyId as string) || "0");
    const limit = parseInt((req.query.limit as string) || "10");
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.year, p.num_citations AS numCitations, p.venue
       FROM publication p
       JOIN faculty_publication fp ON p.id = fp.publication_id
       WHERE fp.faculty_id = ?
       ORDER BY p.num_citations DESC
       LIMIT ?`,
      [facultyId, limit]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Keyword publication trend (year-by-year) ────────────────────────────────
router.get("/keyword-trend", async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT p.year, COUNT(*) AS count
       FROM publication p
       JOIN publication_keyword pk ON p.id = pk.publication_id
       JOIN keyword k ON pk.keyword_id = k.id
       WHERE k.name LIKE ? AND p.year IS NOT NULL
       GROUP BY p.year
       ORDER BY p.year ASC`,
      [`%${keyword}%`]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Top universities by publication count ───────────────────────────────────
router.get("/top-universities", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "10");
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT u.name AS university, COUNT(DISTINCT fp.publication_id) AS count
       FROM university u
       JOIN faculty f ON f.university_id = u.id
       JOIN faculty_publication fp ON f.id = fp.faculty_id
       GROUP BY u.id, u.name
       ORDER BY count DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Faculty H-Index (Window Functions + CTE) ────────────────────────────────
// Technique: CTE + ROW_NUMBER() window function to compute h-index.
// h-index = max h such that a researcher has h papers with >= h citations.
// Cannot be done efficiently in NoSQL/graph DBs without full data scan.
router.get("/faculty-hindex", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "15");
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `WITH ranked_pubs AS (
         SELECT
           fp.faculty_id,
           p.num_citations,
           ROW_NUMBER() OVER (
             PARTITION BY fp.faculty_id
             ORDER BY p.num_citations DESC
           ) AS rank_num
         FROM faculty_publication fp
         JOIN publication p ON fp.publication_id = p.id
       ),
       hindex_calc AS (
         SELECT
           faculty_id,
           MAX(CASE WHEN num_citations >= rank_num THEN rank_num ELSE 0 END) AS h_index,
           COUNT(*) AS total_publications,
           SUM(num_citations) AS total_citations
         FROM ranked_pubs
         GROUP BY faculty_id
       )
       SELECT
         f.id,
         f.name,
         u.name AS university,
         hc.h_index AS hIndex,
         hc.total_publications AS totalPublications,
         hc.total_citations AS totalCitations
       FROM hindex_calc hc
       JOIN faculty f ON hc.faculty_id = f.id
       LEFT JOIN university u ON f.university_id = u.id
       ORDER BY hc.h_index DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Keyword co-occurrence (Self-Join) ───────────────────────────────────────
// Technique: Self-join on publication_keyword to discover which keywords
// most frequently appear together with a given keyword. Demonstrates
// relational set-intersection via join predicates.
router.get("/keyword-cooccurrence", async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const limit = parseInt((req.query.limit as string) || "12");
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT
         k2.name AS keyword,
         COUNT(*) AS cooccurrences
       FROM publication_keyword pk1
       JOIN keyword k1 ON pk1.keyword_id = k1.id
       JOIN publication_keyword pk2
         ON pk1.publication_id = pk2.publication_id
         AND pk1.keyword_id != pk2.keyword_id
       JOIN keyword k2 ON pk2.keyword_id = k2.id
       WHERE k1.name LIKE ?
       GROUP BY k2.id, k2.name
       ORDER BY cooccurrences DESC
       LIMIT ?`,
      [`%${keyword}%`, limit]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── University Research Profile (Multi-level Aggregation) ──────────────────
// Technique: Multi-table JOIN with GROUP BY over 4 tables, computes:
// faculty count, total distinct publications, average citation rate,
// and keyword diversity (cardinality of distinct keyword set per institution).
router.get("/university-profile", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "10");
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT
         u.name AS university,
         COUNT(DISTINCT f.id) AS facultyCount,
         COUNT(DISTINCT fp.publication_id) AS totalPublications,
         ROUND(AVG(p.num_citations), 2) AS avgCitations,
         COUNT(DISTINCT pk.keyword_id) AS keywordDiversity,
         (
           SELECT k2.name
           FROM faculty f2
           JOIN faculty_publication fp2 ON f2.id = fp2.faculty_id
           JOIN publication_keyword pk2 ON fp2.publication_id = pk2.publication_id
           JOIN keyword k2 ON pk2.keyword_id = k2.id
           WHERE f2.university_id = u.id
           GROUP BY k2.id
           ORDER BY COUNT(*) DESC
           LIMIT 1
         ) AS topKeyword
       FROM university u
       JOIN faculty f ON f.university_id = u.id
       JOIN faculty_publication fp ON f.id = fp.faculty_id
       JOIN publication p ON fp.publication_id = p.id
       LEFT JOIN publication_keyword pk ON p.id = pk.publication_id
       GROUP BY u.id, u.name
       HAVING facultyCount >= 3
       ORDER BY avgCitations DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Favorite keywords (user-defined widget) ─────────────────────────────────
router.get("/favorite-keywords", async (req, res) => {
  try {
    const pool = getMysqlPool();
    await pool.query(
      `CREATE TABLE IF NOT EXISTS favorite_keywords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
    const [rows] = await pool.query(
      `SELECT id, keyword, created_at AS createdAt FROM favorite_keywords ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

router.post("/favorite-keywords", async (req, res) => {
  try {
    const { keyword } = req.body as { keyword: string };
    const pool = getMysqlPool();
    await pool.query(
      `CREATE TABLE IF NOT EXISTS favorite_keywords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
    const [result] = await pool.query(
      `INSERT INTO favorite_keywords (keyword) VALUES (?)`,
      [keyword]
    ) as any[];
    const [rows] = await pool.query(
      `SELECT id, keyword, created_at AS createdAt FROM favorite_keywords WHERE id = ?`,
      [(result as any).insertId]
    ) as any[];
    res.status(201).json((rows as any[])[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

router.delete("/favorite-keywords/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = getMysqlPool();
    await pool.query(`DELETE FROM favorite_keywords WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Dashboard summary stats ──────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const pool = getMysqlPool();
    const [[facultyRow]] = await pool.query(`SELECT COUNT(*) AS total FROM faculty`) as any;
    const [[pubRow]] = await pool.query(`SELECT COUNT(*) AS total FROM publication`) as any;
    const [[kwRow]] = await pool.query(`SELECT COUNT(*) AS total FROM keyword`) as any;
    const [[citRow]] = await pool.query(`SELECT COALESCE(SUM(num_citations),0) AS total FROM publication`) as any;
    res.json({
      facultyCount: Number(facultyRow.total),
      publicationCount: Number(pubRow.total),
      keywordCount: Number(kwRow.total),
      totalCitations: Number(citRow.total),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

// ── Publications by year (all, for dashboard chart) ─────────────────────────
router.get("/publications-by-year", async (req, res) => {
  try {
    const pool = getMysqlPool();
    const [rows] = await pool.query(
      `SELECT year, COUNT(*) AS count
       FROM publication
       WHERE year IS NOT NULL AND year >= 1970
       GROUP BY year
       ORDER BY year ASC`
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MySQL query failed" });
  }
});

export default router;
