# CEU Academy — Plataforma Universitária & Projetor PDF → Slides com IA

> **APP FEITO PELA HORIZONTE FUTURO** · Ecossistema digital alinhado ao Cartão Nacional de Estudante Universitário ([ceu.ao](https://ceu.ao/)) em Angola.

## Ligações em Produção

- **CEU Academy (Azul Universitário `#00217E` / `#00A4DC`):** https://ceu-academy.com · https://ceu-academy.vercel.app
- **AMA Academy (Verde Esmeralda):** https://ama-academy-three.vercel.app

---

## Principais Funcionalidades (MVP)

### 1. Projetor Inteligente PDF & Texto → Slides (`#/projetor`)
- **Interface simplificada e automática:** 5 controlos principais (`+ Novo`, `Slides / Leitura / Grelha`, chip do tipo de documento, `✎ Editar`, `⋯ Mais`, `▶ Projetar`) com ponteiro laser automático, otimização pedagógica automática e modo Ecrã Inteiro Cinema limpo.
- **Deteção Inteligente de Documentos (`engine/doc-analyzer.js`):** Reconhece automaticamente **Ata de Reunião**, **Relatório**, **Regulamento**, **Artigo Científico**, **Plano** ou **Aula**, extraindo decisões, responsáveis, prazos e mensagem central.
- **Reescrita Pedagógica + Auto-Análise Mayer/Gamma (`engine/ai-engine.js`):**
  - Nunca copia texto cru do PDF: adapta para ensinar com intuição simples, exemplos em Angola e pontos de atenção.
  - Auto-análise contínua (`autoSelfAnalyzeAndHeal`): evita layouts repetidos, reduz sobrecarga cognitiva, destaca métricas em **Stat Spotlight**, organiza ideias em **Bento Grid** e gera guião de voz por slide.
- **Descrição por Áudio ou Texto (`🎙 Falar`):** O docente pode ditar por microfone (Web Speech API `pt-PT`) ou escrever como quer os slides, o tema e o tipo de imagens.
- **Imagens Coerentes & 3D Interativo (`engine/web-enrichment.js`, `engine/nucleo-3d.js`):**
  - Pesquisa bilingue PT→EN na Wikimedia Commons com filtro rigoroso de relevância + troca de imagem por slide.
  - 8 modelos 3D interativos coerentes com a matéria (`physics`, `finance`, `code`, `bio`, `meeting`, `wave`, `gyro`, `core`).
- **Ferramentas de Sala de Aula & Exportação (`engine/export-engine.js`):**
  - Narrador por voz automático (`V`), Pulso da Turma em tempo real (`P`), Revelar 1-a-1 (`S`), Quadro/Caneta (`D`), Cortina (`B`), Cronómetro 60s (`T`), gestão de slides (`+ Slide`, mover, apagar), partilha por link (`?deck=`), e exportação para **PowerPoint `.pptx`**, **PDF**, **HTML Offline** e **Ficha do Aluno**.

### 2. Website Universitário & Base de Dados MVP
- **Navegação MVP limpa:** `Início` (`#/ceu-inicio`) · `Projetor IA` (`#/projetor`) · `Cursos` (`#/catalogo`) · `Cartão CEU` (`#/cartao-ceu`).
- **Cartão Digital de Estudante CEU (`#/cartao-ceu`):** Personalização e gravação do cartão universitário (ISPTEC, UCAN, Universidade de Luanda, UMA, IMETRO, INSUTEC, Unibelas, UGS) + biblioteca de apresentações guardadas.
- **Base de Dados Híbrida (`engine/mvp-db.js`, `server.js`, `api/mvp.js`, `supabase/schema.sql`):**
  - **Offline-first no navegador:** IndexedDB (`ceu_academy_mvp_v1`) + backup `.json`.
  - **Backend REST `/api/mvp`:** Persistência local em `data/mvp-db.json` (Express) e Vercel Serverless Function pronta para **Supabase** (basta executar `supabase/schema.sql` e definir `SUPABASE_URL` + `SUPABASE_ANON_KEY`).

---

## Arquitetura do Projeto

```text
├── ceu.html / index.html     # Entrada CEU Academy (data-brand="ceu")
├── ama.html                  # Entrada AMA Academy (Verde Esmeralda)
├── ama-projector.js          # Estúdio & Projetor Cinema PDF → Slides
├── ama-ceu.js                # Landing CEU, cursos universitários e Cartão Digital
├── brand-ceu.css             # Sistema de design CEU (#00217E + #00A4DC, Claro/Escuro)
├── slide-ingenium.css        # Layouts 16:9 (Stat Spotlight, Bento Grid, 3D, Fullscreen)
├── server.js                 # Servidor Express + API REST /api/mvp (file DB)
├── api/mvp.js                # Vercel Serverless API (/api/mvp -> Supabase / edge)
├── supabase/schema.sql       # Schema PostgreSQL + RLS para produção
├── engine/
│   ├── pdf-engine.js         # PDF.js layout-aware + OCR fallback
│   ├── doc-analyzer.js       # Classificador inteligente (Ata, Relatório, Norma, Aula)
│   ├── ai-engine.js          # Reescrita pedagógica, Brief áudio/texto & Auto-Análise Mayer
│   ├── web-enrichment.js     # Fusão Wikipédia + imagens coerentes Wikimedia + YouTube
│   ├── nucleo-3d.js          # 8 modelos 3D interativos sem dependências externas
│   ├── export-engine.js      # Exportação .pptx, PDF, HTML Offline & Ficha do Aluno
│   ├── mvp-db.js             # IndexedDB + sincronização automática /api/mvp
│   └── branding.js           # Controlo dual-brand CEU / AMA
└── tests/
    └── ceu-v3.test.mjs       # Suite de testes (PDF, Outline, DocAnalyzer, Mayer, 3D)
```

---

## Executar e Testar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor local + API MVP (http://127.0.0.1:4210)
PORT=4210 node server.js

# Correr todos os testes automatizados (12/12)
node --test engine/projector-engine.test.mjs engine/quiz-engine.test.mjs tests/ceu-v3.test.mjs
```
