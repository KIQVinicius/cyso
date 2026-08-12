(() => {
  'use strict';

  /* ---------- Entrada por scroll ----------
     Marca o <html> só depois que o JS roda: sem JS, nada fica invisível.
     Um único IntersectionObserver para a página toda — sem biblioteca. */
  const REVEAL_SELECTOR = [
    '.metric-card',
    '.problem__item', '.problem__closing',
    '.steps__item',
    '.channel-card',
    '.method__step',
    '.compare__flow', '.compare__quote',
    '.segment-card',
    '.about__photo', '.about__founder',
    '.faq__item'
  ].join(',');

  const targets = Array.from(document.querySelectorAll(REVEAL_SELECTOR));

  if (targets.length && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-anim');

    // stagger dentro de cada grupo de irmãos, não na página inteira
    const seen = new Map();
    targets.forEach((el) => {
      el.classList.add('reveal');
      const parent = el.parentElement;
      const i = seen.get(parent) || 0;
      seen.set(parent, i + 1);
      el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 60}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // anima uma vez só
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach((el) => observer.observe(el));
  }

  /* ---------- Tema claro/escuro ---------- */
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const root = document.documentElement;
    const syncPressed = () => {
      themeToggle.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
    };
    syncPressed();
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      syncPressed();
    });
  }

  /* ---------- Menu mobile ---------- */
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- FAQ acordeão: um aberto por vez ---------- */
  const faqItems = Array.from(document.querySelectorAll('.faq__item'));
  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq__q');
    const answer = item.querySelector('.faq__a');
    const icon = btn.querySelector('.faq__icon use');

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      faqItems.forEach((other) => {
        if (other === item) return;
        other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq__a').hidden = true;
        other.querySelector('.faq__icon use').setAttribute('href', '#i-plus');
      });

      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.hidden = isOpen;
      icon.setAttribute('href', isOpen ? '#i-plus' : '#i-minus');
    });
  });

  /* ---------- WhatsApp — máscara (00) 00000-0000 ---------- */
  const whatsappInput = document.getElementById('f-whatsapp');
  function maskPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.replace(/^(\d*)/, '($1');
    if (digits.length <= 7) return digits.replace(/^(\d{2})(\d*)/, '($1) $2');
    return digits.replace(/^(\d{2})(\d{5})(\d*)/, '($1) $2-$3');
  }
  whatsappInput.addEventListener('input', (e) => {
    e.target.value = maskPhone(e.target.value);
  });

  /* ---------- Validação + envio ---------- */
  const form = document.getElementById('lead-form');
  const statusEl = document.getElementById('form-status');

  function setError(field, message) {
    const wrapper = document.getElementById(`f-${field}`)?.closest('.field')
      || document.querySelector(`[name="${field}"]`)?.closest('.field');
    const errorEl = document.getElementById(`err-${field}`);
    if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  function validate(data) {
    const errors = {};

    if (!data.nome || data.nome.trim().length < 2) {
      errors.nome = 'Informe seu nome (mín. 2 caracteres).';
    }
    if (!data.empresa || !data.empresa.trim()) {
      errors.empresa = 'Informe o nome da empresa.';
    }
    if (!data.segmento) {
      errors.segmento = 'Selecione um segmento.';
    }
    if (!data.anuncia) {
      errors.anuncia = 'Selecione uma opção.';
    }
    if (!data.investimento) {
      errors.investimento = 'Selecione uma faixa de investimento.';
    }
    const phoneDigits = (data.whatsapp || '').replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      errors.whatsapp = 'Informe um WhatsApp válido com DDD.';
    }

    return errors;
  }

  const WHATSAPP_NUMBER = '5511996105430';

  function buildWhatsappMessage(data) {
    const linhas = [
      'Olá, CYSÔ! Quero solicitar a análise gratuita.',
      '',
      `*Nome:* ${data.nome.trim()}`,
      `*Empresa:* ${data.empresa.trim()}`,
      `*Segmento:* ${data.segmento}`,
      `*Tráfego pago:* ${data.anuncia === 'sim' ? 'Já invisto' : 'Ainda não invisto'}`,
      `*Investimento:* ${data.investimento}`,
      `*WhatsApp:* ${data.whatsapp}`
    ];
    if (data.contato && data.contato.trim()) {
      linhas.splice(5, 0, `*Site/Instagram:* ${data.contato.trim()}`);
    }
    return linhas.join('\n');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    ['nome', 'empresa', 'segmento', 'anuncia', 'investimento', 'whatsapp'].forEach((f) => setError(f, ''));

    const errors = validate(data);
    const hasErrors = Object.keys(errors).length > 0;
    Object.entries(errors).forEach(([field, message]) => setError(field, message));

    if (hasErrors) {
      statusEl.textContent = 'Verifique os campos destacados.';
      statusEl.className = 'form-status form-status--error';
      return;
    }

    // Abre síncrono, dentro do gesto do usuário — depois de um await o navegador bloqueia o popup.
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsappMessage(data))}`;
    window.open(url, '_blank', 'noopener');

    form.hidden = true;
    statusEl.innerHTML = `Abrimos o WhatsApp com suas respostas — é só enviar. Não abriu? <a href="${url}" target="_blank" rel="noopener">Clique aqui</a>.`;
    statusEl.className = 'form-status form-status--success';
    statusEl.parentElement.insertBefore(statusEl, form);
  });
})();
