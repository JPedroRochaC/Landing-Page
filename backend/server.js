import "dotenv/config";

import express from "express";
import cors from "cors";

import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/payments", paymentRoutes);
app.use("/auth", authRoutes);
// app.use("/webhook", webhookRoutes);

app.get("/", (req, res) => {
    res.json({
        status: "API Salonia online 🚀"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});