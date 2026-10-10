/* Portfolio — navigation mobile, animations légères, copie et assistant IA. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);

  // Année, navigation accessible et réduction des effets en cas de préférence utilisateur.
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const navButton = $('.nav-toggle');
  const navMenu = $('#primary-navigation');
  function closeMenu() {
    if (!navButton || !navMenu) return;
    navMenu.classList.remove('is-open');
    navButton.setAttribute('aria-expanded', 'false');
    navButton.setAttribute('aria-label', 'Ouvrir le menu');
  }
  if (navButton && navMenu) {
    navButton.addEventListener('click', () => {
      const open = !navMenu.classList.contains('is-open');
      navMenu.classList.toggle('is-open', open);
      navButton.setAttribute('aria-expanded', String(open));
      navButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    navMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('click', (event) => {
      if (!navMenu.contains(event.target) && !navButton.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  // N'anime les éléments que si IntersectionObserver est disponible.
  const revealElements = [...document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('js-enabled');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.add('active');
          obs.unobserve(target);
        }
      });
    }, { rootMargin: '0px 0px -35px 0px', threshold: 0.04 });
    revealElements.forEach((element) => observer.observe(element));
  }

  // Certification Voltaire — copie sans gestionnaire inline.
  const codeButton = $('.copy-code[data-copy]');
  if (codeButton) {
    codeButton.addEventListener('click', async () => {
      const value = codeButton.dataset.copy;
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
          copied = true;
        } else {
          const input = document.createElement('textarea');
          input.value = value;
          input.style.cssText = 'position:fixed;left:-9999px;top:0';
          document.body.appendChild(input);
          input.select();
          copied = document.execCommand('copy');
          input.remove();
        }
      } catch (error) {
        console.warn('Copie impossible :', error);
      }
      const node = $('#certification-code');
      if (node && copied) {
        node.textContent = 'Copié !';
        window.setTimeout(() => { node.textContent = value; }, 1400);
      }
    });
  }

  // Assistant IA : protocole Gradio existant conservé.
  const API_BASE = 'https://maaxxe-rag-cv-pdf.hf.space';
  const BOT_ID = 1;
  const popup = $('#chat-popup');
  const bubble = $('#chat-bubble');
  const closeButton = $('#btn-close');
  const messages = $('#messages');
  const input = $('#user-input');
  const sendButton = $('#send-btn');
  const dot = $('.chat-title .dot');
  if (!popup || !bubble || !closeButton || !messages || !input || !sendButton) return;

  let isOpen = false;
  let history = [];
  let waiting = false;

  function toggleChat(force) {
    isOpen = typeof force === 'boolean' ? force : !isOpen;
    popup.classList.toggle('open', isOpen);
    popup.inert = !isOpen;
    popup.setAttribute('aria-hidden', String(!isOpen));
    bubble.setAttribute('aria-expanded', String(isOpen));
    bubble.setAttribute('aria-label', isOpen ? 'Fermer le chat' : 'Ouvrir le chat');
    bubble.textContent = isOpen ? '✕' : '💬';
    document.body.classList.toggle('chat-is-open', isOpen);
    if (isOpen) input.focus({ preventScroll: true });
    else bubble.focus({ preventScroll: true });
  }
  bubble.addEventListener('click', () => toggleChat());
  closeButton.addEventListener('click', () => toggleChat(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      if (isOpen) toggleChat(false);
    }
  });

  function addMessage(content, role, extraClass = '') {
    const message = document.createElement('div');
    message.className = `msg ${role} ${extraClass}`.trim();
    message.textContent = content;
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  function cleanAnswer(raw) {
    return raw
      .replace(/\n\n---\n\*\*📎 Sources[\s\S]*$/g, '')
      .replace(/\[Chunk \d+\][\s\S]*?(?=\n\n|$)/g, '')
      .replace(/^(Selon le contexte[^,]*,\s*|D'après[^,]*,\s*)/gi, '')
      .replace(/📎 Sources[\s\S]*$/g, '')
      .trim();
  }

  async function sendMessage() {
    const question = input.value.trim();
    if (!question || waiting) return;
    waiting = true;
    sendButton.disabled = true;
    addMessage(question, 'user');
    input.value = '';
    input.style.height = '44px';
    const answerNode = addMessage('Réponse en cours…', 'bot typing');

    try {
      const response = await fetch(`${API_BASE}/gradio_api/call/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [question, history, '', 8, 0.85, false, BOT_ID, ''] }),
      });
      if (!response.ok) throw new Error(`Requête HTTP ${response.status}`);
      const job = await response.json();
      if (!job.event_id) throw new Error('Identifiant de réponse manquant');

      const stream = await fetch(`${API_BASE}/gradio_api/call/respond/${job.event_id}`);
      if (!stream.ok || !stream.body) throw new Error(`Flux HTTP ${stream.status}`);

      const reader = stream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      answerNode.classList.remove('typing');
      const processLine = (line) => {
        if (!line.startsWith('data:')) return;
        const raw = line.slice(5).trim();
        if (!raw) return;
        try {
          const payload = JSON.parse(raw);
          if (Array.isArray(payload) && typeof payload[0] === 'string') {
            answer = cleanAnswer(payload[0]);
            answerNode.textContent = answer;
            messages.scrollTop = messages.scrollHeight;
          }
        } catch (_) {
          // Une ligne malformée ne doit pas interrompre la réponse.
        }
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        lines.forEach(processLine);
      }
      buffer += decoder.decode();
      if (buffer) processLine(buffer);
      if (!answer) answer = "Je n'ai pas pu générer de réponse.";
      answerNode.textContent = answer;
      history.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
      history = history.slice(-12);
      if (dot) dot.classList.add('online');
    } catch (error) {
      console.error('Assistant IA :', error);
      answerNode.classList.remove('typing');
      answerNode.textContent = 'Erreur de connexion à l’assistant. Réessayez.';
    } finally {
      waiting = false;
      sendButton.disabled = false;
      if (isOpen) input.focus({ preventScroll: true });
    }
  }
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener('input', () => {
    input.style.height = '44px';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });
})();
