import { supabase } from "../config/supabase.js";
import plans from "../services/plans.js";

export const registerUser = async (req, res) => {

    const {
        salao,
        nome,
        email,
        whatsapp,
        plan
    } = req.body;

    if (!salao || !nome || !email || !whatsapp || !plan) {
        return res.status(400).json({
            erro: "Preencha todos os campos."
        });
    }

    if (!plans[plan]) {
        return res.status(400).json({
            erro: "Plano inválido."
        });
    }

    const { data, error } = await supabase
        .from("solicitacoes")
        .insert({
            salao_nome: salao,
            nome_responsavel: nome,
            email,
            whatsapp,
            plano: plan
        })
        .select("id")
        .single();

    if (error) {
        console.log(error);
        return res.status(500).json({
            erro: error.message
        });
    }

    res.json({
        solicitacaoId: data.id
    });

};
