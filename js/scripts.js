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

  // Assistant IA : réveil du Space, vérification de disponibilité et Gradio SSE.
  // Ne jamais placer de jeton Hugging Face dans ce fichier public.
  const API_BASE = 'https://maaxxe-rag-cv-pdf.hf.space';
  const BOT_ID = 1;
  const popup = $('#chat-popup');
  const bubble = $('#chat-bubble');
  const closeButton = $('#btn-close');
  const messages = $('#messages');
  const input = $('#user-input');
  const sendButton = $('#send-btn');
  const dot = $('.chat-title .dot');
  const statusLabel = $('#chat-status');
  if (!popup || !bubble || !closeButton || !messages || !input || !sendButton) return;

  let isOpen = false;
  let history = [];
  let waiting = false;
  let spaceReady = false;
  let startupPromise = null;

  function setConnectionStatus(state, label) {
    if (dot) {
      dot.classList.toggle('online', state === 'online');
      dot.classList.toggle('starting', state === 'starting');
      dot.classList.toggle('offline', state === 'offline');
    }
    if (statusLabel) statusLabel.textContent = label;
  }

  async function fetchTimed(url, options = {}, timeoutMs = 9000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  // Une visite sur le Space le réveille normalement s'il était seulement endormi.
  // Le mode no-cors sert ici uniquement à déclencher la visite : son résultat
  // opaque ne prouve ABSOLUMENT PAS que le Space est opérationnel.
  async function triggerWake() {
    try {
      await fetchTimed(API_BASE + '/', {
        method: 'GET', mode: 'no-cors', cache: 'no-store'
      }, 12000);
    } catch (error) {
      console.debug('Tentative de réveil Hugging Face :', error);
    }
  }

  // Le /config Gradio n'est servi correctement que lorsque l'application a démarré.
  async function checkSpaceReady() {
    try {
      const response = await fetchTimed(`${API_BASE}/config`, {
        method: 'GET', cache: 'no-store'
      }, 9000);
      if (!response.ok) return false;
      const config = await response.json();
      return Array.isArray(config.components) && Array.isArray(config.dependencies);
    } catch (error) {
      return false;
    }
  }

  // Une seule séquence de réveil à la fois (page, ouverture du chat et question).
  function ensureSpaceReady(force = false) {
    if (spaceReady && !force) return Promise.resolve(true);
    if (startupPromise) return startupPromise;
    spaceReady = false;
    setConnectionStatus('starting', 'Démarrage…');
    startupPromise = (async () => {
      await triggerWake();
      // Environ 2 minutes de vérification, pour les démarrages à froid.
      for (let attempt = 0; attempt < 25; attempt++) {
        if (await checkSpaceReady()) {
          spaceReady = true;
          setConnectionStatus('online', 'Connecté');
          return true;
        }
        // Renvoie une visite de temps à autre si le réveil a été interrompu.
        if (attempt === 8 || attempt === 16) void triggerWake();
        if (attempt < 24) await sleep(4000);
      }
      setConnectionStatus('offline', 'Indisponible');
      return false;
    })().finally(() => { startupPromise = null; });
    return startupPromise;
  }

  function toggleChat(force) {
    isOpen = typeof force === 'boolean' ? force : !isOpen;
    popup.classList.toggle('open', isOpen);
    popup.inert = !isOpen;
    popup.setAttribute('aria-hidden', String(!isOpen));
    bubble.setAttribute('aria-expanded', String(isOpen));
    bubble.setAttribute('aria-label', isOpen ? 'Fermer le chat' : 'Ouvrir le chat');
    bubble.textContent = isOpen ? '✕' : '💬';
    document.body.classList.toggle('chat-is-open', isOpen);
    if (isOpen) {
      // Réessayez lors de l'ouverture, même si le premier réveil a échoué.
      void ensureSpaceReady();
      input.focus({ preventScroll: true });
    } else {
      bubble.focus({ preventScroll: true });
    }
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
    const node = document.createElement('div');
    node.className = `msg ${role} ${extraClass}`.trim();
    node.textContent = content;
    messages.append(node);
    messages.scrollTop = messages.scrollHeight;
    return node;
  }

  function cleanAnswer(raw) {
    return raw
      .replace(/\n\n---\n\*\*📎 Sources[\s\S]*$/g, '')
      .replace(/\[Chunk \d+\][\s\S]*?(?=\n\n|$)/g, '')
      .replace(/^(Selon le contexte[^,]*,\s*|D'après[^,]*,\s*)/gi, '')
      .replace(/📎 Sources[\s\S]*$/g, '')
      .trim();
  }

  async function submitQuestion(question) {
    const url = `${API_BASE}/gradio_api/call/respond`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [question, history, '', 8, 0.85, false, BOT_ID, ''] })
    };
    let response = await fetchTimed(url, options, 30000);
    // Si HF s'est remis en veille depuis le dernier contrôle, une seule reprise.
    if ([502, 503, 504].includes(response.status)) {
      if (!(await ensureSpaceReady(true))) throw new Error('Space Hugging Face non disponible');
      response = await fetchTimed(url, options, 30000);
    }
    if (!response.ok) throw new Error(`API Gradio HTTP ${response.status}`);
    const job = await response.json();
    if (!job.event_id) throw new Error('event_id Gradio manquant');
    return job.event_id;
  }

  async function readAnswer(eventId, answerNode) {
    const url = `${API_BASE}/gradio_api/call/respond/${encodeURIComponent(eventId)}`;
    const controller = new AbortController();
    // Limite de sécurité pour ne pas laisser l'interface bloquée indéfiniment.
    const timeout = window.setTimeout(() => controller.abort(), 180000);
    let answer = '';
    let finished = false;
    let buffer = '';
    let currentEvent = '';
    let eventData = [];

    const flushEvent = () => {
      if (!eventData.length) { currentEvent = ''; return; }
      const raw = eventData.join('\n');
      if (currentEvent === 'error') throw new Error(`Erreur du flux Gradio : ${raw.slice(0, 180)}`);
      try {
        const result = JSON.parse(raw);
        if (Array.isArray(result) && typeof result[0] === 'string') {
          answer = cleanAnswer(result[0]);
          answerNode.textContent = answer || 'Réponse en cours…';
          messages.scrollTop = messages.scrollHeight;
        }
      } catch (error) {
        if (error instanceof SyntaxError) console.debug('Événement SSE non JSON :', raw);
        else throw error;
      }
      if (currentEvent === 'complete') finished = true;
      eventData = [];
      currentEvent = '';
    };
    const parseLine = (line) => {
      if (!line) { flushEvent(); return; }
      if (line.startsWith('event:')) currentEvent = line.slice(6).trim();
      if (line.startsWith('data:')) eventData.push(line.slice(5).trimStart());
    };

    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok || !response.body) throw new Error(`Flux Gradio HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          lines.forEach(parseLine);
        }
        buffer += decoder.decode();
        if (buffer) parseLine(buffer);
        flushEvent();
      } finally {
        reader.releaseLock();
      }
      if (!answer || !finished) throw new Error('Réponse Gradio incomplète');
      return answer;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function sendMessage() {
    const question = input.value.trim();
    if (!question || waiting) return;
    waiting = true;
    sendButton.disabled = true;
    addMessage(question, 'user');
    input.value = '';
    input.style.height = '44px';
    const answerNode = addMessage('Connexion à l’assistant…', 'bot typing');

    try {
      if (!(await ensureSpaceReady())) {
        throw new Error('Le Space ne s’est pas réveillé. Vérifiez son statut sur Hugging Face.');
      }
      answerNode.textContent = 'Génération de la réponse…';
      const eventId = await submitQuestion(question);
      const answer = await readAnswer(eventId, answerNode);
      answerNode.textContent = answer;
      answerNode.classList.remove('typing');
      history.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
      history = history.slice(-12);
      setConnectionStatus('online', 'Connecté');
    } catch (error) {
      console.error('Assistant IA :', error);
      answerNode.classList.remove('typing');
      answerNode.textContent = error.name === 'AbortError'
        ? 'Le serveur met trop de temps à répondre. Réessayez.'
        : `Connexion impossible : ${error.message || 'réessayez dans un instant.'}`;
      if (!spaceReady) setConnectionStatus('offline', 'Indisponible');
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
      void sendMessage();
    }
  });
  input.addEventListener('input', () => {
    input.style.height = '44px';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });

  // Comme dans l'ancien portfolio : visite immédiate au chargement de la page.
  void ensureSpaceReady();
})();
