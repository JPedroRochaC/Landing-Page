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

app.use(cors());
app.use(express.json());

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

// link bonito do salão: /:slug e /:slug/agendar servem o mesmo app,
// que decide o que mostrar lendo a própria URL no navegador.
app.get("/:slug/agendar", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "salao", "index.html"));
});

app.get("/:slug", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "salao", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});