import { preApproval } from "../services/mercadoPago.js";
import { supabase } from "../config/supabase.js";

export const mercadoPagoWebhook = async (req, res) => {

    try {
        const preapprovalId = req.query["data.id"] || req.body?.data?.id;
        const tipo = req.query.type || req.body?.type;

        if (tipo !== "subscription_preapproval" || !preapprovalId) {
            // Outros tipos de notificação (ex: cobranças recorrentes futuras,
            // ou testes do próprio Mercado Pago) — só confirma recebimento por enquanto.
            return res.sendStatus(200);
        }

        // Nunca confiar no payload da notificação sozinho — busca a assinatura
        // de verdade na API do Mercado Pago pra confirmar o status real.
        const assinaturaConfirmada = await preApproval.get({ id: preapprovalId });

        const solicitacaoId = assinaturaConfirmada.external_reference;
        const status = assinaturaConfirmada.status; // authorized | paused | cancelled | pending

        if (!solicitacaoId) {
            console.log("Webhook sem external_reference, assinatura:", preapprovalId);
            return res.sendStatus(200);
        }

        if (status === "authorized") {
            await supabase
                .from("solicitacoes")
                .update({
                    status: "pago",
                    mp_preapproval_id: String(preapprovalId),
                    atualizado_em: new Date().toISOString()
                })
                .eq("id", solicitacaoId);

            // Aqui é o ponto pra, no futuro, disparar um e-mail/WhatsApp
            // avisando você que uma nova assinatura foi autorizada.
            console.log(`Solicitação ${solicitacaoId} marcada como paga (assinatura autorizada).`);
        }

        res.sendStatus(200);

    } catch (error) {
        console.log("Erro no webhook do Mercado Pago:", error);
        // Sempre responde 200 mesmo em erro interno, senão o Mercado Pago
        // fica reenviando a mesma notificação repetidamente.
        res.sendStatus(200);
    }

};
