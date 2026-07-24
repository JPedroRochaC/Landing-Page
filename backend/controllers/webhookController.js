import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { preApproval, invoice } from "../services/mercadoPago.js";
import { supabase } from "../config/supabase.js";

const subscriptionStatusMap = {
    authorized: "pago",
    pending: "pendente",
    paused: "pausado",
    canceled: "cancelado",
    cancelled: "cancelado",
};

const invoiceStatusMap = {
    approved: "pago",
    pending: "pendente",
    in_process: "pendente",
    rejected: "inadimplente",
    cancelled: "cancelado",
    canceled: "cancelado",
    refunded: "cancelado",
    charged_back: "inadimplente",
};

const validateSignature = (req, dataId) => {
    const secrets = [process.env.MP_WEBHOOK_SECRET, process.env.MP_WEBHOOK_SECRET_TEST].filter(Boolean);
    if (!secrets.length) {
        const error = new Error("Chaves de webhook do Mercado Pago não configuradas.");
        error.code = "WEBHOOK_SECRET_MISSING";
        throw error;
    }

    let signatureError;
    for (const secret of secrets) {
        try {
            WebhookSignatureValidator.validate({
                xSignature: req.headers["x-signature"],
                xRequestId: req.headers["x-request-id"],
                dataId,
                secret,
                toleranceSeconds: 300,
            });
            return;
        } catch (error) {
            signatureError = error;
        }
    }
    throw signatureError;
};

const updateRequest = async (solicitacaoId, values) => {
    const { error } = await supabase
        .from("solicitacoes")
        .update({ ...values, atualizado_em: new Date().toISOString() })
        .eq("id", solicitacaoId);
    if (error) throw error;
};

const handleSubscription = async (preapprovalId) => {
    const subscription = await preApproval.get({ id: preapprovalId });
    if (!subscription.external_reference) throw new Error("Assinatura sem external_reference.");
    const status = subscriptionStatusMap[subscription.status] || "pendente";
    await updateRequest(subscription.external_reference, {
        status,
        mp_preapproval_id: String(preapprovalId),
    });
    return { solicitacaoId: subscription.external_reference, status };
};

const handleInvoice = async (invoiceId) => {
    const subscriptionInvoice = await invoice.get({ id: invoiceId });
    let solicitacaoId = subscriptionInvoice.external_reference;

    if (!solicitacaoId && subscriptionInvoice.preapproval_id) {
        const { data, error } = await supabase
            .from("solicitacoes")
            .select("id")
            .eq("mp_preapproval_id", subscriptionInvoice.preapproval_id)
            .single();
        if (error) throw error;
        solicitacaoId = data.id;
    }

    if (!solicitacaoId) throw new Error("Fatura sem solicitação associada.");
    const paymentStatus = subscriptionInvoice.payment?.status || subscriptionInvoice.status;
    const status = invoiceStatusMap[paymentStatus] || "pendente";
    const values = {
        status,
        mp_payment_id: subscriptionInvoice.payment?.id ? String(subscriptionInvoice.payment.id) : null,
    };
    if (subscriptionInvoice.preapproval_id) values.mp_preapproval_id = String(subscriptionInvoice.preapproval_id);
    await updateRequest(solicitacaoId, values);
    return { solicitacaoId, status };
};

export const mercadoPagoWebhook = async (req, res) => {
    const dataId = String(req.query["data.id"] || req.body?.data?.id || "");
    const type = String(req.query.type || req.body?.type || "");
    const requestId = req.headers["x-request-id"] || null;

    if (!dataId || !["subscription_preapproval", "subscription_authorized_payment"].includes(type)) {
        return res.sendStatus(200);
    }

    try {
        validateSignature(req, dataId);
        const result = type === "subscription_preapproval"
            ? await handleSubscription(dataId)
            : await handleInvoice(dataId);

        console.info(JSON.stringify({ event: "mercadopago_webhook_processed", type, requestId, dataId, ...result }));
        return res.sendStatus(200);
    } catch (error) {
        const invalidSignature = error instanceof InvalidWebhookSignatureError;
        console.error(JSON.stringify({
            event: invalidSignature ? "mercadopago_webhook_rejected" : "mercadopago_webhook_failed",
            type,
            requestId,
            dataId,
            reason: error.reason || error.code || error.message,
        }));
        return res.sendStatus(invalidSignature ? 401 : 503);
    }
};
