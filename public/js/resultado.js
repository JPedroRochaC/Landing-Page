const title = document.getElementById("statusTitle");
const message = document.getElementById("statusMessage");
const notice = document.getElementById("statusNotice");
const icon = document.getElementById("statusIcon");
const requestId = new URLSearchParams(window.location.search).get("solicitacao");
const API_BASE = window.location.hostname === "localhost"
  ? window.location.origin
  : "https://landing-page-mpu1.onrender.com";

const showConfirmed = () => {
  icon.textContent = "✓";
  icon.className = "resultado-icone sucesso";
  title.textContent = "Pagamento confirmado!";
  message.textContent = "Sua assinatura foi validada diretamente no Mercado Pago.";
  notice.innerHTML = "<strong>Próximo passo</strong><br>Nossa equipe verificará o cadastro e enviará manualmente no seu WhatsApp o formulário para configurar o salão.";
};

const confirmPayment = async () => {
  if (!requestId) return window.location.replace("/pagamento-pendente.html");
  try {
    const response = await fetch(`${API_BASE}/payments/status/${encodeURIComponent(requestId)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    if (["pago", "ativo", "em_configuracao"].includes(result.status)) return showConfirmed();
    if (["cancelado", "inadimplente"].includes(result.status)) return window.location.replace("/pagamento-erro.html");
    return window.location.replace("/pagamento-pendente.html");
  } catch {
    title.textContent = "Não conseguimos confirmar agora";
    message.textContent = "O pagamento pode ainda estar em processamento. Você não precisa pagar novamente.";
    notice.innerHTML = "<strong>Tente novamente em alguns minutos</strong><br>Se precisar, fale com nossa equipe pelo WhatsApp.";
  }
};

confirmPayment();
