/* Seu Comando — perguntas da pré-entrevista (triagem). Compartilhado entre a página do candidato e o painel.
   Regra: só perguntas ligadas à vaga. Idade aparece apenas quando a lei exige maioridade para a função. */
(function (g) {
  'use strict';
  // Requisitos que dependem dos marcadores do cargo. elim: true = quem responde "não" é descartado na triagem.
  g.CENTRALIZAR_REQS = [
    { k: 'maior18', se: ['TIP'], nao: ['PEM'], q: 'Você tem 18 anos ou mais? A lei proíbe esta função para menores de 18 anos (Decreto 6.481/2008).', elim: true, curto: 'maioridade exigida' },
    { k: 'motofrete', se: ['PEM'], q: 'Você tem 21 anos ou mais, CNH categoria A há mais de 2 anos e o curso de motofretista (exigências da Lei 12.009/2009)?', elim: true, curto: 'requisitos do motofrete' },
    { k: 'motopropria', se: ['PEM'], q: 'Você tem motocicleta própria com documentação em dia?', elim: false, curto: 'moto própria' },
    { k: 'cnh', se: ['CNH'], nao: ['PEM'], q: 'Você tem CNH válida na categoria exigida para a função?', elim: true, curto: 'CNH exigida' },
    { k: 'viagem', se: ['MOT'], q: 'Você tem disponibilidade para rotas longas e eventuais pernoites?', elim: false, curto: 'viagens' },
    { k: 'conselho', se: ['REG'], q: 'Você tem registro ativo no conselho profissional da área?', elim: true, curto: 'registro no conselho' },
    { k: 'vigilante', se: ['PEV'], q: 'Você tem curso de formação de vigilante e reciclagem válidos?', elim: true, curto: 'curso de vigilante' },
    { k: 'bombeiro', se: ['PEB'], q: 'Você tem formação de bombeiro civil válida?', elim: true, curto: 'formação de bombeiro civil' },
    { k: 'nr10', se: ['PEE'], q: 'Você tem curso NR-10 (segurança em eletricidade) válido?', elim: true, curto: 'NR-10' },
    { k: 'nr35', se: ['NR35'], q: 'Você tem curso de trabalho em altura (NR-35)?', elim: false, curto: 'NR-35' },
    { k: 'empilhadeira', se: ['NR11'], q: 'Você já operou empilhadeira com curso de operador?', elim: false, curto: 'empilhadeira' },
    { k: 'boaspraticas', se: ['ALI'], q: 'Você tem curso de boas práticas na manipulação de alimentos?', elim: false, curto: 'boas práticas' },
    { k: 'caixa', se: ['CAIXA'], q: 'Você já trabalhou com caixa e fechamento de caixa?', elim: false, curto: 'experiência com caixa' },
    { k: 'vendas', se: ['COM'], q: 'Você já trabalhou com vendas e metas?', elim: false, curto: 'experiência em vendas' },
    { k: 'remoto', se: ['TELE'], q: 'Você tem computador e internet estáveis para trabalhar a distância, se for o caso?', elim: false, curto: 'estrutura para teletrabalho' },
    { k: 'noite', se: ['NOT'], q: 'Você pode trabalhar após as 22h, quando a escala exigir?', elim: false, curto: 'trabalho noturno' }
  ];
  g.CENTRALIZAR_REQS_DO_CARGO = function (cargo) {
    var fl = (cargo && cargo.flags) || [];
    return g.CENTRALIZAR_REQS.filter(function (r) {
      return r.se.some(function (x) { return fl.indexOf(x) > -1; }) && !(r.nao || []).some(function (x) { return fl.indexOf(x) > -1; });
    });
  };
  // Perguntas de situação por setor (resposta livre, lida pelo empregador; não filtra).
  g.CENTRALIZAR_SITUACOES = {
    'Alimentação': 'Um cliente diz que o pedido veio errado e está irritado, com a fila cheia. O que você faz?',
    'Comércio': 'O sistema do caixa trava com fila de clientes esperando. Como você age?',
    'Administrativo': 'Você percebe um erro num documento já enviado para um cliente. O que você faz?',
    'Limpeza e conservação': 'Você encontra um objeto de valor esquecido durante a limpeza. O que faz?',
    'Construção civil': 'Você percebe que o equipamento de segurança de um colega está com defeito. O que faz?',
    'Indústria': 'A máquina começa a fazer um barulho diferente no meio da produção. O que você faz?',
    'Transporte e entregas': 'O cliente não está no endereço na hora da entrega. Como você age?',
    'Saúde': 'Um paciente pede uma informação sobre outro paciente. Como você responde?',
    'Beleza': 'A cliente não gostou do resultado do serviço. O que você faz?',
    'Educação e cuidado': 'Uma criança se machuca levemente durante a atividade. Quais são os seus passos?',
    'Segurança e portaria': 'Uma pessoa sem identificação insiste em entrar dizendo que é urgente. O que faz?',
    'Hotelaria e turismo': 'Um hóspede reclama do barulho do quarto ao lado de madrugada. Como você age?',
    'Manutenção e serviços técnicos': 'O conserto vai demorar mais que o combinado com o cliente. O que você faz?',
    'Automotivo': 'Durante o serviço, você encontra outro defeito no veículo. Como procede?',
    'Tecnologia e comunicação': 'Um prazo importante não vai ser cumprido. Quando e como você avisa?',
    'Agro e rural': 'Você nota um animal doente no início do turno. O que faz?'
  };
  g.CENTRALIZAR_SITUACAO_PADRAO = 'Conte uma situação difícil que você viveu no trabalho e como resolveu.';
  g.CENTRALIZAR_ROTULOS = {
    inicio: { imediato: 'Imediato', d15: 'Em até 15 dias', d30: 'Em até 30 dias' },
    fds: { sim: 'Sim', asvezes: 'Às vezes', nao: 'Não' },
    pretensao: { a1800: 'Até R$ 1.800', a2200: 'R$ 1.800 a R$ 2.200', a2800: 'R$ 2.200 a R$ 2.800', m2800: 'Acima de R$ 2.800', combinar: 'A combinar' },
    jaTrabalhou: { nao: 'Não', mesma: 'Sim, na mesma função', outra: 'Sim, em outra função' },
    escolaridade: { fi: 'Fundamental incompleto', fc: 'Fundamental completo', mi: 'Médio incompleto', mc: 'Médio completo', si: 'Superior incompleto', sc: 'Superior completo' },
    transporte: { pe: 'A pé ou bicicleta', onibus: 'Ônibus (vale-transporte)', moto: 'Moto própria', carro: 'Carro próprio' }
  };
})(window);
