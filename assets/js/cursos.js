/* Centralizar — mini cursos para equipes de alimentação. Conteúdo baseado na RDC Anvisa 216/2004 (boas práticas
   para serviços de alimentação), na RDC 727/2022 (alergênicos) e nas NRs 6, 12 e 17. Cada curso: aulas curtas,
   teste de 4 questões (aprovação com 3 acertos) e certificado que comprova a capacitação (RDC 216, item 4.6.7). */
(function (g) {
  'use strict';
  g.CENTRALIZAR_CURSOS = [
    { id: 'higiene', titulo: 'Higiene pessoal e saúde do manipulador', min: 10, base: 'RDC 216/2004, itens 4.6.1 a 4.6.7', aulas: [
      ['Antes de entrar na cozinha', 'Uniforme limpo, trocado todo dia e usado só no trabalho. Cabelo preso e coberto por rede ou touca. Unhas curtas e sem esmalte. A RDC 216 não permite barba na manipulação. Tire anéis, aliança, brincos, relógio, pulseiras e maquiagem antes de começar.'],
      ['Quando lavar as mãos', 'Ao chegar, antes e depois de manipular alimentos, depois de qualquer interrupção (celular, dinheiro, lixo), depois de tocar algo contaminado, depois de usar o banheiro e sempre que precisar.'],
      ['Como lavar', 'Molhe as mãos, use sabonete líquido antisséptico (ou sabonete e depois antisséptico), esfregue palmas, dorso, entre os dedos, polegares, unhas e punhos, enxágue e seque com papel toalha. Feche a torneira com o papel se ela não for automática.'],
      ['Saúde e comportamento', 'Diarreia, vômito, febre, feridas ou infecção nas mãos e na pele: avise a chefia antes de começar, porque quem tem sintomas é afastado da manipulação enquanto durarem. Durante o preparo, não fume, não coma, não tussa nem espirre sobre o alimento e não mexa em dinheiro.']
    ], quiz: [
      ['Quando lavar as mãos?', ['Só ao chegar ao trabalho', 'Ao chegar, antes e depois de manipular, depois de interrupções e depois do banheiro', 'Só quando estiverem sujas'], 1],
      ['Pode usar aliança enquanto prepara alimentos?', ['Sim, aliança é permitida', 'Não, todos os adornos são retirados', 'Só se for lisa'], 1],
      ['Você acordou com diarreia. O que fazer?', ['Trabalhar normalmente de luva', 'Avisar a chefia antes de manipular alimentos', 'Tomar remédio e não contar'], 1],
      ['Qual atitude está correta durante o preparo?', ['Atender o celular e voltar sem lavar as mãos', 'Receber dinheiro e montar o lanche em seguida', 'Lavar as mãos depois de qualquer interrupção'], 2]
    ] },
    { id: 'contaminacao', titulo: 'Contaminação cruzada e doenças transmitidas por alimentos', min: 8, base: 'RDC 216/2004, item 4.8', aulas: [
      ['O que é', 'Contaminação cruzada é quando micro-organismos passam do alimento cru para o pronto: por contato direto, pelas mãos, por tábuas, facas, panos ou bancadas. Cru, semipronto e pronto não podem se encostar.'],
      ['Na prática', 'Use tábuas e facas separadas para carne crua, frango, peixe, vegetais e alimentos prontos (por cor, se a casa adotar). Na geladeira, o cru fica embaixo e o pronto em cima. Quem mexeu no cru lava e desinfeta as mãos antes de tocar no pronto.'],
      ['Frutas e verduras', 'O que vai ser consumido cru, como alface, tomate e frutas, é lavado em água corrente e desinfetado com produto regularizado na Anvisa, na diluição e no tempo do rótulo, e depois enxaguado.'],
      ['Doenças transmitidas por alimentos', 'Salmonela, E. coli, estafilococos e outros causam diarreia, vômito e febre, e podem ser graves para crianças, idosos e gestantes. O alimento contaminado pode ter cheiro, cor e sabor normais: quem previne é o processo, não a aparência.']
    ], quiz: [
      ['Onde guardar a carne crua na geladeira?', ['Em cima, acima dos alimentos prontos', 'Embaixo, abaixo dos alimentos prontos', 'Em qualquer lugar, se estiver tampada'], 1],
      ['Você cortou frango cru e vai montar uma salada. Antes:', ['Basta passar um pano na faca', 'Troca ou higieniza faca e tábua e lava as mãos', 'Usa o outro lado da mesma tábua'], 1],
      ['A alface da salada deve:', ['Ser lavada só com água', 'Ser lavada em água corrente e desinfetada com produto regularizado', 'Ficar de molho no vinagre'], 1],
      ['Alimento contaminado sempre tem cheiro ruim?', ['Sim, sempre', 'Não, pode parecer normal', 'Só a carne'], 1]
    ] },
    { id: 'temperaturas', titulo: 'Temperaturas seguras', min: 10, base: 'RDC 216/2004, itens 4.8.8 a 4.8.17', aulas: [
      ['A zona de perigo', 'Entre 5 °C e 60 °C as bactérias se multiplicam rápido. O alimento passa o menor tempo possível nessa faixa: ou está quente, acima de 60 °C, ou frio, abaixo de 5 °C.'],
      ['Cozinhar e manter quente', 'A cocção atinge pelo menos 70 °C em todas as partes do alimento (meça no centro). Para manter quente: acima de 60 °C por no máximo 6 horas. O óleo de fritura não passa de 180 °C e é trocado quando mudar cor, cheiro ou sabor ou fizer muita espuma e fumaça.'],
      ['Resfriar e guardar', 'Para guardar o que foi cozido: baixar de 60 °C para 10 °C em até 2 horas e depois refrigerar abaixo de 5 °C ou congelar a -18 °C ou menos. Pronto refrigerado a 4 °C ou menos vale no máximo 5 dias.'],
      ['Descongelar', 'Descongele na geladeira, abaixo de 5 °C, ou no micro-ondas quando for preparar logo em seguida. Nunca na pia, em temperatura ambiente. O que foi descongelado não volta ao freezer.']
    ], quiz: [
      ['Temperatura mínima de cocção em todas as partes do alimento:', ['50 °C', '70 °C', '100 °C'], 1],
      ['O alimento quente no balcão deve ficar:', ['Acima de 60 °C por até 6 horas', 'Acima de 40 °C o dia todo', 'Em temperatura ambiente'], 0],
      ['Sobrou carne assada. Como guardar?', ['Esfriar na bancada até o dia seguinte', 'Baixar de 60 °C a 10 °C em até 2 horas e refrigerar abaixo de 5 °C', 'Deixar no forno desligado'], 1],
      ['O freezer deve marcar:', ['-18 °C ou menos', '-5 °C', '0 °C'], 0]
    ] },
    { id: 'recebimento', titulo: 'Recebimento, armazenamento e etiquetas', min: 8, base: 'RDC 216/2004, itens 4.7 e 4.9.1', aulas: [
      ['Ao receber', 'Confira na hora da entrega: embalagem inteira, validade, rótulo e a temperatura dos refrigerados e congelados. O que estiver fora do padrão é recusado ou separado, e o responsável é avisado.'],
      ['Guardar', 'Sobre estrados, paletes ou prateleiras, nunca no chão, afastado da parede e longe dos produtos de limpeza. Primeiro que vence, primeiro que sai (PVPS): o lote com validade mais curta fica na frente.'],
      ['Etiquetar', 'Alimento preparado ou fracionado leva etiqueta com nome, data de preparo e validade. Embalagem aberta segue a validade que o fabricante indica para depois de aberta. As etiquetas do Centralizar já saem com lote e validade.']
    ], quiz: [
      ['Os sacos de insumos ficam:', ['No chão, encostados na parede', 'Sobre estrados ou prateleiras, afastados da parede', 'Junto dos produtos de limpeza'], 1],
      ['PVPS quer dizer:', ['Primeiro que vence, primeiro que sai', 'Produto vendido, produto separado', 'Primeiro que vem, primeiro que sai'], 0],
      ['O molho preparado hoje e guardado na geladeira precisa de:', ['Nada, todo mundo sabe o que é', 'Etiqueta com nome, data de preparo e validade', 'Só a data de hoje'], 1],
      ['O frango chegou a 12 °C. O que fazer?', ['Receber e guardar rápido', 'Recusar ou separar e avisar o responsável, registrando', 'Pôr no freezer para compensar'], 1]
    ] },
    { id: 'higienizacao', titulo: 'Limpeza e desinfecção', min: 8, base: 'RDC 216/2004, itens 4.2 e 4.11.4', aulas: [
      ['Limpar não é desinfetar', 'Limpar tira a sujeira visível, com detergente e água. Desinfetar reduz os micro-organismos, com produto regularizado na Anvisa. A ordem: tirar os resíduos, lavar, enxaguar, desinfetar, enxaguar se o rótulo pedir e deixar secar.'],
      ['Diluição e tempo', 'Use o produto na diluição e no tempo de contato do rótulo ou do POP da casa. Mais produto não limpa mais e pode deixar resíduo no alimento. Nunca misture produtos: água sanitária com amoníaco ou com ácido libera gás tóxico.'],
      ['Frequência e registro', 'Bancadas e utensílios a cada uso; equipamentos, pisos e paredes conforme o POP; caixa-d\'água no máximo a cada 6 meses, com registro. Panos de limpeza são trocados com frequência; na área de preparo, prefira os descartáveis.']
    ], quiz: [
      ['Qual a diferença entre limpar e desinfetar?', ['Nenhuma', 'Limpar tira a sujeira; desinfetar reduz os micro-organismos', 'Desinfetar é só passar pano'], 1],
      ['Misturar água sanitária com outro produto para limpar melhor:', ['Pode, fica mais forte', 'Nunca: pode liberar gás tóxico', 'Só com vinagre'], 1],
      ['A caixa-d\'água é higienizada:', ['Uma vez por ano', 'No máximo a cada 6 meses, com registro', 'Só quando a água ficar turva'], 1],
      ['Usar mais desinfetante do que o rótulo manda:', ['Deixa mais limpo', 'Pode deixar resíduo e não melhora o resultado', 'É obrigatório'], 1]
    ] },
    { id: 'alergenicos', titulo: 'Alergênicos e informação ao cliente', min: 6, base: 'RDC 727/2022 (rotulagem de alergênicos); CDC, art. 6º, III', aulas: [
      ['Os principais', 'Trigo, centeio, cevada e aveia, leite, ovos, amendoim, soja, peixes, crustáceos, castanhas, nozes e amêndoas estão entre os alimentos que mais causam alergia. Para quem é alérgico, uma quantidade mínima pode causar reação grave.'],
      ['Quando o cliente pergunta', 'Consulte a ficha técnica ou o responsável antes de responder. Nunca chute. Se não houver certeza, diga que não pode garantir: informar com clareza é direito do consumidor.'],
      ['Evitar o contato', 'No pedido para alérgico, separe utensílios e superfícies, troque as luvas, lave as mãos e limpe a área antes. Produto embalado na casa informa os alergênicos no rótulo.']
    ], quiz: [
      ['O cliente pergunta se o molho tem leite e você não sabe:', ['Diz que não tem, para não perder a venda', 'Consulta a ficha técnica ou o responsável antes de responder', 'Diz que tem pouco'], 1],
      ['Para quem tem alergia, uma quantidade pequena:', ['Não faz mal', 'Pode causar reação grave', 'Só faz mal se estiver crua'], 1],
      ['Qual destes é um alergênico comum?', ['Sal', 'Amendoim', 'Açúcar'], 1],
      ['Pedido para cliente alérgico a trigo. O cuidado é:', ['Usar a mesma chapa sem limpar', 'Separar utensílios e limpar a área antes', 'Só tirar o pão'], 1]
    ] },
    { id: 'seguranca', titulo: 'Segurança na cozinha', min: 8, base: 'NR-6 (EPI), NR-12 (máquinas), NR-17 (ergonomia); CLT, art. 158', aulas: [
      ['Cortes e máquinas', 'Faca afiada e certa para cada uso, corte sobre tábua firme e longe do corpo. Nunca tente pegar uma faca caindo. Em moedor, cortador, masseira ou fatiador, use as proteções e o empurrador, nunca a mão. Limpeza só com a máquina desligada da tomada.'],
      ['Queimaduras e óleo', 'Cabo das panelas virado para dentro; luva térmica para forno e assadeira. Óleo pegando fogo: desligue o gás e abafe com a tampa, nunca jogue água. Avise quando o piso estiver molhado e use calçado antiderrapante.'],
      ['EPI e postura', 'A empresa fornece os EPIs de graça e ensina o uso: luva térmica, luva de malha de aço para corte, avental, calçado antiderrapante e luvas para produtos de limpeza. Usar é obrigação do empregado (CLT, art. 158). Para levantar peso, dobre os joelhos e peça ajuda.']
    ], quiz: [
      ['Óleo pegando fogo na fritadeira:', ['Jogar água', 'Desligar o gás e abafar com a tampa', 'Abanar'], 1],
      ['Para limpar o moedor ou o fatiador:', ['Desligar da tomada antes', 'Limpar ligado, com cuidado', 'Só passar pano por fora'], 0],
      ['Quem paga o EPI?', ['O empregado', 'A empresa, de graça', 'Metade cada um'], 1],
      ['A faca está caindo. Você:', ['Tenta pegar no ar', 'Se afasta e deixa cair', 'Chuta para longe'], 1]
    ] }
  ];
  // Cursos sugeridos para todos que manipulam alimentos (RDC 216, item 4.6.7: higiene pessoal, manipulação higiênica e DTA)
  g.CENTRALIZAR_CURSOS_BASE = ['higiene', 'contaminacao', 'temperaturas'];
  g.CENTRALIZAR_CURSO_VALIDADE_MESES = 12; // reciclagem anual sugerida
})(window);
