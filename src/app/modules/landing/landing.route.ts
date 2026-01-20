import { Router } from "express";
import { landingPage } from "./landing.controller";

const router = Router();

router.get("/", landingPage);

export const LandingRouter = router;
