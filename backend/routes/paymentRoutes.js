import express from "express";
import { createSubscription, getSubscriptionStatus } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", createSubscription);
router.get("/status/:solicitacaoId", getSubscriptionStatus);

export default router;
