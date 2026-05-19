import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mysqlRouter from "./mysql";
import mongoRouter from "./mongo";
import neo4jRouter from "./neo4j";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/mysql", mysqlRouter);
router.use("/mongo", mongoRouter);
router.use("/neo4j", neo4jRouter);

export default router;
