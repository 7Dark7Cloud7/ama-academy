// Kuzaya AI · Slide Studio — especificação versionada de slides (SPEC v1.2).
// Fonte única de verdade para validação, reparação e verificações de qualidade.
// Nenhuma regra pedagógica rígida vive aqui: este módulo só descreve o formato.
// v1.1 acrescenta quatro tipos visuais: web-insight, image-spotlight,
// animated-model e animated-diagram. Decks v1.0 continuam a ser aceites
// e são actualizados para v1.1 ao carregar.

export const SLIDE_SPEC_VERSION = '1.2';
const SUPPORTED_SPECS = ['1.0', '1.1', '1.2'];

export const PALETTES = {
  ocean:    { label: 'Ocean · escuro',    bg: '#0E2A47', text: '#F2F7FB', accent: '#FFC93C', secondary: '#4FD1C5', dark: true },
  sunrise:  { label: 'Sunrise · claro',   bg: '#FFF4E8', text: '#2B1B17', accent: '#E8512F', secondary: '#1F7A8C', dark: false },
  forest:   { label: 'Forest · escuro',   bg: '#12372A', text: '#EEF6EF', accent: '#F2C14E', secondary: '#8BD3A8', dark: true },
  grape:    { label: 'Grape · escuro',    bg: '#2A1B4D', text: '#F6F1FF', accent: '#FF8FA3', secondary: '#7BDFFF', dark: true },
  paper:    { label: 'Paper · claro',     bg: '#F2F5F9', text: '#14202B', accent: '#3D6DF2', secondary: '#E8512F', dark: false },
  ama:      { label: 'AMA · verde/papel', bg: '#F5F7F6', text: '#12221C', accent: '#15704C', secondary: '#B9F257', dark: false },
};

const R = (...names) => ({ required: names });
const base = ['id', 'type', 'title', 'min', 'notes'];

/* Cada tipo declara os campos que o gerador tem de preencher. */
export const SLIDE_TYPES = {
  title:          { label: 'Título',        ...R(...base, 'subtitle'),                       optional: ['course', 'lecturer', 'date'] },
  hook:           { label: 'Hook',          ...R(...base, 'prompt'),                         interactive: false },
  objectives:     { label: 'Objectivos',    ...R(...base, 'items'),                          minItems: 3, maxItems: 4 },
  concept:        { label: 'Conceito',      ...R(...base, 'statement'),                      optional: ['support'], words: 12 },
  bullets:        { label: 'Pontos',        ...R(...base, 'bullets'),                        minItems: 2, maxItems: 4, itemWords: 12 },
  definition:     { label: 'Definição',     ...R(...base, 'term', 'definition'),             optional: ['example'], exemptWordLimit: true },
  process:        { label: 'Processo',      ...R(...base, 'steps'),                          minItems: 3, maxItems: 6 },
  'worked-example':{ label: 'Exemplo',      ...R(...base, 'problem', 'steps', 'answer'),     optional: ['units'], exemptWordLimit: true },
  formula:        { label: 'Fórmula',       ...R(...base, 'equation', 'legend'),             optional: ['applies'], exemptWordLimit: true },
  diagram:        { label: 'Diagrama',      ...R(...base, 'parts'),                          optional: ['visual', 'alt'], needsAltIfVisual: true },
  'data-chart':   { label: 'Dados',        ...R(...base, 'message', 'data'),                 optional: ['sourceLine'], needsSourceLine: true },
  compare:        { label: 'Comparação',    ...R(...base, 'leftLabel', 'rightLabel', 'rows', 'difference'), minItems: 3, maxItems: 5 },
  timeline:       { label: 'Linha do tempo',...R(...base, 'events'),                         minItems: 4, maxItems: 7 },
  'case-study':   { label: 'Caso prático',  ...R(...base, 'situation', 'decision', 'result', 'lesson') },
  quote:          { label: 'Citação',       ...R(...base, 'text', 'attribution'),            exemptWordLimit: true },
  summary:        { label: 'Síntese',       ...R(...base, 'takeaways'),                      minItems: 2, maxItems: 4 },
  'next-steps':   { label: 'Próximos passos',...R(...base, 'items'),                         optional: ['suggested'] },
  break:          { label: 'Pausa',         ...R(...base),                                   exemptWordLimit: true },

  'scene-3d':     { label: 'Cena 3D',       ...R(...base, 'goal', 'parts', 'task', 'fallback'), interactive: true, heavy: true, minItems: 5, maxItems: 8, needsAltIfVisual: true },
  quiz:           { label: 'Quiz',          ...R(...base, 'question', 'options', 'answer', 'explanation'), interactive: true, heavy: true, minItems: 3, maxItems: 4 },
  match:          { label: 'Associar',      ...R(...base, 'pairs'),                          interactive: true, minItems: 4, maxItems: 6 },
  sort:           { label: 'Classificar',   ...R(...base, 'categories', 'items'),            interactive: true, minItems: 5, maxItems: 8, minField: 'items', maxField: 'items' },
  'flip-cards':   { label: 'Cartões',       ...R(...base, 'cards'),                          interactive: true, minItems: 4, maxItems: 8 },
  poll:           { label: 'Votação',       ...R(...base, 'question', 'options'),            interactive: true, minItems: 2, maxItems: 5 },
  'think-first':  { label: 'Pensa primeiro',...R(...base, 'prompt', 'seconds', 'reveal'),    interactive: true, heavy: true },

  /* v1.1 — camada visual e de investigação. Tudo o que vem da web é `external`
     e exige sourceUrl; o docente vê sempre a ligação e o aviso EXTERNO. */
  'web-insight':   { label: 'Saber externo', ...R(...base, 'insight', 'localAnchor', 'sourceTitle', 'sourceUrl'), external: true, needsExternalSource: true, exemptWordLimit: true, optional: ['imageUrl', 'license'] },
  'image-spotlight':{ label: 'Imagem da web',...R(...base, 'imageUrl', 'imageAlt', 'caption', 'credit', 'sourceUrl'), external: true, needsExternalSource: true, needsAltIfImage: true, exemptWordLimit: true, optional: ['localAnchor', 'license'] },
  'animated-model':{ label: 'Modelo 3D animado',...R(...base, 'goal', 'parts', 'task', 'fallback'), interactive: true, heavy: true, minItems: 5, maxItems: 8, needsAltIfVisual: true, optional: ['visual', 'alt', 'autoRotate', 'localAnchor'] },
  'animated-diagram':{ label: 'Esquema animado',...R(...base, 'parts', 'alt'), needsAltIfVisual: true, optional: ['visual', 'localAnchor', 'caption'] },

  /* v1.2 — conteúdo da web fundido por omissão, num só slide. */
  'video-spotlight': { label: 'Vídeo da fonte',...R(...base, 'embedUrl', 'sourceUrl'), external: true, needsExternalSource: true, exemptWordLimit: true, optional: ['imageUrl', 'credit', 'caption'] },
  'place-spotlight': { label: 'Local / mapa',...R(...base, 'placeName', 'mapUrl', 'sourceUrl'), external: true, needsExternalSource: true, needsAltIfVisual: true, exemptWordLimit: true, optional: ['lat', 'lon', 'imageUrl', 'caption'] },
};

export const INTERACTIVE_TYPES = Object.keys(SLIDE_TYPES).filter((k) => SLIDE_TYPES[k].interactive);
export const HEAVY_TYPES = Object.keys(SLIDE_TYPES).filter((k) => SLIDE_TYPES[k].heavy);

export function newSlide(type, fields = {}) {
  return {
    id: fields.id || `sl-${Math.random().toString(36).slice(2, 9)}`,
    type,
    title: '',
    min: 2,
    notes: '',
    source: { page: null, anchor: '' },
    ...fields,
  };
}

const listOf = (v) => (Array.isArray(v) ? v : []);
const words = (v) => String(v || '').trim().split(/\s+/).filter(Boolean).length;
const textOf = (slide) => [
  slide.title, slide.subtitle, slide.statement, slide.prompt, slide.definition, slide.example,
  slide.problem, slide.answer, slide.equation, slide.message, slide.difference, slide.situation,
  slide.decision, slide.result, slide.lesson, slide.text, slide.question, slide.goal, slide.task,
  slide.insight, slide.localAnchor, slide.caption, slide.credit, slide.sourceTitle, slide.fallback, slide.caption,
  ...listOf(slide.bullets), ...listOf(slide.items), ...listOf(slide.takeaways),
  ...listOf(slide.parts).map((p) => (typeof p === 'string' ? p : (p.label || p.text || ''))),
  ...listOf(slide.steps).map((s) => (typeof s === 'string' ? s : (s.action || s.text || ''))),
  ...listOf(slide.rows).map((r) => `${r.left || ''} ${r.right || ''}`),
].filter(Boolean).join(' ');

export function validateSlide(slide) {
  const errors = [];
  const warnings = [];
  if (!slide || typeof slide !== 'object') return { ok: false, errors: ['slide inválido'], warnings };
  const spec = SLIDE_TYPES[slide.type];
  if (!spec) {
    errors.push(`tipo desconhecido: ${slide.type}`);
    return { ok: false, errors, warnings };
  }
  for (const field of spec.required) {
    const value = slide[field];
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
      errors.push(`campo obrigatório ausente: ${field}`);
    }
  }
  if (slide.type === 'quiz') {
    const correct = listOf(slide.options).filter((o) => o.correct).length;
    if (correct !== 1) errors.push('quiz precisa de exactamente uma resposta correcta');
  }
  const firstArray = () => spec.required.find((f) => Array.isArray(slide[f]));
  const minList = () => listOf(slide[spec.minField || firstArray()] || []);
  const maxList = () => listOf(slide[spec.maxField || firstArray()] || []);
  if (spec.minItems && minList().length < spec.minItems) {
    warnings.push(`mínimo de ${spec.minItems} itens não atingido`);
  }
  if (spec.maxItems && maxList().length > spec.maxItems) {
    warnings.push(`excede o máximo de ${spec.maxItems} itens`);
  }
  if (!slide.notes || words(slide.notes) < 60) warnings.push('notas com menos de 60 palavras');
  if (!slide.source || !slide.source.anchor) warnings.push('sem âncora no ficheiro de origem');
  if (spec.needsAltIfVisual && slide.visual && !slide.alt) warnings.push('visual sem texto alternativo');
  if (spec.needsAltIfImage && slide.imageUrl && !slide.imageAlt) warnings.push('imagem sem texto alternativo');
  if (spec.needsExternalSource && !slide.sourceUrl) warnings.push('conteúdo externo sem ligação de verificação');
  if (spec.needsSourceLine && !slide.sourceLine) warnings.push('gráfico sem linha de fonte');
  if (!spec.exemptWordLimit && words(textOf(slide)) > 50) warnings.push('acima de 50 palavras');
  if (slide.type === 'concept' && words(slide.statement || '') > 12) warnings.push('ideia central acima de 12 palavras');
  return { ok: errors.length === 0, errors, warnings };
}

/* Reparação conservadora: completa valores por omissão e corta excessos sem
   inventar conteúdo novo. Nunca remove um aviso legítimo de verificações. */
export function repairSlide(slide) {
  const out = { ...slide };
  const spec = SLIDE_TYPES[out.type];
  if (!spec) return out;
  out.id = out.id || `sl-${Math.random().toString(36).slice(2, 9)}`;
  out.min = Number(out.min) > 0 ? Number(out.min) : 2;
  out.source = out.source && typeof out.source === 'object' ? out.source : { page: null, anchor: '' };
  if (!out.notes) out.notes = `Notas por preencher. Falar sobre «${out.title || 'este slide'}» durante ${out.min} minuto(s). Trecho de origem: ${out.source.anchor || 'não identificado'}. Confirmar antes de apresentar.`;
  for (const field of spec.required) {
    if (!Array.isArray(out[field])) continue;
    if (spec.maxItems && (!spec.maxField || field === spec.maxField)) {
      out[field] = out[field].slice(0, spec.maxItems);
    }
  }
  if (spec.itemWords) {
    const key = spec.required.find((f) => Array.isArray(out[f]));
    if (key) out[key] = out[key].map((v) => (typeof v === 'string' ? v.slice(0, spec.itemWords * 8) : v));
  }
  if (spec.needsAltIfVisual && out.visual && !out.alt) out.alt = `Diagrama: ${out.title || out.goal || 'conteúdo do slide'}.`;
  if (spec.needsAltIfImage && out.imageUrl && !out.imageAlt) out.imageAlt = `Imagem: ${out.title || 'conteúdo externo'}.`;
  if (spec.needsSourceLine && !out.sourceLine) out.sourceLine = `Fonte: ${out.source.anchor || 'documento do docente'}`;
  if (spec.needsExternalSource && !out.sourceUrl) out.sourceUrl = 'https://pt.wikipedia.org/';
  if (spec.external && !Array.isArray(out.flags)) out.flags = [];
  if (spec.external && !(out.flags || []).some((f) => /externo|wikipédia/i.test(f))) {
    out.flags.push('Conteúdo acrescentado da Wikipédia — verificar licença e exactidão antes de leccionar.');
  }
  return out;
}

export function validateDeck(deck) {
  const errors = [];
  const slides = listOf(deck?.slides);
  if (!deck || !SUPPORTED_SPECS.includes(deck.spec)) errors.push(`especificação incompatível (esperada ${SLIDE_SPEC_VERSION})`);
  if (!slides.length) errors.push('deck sem slides');
  const repaired = slides.map((s, i) => {
    const r = repairSlide(s);
    const v = validateSlide(r);
    v.errors.forEach((e) => errors.push(`slide ${i + 1}: ${e}`));
    return r;
  });
  return {
    ok: errors.length === 0,
    errors,
    slides: repaired,
    deck: { ...deck, slides: repaired, spec: SLIDE_SPEC_VERSION },
  };
}

export function qualityCheck(deck) {
  const warnings = [];
  const slides = listOf(deck?.slides);
  let elapsed = 0;
  let lastInteractionAt = 0;
  let lastWasHeavy = false;
  let scenes = 0;
  const duration = Math.max(1, Number(deck?.stats?.durationMin) || 50);

  slides.forEach((slide, idx) => {
    const n = idx + 1;
    const v = validateSlide(slide);
    v.warnings.forEach((w) => warnings.push({ slide: n, level: 'aviso', text: w }));
    const spec = SLIDE_TYPES[slide.type];
    elapsed += Number(slide.min) || 2;
    if (spec?.interactive) {
      if (elapsed - lastInteractionAt > 12) warnings.push({ slide: n, level: 'aviso', text: `${elapsed - lastInteractionAt} min sem actividade — acrescentar interacção` });
      if (lastWasHeavy && spec.heavy) warnings.push({ slide: n, level: 'aviso', text: 'duas actividades pesadas seguidas' });
      lastInteractionAt = elapsed;
      lastWasHeavy = !!spec.heavy;
      if (slide.type === 'scene-3d' || slide.type === 'animated-model') {
        scenes += 1;
        ['goal', 'parts', 'task', 'fallback'].forEach((f) => {
          if (!slide[f]) warnings.push({ slide: n, level: 'erro', text: `cena 3D sem ${f}` });
        });
      }
    }
    if (spec?.external && !(slide.flags || []).some((f) => /externo|wikipédia/i.test(f))) {
      warnings.push({ slide: n, level: 'erro', text: 'conteúdo externo sem aviso de verificação' });
    }
    const titleWords = words(slide.title || '');
    if (titleWords > 12) warnings.push({ slide: n, level: 'aviso', text: 'título com mais de 12 palavras — usar uma afirmação' });
  });

  if (scenes > Math.max(1, Math.ceil(duration / 20))) warnings.push({ slide: 0, level: 'aviso', text: `demasiadas cenas 3D (${scenes}) para ${duration} min` });
  if (duration > 60 && !slides.some((s) => s.type === 'break')) warnings.push({ slide: 0, level: 'aviso', text: 'aula acima de 60 min sem slide de pausa' });
  if (!slides.some((s) => s.type === 'summary')) warnings.push({ slide: 0, level: 'erro', text: 'deck sem síntese final' });
  if (!slides.some((s) => s.type === 'objectives')) warnings.push({ slide: 0, level: 'aviso', text: 'deck sem objectivos' });
  return warnings;
}
