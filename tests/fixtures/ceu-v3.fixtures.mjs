// 10 Fixtures (5 PT + 5 EN) + 3 Real-PDF Simulation Layouts (Multi-page Text, STEM Equations, Scanned Image-only)
export const FIXTURES_10 = [
  // 5 Portuguese (PT) Fixtures
  {
    id: 'pt-01-fisica',
    language: 'pt',
    subject: 'fisica',
    level: 'universitario',
    density: 'completo',
    title: 'Dinâmica e Leis de Newton',
    text: `## Primeira Lei e Inércia
Inércia é a tendência de qualquer corpo manter o seu estado de repouso ou de movimento retilíneo uniforme enquanto a força resultante for nula. Em veículos em Luanda, o cinto de segurança trava o passageiro numa paragem brusca.

## Segunda Lei: Força e Aceleração
F = m × a relaciona a força resultante, a massa e a aceleração. Um carro de 1000 kg que acelera a 2 m/s² exige 2000 N.

## Ação vs Reação
Ação versus reação: as duas forças têm igual intensidade e sentidos opostos, mas actuam sempre em corpos diferentes.`,
  },
  {
    id: 'pt-02-financas',
    language: 'pt',
    subject: 'financas',
    level: 'profissional',
    density: 'completo',
    title: 'Juro Composto e Planeamento em Kwanzas',
    text: `## Capitalização Composta
Juro composto é o rendimento calculado sobre o capital inicial somado aos juros acumulados. M = C × (1 + i)^n determina o montante final após n períodos.

## Juro Simples vs Juro Composto
Ao contrário do juro simples que cresce em linha recta, o juro composto acelera em curva exponencial ao longo dos anos.

## Passos para Criar o Fundo de Emergência
1. Calcular as despesas fixas mensais da família em Kwanzas.
2. Guardar primeiro 20% do rendimento logo no dia do salário.
3. Acumular entre 3 e 6 meses numa aplicação líquida de baixo risco.`,
  },
  {
    id: 'pt-03-algoritmos',
    language: 'pt',
    subject: 'programacao',
    level: 'universitario',
    density: 'completo',
    title: 'Pesquisa Binária e Complexidade',
    text: `## Pensamento Algorítmico
Algoritmo é uma sequência finita e ordenada de passos inequívocos para resolver um problema computacional.

## Pesquisa Linear vs Binária
Pesquisa linear versus pesquisa binária: numa pauta ordenada de 1024 estudantes, a linear exige até 1024 passos enquanto a binária resolve em passos = log2(n), ou seja, no máximo 10 comparações.

## Regras de Implementação
1. Confirmar que a lista está previamente ordenada.
2. Calcular o índice do meio e comparar com o valor procurado.
3. Descartar metade da lista a cada iteração até encontrar o elemento.`,
  },
  {
    id: 'pt-04-biologia',
    language: 'pt',
    subject: 'biologia',
    level: 'secundario',
    density: 'essencial',
    title: 'Fotossíntese e Floresta do Maiombe',
    text: `## Processo Bioquímico
Fotossíntese é a conversão de energia luminosa, água e dióxido de carbono em glicose e oxigénio. 6 CO2 + 6 H2O -> C6H12O6 + 6 O2 resume a reacção global.

## Importância Ecológica
Na Floresta do Maiombe em Cabinda, as plantas absorvem carbono e mantêm o equilíbrio climático e a biodiversidade.`,
  },
  {
    id: 'pt-05-calculo',
    language: 'pt',
    subject: 'matematica',
    level: 'universitario',
    density: 'detalhado',
    title: 'Derivadas e Taxa de Variação',
    text: `## Conceito de Derivada
A derivada mede a taxa de variação instantânea de uma função num ponto. f'(x) = lim (f(x+h) - f(x)) / h define formalmente o declive da recta tangente.

## Regras Básicas de Derivação
1. A derivada de uma constante é zero.
2. Para potências aplica-se a regra d/dx(x^n) = n * x^(n-1).
3. Na regra da cadeia deriva-se a função exterior e multiplica-se pela derivada da interior.

## Aplicações em Engenharia
Engenheiros usam derivadas para optimizar custos, calcular velocidades instantâneas e modelar circuitos eléctricos.`,
  },

  // 5 English (EN) Fixtures
  {
    id: 'en-01-thermodynamics',
    language: 'en',
    subject: 'fisica',
    level: 'universitario',
    density: 'completo',
    title: 'First Law of Thermodynamics',
    text: `## Energy Conservation
The First Law of Thermodynamics states that energy cannot be created or destroyed, only transformed between heat and mechanical work. ΔU = Q - W captures internal energy change.

## Isothermal vs Adiabatic Processes
Isothermal versus adiabatic systems: isothermal processes keep temperature constant whereas adiabatic systems prevent heat exchange with the surroundings.

## Problem Solving Steps
1. Define the system boundary clearly.
2. Identify heat added Q and work done W with proper signs.
3. Compute internal energy change and verify units in Joules.`,
  },
  {
    id: 'en-02-networking',
    language: 'en',
    subject: 'programacao',
    level: 'universitario',
    density: 'completo',
    title: 'TCP vs UDP Network Protocols',
    text: `## Transport Layer Role
Transport protocols deliver application data reliably or rapidly between end hosts across packet-switched IP networks.

## TCP vs UDP Comparison
TCP versus UDP: TCP guarantees ordered packet delivery with retransmissions whereas UDP prioritizes low latency for live video calls and gaming.

## Handshake Sequence
1. Client sends SYN packet to open connection.
2. Server responds with SYN-ACK confirmation.
3. Client replies ACK and data transfer begins.`,
  },
  {
    id: 'en-03-economics',
    language: 'en',
    subject: 'financas',
    level: 'profissional',
    density: 'essencial',
    title: 'Supply, Demand, and Market Equilibrium',
    text: `## Price Discovery Mechanism
Market equilibrium occurs where quantity demanded equals quantity supplied at a clearing price P*.

## Shifts vs Movements
Changes in price cause movements along the curve whereas income or technology shocks shift the entire supply or demand curve.`,
  },
  {
    id: 'en-04-cell-biology',
    language: 'en',
    subject: 'biologia',
    level: 'secundario',
    density: 'completo',
    title: 'Cellular Respiration and ATP',
    text: `## Purpose of Cellular Respiration
Cellular respiration breaks down glucose molecules inside mitochondria to generate usable chemical energy stored in ATP.

## Aerobic vs Anaerobic Pathways
Aerobic respiration requires oxygen and yields high ATP whereas anaerobic fermentation operates without oxygen and yields far less ATP.

## Core Stages
1. Glycolysis splits glucose into pyruvate in the cytoplasm.
2. The Krebs cycle releases carbon dioxide and electron carriers.
3. Oxidative phosphorylation drives bulk ATP synthesis.`,
  },
  {
    id: 'en-05-linear-algebra',
    language: 'en',
    subject: 'matematica',
    level: 'universitario',
    density: 'detalhado',
    title: 'Eigenvalues and Linear Transformations',
    text: `## Geometric Intuition
An eigenvector is a non-zero vector whose direction remains unchanged when a linear transformation matrix A is applied. A * v = λ * v defines this invariant scaling.

## Step by Step Computation
1. Form the characteristic matrix (A - λI).
2. Solve det(A - λI) = 0 to find eigenvalues λ.
3. Substitute each λ back to solve for corresponding eigenvectors v.

## Engineering Applications
Principal Component Analysis, vibration analysis, and PageRank rely directly on dominant eigenvalues.`,
  },
];

// 3 Real-PDF Layout Test Samples
export const PDF_SAMPLE_MULTI_PAGE = [
  {
    page: 1,
    lines: [
      { text: 'Universidade de Luanda · Sebenta Oficial', height: 10, bold: false, y: 790 },
      { text: '1. Introdução à Gestão de Projectos', height: 18, bold: true, y: 720 },
      { text: 'Um projecto é um esforço temporário para criar um produto ou serviço único.', height: 12, bold: false, y: 690 },
      { text: 'O triângulo de restrições liga âmbito, prazo e custo em qualquer obra.', height: 12, bold: false, y: 670 },
      { text: 'Página 1 de 4', height: 9, bold: false, y: 40 },
    ],
  },
  {
    page: 2,
    lines: [
      { text: 'Universidade de Luanda · Sebenta Oficial', height: 10, bold: false, y: 790 },
      { text: '2. Planeamento e Cronograma', height: 18, bold: true, y: 720 },
      { text: 'O caminho crítico determina a duração mínima total do projecto.', height: 12, bold: false, y: 690 },
      { text: '1. Listar entregas principais e decompor em tarefas.', height: 12, bold: false, y: 670 },
      { text: 'Página 2 de 4', height: 9, bold: false, y: 40 },
    ],
  },
  {
    page: 3,
    lines: [
      { text: 'Universidade de Luanda · Sebenta Oficial', height: 10, bold: false, y: 790 },
      { text: '3. Gestão de Riscos e Orçamento', height: 18, bold: true, y: 720 },
      { text: 'Identificar riscos cedo reduz desvios financeiros em Kwanzas.', height: 12, bold: false, y: 690 },
      { text: 'Página 3 de 4', height: 9, bold: false, y: 40 },
    ],
  },
  {
    page: 4,
    lines: [
      { text: 'Universidade de Luanda · Sebenta Oficial', height: 10, bold: false, y: 790 },
      { text: '4. Encerramento e Lições Aprendidas', height: 18, bold: true, y: 720 },
      { text: 'Documentar resultados garante melhoria contínua nas equipas.', height: 12, bold: false, y: 690 },
      { text: 'Página 4 de 4', height: 9, bold: false, y: 40 },
    ],
  },
];

export const PDF_SAMPLE_STEM = [
  {
    page: 1,
    lines: [
      { text: 'Circuitos Eléctricos · Lei de Ohm', height: 18, bold: true, y: 740 },
      { text: 'V = I × R relaciona tensão, corrente e resistência eléctrica.', height: 12, bold: false, y: 700 },
      { text: 'P = V × I calcula a potência dissipada em Watts.', height: 12, bold: false, y: 680 },
    ],
  },
];

export const PDF_SAMPLE_SCANNED = [
  { page: 1, lines: [{ text: '1', height: 10, bold: false, y: 40 }] },
  { page: 2, lines: [{ text: '2', height: 10, bold: false, y: 40 }] },
];
