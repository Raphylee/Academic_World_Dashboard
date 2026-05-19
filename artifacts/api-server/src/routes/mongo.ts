import { Router, type IRouter } from "express";
import { getMongoDb } from "../lib/mongo";

const router: IRouter = Router();

// ── Full-text publication search ────────────────────────────────────────────
router.get("/publication-details", async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    const limit = parseInt((req.query.limit as string) || "10");
    const db = await getMongoDb();
    const publications = db.collection("publications");
    const docs = await publications
      .find({ title: { $regex: q, $options: "i" } })
      .limit(limit)
      .toArray();
    const result = docs.map((d) => ({
      id: d._id?.toString() || String(d.id),
      title: d.title,
      year: d.year,
      numCitations: d.numCitations ?? d.num_citations ?? 0,
      venue: d.venue,
      abstract: d.abstract,
      keywords: Array.isArray(d.keywords)
        ? d.keywords.map((k: any) => (typeof k === "string" ? k : k.name))
        : [],
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MongoDB query failed" });
  }
});

// ── Faculty ranked by keyword score ────────────────────────────────────────
router.get("/faculty-keyword-scores", async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const limit = parseInt((req.query.limit as string) || "10");
    const db = await getMongoDb();
    const faculty = db.collection("faculty");
    const docs = await faculty
      .aggregate([
        { $unwind: "$keywords" },
        { $match: { "keywords.name": { $regex: keyword, $options: "i" } } },
        { $project: { name: 1, affiliation: 1, score: "$keywords.score" } },
        { $sort: { score: -1 } },
        { $limit: limit },
      ])
      .toArray();
    const result = docs.map((d) => ({
      name: d.name,
      university: d.affiliation,
      score: d.score,
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MongoDB query failed" });
  }
});

// ── Keyword aggregate stats ──────────────────────────────────────────────────
router.get("/keyword-stats", async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const db = await getMongoDb();
    const publications = db.collection("publications");
    const pipeline = [
      { $unwind: "$keywords" },
      {
        $match: {
          $or: [
            { "keywords.name": { $regex: keyword, $options: "i" } },
            { keywords: { $regex: keyword, $options: "i" } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalPublications: { $sum: 1 },
          totalCitations: {
            $sum: { $ifNull: ["$numCitations", "$num_citations", 0] },
          },
          avgCitations: {
            $avg: { $ifNull: ["$numCitations", "$num_citations", 0] },
          },
          venues: { $push: "$venue" },
        },
      },
    ];
    const [stats] = await publications.aggregate(pipeline).toArray();

    if (!stats) {
      res.json({ keyword, totalPublications: 0, totalCitations: 0, avgCitations: 0, topVenue: null });
      return;
    }

    const venueMap: Record<string, number> = {};
    for (const v of stats.venues || []) {
      if (v) venueMap[v] = (venueMap[v] || 0) + 1;
    }
    const topVenue =
      Object.entries(venueMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      keyword,
      totalPublications: stats.totalPublications,
      totalCitations: stats.totalCitations,
      avgCitations: Math.round((stats.avgCitations || 0) * 10) / 10,
      topVenue,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MongoDB query failed" });
  }
});

// ── Top cited publications ───────────────────────────────────────────────────
router.get("/top-cited", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "10");
    const db = await getMongoDb();
    const publications = db.collection("publications");
    const docs = await publications
      .find({})
      .sort({ numCitations: -1, num_citations: -1 })
      .limit(limit)
      .toArray();
    const result = docs.map((d) => ({
      id: d._id?.toString() || String(d.id),
      title: d.title,
      year: d.year,
      numCitations: d.numCitations ?? d.num_citations ?? 0,
      venue: d.venue,
      abstract: d.abstract,
      keywords: Array.isArray(d.keywords)
        ? d.keywords.map((k: any) => (typeof k === "string" ? k : k.name))
        : [],
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MongoDB query failed" });
  }
});

// ── Venue citation-impact analysis ($facet + $group aggregation) ────────────
// Technique: Multi-stage aggregation pipeline using $group + $sort + $project.
// Demonstrates MongoDB's strength: computing citation impact metrics per venue
// across millions of publication documents without schema joins.
router.get("/venue-analysis", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "15");
    const db = await getMongoDb();
    const publications = db.collection("publications");

    const docs = await publications
      .aggregate([
        { $match: { venue: { $exists: true, $nin: [null, ""] } } },
        {
          $group: {
            _id: "$venue",
            totalPublications: { $sum: 1 },
            totalCitations: {
              $sum: { $ifNull: ["$numCitations", "$num_citations", 0] },
            },
            avgCitations: {
              $avg: { $ifNull: ["$numCitations", "$num_citations", 0] },
            },
          },
        },
        { $match: { totalPublications: { $gte: 5 } } },
        { $sort: { avgCitations: -1 } },
        { $limit: limit },
        {
          $project: {
            venue: "$_id",
            totalPublications: 1,
            totalCitations: 1,
            avgCitations: { $round: ["$avgCitations", 1] },
            _id: 0,
          },
        },
      ])
      .toArray();

    res.json(docs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MongoDB query failed" });
  }
});

// ── Dataset-wide year activity histogram ────────────────────────────────────
// Technique: $group by year across entire unfiltered collection — a full
// collection scan aggregation that relational DBs would require a table scan
// for, but MongoDB can stream efficiently over its document store.
router.get("/year-activity", async (req, res) => {
  try {
    const db = await getMongoDb();
    const publications = db.collection("publications");

    const docs = await publications
      .aggregate([
        { $match: { year: { $exists: true, $ne: null, $gt: 1990 } } },
        {
          $group: {
            _id: "$year",
            publications: { $sum: 1 },
            totalCitations: {
              $sum: { $ifNull: ["$numCitations", "$num_citations", 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            year: "$_id",
            publications: 1,
            totalCitations: 1,
            _id: 0,
          },
        },
      ])
      .toArray();

    res.json(docs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MongoDB query failed" });
  }
});

export default router;
