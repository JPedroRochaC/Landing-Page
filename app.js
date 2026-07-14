/* ==========================================================
   BotWap Nails — Landing Page JS
   Simula uma conversa com a BotWap pra cliente testar.
   ========================================================== */

// Base de respostas do "bot" — simples matcher por palavras-chave
const BOT_REPLIES = [
  { keys:['oi','olá','ola','bom dia','boa tarde','boa noite'],
    reply:'Oii! 💗 Que bom te ver por aqui. Como posso te ajudar? Posso te mostrar horários, valores ou tirar dúvidas ✨' },

  { keys:['horário','horario','agenda','amanhã','amanha','sábado','sabado','hoje','livre','disponível','disponivel'],
    reply:'Deixa eu ver aqui na agenda... 📅 Pra essa semana tenho: <b>Quarta 14h</b>, <b>Sexta 10h</b> e <b>Sábado 15h30</b>. Algum desses combina com você?' },

  { keys:['preço','preco','valor','custa','quanto','gel','alongamento','esmaltação','esmaltacao'],
    reply:'Nossos valores 💅<br>• Esmaltação em gel: <b>R$ 80</b><br>• Alongamento em gel: <b>R$ 140</b><br>• Manutenção: <b>R$ 90</b><br>• Blindagem: <b>R$ 70</b><br>Quer agendar algum?' },

  { keys:['pagamento','pix','cartão','cartao','dinheiro','débito','debito','crédito','credito'],
    reply:'Aceitamos <b>Pix, cartão de débito, crédito</b> e dinheiro 💗 O Pix tem 5% de desconto!' },

  { keys:['domicílio','domicilio','em casa','atende em casa','vai até','vai ate'],
    reply:'Sim, atendo a domicílio 🏡 A taxa de deslocamento é <b>R$ 25</b> na região central. Me manda seu endereço que confirmo pra você!' },

  { keys:['remarcar','desmarcar','cancelar','trocar horário','trocar horario'],
    reply:'Claro, sem problema 💗 Me diz seu nome e a data do agendamento que eu resolvo aqui pra você.' },

  { keys:['sinal','reserva','confirmar'],
    reply:'Pra garantir seu horário eu peço um sinal de <b>R$ 30</b> via Pix ✨ Depois é só chegar no dia, tá?' },

  { keys:['endereço','endereco','onde','localização','localizacao'],
    reply:'Estamos na <b>Rua das Flores, 128 - Centro</b> 📍 Bem pertinho da praça, prédio branco com fachada rosé 💗' },

  { keys:['obrigada','obrigado','valeu','brigada'],
    reply:'Imagina, amor 💗 Tô aqui pra te ajudar sempre. Qualquer coisa é só chamar!' },
];

const FALLBACK = 'Anotei aqui 💗 Se quiser, posso te mostrar <b>horários</b>, <b>valores</b> ou <b>formas de pagamento</b>. Ou me conta o que tá procurando!';

// ===== Elementos =====
const chat = document.getElementById('waChat');
const form = document.getElementById('waForm');
const input = document.getElementById('waText');
const status = document.getElementById('waStatus');
const suggestBtns = document.querySelectorAll('.suggest button');

// ===== Envio de mensagem =====
function addMessage(text, side='out'){
  const el = document.createElement('div');
  el.className = `wa-msg wa-${side}`;
  el.innerHTML = text;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

function showTyping(){
  const el = document.createElement('div');
  el.className = 'wa-typing';
  el.id = 'typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  if(status) status.textContent = 'digitando...';
}
function hideTyping(){
  const t = document.getElementById('typing');
  if(t) t.remove();
  if(status) status.textContent = 'online agora';
}

function findReply(msg){
  const m = msg.toLowerCase();
  for(const r of BOT_REPLIES){
    if(r.keys.some(k => m.includes(k))) return r.reply;
  }
  return FALLBACK;
}

function sendUser(text){
  if(!text.trim()) return;
  addMessage(text, 'in');
  input.value = '';
  showTyping();
  const delay = 900 + Math.random()*700;
  setTimeout(()=>{
    hideTyping();
    addMessage(findReply(text), 'out');
  }, delay);
}

form?.addEventListener('submit', e => {
  e.preventDefault();
  sendUser(input.value);
});

suggestBtns.forEach(b => {
  b.addEventListener('click', () => sendUser(b.dataset.msg));
});

// ===== Formulário CTA =====
const cta = document.getElementById('ctaForm');
const ctaMsg = document.getElementById('ctaMsg');
cta?.addEventListener('submit', e => {
  e.preventDefault();
  ctaMsg.textContent = '✨ Pronto! Em instantes você recebe um WhatsApp da gente pra começar seu teste grátis.';
  cta.reset();
});

// ===== Fade-in ao rolar =====
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if(en.isIntersecting){
      en.target.style.opacity = 1;
      en.target.style.transform = 'none';
      io.unobserve(en.target);
    }
  });
},{threshold:.15});

document.querySelectorAll('.step, .benefit, .plan, .faq details').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  io.observe(el);
});
