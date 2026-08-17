import express from "express";
import { checkAuth, syncMe } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Not guarded by protectRoute: this is the endpoint that creates the database profile,
// so on a first-ever sign-in the row protectRoute looks for is exactly what doesn't
// exist yet. syncMe checks the Clerk session itself.
router.post("/sync", syncMe);

router.get("/check", protectRoute,checkAuth);

export default router;