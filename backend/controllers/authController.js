import { supabase } from "../config/supabase.js";
import plans from "../services/plans.js";

const normalizeEmail = (value = "") => value.trim().toLowerCase();
const normalizePhone = (value = "") => value.replace(/\D/g, "");
const formatPhone = (value) => value.length === 11
    ? `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
    : `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
const activeStatuses = new Set(["pago", "ativo", "em_configuracao"]);

const findExistingRequest = async (email, whatsapp) => {
    const byEmail = await supabase
        .from("solicitacoes")
        .select("id,status,email,whatsapp")
        .ilike("email", email)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (byEmail.error) throw byEmail.error;
    if (byEmail.data) return byEmail.data;

    const byPhone = await supabase
        .from("solicitacoes")
        .select("id,status,email,whatsapp")
        .in("whatsapp", [whatsapp, formatPhone(whatsapp), `55${whatsapp}`, `+55${whatsapp}`])
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (byPhone.error) throw byPhone.error;
    return byPhone.data;
};

export const registerUser = async (req, res) => {
    try {
        const nome = String(req.body.nome || "").trim();
        const email = normalizeEmail(req.body.email);
        const whatsapp = normalizePhone(req.body.whatsapp);
        const plan = String(req.body.plan || "");

        if (nome.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || whatsapp.length < 10) {
            return res.status(400).json({ erro: "Confira seu nome, e-mail e WhatsApp." });
        }

        if (!plans[plan]) {
            return res.status(400).json({ erro: "Plano inválido." });
        }

        const existing = await findExistingRequest(email, whatsapp);
        if (existing && activeStatuses.has(existing.status)) {
            return res.status(409).json({
                erro: "Já existe uma assinatura ativa com este e-mail ou WhatsApp. Fale com nosso atendimento se precisar de ajuda.",
            });
        }

        if (existing) {
            const { error } = await supabase
                .from("solicitacoes")
                .update({
                    nome_responsavel: nome,
                    email,
                    whatsapp,
                    plano: plan,
                    atualizado_em: new Date().toISOString(),
                })
                .eq("id", existing.id);

            if (error) throw error;
            return res.json({ solicitacaoId: existing.id, reutilizada: true });
        }

        const { data, error } = await supabase
            .from("solicitacoes")
            .insert({
                salao_nome: "Cadastro pendente",
                nome_responsavel: nome,
                email,
                whatsapp,
                plano: plan,
                status: "pendente",
            })
            .select("id")
            .single();

        if (error) throw error;
        return res.status(201).json({ solicitacaoId: data.id });
    } catch (error) {
        console.error(JSON.stringify({ event: "lead_registration_failed", message: error.message }));
        return res.status(500).json({ erro: "Não foi possível salvar seus dados. Tente novamente." });
    }
};
