import { Router, type IRouter } from "express";
import healthRouter from "./health";
import farmRouter from "./farm";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(farmRouter);

export default router;
