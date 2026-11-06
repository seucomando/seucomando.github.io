/* Centralizar — motor de cláusulas do contrato de trabalho.
   Monta o contrato em camadas: base protetiva (todo contrato), cláusulas pelos marcadores de risco do cargo,
   cláusulas do setor e as atribuições do cargo. Tudo o que vem do usuário passa por esc(). */
(function (g) {
  'use strict';
  var ORD = ['PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÉTIMA', 'OITAVA', 'NONA', 'DÉCIMA', 'DÉCIMA PRIMEIRA', 'DÉCIMA SEGUNDA', 'DÉCIMA TERCEIRA', 'DÉCIMA QUARTA', 'DÉCIMA QUINTA', 'DÉCIMA SEXTA', 'DÉCIMA SÉTIMA', 'DÉCIMA OITAVA', 'DÉCIMA NONA', 'VIGÉSIMA', 'VIGÉSIMA PRIMEIRA', 'VIGÉSIMA SEGUNDA', 'VIGÉSIMA TERCEIRA', 'VIGÉSIMA QUARTA', 'VIGÉSIMA QUINTA', 'VIGÉSIMA SEXTA', 'VIGÉSIMA SÉTIMA', 'VIGÉSIMA OITAVA', 'VIGÉSIMA NONA', 'TRIGÉSIMA'];

  // Cláusulas próprias de cada setor (comportamento esperado e proteção do negócio).
  var SETOR = {
    'Alimentação': ['É vedado à(ao) EMPREGADA(O) consumir, retirar ou oferecer a terceiros alimentos, bebidas ou insumos da EMPREGADORA sem autorização expressa, sem prejuízo da refeição fornecida pela empresa.', 'A(O) EMPREGADA(O) seguirá as fichas técnicas, receitas, porcionamentos e padrões de apresentação definidos pela EMPREGADORA, que constituem informação confidencial do negócio.', 'Informações sobre alergênicos e ingredientes serão repassadas aos clientes exatamente como constam das fichas técnicas, sendo vedado alterar receitas sem autorização.'],
    'Comércio': ['A(O) EMPREGADA(O) observará os preços, condições de pagamento, descontos e a política de trocas definidos pela EMPREGADORA, sendo vedado conceder descontos ou condições não autorizadas.', 'É vedado reservar mercadorias, realizar vendas para si ou para terceiros fora do sistema ou receber valores sem o registro correspondente.', 'A(O) EMPREGADA(O) tratará os clientes conforme o Código de Defesa do Consumidor e as orientações de atendimento da EMPREGADORA.'],
    'Administrativo': ['Documentos, senhas, certificados digitais e acessos bancários confiados à(ao) EMPREGADA(O) são de uso exclusivo em serviço e não podem ser compartilhados.', 'A(O) EMPREGADA(O) seguirá os procedimentos internos de aprovação de pagamentos e não realizará pagamentos ou transferências sem a autorização definida pela EMPREGADORA.'],
    'Limpeza e conservação': ['A(O) EMPREGADA(O) utilizará os produtos de limpeza conforme as fichas de segurança (FISPQ) e as diluições indicadas, sendo vedado misturar produtos sem orientação.', 'Objetos encontrados durante a limpeza serão entregues imediatamente à chefia, com registro.'],
    'Construção civil': ['A(O) EMPREGADA(O) cumprirá as regras do canteiro de obras, inclusive de acesso, organização, sinalização e uso de equipamentos coletivos de proteção.', 'É vedado executar serviço não previsto na ordem de serviço do dia ou alterar o projeto sem autorização do responsável técnico.'],
    'Indústria': ['A(O) EMPREGADA(O) seguirá os procedimentos operacionais, de qualidade e de rastreabilidade definidos pela EMPREGADORA, registrando a produção e as não conformidades.', 'Moldes, processos, fórmulas e informações de clientes industriais são confidenciais e pertencem à EMPREGADORA.'],
    'Transporte e entregas': ['A(O) EMPREGADA(O) respeitará a legislação de trânsito, as rotas e os horários definidos, sendo vedado transportar pessoas ou cargas estranhas ao serviço.', 'Os valores recebidos na entrega serão prestados à EMPREGADORA no mesmo dia, com os comprovantes.'],
    'Saúde': ['A(O) EMPREGADA(O) manterá sigilo sobre dados de pacientes, que são dados pessoais sensíveis (LGPD, art. 11), além do sigilo profissional previsto no código de ética da profissão.', 'Os procedimentos seguirão os protocolos assistenciais e de biossegurança do estabelecimento e a prescrição do profissional habilitado.'],
    'Beleza': ['Os instrumentos serão higienizados e esterilizados conforme as normas sanitárias, e os produtos aplicados somente após confirmar alergias e restrições informadas pelo cliente.', 'A carteira de clientes atendidos no estabelecimento pertence à EMPREGADORA, sendo vedado desviar clientes para atendimento particular durante o contrato.'],
    'Educação e cuidado': ['A(O) EMPREGADA(O) observará o Estatuto da Criança e do Adolescente e as regras de proteção da instituição, sendo vedado fotografar, filmar ou divulgar imagens de crianças e alunos sem autorização expressa dos responsáveis.', 'Materiais pedagógicos produzidos em serviço poderão ser utilizados pela EMPREGADORA nas suas atividades.'],
    'Segurança e portaria': ['A(O) EMPREGADA(O) registrará em livro ou sistema todas as ocorrências do posto e seguirá os procedimentos de controle de acesso definidos pela EMPREGADORA.', 'É vedado permitir a entrada de pessoas ou veículos sem a identificação e a autorização previstas nos procedimentos.'],
    'Hotelaria e turismo': ['A(O) EMPREGADA(O) manterá discrição sobre hóspedes e clientes e entregará à recepção, com registro, todo objeto encontrado nas acomodações.'],
    'Manutenção e serviços técnicos': ['Os serviços serão executados conforme ordens de serviço, normas técnicas e manuais dos fabricantes, com registro das intervenções realizadas.'],
    'Automotivo': ['É vedado utilizar veículos de clientes fora do necessário ao serviço, inclusive para testes não autorizados, respondendo a(o) EMPREGADA(O) por danos causados com culpa, nos termos deste contrato.', 'Peças substituídas serão separadas e identificadas para devolução ou descarte conforme a orientação da EMPREGADORA.'],
    'Tecnologia e comunicação': ['A(O) EMPREGADA(O) seguirá a política de segurança da informação da EMPREGADORA, sendo vedado copiar códigos, bases de dados ou credenciais para dispositivos ou contas pessoais.'],
    'Agro e rural': ['A(O) EMPREGADA(O) observará as orientações de manejo, de aplicação de defensivos (somente com treinamento e EPI) e de bem-estar animal da propriedade.']
  };


  // Biblioteca de cláusulas opcionais que o empregador pode incluir.
  g.CENTRALIZAR_OPCIONAIS = [
    { k: 'imagem', nome: 'Uso de imagem em divulgação', base: 'CF, art. 5º, X; Código Civil, art. 20. Autorização específica e revogável.', t: 'DO USO DE IMAGEM (AUTORIZAÇÃO DESTACADA)', p: function () { return [
      'A(O) EMPREGADA(O) autoriza, de forma específica e destacada, o uso da sua imagem em fotos e vídeos de divulgação institucional da EMPREGADORA (site, redes sociais e materiais do estabelecimento), durante a vigência do contrato, sem finalidade diversa e sem exploração comercial autônoma.',
      'Esta autorização pode ser revogada a qualquer tempo, por escrito ou pelo aplicativo, sem prejuízo ao contrato, devendo a EMPREGADORA deixar de publicar novos materiais com a imagem.'] ; } },
    { k: 'biometria', nome: 'Biometria do ponto (rosto ou digital)', base: 'LGPD, art. 11, II, "g"; Portaria MTP 671/2021. Recomendada quando o ponto usa biometria.', t: 'DOS DADOS BIOMÉTRICOS DO PONTO', p: function () { return [
      'A(O) EMPREGADA(O) está ciente de que a EMPREGADORA utilizará o reconhecimento facial ou a impressão digital exclusivamente para o registro de ponto, o controle de acesso e a prevenção a fraudes na identificação (LGPD, art. 11, II, "g"; Portaria MTP 671/2021).',
      'Os dados biométricos serão armazenados com medidas de segurança, não serão compartilhados além do fornecedor do sistema de ponto e serão eliminados ao término do contrato, ressalvada a guarda dos registros exigida por lei.',
      'A(O) EMPREGADA(O) poderá exercer os direitos do art. 18 da LGPD, e a EMPREGADORA oferecerá outra forma de registro quando a biometria não puder ser usada por motivo justificado.'] ; } },
    { k: 'naoaliciamento', nome: 'Não aliciamento de clientes e colegas', base: 'CLT, art. 482, "c" e "g". Após o contrato, limitado ao uso de informação sigilosa.', t: 'DO NÃO ALICIAMENTO', p: function () { return [
      'Durante o contrato, é vedado à(ao) EMPREGADA(O) aliciar clientes, fornecedores ou empregados da EMPREGADORA para negócio próprio ou de terceiros (CLT, art. 482, "c").',
      'Após o término do contrato, é vedado utilizar informações sigilosas da EMPREGADORA, como carteira de clientes e condições comerciais, para aliciar clientes ou empregados, sem prejuízo da liberdade de exercer a profissão.'] ; } },
    { k: 'naoconcorrencia', nome: 'Não concorrência após o contrato (com indenização)', base: 'Jurisprudência do TST: só vale com limite de tempo, área e atividade e com indenização paga ao empregado durante a restrição.', t: 'DA NÃO CONCORRÊNCIA APÓS O CONTRATO', p: function (x) { var m = +x.ct.ncMeses || 6; return [
      'Por ' + m + ' (' + ({ 6: 'seis', 12: 'doze', 24: 'vinte e quatro' }[m] || m) + ') meses após o término do contrato, qualquer que seja a causa, a(o) EMPREGADA(O) não exercerá a mesma atividade em empresa concorrente do mesmo ramo da EMPREGADORA, nos limites do município de ' + x.esc(String(x.empresa.cidade || '').split('/')[0]) + ' e dos municípios limítrofes.',
      'Em contrapartida, a EMPREGADORA pagará à(ao) EMPREGADA(O), durante todo o período de restrição, indenização mensal equivalente ao último salário contratual, por depósito até o dia 10 de cada mês.',
      'A restrição não alcança atividades diferentes da exercida na EMPREGADORA. A EMPREGADORA poderá dispensar a restrição, por escrito, até a data do desligamento, caso em que nenhuma indenização será devida.',
      'Descumprida a obrigação pela(o) EMPREGADA(O), cessará o pagamento e serão devolvidos os valores recebidos no período do descumprimento, sem prejuízo de perdas e danos comprovados.'] ; } },
    { k: 'comodato', nome: 'Comodato de equipamentos', base: 'Código Civil, art. 579; CLT, arts. 458, § 2º, I, e 462, § 1º.', t: 'DO COMODATO DE EQUIPAMENTOS', p: function () { return [
      'Os equipamentos entregues para o trabalho, como celular, tablet, notebook, máquina de cartão ou ferramentas, são cedidos em comodato (Código Civil, art. 579), mediante termo de entrega com descrição e estado de conservação, e não constituem salário (CLT, art. 458, § 2º, I).',
      'A(O) EMPREGADA(O) zelará pelos equipamentos e os devolverá ao fim do contrato ou quando solicitado. O desgaste natural não gera desconto; o dano causado com dolo, ou com culpa comprovada, poderá ser descontado, conforme ajustado neste contrato (CLT, art. 462, § 1º).',
      'Perda, furto ou roubo serão comunicados imediatamente, com boletim de ocorrência quando cabível.'] ; } },
    { k: 'celular', nome: 'Uso de celular pessoal no expediente', base: 'Poder diretivo (CLT, art. 2º), com proporcionalidade e sem acesso ao aparelho.', t: 'DO USO DE CELULAR PESSOAL', p: function () { return [
      'Durante o expediente, o celular pessoal será usado nas pausas e intervalos, salvo emergência ou quando for ferramenta de trabalho autorizada, como o registro de ponto pelo aplicativo.',
      'É vedado fotografar ou filmar clientes, colegas, documentos, áreas internas, receitas e processos da EMPREGADORA sem autorização, bem como divulgar essas imagens.',
      'A restrição visa à segurança, à atenção ao serviço e à proteção de dados, e não autoriza a EMPREGADORA a acessar o conteúdo do aparelho pessoal.'] ; } },
    { k: 'curso', nome: 'Cursos pagos pela empresa (permanência)', base: 'Aceita pela jurisprudência só para curso não obrigatório, com reembolso proporcional e limite do art. 477, § 5º, na rescisão.', t: 'DOS CURSOS CUSTEADOS PELA EMPREGADORA', p: function (x) { var m = +x.ct.cursoMeses || 12; return [
      'Os cursos de qualificação não obrigatórios, que não sejam exigidos por lei, por norma regulamentadora ou pela EMPREGADORA para o exercício da função, quando custeados pela EMPREGADORA com a concordância da(o) EMPREGADA(O), serão objeto de termo próprio com o valor investido.',
      'Se a(o) EMPREGADA(O) pedir demissão ou for dispensada(o) por justa causa antes de completar ' + m + ' meses do término do curso, reembolsará o valor investido proporcionalmente ao tempo que faltar, respeitado na rescisão o limite do art. 477, § 5º, da CLT.',
      'Treinamentos obrigatórios, como os das normas regulamentadoras, integração e boas práticas, são custo da EMPREGADORA e nunca serão reembolsados.'] ; } },
    { k: 'horario', nome: 'Ajuste de horário e troca de turno', base: 'CLT, art. 468; Súmula 265 do TST (volta ao diurno suprime o adicional noturno).', t: 'DA ALTERAÇÃO DE HORÁRIO E DE TURNO', p: function () { return [
      'A EMPREGADORA poderá ajustar o horário de entrada e saída dentro do mesmo turno, conforme a necessidade do serviço, comunicando a(o) EMPREGADA(O) com antecedência mínima de 7 (sete) dias, sem aumento da jornada contratada.',
      'A transferência do turno noturno para o diurno implica a supressão do adicional noturno (Súmula 265 do TST). A mudança do turno diurno para o noturno dependerá da concordância da(o) EMPREGADA(O) e do pagamento do adicional.'] ; } },
    { k: 'km', nome: 'Reembolso de veículo próprio (por km)', base: 'Natureza indenizatória; não integra o salário.', t: 'DO RESSARCIMENTO DE DESPESAS COM VEÍCULO PRÓPRIO', p: function () { return [
      'Quando autorizada(o) a usar veículo próprio em serviço, a(o) EMPREGADA(O) será ressarcida(o) por quilômetro rodado em serviço, conforme tabela da EMPREGADORA e relatório de deslocamentos, com natureza indenizatória, sem integrar o salário.',
      'O ressarcimento não cobre o deslocamento entre a residência e o trabalho, que segue as regras do vale-transporte.'] ; } }
  ];

  // Verificação de cláusula escrita pelo empregador: aponta o que a lei não deixa valer.
  g.CENTRALIZAR_RISCOS_CLAUSULA = function (texto) {
    var t = String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var R = [
      ['bad', /renunci|abre mao|abrir mao|desist[ea] de|nao podera (reclamar|ajuizar|cobrar)|quitacao (geral|ampla|total)|nao (entrara|ingressara) (com acao|na justica)/, 'Renúncia antecipada a direitos é nula (CLT, arts. 9º e 444).'],
      ['bad', /gravid|gestant|engravid|esteriliza|laquead|vasectom|\bhiv\b|teste de aids/, 'Exigir teste ou declaração de gravidez, esterilização ou HIV é proibido (Lei 9.029/95, art. 2º; Portaria MTE 1.246/2010).'],
      ['bad', /(nao|sem) (tera direito|terao direito|direito|recebera|receberao|serao pagas|sera pago|sera devid[oa]|serao devid[oa]s).{0,40}(hora|extra|ferias|13|decimo|fgts|aviso|adicional|repouso|dsr|intervalo|salario)/, 'Direitos mínimos (horas extras, férias, 13º, FGTS, adicionais, repouso) não podem ser afastados por contrato (CLT, arts. 9º e 444).'],
      ['bad', /atestado.{0,50}(nao sera aceit|nao serao aceit|nao aceit|sera descontad|serao descontad|nao abona)/, 'Atestado médico válido abona a falta (Lei 605/49, art. 6º, § 2º).'],
      ['bad', /revista intima|revistas intimas/, 'Revista íntima é proibida (Lei 13.271/2016; CLT, art. 373-A, VI).'],
      ['bad', /sindicat|greve/, 'Restringir filiação sindical ou greve viola a Constituição (arts. 8º e 9º).'],
      ['warn', /multa/, 'Multa contra o empregado não tem base na CLT, e o desconto só cabe nas hipóteses do art. 462. Se for multa de trânsito, exija prova da autoria e da culpa.'],
      ['warn', /descont/, 'Desconto só por lei, norma coletiva, adiantamento ou dano (doloso, ou culposo se ajustado): CLT, art. 462. Confira o texto.'],
      ['warn', /religi|casament|casar|filhos|orientacao sexual|partido|cor da pele|\braca\b|aparencia fisica|peso corporal/, 'Pode configurar discriminação (Lei 9.029/95; CF, art. 7º, XXX). Reescreva sem critério pessoal.'],
      ['warn', /concorren/, 'Não concorrência após o contrato só vale com limite de tempo, área e atividade e com indenização: prefira a cláusula pronta.'],
      ['warn', /sem (registro|carteira)|pejotiz|como pj|nota fiscal/, 'Contratar empregado como PJ ou sem registro gera vínculo e autuação (CLT, arts. 3º e 41).']
    ];
    return R.filter(function (r) { return r[1].test(t); }).map(function (r) { return [r[0], r[2]]; });
  };

  g.CENTRALIZAR_CLAUSULAS = function (x) {
    var esc = x.esc, ct = x.ct, cargo = x.cargo, f = function (k) { return cargo.flags.indexOf(k) > -1; };
    var exp = ct.modelo === 'experiencia', fim = x.addDays(ct.inicio, ct.dias - 1), resto = 90 - ct.dias, j = x.JORNADAS[ct.jornada];
    var noturno = ct.turno !== 'diurno', S = [];
    var fnInt = String((x.pessoa && x.pessoa.funcao) || '').replace(/\s*\(freelancer\)$/i, ''); if (fnInt.toLowerCase() === cargo.cargo.toLowerCase()) fnInt = '';
    var add = function (titulo, pars) { S.push({ t: titulo, p: pars.filter(Boolean) }); };
    var salario = 'R$ ' + x.brl(+ct.salario || 0);

    add('DA FUNÇÃO E DAS ATRIBUIÇÕES', [
      'A(O) EMPREGADA(O) é admitida(o) para exercer a função de <strong>' + esc(fnInt || cargo.cargo) + '</strong>' + (fnInt ? ', enquadrada no cargo de ' + esc(cargo.cargo) + ',' : ',') + ' Classificação Brasileira de Ocupações (CBO) ' + esc(cargo.cbo) + ', com as seguintes atribuições principais: ' + cargo.atrib.map(function (a, i) { return '<strong>' + String.fromCharCode(97 + i) + ')</strong> ' + esc(a.charAt(0).toLowerCase() + a.slice(1)); }).join('; ') + '.',
      'Além das atribuições acima, a(o) EMPREGADA(O) executará as tarefas compatíveis com a sua condição pessoal e com a função (CLT, art. 456, parágrafo único), podendo a EMPREGADORA ajustar rotinas, escalas e procedimentos sem alterar a função nem reduzir o salário (CLT, art. 468).',
      'A(O) EMPREGADA(O) declara que as informações prestadas na pré-entrevista e na admissão são verdadeiras' + (f('TIP') ? ' e que tem 18 (dezoito) anos completos, idade exigida para esta função (Decreto 6.481/2008)' : '') + (f('PEM') ? ', que tem ao menos 21 (vinte e um) anos e é habilitada(o) na categoria A há pelo menos 2 (dois) anos (Lei 12.009/2009)' : '') + '.'
    ]);

    add(exp ? 'DO PRAZO DE EXPERIÊNCIA E DA PRORROGAÇÃO' : 'DO PRAZO', exp ? [
      'Este contrato de experiência vigora por <strong>' + ct.dias + ' dias</strong>, de ' + x.dmyy(ct.inicio) + ' a ' + x.dmyy(fim) + ' (CLT, arts. 443, § 2º, "c", e 445, parágrafo único), e foi assinado antes do início da prestação de serviços.',
      resto > 0 ? (ct.autoProrrog !== false ? 'Não havendo manifestação em contrário de qualquer das partes até o termo final, este contrato fica <strong>automaticamente prorrogado por mais ' + resto + ' dias</strong>, uma única vez, sem ultrapassar o limite de 90 dias (CLT, art. 451).' : 'O contrato poderá ser prorrogado uma única vez, por escrito, por até ' + resto + ' dias, sem ultrapassar o limite de 90 dias (CLT, art. 451).') : 'O prazo já corresponde ao limite legal de 90 dias, não admitindo prorrogação.',
      'Encerrado o prazo, inclusive o da prorrogação, sem manifestação das partes, o contrato passa a vigorar por prazo indeterminado.',
      'Durante a experiência, a EMPREGADORA avaliará desempenho, assiduidade, pontualidade, cumprimento de normas e adaptação à função, registrando as avaliações no sistema, que poderão ser consultadas pela(o) EMPREGADA(O).'
    ] : ['Este contrato vigora por prazo indeterminado a partir de ' + x.dmyy(ct.inicio) + '.']);

    var jor = [
      'A jornada é de <strong>' + esc(j[0]) + '</strong>, ' + esc(j[1]) + ', em turno ' + esc(x.TURNOS[ct.turno]) + '.',
      'O registro de ponto é pessoal e intransferível, feito pelo aplicativo ou pelo aparelho da empresa (Portaria MTP 671/2021). Registrar o ponto de outra pessoa, ou permitir que registrem o seu, constitui falta grave.',
      'Os intervalos para descanso e alimentação são obrigatórios e devem ser efetivamente usufruídos (CLT, art. 71).',
      'Horas extras dependem de autorização prévia e expressa da chefia e serão pagas com adicional de no mínimo 50% (Constituição, art. 7º, XVI)' + (ct.banco ? ' ou compensadas em banco de horas, por este acordo individual escrito, no prazo máximo de 6 (seis) meses (CLT, art. 59, § 5º)' : '') + '.'
    ];
    if (ct.jornada === '1236') jor.push('Na escala 12x36, a remuneração mensal abrange o descanso semanal remunerado e os feriados, que se consideram compensados, assim como as prorrogações de trabalho noturno (CLT, art. 59-A, parágrafo único).');
    if (noturno) jor.push('O trabalho entre 22h e 5h é noturno, com hora reduzida de 52 minutos e 30 segundos e adicional de 20%; as horas prorrogadas após as 5h também são noturnas (CLT, art. 73; Súmula 60, II, do TST).');
    if (f('J6') || ct.jornada === '6h') jor.push('Nas atividades de teleatendimento e telefonia, serão observadas as pausas e as condições ergonômicas da NR-17, Anexo II.');
    if (f('DIG')) jor.push('Em digitação contínua, haverá pausa de 10 minutos a cada 90 minutos trabalhados, não deduzida da jornada (CLT, art. 72).');
    if (f('MOT')) jor.push('A jornada do motorista profissional será controlada de forma fidedigna por diário de bordo, rastreador ou aplicativo, observados os arts. 235-A a 235-H da CLT, os descansos legais e o cômputo do tempo de espera conforme a decisão do STF na ADI 5.322.');
    if (f('EXT')) jor.push('Nas atividades externas, a marcação será feita pelo aplicativo com geolocalização. A ausência de controle de jornada somente se aplicará se o controle for comprovadamente incompatível com a atividade, com anotação na CTPS (CLT, art. 62, I).');
    if (f('CONF')) jor.push('Caso a(o) EMPREGADA(O) exerça cargo de gestão, com efetivos poderes de mando e gratificação de função de ' + (+ct.grat || 40) + '% sobre o salário efetivo, não inferior a 40%, ficará dispensada(o) do controle de jornada (CLT, art. 62, II e parágrafo único). A reversão ao cargo efetivo não assegura a manutenção da gratificação (CLT, art. 468, §§ 1º e 2º).');
    if (f('TELE') && ct.modalidade && ct.modalidade !== 'presencial') jor.push('O trabalho será prestado em regime de ' + (ct.modalidade === 'hibrido' ? 'teletrabalho híbrido' : 'teletrabalho') + ' (CLT, arts. 75-B e 75-C). Os equipamentos e a infraestrutura necessários serão fornecidos ou reembolsados conforme ajuste escrito, sem natureza salarial (art. 75-D), e a(o) EMPREGADA(O) seguirá as instruções de saúde e segurança (art. 75-E). A EMPREGADORA poderá determinar o retorno ao regime presencial com 15 dias de transição (art. 75-C, § 2º). Havendo controle de horário, aplicam-se as regras de jornada e de horas extras.');
    add('DA JORNADA E DO CONTROLE DE PONTO', jor);

    var rem = ['O salário mensal é de <strong>' + salario + '</strong>, pago até o 5º dia útil do mês seguinte ao trabalhado, preferencialmente em conta bancária da(o) EMPREGADA(O) (CLT, arts. 459, § 1º, e 464, parágrafo único).'];
    if (ct.insal) rem.push('Será pago adicional de insalubridade de ' + ct.insal + '%, calculado sobre o salário-mínimo, salvo base mais favorável em norma coletiva (CLT, art. 192), conforme o laudo técnico da empresa. O adicional deixará de ser devido se o risco for eliminado ou neutralizado, comprovadamente (CLT, art. 194).');
    if (ct.peric) rem.push('Será pago adicional de periculosidade de 30% sobre o salário-base (CLT, art. 193, § 1º)' + (f('PEM') ? ', por utilizar motocicleta em vias públicas (CLT, art. 193, § 4º; Tema 101 do TST)' : '') + ', que deixará de ser devido se cessada a exposição ao risco (CLT, art. 194). Os adicionais de insalubridade e periculosidade não se acumulam (CLT, art. 193, § 2º).');
    if (ct.noturno) rem.push('Será pago adicional noturno de 20% sobre a hora diurna (CLT, art. 73).');
    if (f('COM')) rem.push('Além do salário, serão pagas comissões de ' + (+ct.comissao || 0) + '% sobre as vendas efetivamente concluídas, devidas após ultimada a transação (CLT, art. 466). O estorno de comissões somente ocorrerá nos casos permitidos pela Lei 3.207/57, art. 7º, e o repouso semanal remunerado incidirá sobre as comissões (Súmula 27 do TST). Fica garantido, em qualquer mês, o piso da categoria.');
    if (f('GOR')) rem.push('As gorjetas, espontâneas ou cobradas, não constituem receita da EMPREGADORA e serão rateadas conforme a norma coletiva ou os critérios definidos em assembleia, com as retenções legais e a anotação da média na CTPS (CLT, art. 457, §§ 3º a 11; Lei 13.419/2017). As gorjetas não integram a base do aviso-prévio, do adicional noturno, das horas extras e do repouso (Súmula 354 do TST).');
    if (f('CAIXA')) rem.push('Havendo previsão em norma coletiva, será paga a gratificação de quebra de caixa, que se destina a compensar eventuais diferenças apuradas na forma da cláusula dos descontos.');
    rem.push('Os holerites serão disponibilizados pelo aplicativo após a aprovação da EMPREGADORA, valendo a disponibilização como entrega do recibo de pagamento (CLT, art. 464).');
    add('DA REMUNERAÇÃO', rem);

    add('DO LOCAL DE TRABALHO', [
      'O trabalho será prestado no estabelecimento da EMPREGADORA situado em ' + esc(x.empresa.endereco) + ', ' + esc(x.empresa.cidade) + ', podendo ocorrer em outras unidades da EMPREGADORA no mesmo município, sem mudança de domicílio (CLT, art. 469).',
      (f('EXT') || f('MOT') || f('PEM')) ? 'Pela natureza da função, as atividades serão exercidas também externamente, nas rotas e locais definidos pela EMPREGADORA.' : ''
    ]);

    var desc = [
      'Somente serão descontados do salário os valores previstos em lei ou em norma coletiva, os adiantamentos e os vales autorizados previamente e por escrito pela(o) EMPREGADA(O) (CLT, art. 462; Súmula 342 do TST).',
      'Em caso de dano causado pela(o) EMPREGADA(O), o desconto é lícito na ocorrência de dolo e, <strong>conforme expressamente ajustado neste contrato, também nos danos causados por culpa</strong> (negligência, imprudência ou imperícia), apurados com ciência da(o) EMPREGADA(O) (CLT, art. 462, § 1º).',
      ct.vt !== false ? 'Optando pelo vale-transporte, será descontado até 6% do salário básico (Lei 7.418/85). A declaração falsa ou o uso indevido do benefício constitui falta grave.' : '',
      'A soma dos descontos de um mês observará o limite de 70% do salário (OJ 18 da SDC do TST), e, na rescisão, a compensação não excederá o equivalente a um mês de remuneração (CLT, art. 477, § 5º).'
    ];
    if (f('CAIXA')) desc.push('Recebendo a(o) EMPREGADA(O) a gratificação de quebra de caixa, as diferenças apuradas em conferência feita na sua presença, com registro assinado, poderão ser descontadas. Não havendo pagamento dessa gratificação, o desconto dependerá da comprovação de culpa, nos termos do art. 462, § 1º, da CLT.');
    if (f('MOT') || f('CNH') || f('PEM')) desc.push('As multas de trânsito decorrentes de infração cometida pela(o) EMPREGADA(O) na condução de veículo a serviço poderão ser descontadas, conforme ajustado neste contrato, desde que comprovadas a autoria e a culpa, assegurados a indicação do condutor e o direito de defesa (CLT, art. 462, § 1º).');
    add('DOS DESCONTOS', desc);

    var sst = [
      'A(O) EMPREGADA(O) fará o exame admissional antes do início das atividades e os exames periódicos determinados pelo PCMSO (NR-7).',
      'A(O) EMPREGADA(O) cumprirá as normas de segurança e saúde, usará os equipamentos de proteção fornecidos e participará dos treinamentos. A recusa injustificada ao uso de EPI ou à observância das instruções constitui falta (CLT, art. 158, parágrafo único).',
      'É vedado trabalhar sob efeito de álcool ou de substâncias que comprometam a segurança. Acidentes e incidentes devem ser comunicados imediatamente à chefia.'
    ];
    var nrTxt = {
      NR6: 'Os EPIs serão fornecidos gratuitamente, com certificado de aprovação, mediante ficha de entrega assinada, cabendo à(ao) EMPREGADA(O) guardá-los, conservá-los e comunicar qualquer dano (NR-6).',
      NR10: 'Os serviços em instalações elétricas somente serão executados com treinamento NR-10 e autorização formal, com desenergização e bloqueio quando aplicável, assegurado o direito de recusa diante de risco grave e iminente (NR-10).',
      NR11: 'A operação de empilhadeiras e equipamentos de movimentação de cargas somente será feita por quem tiver treinamento e cartão de identificação emitidos pela EMPREGADORA (NR-11).',
      NR12: 'É vedado operar máquinas sem capacitação ou remover, burlar ou desativar proteções e dispositivos de segurança, o que constitui falta grave (NR-12).',
      NR13: 'A operação de caldeiras e vasos de pressão exige o treinamento de segurança previsto na NR-13 e o registro das ocorrências.',
      NR17: 'Serão observadas as condições ergonômicas e as pausas previstas na NR-17.',
      NR18: 'Antes de iniciar no canteiro de obras, a(o) EMPREGADA(O) receberá o treinamento admissional da NR-18 e seguirá o PGR da obra.',
      NR20: 'O trabalho com inflamáveis e combustíveis exige a capacitação da NR-20 e o cumprimento dos procedimentos de segurança do posto ou instalação.',
      NR31: 'Serão observadas as normas de segurança e saúde do trabalho rural (NR-31), inclusive para máquinas, defensivos e animais.',
      NR32: 'Serão observadas as regras da NR-32: vacinação oferecida gratuitamente, proibição de adornos, cuidado com perfurocortantes e uso de EPIs em todos os procedimentos.',
      NR35: 'O trabalho acima de 2 metros somente será realizado com treinamento NR-35, ASO com aptidão para trabalho em altura, análise de risco e autorização da EMPREGADORA.',
      NR36: 'Nas atividades de abate e processamento de carnes, serão concedidas as pausas psicofisiológicas e observado o rodízio previsto na NR-36.'
    };
    cargo.flags.forEach(function (k) { if (nrTxt[k]) sst.push(nrTxt[k]); });
    if (f('ALI')) sst.push('Na manipulação de alimentos, a(o) EMPREGADA(O) seguirá as boas práticas (RDC Anvisa 216/2004): uniforme limpo e exclusivo, cabelos protegidos, unhas curtas e sem esmalte, sem adornos, higienização frequente das mãos, e comunicará imediatamente sintomas de doenças, para afastamento da manipulação.');
    if (f('INF')) sst.push('No trabalho em câmaras frias ou ambientes artificialmente frios, serão fornecidas vestimentas térmicas e observado o intervalo de 20 minutos a cada 1h40 (CLT, art. 253).');
    if (f('INR')) sst.push('O protetor auricular é de uso obrigatório nas áreas sinalizadas.');
    if (f('PESO')) sst.push('Serão respeitados os limites legais de remoção individual de peso (CLT, arts. 198 e 390), utilizando-se os equipamentos de transporte disponíveis.');
    if (f('PEI')) sst.push('No abastecimento de veículos, a(o) EMPREGADA(O) seguirá os procedimentos de segurança com inflamáveis, sendo vedado fumar ou usar chamas na área de risco.');
    if (f('PEE')) sst.push('As atividades em instalações ou equipamentos energizados só serão realizadas mediante autorização, com uso de EPIs e EPCs adequados.');
    if (f('PEV')) sst.push('A(O) EMPREGADA(O) manterá válidos o curso de formação e as reciclagens de vigilante (Lei 7.102/83), utilizando arma e equipamentos somente em serviço e no posto designado.');
    if (f('PEB')) sst.push('A(O) EMPREGADA(O) manterá atualizada a formação de bombeiro civil e participará das simulações e inspeções programadas (Lei 11.901/2009).');
    if (f('PEM')) sst.push('No motofrete, a(o) EMPREGADA(O) manterá válidos o curso especializado e a habilitação exigidos pela Lei 12.009/2009, usará capacete e colete com dispositivos retrorrefletivos e conduzirá motocicleta com os equipamentos obrigatórios da regulamentação do CONTRAN.');
    if (f('MOT')) sst.push('A(O) EMPREGADA(O) submeter-se-á aos exames toxicológicos exigidos por lei (CLT, art. 168, § 6º) e respeitará os tempos de direção e descanso.');
    if (f('RAD')) sst.push('Será utilizado dosímetro individual e observadas as normas de proteção radiológica, com jornada de 24 horas semanais (Lei 7.394/85).');
    add('DA SEGURANÇA E DA SAÚDE NO TRABALHO', sst);

    var bens = ['Uniformes, crachás, chaves, ferramentas, aparelhos e demais bens entregues à(ao) EMPREGADA(O) são de propriedade da EMPREGADORA, para uso exclusivo em serviço, e serão devolvidos ao término do contrato ou quando solicitados.'];
    if (f('UNI') || f('ALI')) bens.push('O padrão de vestimenta é definido pela EMPREGADORA. A higienização do uniforme cabe à(ao) EMPREGADA(O), salvo quando exigir procedimentos ou produtos diferentes dos de uso comum (CLT, art. 456-A).');
    if (f('MOT') || f('CNH')) bens.push('O veículo da EMPREGADORA será usado somente em serviço, com checklist diário, sendo vedado desviar rotas, emprestá-lo ou transportar terceiros. O veículo poderá ser monitorado por rastreador.');
    if (f('PEM')) bens.push('Se a(o) EMPREGADA(O) utilizar motocicleta própria, o aluguel pelo uso em benefício da EMPREGADORA será ajustado em instrumento separado, com valor e critérios objetivos e com separação entre aluguel, combustível e manutenção, tendo natureza indenizatória. A EMPREGADORA não manterá no motofrete condutor sem os requisitos da Lei 12.009/2009.');
    add('DOS UNIFORMES, EQUIPAMENTOS E BENS DA EMPRESA', bens);

    var sig = [
      'A(O) EMPREGADA(O) manterá sigilo, durante o contrato e por 2 (dois) anos após o seu término, sobre as informações sigilosas da EMPREGADORA a que tiver acesso em razão da função, assim entendidas receitas e fichas técnicas, custos, preços de compra, fornecedores, carteira de clientes, estratégias e dados de outros empregados. A violação de segredo da empresa constitui falta grave (CLT, art. 482, "g").',
      'Os dados pessoais de clientes, fornecedores e colegas serão tratados somente para o trabalho e conforme as instruções da EMPREGADORA (LGPD).',
      'Sistemas, e-mails corporativos, aplicativos e equipamentos da EMPREGADORA são ferramentas de trabalho e, com a ciência dada neste contrato, poderão ser monitorados de forma proporcional e para fins de segurança e gestão, sem acesso a contas ou conversas pessoais. As áreas comuns poderão ter câmeras de segurança, nunca em banheiros ou vestiários. A geolocalização pelo aplicativo ou por rastreador se limita aos dias e horários de trabalho (LGPD, art. 6º).',
      'É vedado publicar em redes sociais imagens internas, dados de clientes ou conteúdos que exponham a EMPREGADORA sem autorização. O uso do celular pessoal durante a jornada segue o regulamento interno.'
    ];
    if (f('TELE') || cargo.setor === 'Tecnologia e comunicação') sig.push('Os programas de computador desenvolvidos durante o contrato e em decorrência dele, ou com uso de recursos, informações ou equipamentos da EMPREGADORA, pertencem exclusivamente a ela, sendo da(o) EMPREGADA(O) apenas os criados sem relação com o contrato e sem esses recursos (Lei 9.609/98, art. 4º). Quanto a textos, imagens, vídeos e demais criações feitas em serviço, a(o) EMPREGADA(O) cede à EMPREGADORA os direitos patrimoniais de autor para uso nas suas atividades, sem remuneração adicional além do salário (Lei 9.610/98).');
    add('DA CONFIDENCIALIDADE, DOS DADOS E DOS SISTEMAS', sig);

    add('DA EXCLUSIVIDADE DURANTE O CONTRATO', ['Durante o contrato, a(o) EMPREGADA(O) não exercerá, sem autorização da EMPREGADORA, atividade concorrente ou que prejudique o serviço, o que constitui falta grave (CLT, art. 482, "c").']);

    add('DO REGULAMENTO INTERNO E DAS COMUNICAÇÕES ELETRÔNICAS', [
      'A(O) EMPREGADA(O) declara ter recebido e conhecer o regulamento interno da EMPREGADORA, na versão vigente nesta data, que integra este contrato. Alterações posteriores não reduzirão vantagens já incorporadas ao contrato (Súmula 51, I, do TST).',
      'Comunicados, holerites, escalas, advertências, avaliações, ciências e assinaturas poderão ser feitos pelo aplicativo Centralizar, com acesso pessoal e intransferível. As partes reconhecem a validade da assinatura e da ciência eletrônicas assim realizadas, com registro de data, hora, versão do documento e identificação do signatário (MP 2.200-2/2001, art. 10, § 2º).',
      'A(O) EMPREGADA(O) manterá atualizados telefone, endereço e conta bancária no aplicativo.'
    ]);

    add('DAS FALTAS, ATESTADOS E AUSÊNCIAS', [
      'A(O) EMPREGADA(O) avisará a chefia sobre faltas e atrasos antes do início do turno, sempre que possível.',
      'O atestado médico será enviado por foto pelo aplicativo, para ciência imediata, e <strong>o original em papel será entregue em até 48 horas</strong>; sem a entrega do original, a ausência não será abonada.',
      'A falta injustificada acarreta o desconto do dia e do repouso semanal da semana correspondente (Lei 605/49, art. 6º).'
    ]);

    var bene = ['Os benefícios são os previstos em lei, na norma coletiva e nas políticas da EMPREGADORA.'];
    bene.push('A alimentação fornecida pela EMPREGADORA, inclusive por programa de alimentação, destina-se exclusivamente à refeição da(o) EMPREGADA(O), não tem finalidade retributiva, não será paga em dinheiro e não integra a remuneração (CLT, art. 457, § 2º).');
    if (f('RUR')) bene.push('No trabalho rural, os descontos de moradia e alimentação observarão os limites de 20% e 25% do salário-mínimo, respectivamente, quando previamente autorizados (Lei 5.889/73, art. 9º).');
    add('DOS BENEFÍCIOS', bene);

    add('DA RESCISÃO', exp ? [
      ct.art481 ? 'As partes ajustam o direito recíproco de rescisão antes do termo final. Exercido esse direito, aplicam-se os princípios da rescisão dos contratos por prazo indeterminado, inclusive o aviso-prévio (CLT, art. 481; Súmula 163 do TST).' : 'A rescisão antecipada sem justa causa pela EMPREGADORA obriga ao pagamento, a título de indenização, da metade da remuneração devida até o termo final (CLT, art. 479). Se a iniciativa for da(o) EMPREGADA(O), ela(e) indenizará os prejuízos que causar, até o mesmo limite (CLT, art. 480).',
      'O término do contrato no prazo ajustado não gera aviso-prévio nem a multa de 40% do FGTS.',
      'Constituem justa causa as faltas previstas no art. 482 da CLT, entre elas as indicadas neste contrato.',
      'No desligamento, a(o) EMPREGADA(O) devolverá os bens da empresa e prestará contas de valores sob sua guarda.'
    ] : ['A rescisão observará a CLT, inclusive o aviso-prévio proporcional (Lei 12.506/2011) e as hipóteses de justa causa do art. 482.', 'No desligamento, a(o) EMPREGADA(O) devolverá os bens da empresa e prestará contas de valores sob sua guarda.']);

    var setor = SETOR[cargo.setor] || [];
    if (setor.length) add('DAS REGRAS PRÓPRIAS DA ATIVIDADE (' + cargo.setor.toUpperCase() + ')', setor);
    if (f('REG')) S[S.length - 1].p.push('A(O) EMPREGADA(O) manterá ativo o registro no conselho profissional e comunicará imediatamente qualquer suspensão ou cancelamento, que impede o exercício da função.' + (cargo.nota ? ' ' + esc(cargo.nota) : ''));

    // Cláusulas opcionais escolhidas pelo empregador e cláusulas próprias (texto livre, sempre escapado).
    g.CENTRALIZAR_OPCIONAIS.forEach(function (o) { if (ct.opc && ct.opc[o.k]) add(o.t, o.p(x)); });
    (ct.extras || []).forEach(function (e) {
      var ps = String(e.texto || '').split(/\n\s*\n/).map(function (t) { return esc(t.trim()).replace(/\n/g, '<br>'); }).filter(Boolean);
      if (ps.length) add(esc(String(e.titulo || 'CLÁUSULA ADICIONAL').toUpperCase()), ps);
    });

    add('DAS NORMAS COLETIVAS E DISPOSIÇÕES FINAIS', [
      'Aplicam-se a este contrato a convenção ou o acordo coletivo da categoria' + (ct.cct ? ' (' + esc(ct.cct) + ')' : '') + ', prevalecendo as condições mais favoráveis à(ao) EMPREGADA(O) quando assim exigir a lei.',
      'A tolerância com o descumprimento de qualquer cláusula não implica renúncia nem alteração do contrato.',
      'Os dados pessoais da(o) EMPREGADA(O) serão tratados para a execução deste contrato e o cumprimento de obrigações legais (LGPD, art. 7º, II e V).',
      'Este contrato é assinado eletronicamente ou em duas vias, ficando uma com cada parte.'
    ]);

    return S.map(function (s, i) {
      return '<section class="cl"><h4>CLÁUSULA ' + (ORD[i] || (i + 1) + 'ª') + ' · ' + s.t + '</h4>' + s.p.map(function (p, k) { return '<p contenteditable="true">' + (s.p.length > 1 ? '<strong>' + (k === 0 ? 'Caput.' : 'Parágrafo ' + (k === 1 && s.p.length === 2 ? 'único' : k + 'º')) + '</strong> ' : '') + p + '</p>'; }).join('') + '</section>';
    }).join('');
  };
})(window);
