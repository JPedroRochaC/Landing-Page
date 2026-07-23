const form = document.getElementById("signupForm");
const submitBtn = document.getElementById("submitBtn");

const params = new URLSearchParams(window.location.search);
const plan = params.get("plan");

const API_BASE = "https://landing-page-mpu1.onrender.com";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  const dados = {
    salao: document.getElementById("salao").value,
    nome: document.getElementById("nome").value,
    email: document.getElementById("email").value,
    whatsapp: document.getElementById("whatsapp").value,
    plan,
  };

  try {
    // 1. cria a solicitação (sem senha, sem login ainda)
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const registerResult = await registerResponse.json();

    if (!registerResponse.ok) {
      alert(registerResult.erro || "Erro ao enviar seus dados.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Continuar para pagamento";
      return;
    }

    // 2. cria o pagamento vinculado a essa solicitação
    const paymentResponse = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        solicitacaoId: registerResult.solicitacaoId,
        email: dados.email,
      }),
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      alert(paymentResult.message || "Erro ao criar o pagamento.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Continuar para pagamento";
      return;
    }

    // 3. redireciona pro checkout do Mercado Pago
    window.location.href = paymentResult.link;
  } catch (error) {
    console.log(error);
    alert("Não foi possível conectar ao servidor. Tente novamente.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Continuar para pagamento";
  }
});
