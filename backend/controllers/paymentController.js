import { preApproval } from "../services/mercadoPago.js";
import { supabase } from "../config/supabase.js";
import plans from "../services/plans.js";

const statusMap = {
    authorized: "pago",
    pending: "pendente",
    paused: "pausado",
    canceled: "cancelado",
    cancelled: "cancelado",
};

const updateStatus = async (solicitacaoId, mpStatus, preapprovalId) => {
    const status = statusMap[mpStatus] || "pendente";
    const { error } = await supabase
        .from("solicitacoes")
        .update({ status, mp_preapproval_id: String(preapprovalId), atualizado_em: new Date().toISOString() })
        .eq("id", solicitacaoId);
    if (error) throw error;
    return status;
};

export const createSubscription = async (req, res) => {
    try {
        const { plan, solicitacaoId } = req.body;
        if (!plan || !plans[plan] || !solicitacaoId) {
            return res.status(400).json({ message: "Plano ou solicitação inválida." });
        }

        const { data: request, error } = await supabase
            .from("solicitacoes")
            .select("id,email,plano,status,mp_preapproval_id")
            .eq("id", solicitacaoId)
            .single();
        if (error || !request) return res.status(404).json({ message: "Solicitação não encontrada." });
        if (request.plano !== plan) return res.status(400).json({ message: "O plano não corresponde à solicitação." });
        if (["pago", "ativo", "em_configuracao"].includes(request.status)) {
            return res.status(409).json({ message: "Esta assinatura já foi confirmada." });
        }

        if (request.mp_preapproval_id) {
            const existing = await preApproval.get({ id: request.mp_preapproval_id });
            const currentStatus = await updateStatus(request.id, existing.status, existing.id);
            if (currentStatus === "pago") return res.status(409).json({ message: "Esta assinatura já foi confirmada." });
            if (existing.init_point && currentStatus === "pendente") {
                return res.json({ message: "Checkout existente recuperado.", id: existing.id, link: existing.init_point });
            }
        }

        const chosenPlan = plans[plan];
        const subscription = await preApproval.create({
            body: {
                reason: chosenPlan.name,
                external_reference: request.id,
                payer_email: request.email,
                back_url: `${process.env.APP_BASE_URL}/pagamento-sucesso.html?solicitacao=${encodeURIComponent(request.id)}`,
                notification_url: `${process.env.API_BASE_URL}/webhook/mercadopago`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: chosenPlan.price,
                    currency_id: "BRL",
                },
            },
        });

        const { error: updateError } = await supabase
            .from("solicitacoes")
            .update({ mp_preapproval_id: subscription.id, status: "pendente", atualizado_em: new Date().toISOString() })
            .eq("id", request.id);
        if (updateError) throw updateError;

        console.info(JSON.stringify({ event: "subscription_checkout_created", requestId: request.id, preapprovalId: subscription.id }));
        return res.status(201).json({ message: "Assinatura criada com sucesso.", id: subscription.id, link: subscription.init_point });
    } catch (error) {
        console.error(JSON.stringify({ event: "subscription_creation_failed", message: error.message }));
        return res.status(500).json({ message: "Não foi possível criar a assinatura. Tente novamente." });
    }
};

export const getSubscriptionStatus = async (req, res) => {
    try {
        const { data: request, error } = await supabase
            .from("solicitacoes")
            .select("id,status,mp_preapproval_id")
            .eq("id", req.params.solicitacaoId)
            .single();
        if (error || !request) return res.status(404).json({ message: "Solicitação não encontrada." });
        if (!request.mp_preapproval_id) return res.json({ status: "pendente" });

        const subscription = await preApproval.get({ id: request.mp_preapproval_id });
        const status = await updateStatus(request.id, subscription.status, subscription.id);
        return res.json({ status });
    } catch (error) {
        console.error(JSON.stringify({ event: "subscription_status_failed", message: error.message }));
        return res.status(503).json({ message: "Não foi possível confirmar o pagamento agora." });
    }
};
