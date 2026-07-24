const form = document.getElementById("signupForm");
const submitBtn = document.getElementById("submitBtn");
const whatsappInput = document.getElementById("whatsapp");
const plan = new URLSearchParams(window.location.search).get("plan");
const API_BASE = window.location.hostname === "localhost"
  ? window.location.origin
  : "https://landing-page-mpu1.onrender.com";

if (!plan || !["starter", "pro"].includes(plan)) window.location.replace("/#planos");

whatsappInput.addEventListener("input", () => {
  const digits = whatsappInput.value.replace(/\D/g, "").slice(0, 11);
  whatsappInput.value = digits.length > 10 ? digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3") : digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault(); submitBtn.disabled = true; submitBtn.textContent = "Abrindo pagamento...";
  const dados = {
    salao: "Cadastro pendente",
    nome: document.getElementById("nome").value.trim(),
    email: document.getElementById("email").value.trim().toLowerCase(),
    whatsapp: whatsappInput.value.replace(/\D/g, ""),
    plan,
  };
  try {
    const registerResponse = await fetch(`${API_BASE}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
    const registerResult = await registerResponse.json();
    if (!registerResponse.ok) throw new Error(registerResult.erro || "Não foi possível salvar seus dados.");
    const paymentResponse = await fetch(`${API_BASE}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, solicitacaoId: registerResult.solicitacaoId, email: dados.email }) });
    const paymentResult = await paymentResponse.json();
    if (!paymentResponse.ok || !paymentResult.link) throw new Error(paymentResult.message || "Não foi possível abrir o pagamento.");
    window.location.assign(paymentResult.link);
  } catch (error) {
    alert(error.message || "Não foi possível conectar ao servidor. Tente novamente."); submitBtn.disabled = false; submitBtn.textContent = "Ir para o pagamento seguro";
  }
});
