import { preApproval } from "../services/mercadoPago.js";
import { supabase } from "../config/supabase.js";
import plans from "../services/plans.js";

export const createSubscription = async (req, res) => {

    try {

        const { plan, solicitacaoId, email } = req.body;

        if (!plan || !plans[plan]) {
            return res.status(400).json({
                message: "Plano inválido."
            });
        }

        if (!solicitacaoId) {
            return res.status(400).json({
                message: "solicitacaoId é obrigatório."
            });
        }

        if (!email) {
            return res.status(400).json({
                message: "E-mail é obrigatório pra criar a assinatura."
            });
        }

        const planoEscolhido = plans[plan];

        const assinatura = await preApproval.create({
            body: {
                reason: planoEscolhido.name,
                external_reference: solicitacaoId,
                payer_email: email,
                back_url: `${process.env.APP_BASE_URL}/pagamento-sucesso.html`,
                notification_url: `${process.env.API_BASE_URL}/webhook/mercadopago`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: planoEscolhido.price,
                    currency_id: "BRL"
                }
            }
        });

        // guarda o id da assinatura na solicitação, útil pra conferência manual depois
        await supabase
            .from("solicitacoes")
            .update({ mp_preapproval_id: assinatura.id })
            .eq("id", solicitacaoId);

        res.json({
            message: "Assinatura criada com sucesso",
            id: assinatura.id,
            link: assinatura.init_point
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Erro ao criar assinatura",
            error: error.message
        });

    }

};
