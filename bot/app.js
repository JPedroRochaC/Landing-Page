const SUPABASE_URL = "https://mdvdgtiozakoufrjgmns.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdmRndGlvemFrb3VmcmpnbW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDU3MjMsImV4cCI6MjA5OTQyMTcyM30.fuPH7iWSh2SGPskhiyi7Klmf3fxsbn5b9XfuvlHRA0M";

// use `sb` no lugar de `supabase` pra não conflitar com o global do CDN
let sb = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ------- ESTADO -------
const STORAGE_KEY = "botwap_nails_config_v1";
const AUTH_KEY = "botwap_nails_auth_v1";

const estadoPadrao = {
  atendimentoAtivo: true,
  servicos: [
    { nome: "Esmaltação em gel", duracao: 60, preco: 80 },
    { nome: "Alongamento em fibra", duracao: 180, preco: 200 },
  ],
  horarios: [
    { dia: "Terça", inicio: "09:00", fim: "18:00" },
    { dia: "Quarta", inicio: "09:00", fim: "18:00" },
    { dia: "Quinta", inicio: "09:00", fim: "18:00" },
    { dia: "Sexta", inicio: "09:00", fim: "20:00" },
    { dia: "Sábado", inicio: "09:00", fim: "16:00" },
  ],
  faq: [
    {
      pergunta: "Vocês aceitam Pix?",
      resposta: "Sim, amor! Pix, dinheiro e cartão 💖",
    },
  ],
  dados: {
    endereco: "",
    domicilio: "nao",
    taxaDeslocamento: "",
    pagamentos: "",
    exigeSinal: "nao",
    valorSinal: "",
    antecedencia: "",
  },
};

let estado = carregarEstado();

function carregarEstado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(estadoPadrao);
    return { ...structuredClone(estadoPadrao), ...JSON.parse(raw) };
  } catch {
    return structuredClone(estadoPadrao);
  }
}

function salvarEstado(mostrarToast = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  if (mostrarToast) toast("Salvo ✓");
}

// ------- ELEMENTOS -------
const telaLogin = document.getElementById("tela-login");
const telaPainel = document.getElementById("tela-painel");
const formLogin = document.getElementById("form-login");
const erroLogin = document.getElementById("erro-login");
const btnSair = document.getElementById("sair");

const toggleAtend = document.getElementById("toggle-atendimento");
const tbodyServicos = document.getElementById("tbody-servicos");
const tbodyHorarios = document.getElementById("tbody-horarios");
const listaFaq = document.getElementById("lista-faq");

const statusSalvar = document.getElementById("status-salvar");

// ------- LOGIN -------
function mostrarPainel() {
  telaLogin.hidden = true;
  telaPainel.hidden = false;
  renderTudo();
}
function mostrarLogin() {
  telaPainel.hidden = true;
  telaLogin.hidden = false;
}

if (localStorage.getItem(AUTH_KEY) === "1") {
  mostrarPainel();
} else {
  mostrarLogin();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  erroLogin.textContent = "";
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  if (!email || !senha) {
    erroLogin.textContent = "Preencha seu e-mail e senha, linda ✨";
    return;
  }

  // no submit do login:
  if (sb) {
    const { error } = await sb.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) {
      erroLogin.textContent = "E-mail ou senha incorretos.";
      return;
    }
  }

  // no botão sair:
  if (sb) await sb.auth.signOut();

  localStorage.setItem(AUTH_KEY, "1");
  mostrarPainel();
});

btnSair.addEventListener("click", async () => {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(AUTH_KEY);
  mostrarLogin();
});

// ------- TOGGLE ATENDIMENTO -------
toggleAtend.addEventListener("click", () => {
  estado.atendimentoAtivo = !estado.atendimentoAtivo;
  atualizarToggle();
  salvarEstado();
});
function atualizarToggle() {
  toggleAtend.classList.toggle("on", estado.atendimentoAtivo);
  toggleAtend.setAttribute(
    "aria-checked",
    estado.atendimentoAtivo ? "true" : "false",
  );
}

// ------- SERVIÇOS -------
function renderServicos() {
  tbodyServicos.innerHTML = "";
  if (!estado.servicos.length) {
    tbodyServicos.innerHTML = `<tr><td colspan="4" class="vazio">Nenhum serviço cadastrado ainda 🌸</td></tr>`;
    return;
  }
  estado.servicos.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(s.nome)}</td>
      <td>${s.duracao} min</td>
      <td>R$ ${formatarMoeda(s.preco)}</td>
      <td class="acoes">
        <button type="button" class="excluir" data-remover-servico="${i}">Remover</button>
      </td>
    `;
    tbodyServicos.appendChild(tr);
  });
}

// ------- HORÁRIOS -------
function renderHorarios() {
  tbodyHorarios.innerHTML = "";
  if (!estado.horarios.length) {
    tbodyHorarios.innerHTML = `<tr><td colspan="4" class="vazio">Nenhum horário cadastrado ainda 🕰️</td></tr>`;
    return;
  }
  estado.horarios.forEach((h, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(h.dia)}</td>
      <td>${h.inicio}</td>
      <td>${h.fim}</td>
      <td class="acoes">
        <button type="button" class="excluir" data-remover-horario="${i}">Remover</button>
      </td>
    `;
    tbodyHorarios.appendChild(tr);
  });
}

// ------- FAQ -------
function renderFaq() {
  listaFaq.innerHTML = "";
  if (!estado.faq.length) {
    listaFaq.innerHTML = `<p class="vazio">Nenhuma pergunta cadastrada ainda 💬</p>`;
    return;
  }
  estado.faq.forEach((f, i) => {
    const div = document.createElement("div");
    div.className = "faq-item";
    div.innerHTML = `
      <button type="button" class="remover" data-remover-faq="${i}">Remover</button>
      <div class="pergunta">${escapeHtml(f.pergunta)}</div>
      <div class="resposta">${escapeHtml(f.resposta)}</div>
    `;
    listaFaq.appendChild(div);
  });
}

// ------- DADOS DO NEGÓCIO -------
function carregarDadosNegocioNoForm() {
  const d = estado.dados;
  document.getElementById("endereco").value = d.endereco || "";
  document.getElementById("domicilio").value = d.domicilio || "nao";
  document.getElementById("taxa-deslocamento").value = d.taxaDeslocamento || "";
  document.getElementById("pagamentos").value = d.pagamentos || "";
  document.getElementById("exige-sinal").value = d.exigeSinal || "nao";
  document.getElementById("valor-sinal").value = d.valorSinal || "";
  document.getElementById("antecedencia").value = d.antecedencia || "";
}
document.getElementById("salvar-dados").addEventListener("click", () => {
  estado.dados = {
    endereco: document.getElementById("endereco").value.trim(),
    domicilio: document.getElementById("domicilio").value,
    taxaDeslocamento: document.getElementById("taxa-deslocamento").value,
    pagamentos: document.getElementById("pagamentos").value.trim(),
    exigeSinal: document.getElementById("exige-sinal").value,
    valorSinal: document.getElementById("valor-sinal").value,
    antecedencia: document.getElementById("antecedencia").value,
  };
  salvarEstado();
});

// ------- BOTÕES ADICIONAR -------
document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tipo = btn.dataset.add;

    if (tipo === "servico") {
      const nome = document.getElementById("servico-nome").value.trim();
      const duracao = parseInt(
        document.getElementById("servico-duracao").value,
        10,
      );
      const preco = parseFloat(document.getElementById("servico-preco").value);
      if (!nome || !duracao || isNaN(preco)) {
        toast("Preencha nome, duração e preço 💅");
        return;
      }
      estado.servicos.push({ nome, duracao, preco });
      document.getElementById("servico-nome").value = "";
      document.getElementById("servico-duracao").value = "";
      document.getElementById("servico-preco").value = "";
      renderServicos();
      salvarEstado();
    }

    if (tipo === "horario") {
      const dia = document.getElementById("horario-dia").value;
      const inicio = document.getElementById("horario-inicio").value;
      const fim = document.getElementById("horario-fim").value;
      if (!inicio || !fim) {
        toast("Escolha o horário 🕰️");
        return;
      }
      estado.horarios.push({ dia, inicio, fim });
      renderHorarios();
      salvarEstado();
    }

    if (tipo === "faq") {
      const pergunta = document.getElementById("faq-pergunta").value.trim();
      const resposta = document.getElementById("faq-resposta").value.trim();
      if (!pergunta || !resposta) {
        toast("Preencha pergunta e resposta 💬");
        return;
      }
      estado.faq.push({ pergunta, resposta });
      document.getElementById("faq-pergunta").value = "";
      document.getElementById("faq-resposta").value = "";
      renderFaq();
      salvarEstado();
    }
  });
});

// ------- REMOVER (delegação) -------
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  if (t.dataset.removerServico !== undefined) {
    estado.servicos.splice(+t.dataset.removerServico, 1);
    renderServicos();
    salvarEstado();
  }
  if (t.dataset.removerHorario !== undefined) {
    estado.horarios.splice(+t.dataset.removerHorario, 1);
    renderHorarios();
    salvarEstado();
  }
  if (t.dataset.removerFaq !== undefined) {
    estado.faq.splice(+t.dataset.removerFaq, 1);
    renderFaq();
    salvarEstado();
  }
});

// ------- UTILS -------
function renderTudo() {
  atualizarToggle();
  renderServicos();
  renderHorarios();
  renderFaq();
  carregarDadosNegocioNoForm();
}

function toast(msg) {
  statusSalvar.textContent = msg;
  statusSalvar.classList.add("mostrar");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => statusSalvar.classList.remove("mostrar"), 1800);
}

function formatarMoeda(v) {
  return Number(v).toFixed(2).replace(".", ",");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
