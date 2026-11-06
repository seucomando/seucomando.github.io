/* Dados de exemplo do protótipo (fictícios). Nomes, valores e datas servem só para ver a interface cheia. */
window.BROTA_SEED = {
  hoje: '2026-11-05',
  empresa: { nome: 'Padaria Sol', razao: 'Padaria Sol Ltda', cnpj: '[00.000.000/0001-00]', cidade: 'Criciúma/SC', endereco: 'Rua [endereço], Centro' },
  pessoas: [
    { id: 'e1', nome: 'Ana Beatriz Souza', funcao: 'Atendente de balcão', setor: 'Salão', salario: 1980, admissao: '2025-03-03', celular: true, cpf: '***.456.789-**', escala: '07:00' },
    { id: 'e2', nome: 'Joana Ribeiro', funcao: 'Atendente de balcão', setor: 'Salão', salario: 1980, admissao: '2024-08-12', celular: true, cpf: '***.218.334-**', escala: '06:30' },
    { id: 'e3', nome: 'Marcos Lima', funcao: 'Repositor', setor: 'Estoque', salario: 1850, admissao: '2025-06-02', celular: false, cpf: '***.902.115-**', escala: '07:00' },
    { id: 'e4', nome: 'Paulo Henrique Rocha', funcao: 'Padeiro', setor: 'Produção', salario: 2650, admissao: '2022-01-10', celular: false, cpf: '***.611.470-**', escala: '04:00' },
    { id: 'e5', nome: 'Renata Alves', funcao: 'Confeiteira', setor: 'Produção', salario: 2480, admissao: '2023-05-15', celular: false, cpf: '***.375.028-**', escala: '05:00' },
    { id: 'e6', nome: 'Carlos Eduardo Nunes', funcao: 'Auxiliar de padeiro', setor: 'Produção', salario: 1900, admissao: '2024-02-01', celular: false, cpf: '***.140.663-**', escala: '04:00' },
    { id: 'e7', nome: 'Fernanda Lopes', funcao: 'Operadora de caixa', setor: 'Caixa', salario: 2050, admissao: '2023-09-18', celular: true, cpf: '***.587.209-**', escala: '07:00' },
    { id: 'e8', nome: 'Bruno Teixeira', funcao: 'Operador de caixa', setor: 'Caixa', salario: 2050, admissao: '2025-01-06', celular: true, cpf: '***.033.781-**', escala: '13:00' },
    { id: 'e9', nome: 'Patrícia Gomes', funcao: 'Gerente', setor: 'Gestão', salario: 3800, admissao: '2021-04-05', celular: true, cpf: '***.764.552-**', escala: '08:00' },
    { id: 'e10', nome: 'Rafaela Martins', funcao: 'Auxiliar de limpeza', setor: 'Salão', salario: 1750, admissao: '2024-11-04', celular: false, cpf: '***.298.416-**', escala: '06:00' },
    { id: 'e11', nome: 'Thiago Pereira', funcao: 'Entregador', setor: 'Entregas', salario: 1820, admissao: '2025-08-11', celular: true, cpf: '***.857.640-**', escala: '08:00' },
    { id: 'e12', nome: 'Gabriela Santos', funcao: 'Atendente (meio período)', setor: 'Salão', salario: 1100, admissao: '2025-10-01', celular: true, cpf: '***.416.093-**', escala: '13:00' }
  ],
  ponto: {
    e1: ['06:58', '11:02', '12:01', ''], e2: ['06:27', '10:31', '11:30', ''], e3: ['07:47', '', '', ''], e4: ['03:56', '08:00', '09:00', '13:02'],
    e5: ['04:58', '09:01', '10:00', ''], e6: ['', '', '', ''], e7: ['06:55', '11:00', '12:02', ''], e8: ['', '', '', ''],
    e9: ['07:52', '', '', ''], e10: ['05:59', '10:00', '11:01', ''], e11: ['', '', '', ''], e12: ['', '', '', '']
  },
  marcacoesMetodo: { e1: 'celular', e2: 'celular', e3: 'fixo-digital', e4: 'fixo-rosto', e5: 'fixo-rosto', e7: 'celular', e9: 'celular', e10: 'fixo-digital' },
  atestados: [
    { id: 'a1', pessoa: 'e11', inicio: '2026-11-04', dias: 3, foto: '2026-11-04 09:10', original: 'pendente', prazo: '2026-11-07', ciencia: true },
    { id: 'a2', pessoa: 'e5', inicio: '2026-10-28', dias: 1, foto: '2026-10-28 07:40', original: 'entregue', entregueEm: '2026-10-29', prazo: '2026-10-30', ciencia: true },
    { id: 'a3', pessoa: 'e7', inicio: '2026-10-21', dias: 1, foto: '2026-10-21 08:15', original: 'pendente', prazo: '2026-10-23', ciencia: true },
    { id: 'a4', pessoa: 'e1', inicio: '2026-10-14', dias: 1, foto: '2026-10-14 06:50', original: 'entregue', entregueEm: '2026-10-16', prazo: '2026-10-16', ciencia: true }
  ],
  advertencias: [
    { id: 'w1', pessoa: 'e3', data: '2026-11-04', motivo: 'Atraso de 47 minutos em 03/11, sem justificativa (ponto às 07:47).', ciencia: 'app', cienciaEm: '2026-11-04 16:20' },
    { id: 'w2', pessoa: 'e6', data: '2026-10-22', motivo: 'Falta em 21/10 sem justificativa nem atestado.', ciencia: 'recusa', testemunhas: 'Patrícia Gomes e Paulo Henrique Rocha' }
  ],
  faltas: [
    { pessoa: 'e6', data: '2026-10-21', abonada: false },
    { pessoa: 'e3', data: '2026-10-09', abonada: false },
    { pessoa: 'e8', data: '2026-10-30', abonada: false },
    { pessoa: 'e7', data: '2026-10-21', abonada: false, atestado: 'a3' }
  ],
  horasExtras: { e1: 6, e2: 4, e4: 10, e5: 8, e7: 2, e9: 0, e11: 5 },
  holerites: { competencia: '2026-10', status: 'aguardando', lancadoEm: '2026-11-04 18:12', aprovados: [] },
  vales: [
    { id: 'v1', pessoa: 'e1', data: '2026-10-08', tipo: 'produto', desc: 'Bolo de fubá e 6 pães de queijo', valor: 38.5, assinado: '2026-10-08 17:02', comp: '2026-10' },
    { id: 'v2', pessoa: 'e6', data: '2026-10-15', tipo: 'produto', desc: 'Torta salgada de frango (1 kg)', valor: 58, assinado: '2026-10-15 14:10', comp: '2026-10' },
    { id: 'v3', pessoa: 'e8', data: '2026-10-20', tipo: 'adiantamento', desc: 'Adiantamento salarial', valor: 820, assinado: '2026-10-20 13:05', comp: '2026-10' },
    { id: 'v4', pessoa: 'e7', data: '2026-10-25', tipo: 'produto', desc: 'Cesta de café da manhã', valor: 89.9, assinado: '', comp: '2026-10' },
    { id: 'v5', pessoa: 'e8', data: '2026-10-27', tipo: 'produto', desc: 'Café torrado e geleia', valor: 40.4, assinado: '2026-10-27 19:44', comp: '2026-10' },
    { id: 'v6', pessoa: 'e11', data: '2026-11-02', tipo: 'produto', desc: 'Pão francês e frios', valor: 26.4, assinado: '2026-11-02 08:31', comp: '2026-11' },
    { id: 'v7', pessoa: 'e1', data: '2026-11-04', tipo: 'produto', desc: 'Pão de queijo congelado 1 kg', valor: 32.9, assinado: '', comp: '2026-11' }
  ],
  produtos: [
    { id: 'p1', nome: 'Pão de queijo congelado 1 kg', cod: 'PQ-1KG-042', qtd: 38, min: 20, validade: '2027-02-05', preco: 32.9, lote: 'L2611-05' },
    { id: 'p2', nome: 'Bolo de fubá inteiro', cod: 'BF-INT-007', qtd: 6, min: 8, validade: '2026-11-08', preco: 24, lote: 'L0511-02' },
    { id: 'p3', nome: 'Torta salgada de frango (kg)', cod: 'TS-FRG-013', qtd: 4, min: 3, validade: '2026-11-07', preco: 58, lote: 'L0411-01' },
    { id: 'p4', nome: 'Café torrado 500 g', cod: 'CF-500-101', qtd: 22, min: 10, validade: '2027-06-30', preco: 21.5, lote: 'L1009-14' },
    { id: 'p5', nome: 'Farinha de trigo 25 kg (insumo)', cod: 'FT-25-001', qtd: 5, min: 6, validade: '2027-03-15', preco: null, lote: 'L2010-03' },
    { id: 'p6', nome: 'Leite integral 1 L', cod: 'LT-1L-055', qtd: 48, min: 24, validade: '2026-12-02', preco: 5.49, lote: 'L0111-07' },
    { id: 'p7', nome: 'Geleia artesanal de morango 300 g', cod: 'GM-300-020', qtd: 11, min: 6, validade: '2027-01-20', preco: 18.9, lote: 'L2510-09' }
  ],
  checklists: [
    { id: 'c1', setor: 'Salão', nome: 'Abertura do salão', hora: '06:30', resp: 'e2', foto: 'parcial', itens: [
      { t: 'Ligar fornos de exposição e conferir temperatura', foto: true, feito: true, fotoEm: '06:41' },
      { t: 'Higienizar balcão e vitrine', foto: true, feito: true, fotoEm: '06:52' },
      { t: 'Conferir validade dos frios', foto: false, feito: true },
      { t: 'Abrir o caixa com troco de R$ 200', foto: true, feito: false },
      { t: 'Ligar a música ambiente', foto: false, feito: true } ] },
    { id: 'c2', setor: 'Produção', nome: 'Fechamento da produção', hora: '13:00', resp: 'e4', foto: 'todos', itens: [
      { t: 'Limpar a masseira e a modeladora', foto: true, feito: true, fotoEm: '13:04' },
      { t: 'Desligar e limpar os fornos', foto: true, feito: false },
      { t: 'Guardar insumos com etiqueta de validade', foto: true, feito: false },
      { t: 'Registrar a temperatura da câmara fria', foto: true, feito: false } ] },
    { id: 'c3', setor: 'Caixa', nome: 'Fechamento do caixa', hora: '20:00', resp: 'e7', foto: 'parcial', itens: [
      { t: 'Contar o dinheiro e conferir com o relatório do sistema', foto: true, feito: false },
      { t: 'Registrar a sangria', foto: true, feito: false },
      { t: 'Guardar o malote no cofre', foto: false, feito: false } ] }
  ],
  vagas: [
    { id: 'g1', titulo: 'Atendente de balcão', regimeOferta: 'CLT · experiência de 45 dias', aberta: true,
      crit: { regime: 'clt', turnos: ['manha'], km: 8, exp: 0 },
      cands: [
        { n: 'Larissa Costa', regime: 'tanto', turnos: ['manha', 'tarde', 'fds'], km: 7, exp: 2, fone: '(48) 9 8840-2291', contato: true, status: 'admissao' },
        { n: 'Diego Martins', regime: 'free', turnos: ['noite', 'fds'], km: 6, exp: 1, fone: '(48) 9 9177-0382', contato: true },
        { n: 'Camila Duarte', regime: 'clt', turnos: ['manha', 'tarde'], km: 3, exp: 1, fone: '(48) 9 9812-4410', contato: true },
        { n: 'Rogério Vieira', regime: 'clt', turnos: ['manha'], km: 18, exp: 5, fone: '(48) 9 9604-7713', contato: true },
        { n: 'Júlia Fernandes', regime: 'temp', turnos: ['manha', 'tarde', 'fds'], km: 2, exp: 0, fone: '(48) 9 9931-5058', contato: false }
      ] },
    { id: 'g2', titulo: 'Auxiliar de padeiro', regimeOferta: 'Freelancer · fins de semana', aberta: true,
      crit: { regime: 'free', turnos: ['fds'], km: 12, exp: 1 },
      cands: [
        { n: 'Diego Martins', regime: 'free', turnos: ['noite', 'fds'], km: 6, exp: 1, fone: '(48) 9 9177-0382', contato: true, status: 'admissao' },
        { n: 'Igor Batista', regime: 'tanto', turnos: ['manha', 'fds'], km: 9, exp: 3, fone: '(48) 9 9220-6618', contato: true },
        { n: 'Sabrina Melo', regime: 'clt', turnos: ['manha', 'tarde'], km: 4, exp: 2, fone: '(48) 9 9451-3307', contato: true }
      ] }
  ],
  admissoes: [
    { id: 'd1', nome: 'Larissa Costa', funcao: 'Atendente de balcão', modelo: 'experiencia', inicio: '2026-11-10', salario: 1980, cpf: '[000.000.000-00]',
      docs: [
        { n: 'RG ou CNH', v: 'RG 6.123.456 SSP/SC', por: 'candidato', st: 'ok' },
        { n: 'CPF', v: '[000.000.000-00]', por: 'candidato', st: 'ok' },
        { n: 'Endereço', v: 'Rua das Palmeiras, 210, Pinheirinho, Criciúma/SC, CEP 88804-010', por: 'contador', st: 'ok' },
        { n: 'Carteira de Trabalho Digital', v: 'Número do CPF (CTPS digital)', por: 'candidato', st: 'ok' },
        { n: 'Conta para pagamento', v: '', por: '', st: 'pendente' },
        { n: 'Exame admissional (ASO)', v: '', por: '', st: 'pendente' } ],
      hist: [ '04/11 19:22 · Larissa enviou RG, CPF, endereço e CTPS pelo link do WhatsApp', '05/11 10:03 · Contador corrigiu o CEP de 88800-000 para 88804-010', '05/11 10:05 · Contador pediu a chave PIX à candidata' ] },
    { id: 'd2', nome: 'Diego Martins', funcao: 'Auxiliar de padeiro (freelancer)', modelo: 'autonomo', inicio: '2026-11-07', salario: 160, cpf: '[000.000.000-00]',
      docs: [
        { n: 'RG ou CNH', v: 'CNH 0123456789', por: 'candidato', st: 'ok' },
        { n: 'CPF', v: '[000.000.000-00]', por: 'candidato', st: 'ok' },
        { n: 'Cartão CNPJ do MEI', v: 'MEI ativo desde 2024', por: 'candidato', st: 'ok' },
        { n: 'Chave PIX', v: '', por: '', st: 'pendente' } ],
      hist: [ '05/11 08:40 · Diego enviou RG, CPF e cartão do MEI' ] }
  ]
};

/* Base de contratos sugeridos. {{campos}} são preenchidos com os dados da pessoa escolhida. */
window.BROTA_CONTRATOS = [
  { id: 'experiencia', nome: 'Experiência (CLT)', base: 'CLT, arts. 443, 445 e 451',
    titulo: 'Contrato de trabalho por prazo determinado, na modalidade de experiência',
    clausulas: [
      'A EMPREGADA exercerá a função de {{funcao}}, com as atividades descritas na vaga, no estabelecimento da EMPREGADORA em {{cidade}}.',
      'O contrato tem prazo de 45 dias, com início em {{inicio}}, e poderá ser prorrogado uma única vez, sem ultrapassar 90 dias no total (CLT, arts. 445, parágrafo único, e 451). Encerrado o prazo sem rescisão, passa a vigorar por prazo indeterminado.',
      'A jornada é de 44 horas semanais, conforme a escala da empresa, com registro de ponto por programa eletrônico (Portaria MTP 671/2021).',
      'O salário mensal é de R$ {{salario}}, pago até o 5º dia útil do mês seguinte ao trabalhado (CLT, art. 459, § 1º).',
      'Vales de mercadorias e adiantamentos só serão descontados com autorização prévia e por escrito (CLT, art. 462; Súmula 342 do TST).',
      'A EMPREGADA declara ter recebido o regulamento interno, inclusive a regra de entrega do atestado médico original em até 48 horas.' ] },
  { id: 'indeterminado', nome: 'Prazo indeterminado (CLT)', base: 'CLT, arts. 442 a 444 e 58',
    titulo: 'Contrato individual de trabalho por prazo indeterminado',
    clausulas: [
      'A EMPREGADA é admitida em {{inicio}} para a função de {{funcao}}, podendo exercer atividades compatíveis com sua condição pessoal.',
      'A jornada é de até 8 horas diárias e 44 semanais (CLT, art. 58), com intervalo para descanso e alimentação e registro de ponto eletrônico.',
      'O salário mensal é de R$ {{salario}}, pago até o 5º dia útil do mês seguinte.',
      'Em caso de dano causado pela EMPREGADA, o desconto só será feito se houver dolo ou se a possibilidade estiver acordada neste contrato (CLT, art. 462, § 1º).',
      'Os dados pessoais da EMPREGADA serão tratados para cumprir este contrato e as obrigações legais (LGPD, art. 7º, II e V).' ] },
  { id: 'intermitente', nome: 'Intermitente (CLT)', base: 'CLT, arts. 443, § 3º, e 452-A',
    titulo: 'Contrato de trabalho intermitente',
    clausulas: [
      'O EMPREGADO prestará serviços de {{funcao}} de forma não contínua, quando convocado, alternando períodos de trabalho e de inatividade (CLT, art. 443, § 3º).',
      'O valor da hora de trabalho é de R$ {{salario}}, não inferior ao valor horário do salário mínimo nem ao pago aos demais empregados da mesma função (CLT, art. 452-A).',
      'A convocação será feita pelo aplicativo com pelo menos 3 dias corridos de antecedência. O EMPREGADO terá 1 dia útil para responder, e o silêncio vale como recusa (art. 452-A, §§ 1º e 2º).',
      'A recusa da convocação não descaracteriza a subordinação (art. 452-A, § 3º).',
      'Ao final de cada período trabalhado, o EMPREGADO receberá a remuneração, as férias proporcionais com um terço, o 13º proporcional, o repouso semanal remunerado e os adicionais devidos (art. 452-A, § 6º).' ] },
  { id: 'autonomo', nome: 'Autônomo / freelancer', base: 'CLT, art. 442-B; Código Civil, arts. 593 a 609',
    titulo: 'Contrato de prestação de serviços autônomos',
    aviso: 'Atenção: se houver horário fixo, ordens diretas, pessoalidade e pagamento mensal fixo, a Justiça do Trabalho pode reconhecer vínculo de emprego (CLT, art. 3º).',
    clausulas: [
      'O CONTRATADO prestará serviços de {{funcao}} de forma autônoma, com seus próprios métodos e sem subordinação à CONTRATANTE (CLT, art. 442-B).',
      'Os serviços serão prestados nas datas que o CONTRATADO aceitar, podendo recusar convocações sem penalidade.',
      'A remuneração é de R$ {{salario}} por diária, paga mediante nota fiscal ou recibo do MEI em até 5 dias após o serviço.',
      'O CONTRATADO é responsável por seus tributos e contribuições previdenciárias.',
      'Este contrato pode ser encerrado por qualquer das partes, mediante aviso de 7 dias.' ] },
  { id: 'estagio', nome: 'Estágio', base: 'Lei 11.788/2008',
    titulo: 'Termo de compromisso de estágio',
    clausulas: [
      'O estágio de {{funcao}} começa em {{inicio}}, com interveniência obrigatória da instituição de ensino (Lei 11.788/2008, art. 3º, II).',
      'A jornada não passará de 6 horas diárias e 30 semanais (art. 10, II).',
      'A bolsa mensal é de R$ {{salario}}, com auxílio-transporte, obrigatórios no estágio não obrigatório (art. 12).',
      'A CONCEDENTE contratará seguro contra acidentes pessoais em favor do estagiário (art. 9º, IV).',
      'O estagiário terá recesso de 30 dias a cada ano de estágio, e a duração total não passará de 2 anos (arts. 11 e 13).' ] }
];
