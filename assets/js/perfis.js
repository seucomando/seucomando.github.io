/* Centralizar — perfis de exemplo por tipo de negócio. A equipe, os produtos, os checklists, as vagas e os horários
   precisam fazer sentido com a empresa escolhida na landing. Cada perfil sobrepõe o exemplo base (data.js). */
(function (g) {
  'use strict';
  g.CENTRALIZAR_TIPOS = { padaria: 'Padaria e confeitaria', hamburgueria: 'Hamburgueria e lanchonete', restaurante: 'Restaurante' };
  g.CENTRALIZAR_TIPO_DO_NOME = function (n) {
    var t = String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/burg|lanch|smash|sanduich|dog/.test(t)) return 'hamburgueria';
    if (/restaur|bistro|cantina|churrasc|cozinha|grill|marmit|buffet|pizz/.test(t)) return 'restaurante';
    if (/padar|panific|confeit|doce|bolo|cafe/.test(t)) return 'padaria';
    return '';
  };

  // Documentos e prazos sanitários comuns (RDC Anvisa 216/2004). meses: 0 = sem prazo fixado na norma.
  var DOCS = [
    { id: 'm1', nome: 'Manual de Boas Práticas', base: 'RDC 216/2004, item 4.11.1', ult: '2026-03-10', meses: 12, nota: 'Revisão anual sugerida: o manual tem de descrever o que a casa faz de verdade.' },
    { id: 'm2', nome: 'POP de higienização de instalações, equipamentos e móveis', base: 'RDC 216/2004, item 4.11.4, "a"', ult: '2026-03-10', meses: 12 },
    { id: 'm3', nome: 'POP de controle integrado de vetores e pragas', base: 'RDC 216/2004, item 4.11.4, "b"', ult: '2026-03-10', meses: 12 },
    { id: 'm4', nome: 'POP de higienização do reservatório de água', base: 'RDC 216/2004, item 4.11.4, "c"', ult: '2026-03-10', meses: 12 },
    { id: 'm5', nome: 'POP de higiene e saúde dos manipuladores', base: 'RDC 216/2004, item 4.11.4, "d"', ult: '2026-03-10', meses: 12 },
    { id: 'm6', nome: 'Higienização da caixa-d\'água, com registro', base: 'RDC 216/2004, item 4.4.4 (no máximo a cada 6 meses)', ult: '2026-05-12', meses: 6 },
    { id: 'm7', nome: 'Controle de pragas por empresa especializada, com comprovante', base: 'RDC 216/2004, itens 4.3.2 e 4.11.6', ult: '2026-08-20', meses: 3, nota: 'Periodicidade do contrato com a dedetizadora.' },
    { id: 'm8', nome: 'Exames de saúde dos manipuladores (ASO)', base: 'RDC 216/2004, item 4.6.1; NR-7', ult: '2026-01-20', meses: 12 },
    { id: 'm9', nome: 'Curso do responsável pelas atividades de manipulação', base: 'RDC 216/2004, item 4.12.2', ult: '2025-02-14', meses: 0, resp: 'e9', nota: 'Temas mínimos: contaminantes, doenças transmitidas por alimentos, manipulação higiênica e boas práticas.' },
    { id: 'm10', nome: 'Alvará sanitário', base: 'Vigilância sanitária do município', venc: '2027-03-31', meses: 0 }
  ];
  function temps(eq, h1, h2) {
    return [
      { eq: eq[0], data: '2026-11-05', hora: h1, t: 3.6, por: 'e2' },
      { eq: eq[1], data: '2026-11-05', hora: h1, t: -19.5, por: 'e2' },
      { eq: eq[3], data: '2026-11-05', hora: h1, t: 6.8, por: 'e2', acao: 'Porta da vitrine mal fechada. Fechada e conferida de novo; produtos dentro do prazo.' },
      { eq: eq[3], data: '2026-11-05', hora: h2, t: 4.1, por: 'e2' },
      { eq: eq[2], data: '2026-11-05', hora: h2, t: eq[4], por: 'e4' },
      { eq: eq[0], data: '2026-11-04', hora: h1, t: 3.9, por: 'e1' },
      { eq: eq[1], data: '2026-11-04', hora: h1, t: -20.1, por: 'e1' }
    ];
  }

  var P = {
    padaria: {
      agora: '10:40',
      pessoas: { e3: { cargo: 'cozinheiro-geral', funcao: 'Cozinheiro de salgados', setor: 'Produção' }, e9: { funcao: 'Gerente da padaria' }, e1: { funcao: 'Atendente de balcão' } },
      equip: [['q1', 'Câmara fria de insumos', 'frio'], ['q2', 'Freezer de pão de queijo', 'congelado'], ['q3', 'Estufa de salgados', 'quente'], ['q4', 'Vitrine refrigerada de doces', 'frio']],
      quente: 66, h: ['06:40', '07:30'],
      treinos: { e1: { higiene: 92, temperaturas: 100 }, e2: { higiene: 100 }, e3: { higiene: 83, contaminacao: 100, temperaturas: 92 }, e4: { higiene: 100, temperaturas: 100, recebimento: 92 }, e5: { higiene: 100, alergenicos: 100 }, e9: { higiene: 100, temperaturas: 100, recebimento: 100, higienizacao: 100 } }
    },
    hamburgueria: {
      agora: '19:40',
      empresa: { nome: 'Hamburgueria do Bairro', razao: 'Hamburgueria do Bairro Ltda' },
      pessoas: {
        e1: { funcao: 'Atendente de balcão', setor: 'Salão', escala: '17:00' },
        e2: { funcao: 'Atendente de balcão', setor: 'Salão', escala: '16:30' },
        e3: { cargo: 'cozinheiro-geral', funcao: 'Chapeiro', setor: 'Cozinha', salario: 2200, escala: '17:00' },
        e4: { cargo: 'cozinheiro-geral', funcao: 'Chapeiro líder', setor: 'Cozinha', salario: 2650, escala: '16:00' },
        e5: { cargo: 'auxiliar-de-cozinha', funcao: 'Auxiliar de cozinha (preparo e molhos)', setor: 'Cozinha', salario: 1900, escala: '16:00' },
        e6: { cargo: 'auxiliar-de-cozinha', funcao: 'Auxiliar de cozinha (fritadeira)', setor: 'Cozinha', escala: '17:00' },
        e7: { escala: '17:00' },
        e8: { cargo: 'garcom', funcao: 'Garçom', setor: 'Salão', escala: '18:00' },
        e9: { cargo: 'gerente-de-restaurante', funcao: 'Gerente da hamburgueria', escala: '15:00' },
        e10: { setor: 'Limpeza', escala: '15:00' },
        e11: { funcao: 'Motoboy (delivery)', escala: '18:00' },
        e12: { funcao: 'Atendente do delivery (meio período)', escala: '20:00' }
      },
      ponto: { e1: ['16:58', '', '', ''], e2: ['16:27', '', '', ''], e3: ['17:47', '', '', ''], e4: ['15:56', '', '', ''], e5: ['15:58', '', '', ''], e6: ['', '', '', ''], e7: ['16:55', '', '', ''], e8: ['', '', '', ''], e9: ['14:52', '', '', ''], e10: ['14:59', '18:00', '18:30', ''], e11: ['', '', '', ''], e12: ['', '', '', ''] },
      advertencias: { w1: 'Atraso de 47 minutos em 03/11, sem justificativa (ponto às 17:47).' },
      produtos: {
        p1: { nome: 'Molho da casa 250 ml', cod: 'MC-250-011', un: 'pote', validade: '2026-11-20', preco: 14.9 },
        p2: { nome: 'Kit hambúrguer congelado para levar (4 un)', cod: 'KH-4UN-007', un: 'kit', validade: '2027-01-10', preco: 49.9 },
        p3: { nome: 'Cookie da casa', cod: 'CK-UN-013', un: 'un', validade: '2026-11-09', preco: 9.9 },
        p4: { nome: 'Refrigerante lata 350 ml', cod: 'RF-350-101', un: 'lata', validade: '2027-05-30', preco: 7, custo: 3.2 },
        p5: { nome: 'Pão de brioche, pacote com 12 (insumo)', cod: 'PB-12-001', un: 'pct', validade: '2026-11-09', custo: 24, fornecedor: 'Panificadora Sul' },
        p6: { nome: 'Cerveja long neck 355 ml', cod: 'CV-355-055', un: 'un', validade: '2027-03-10', preco: 12.9, custo: 6.4 },
        p7: { nome: 'Água mineral 500 ml', cod: 'AG-500-020', un: 'un', validade: '2027-08-01', preco: 5, custo: 1.6 },
        p8: { nome: 'Queijo cheddar fatiado (insumo)', cod: 'QC-KG-031', un: 'kg', validade: '2026-11-28', custo: 52 },
        p9: { nome: 'Carne bovina para blend (insumo)', cod: 'CB-KG-002', un: 'kg', validade: '2026-11-08', custo: 42.9, fornecedor: 'Frigorífico Sul' },
        p10: { nome: 'Embalagem kraft para hambúrguer (insumo)', cod: 'EK-HB-010', un: 'un', custo: 0.65 }
      },
      vales: { v1: 'Smash burger e batata', v2: 'Combo da casa', v4: 'Kit hambúrguer congelado', v5: 'Molho da casa e cookies', v6: 'Lanche e refrigerante', v7: 'Kit hambúrguer congelado para levar' },
      checklists: [
        { id: 'c1', setor: 'Salão', nome: 'Abertura do salão', hora: '17:00', resp: 'e2', foto: 'parcial', itens: [
          { t: 'Higienizar mesas, balcão e cardápios', foto: true, feito: true, fotoEm: '17:06' },
          { t: 'Conferir temperatura da geladeira de bebidas', foto: true, feito: true, fotoEm: '17:10' },
          { t: 'Ligar o tablet do delivery e conferir o cardápio online', foto: false, feito: true },
          { t: 'Abrir o caixa com troco de R$ 200', foto: true, feito: false },
          { t: 'Repor guardanapos, sachês e canudos', foto: false, feito: true } ] },
        { id: 'c2', setor: 'Cozinha', nome: 'Fechamento da cozinha', hora: '23:30', resp: 'e4', foto: 'todos', itens: [
          { t: 'Raspar e limpar a chapa e a coifa', foto: true, feito: false },
          { t: 'Filtrar ou trocar o óleo da fritadeira (no máximo 180 °C de uso)', foto: true, feito: false },
          { t: 'Guardar blends e molhos com etiqueta de validade', foto: true, feito: false },
          { t: 'Registrar a temperatura do freezer de blends', foto: true, feito: false } ] },
        { id: 'c3', setor: 'Caixa', nome: 'Fechamento do caixa', hora: '23:45', resp: 'e7', foto: 'parcial', itens: [
          { t: 'Contar o dinheiro e conferir com o relatório do sistema', foto: true, feito: false },
          { t: 'Conferir os repasses dos aplicativos de delivery', foto: false, feito: false },
          { t: 'Guardar o malote no cofre', foto: false, feito: false } ] }
      ],
      vagas: {
        g1: { titulo: 'Atendente de balcão', crit: { regime: 'clt', turnos: ['noite'], km: 8, exp: 0 }, turnos: { manha: 'noite', noite: 'tarde' } },
        g2: { titulo: 'Auxiliar de cozinha', cargo: 'auxiliar-de-cozinha', regimeOferta: 'Freelancer · sextas e sábados à noite', salario: 150 }
      },
      admissoes: { d1: { funcao: 'Atendente de balcão' }, d2: { funcao: 'Auxiliar de cozinha (freelancer)', cargo: 'auxiliar-de-cozinha' } },
      equip: [['q1', 'Geladeira da linha de montagem', 'frio'], ['q2', 'Freezer de blends', 'congelado'], ['q3', 'Fritadeira (óleo)', 'oleo'], ['q4', 'Geladeira de molhos', 'frio']],
      quente: 172, h: ['16:40', '17:30'],
      treinos: { e1: { higiene: 92, alergenicos: 100 }, e2: { higiene: 100 }, e3: { higiene: 83, contaminacao: 100, temperaturas: 92, seguranca: 100 }, e4: { higiene: 100, temperaturas: 100, recebimento: 92, seguranca: 100 }, e5: { higiene: 100, alergenicos: 100 }, e9: { higiene: 100, temperaturas: 100, recebimento: 100, higienizacao: 100 } }
    },
    restaurante: {
      agora: '11:40',
      empresa: { nome: 'Restaurante Sabor da Serra', razao: 'Sabor da Serra Restaurante Ltda' },
      pessoas: {
        e1: { cargo: 'garcom', funcao: 'Garçonete', setor: 'Salão', escala: '11:00' },
        e2: { cargo: 'garcom', funcao: 'Garçonete', setor: 'Salão', escala: '10:30' },
        e3: { cargo: 'cozinheiro-geral', funcao: 'Cozinheiro', setor: 'Cozinha', salario: 2300, escala: '09:00' },
        e4: { cargo: 'chefe-de-cozinha', funcao: 'Chefe de cozinha', setor: 'Cozinha', salario: 4200, escala: '08:00' },
        e5: { cargo: 'cozinheiro-geral', funcao: 'Cozinheira', setor: 'Cozinha', salario: 2300, escala: '09:00' },
        e6: { cargo: 'auxiliar-de-cozinha', funcao: 'Auxiliar de cozinha', setor: 'Cozinha', escala: '08:00' },
        e7: { escala: '11:00' },
        e8: { cargo: 'copeiro', funcao: 'Copeiro (bebidas e sobremesas)', setor: 'Salão', escala: '11:00' },
        e9: { cargo: 'gerente-de-restaurante', funcao: 'Gerente do restaurante', escala: '10:00' },
        e10: { setor: 'Limpeza', escala: '07:00' },
        e11: { funcao: 'Motoboy (delivery)', escala: '11:00' },
        e12: { cargo: 'garcom', funcao: 'Garçom (fins de semana e noite)', escala: '18:00' }
      },
      ponto: { e1: ['10:58', '', '', ''], e2: ['10:27', '', '', ''], e3: ['09:47', '', '', ''], e4: ['07:56', '', '', ''], e5: ['08:58', '', '', ''], e6: ['', '', '', ''], e7: ['10:55', '', '', ''], e8: ['', '', '', ''], e9: ['09:52', '', '', ''], e10: ['06:59', '10:00', '10:30', ''], e11: ['', '', '', ''], e12: ['', '', '', ''] },
      advertencias: { w1: 'Atraso de 47 minutos em 03/11, sem justificativa (ponto às 09:47).' },
      produtos: {
        p1: { nome: 'Feijoada congelada 1 kg', cod: 'FJ-1KG-042', un: 'pct', validade: '2027-01-15', preco: 39.9 },
        p2: { nome: 'Lasanha congelada 600 g', cod: 'LS-600-007', un: 'un', validade: '2027-01-05', preco: 32 },
        p3: { nome: 'Pudim de leite (fatia)', cod: 'PD-FT-013', un: 'un', validade: '2026-11-07', preco: 12 },
        p4: { nome: 'Refrigerante lata 350 ml', cod: 'RF-350-101', un: 'lata', validade: '2027-05-30', preco: 7, custo: 3.2 },
        p5: { nome: 'Arroz tipo 1, 5 kg (insumo)', cod: 'AR-5KG-001', un: 'pct', validade: '2027-06-15', custo: 27.5, fornecedor: 'Distribuidora Criciúma' },
        p6: { nome: 'Água mineral 500 ml', cod: 'AG-500-055', un: 'un', validade: '2027-08-01', preco: 5, custo: 1.6 },
        p7: { nome: 'Vinho tinto seco 750 ml', cod: 'VT-750-020', un: 'garrafa', validade: '2029-12-31', preco: 59.9, custo: 31 },
        p8: { nome: 'Filé de frango (insumo)', cod: 'FF-KG-031', un: 'kg', validade: '2026-11-09', custo: 21.9, fornecedor: 'Frigorífico Sul' },
        p10: { nome: 'Marmitex de alumínio (insumo)', cod: 'MX-AL-010', un: 'un', custo: 0.72 }
      },
      vales: { v1: 'Almoço executivo e sobremesa', v2: 'Feijoada congelada 1 kg', v4: 'Lasanha congelada e pudim', v5: 'Almoço executivo', v6: 'Marmita do dia', v7: 'Feijoada congelada 1 kg' },
      checklists: [
        { id: 'c1', setor: 'Salão', nome: 'Abertura do salão', hora: '10:30', resp: 'e2', foto: 'parcial', itens: [
          { t: 'Montar mesas e higienizar cardápios', foto: true, feito: true, fotoEm: '10:36' },
          { t: 'Conferir o balcão térmico do buffet acima de 60 °C', foto: true, feito: true, fotoEm: '10:52' },
          { t: 'Conferir reservas e pedidos de marmita do dia', foto: false, feito: true },
          { t: 'Abrir o caixa com troco de R$ 200', foto: true, feito: false },
          { t: 'Ligar a música ambiente', foto: false, feito: true } ] },
        { id: 'c2', setor: 'Cozinha', nome: 'Fechamento da cozinha', hora: '15:30', resp: 'e4', foto: 'todos', itens: [
          { t: 'Limpar fogões, chapa e coifa', foto: true, feito: false },
          { t: 'Resfriar as sobras de 60 °C a 10 °C em até 2 horas e etiquetar', foto: true, feito: false },
          { t: 'Guardar insumos com etiqueta de validade', foto: true, feito: false },
          { t: 'Registrar a temperatura da câmara fria', foto: true, feito: false } ] },
        { id: 'c3', setor: 'Caixa', nome: 'Fechamento do caixa', hora: '15:45', resp: 'e7', foto: 'parcial', itens: [
          { t: 'Contar o dinheiro e conferir com o relatório do sistema', foto: true, feito: false },
          { t: 'Registrar a sangria', foto: true, feito: false },
          { t: 'Guardar o malote no cofre', foto: false, feito: false } ] }
      ],
      vagas: {
        g1: { titulo: 'Garçom ou garçonete', cargo: 'garcom', regimeOferta: 'CLT · experiência de 45 dias · almoço', salario: 1950 },
        g2: { titulo: 'Auxiliar de cozinha', cargo: 'auxiliar-de-cozinha', regimeOferta: 'Freelancer · fins de semana', salario: 160 }
      },
      admissoes: { d1: { funcao: 'Garçonete', cargo: 'garcom', salario: 1950 }, d2: { funcao: 'Auxiliar de cozinha (freelancer)', cargo: 'auxiliar-de-cozinha' } },
      equip: [['q1', 'Câmara fria', 'frio'], ['q2', 'Freezer', 'congelado'], ['q3', 'Balcão térmico do buffet', 'quente'], ['q4', 'Geladeira de sobremesas', 'frio']],
      quente: 68, h: ['09:40', '10:30'],
      treinos: { e1: { higiene: 92, alergenicos: 100 }, e2: { higiene: 100 }, e3: { higiene: 83, contaminacao: 100, temperaturas: 92 }, e4: { higiene: 100, temperaturas: 100, recebimento: 92, higienizacao: 100 }, e5: { higiene: 100, alergenicos: 100 }, e9: { higiene: 100, temperaturas: 100, recebimento: 100 } }
    }
  };

  function merge(lista, mapa) { (lista || []).forEach(function (o) { var m = mapa && mapa[o.id]; if (m) Object.keys(m).forEach(function (k) { o[k] = m[k]; }); }); }
  g.CENTRALIZAR_SEED = function (tipo) {
    var s = JSON.parse(JSON.stringify(g.BROTA_SEED)), p = P[tipo] || P.padaria;
    s.tipo = P[tipo] ? tipo : 'padaria'; s.agoraDemo = p.agora;
    if (p.empresa) Object.keys(p.empresa).forEach(function (k) { s.empresa[k] = p.empresa[k]; });
    merge(s.pessoas, p.pessoas); merge(s.produtos, p.produtos); merge(s.admissoes, p.admissoes);
    if (p.ponto) s.ponto = p.ponto;
    if (p.checklists) s.checklists = p.checklists;
    (s.advertencias || []).forEach(function (w) { if (p.advertencias && p.advertencias[w.id]) w.motivo = p.advertencias[w.id]; });
    (s.vales || []).forEach(function (v) { if (p.vales && p.vales[v.id]) v.desc = p.vales[v.id]; });
    (s.vagas || []).forEach(function (v) {
      var m = p.vagas && p.vagas[v.id]; if (!m) return;
      Object.keys(m).forEach(function (k) { if (k !== 'turnos') v[k] = m[k]; });
      if (m.turnos) v.cands.forEach(function (c) { c.turnos = c.turnos.map(function (t) { return m.turnos[t] || t; }); });
    });
    // Boas práticas de alimentos (adicional): equipamentos, temperaturas, documentos e treinamentos
    var eq = p.equip.map(function (e) { return { id: e[0], nome: e[1], tipo: e[2] }; });
    s.bp = { ativo: true, equip: eq, temps: temps([eq[0].id, eq[1].id, eq[2].id, eq[3].id, p.quente], p.h[0], p.h[1]), docs: JSON.parse(JSON.stringify(DOCS)) };
    s.treinos = {};
    Object.keys(p.treinos || {}).forEach(function (pid) { s.treinos[pid] = {}; Object.keys(p.treinos[pid]).forEach(function (c, i) { s.treinos[pid][c] = { nota: p.treinos[pid][c], em: ['2026-09-10', '2026-09-24', '2026-10-08', '2026-10-22'][i % 4] }; }); });
    return s;
  };
})(window);
