import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const allowedOrigins = new Set([
    process.env.APP_BASE_URL,
    ...(process.env.CORS_ORIGINS || "").split(","),
    "http://localhost:3000",
].map((origin) => origin?.trim()).filter(Boolean));

app.disable("x-powered-by");
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error("Origem não permitida."));
    },
}));
app.use(express.json({ limit: "32kb" }));

// só a pasta "public" é servida como arquivo estático — o resto do
// backend (controllers, services, .env) fica fora do alcance do navegador.
// "public" fica um nível acima de backend/, na raiz do projeto.
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/payments", paymentRoutes);
app.use("/auth", authRoutes);
app.use("/webhook", webhookRoutes);

app.get("/api", (req, res) => {
    res.json({
        status: "API Salonia online 🚀"
    });
});

// Rotas não encontradas não devem tentar abrir arquivos ausentes.
app.use((req, res) => {
    res.status(404).json({ message: "Rota não encontrada." });
});

const PORT = process.env.PORT || process.env.SALONIA_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
