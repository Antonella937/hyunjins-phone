import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storyRouter from "./story";
import musicRouter from "./music";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storyRouter);
router.use(musicRouter);

export default router;
