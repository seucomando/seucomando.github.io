# Centralizar · gestão empresarial para pequenas e médias empresas

Protótipo navegável do Centralizar: um sistema único de gestão empresarial que junta equipe, documentos, ponto, holerite, estoque e vales, com **empresário, contador, funcionário e candidato** no mesmo lugar.

- `index.html`: página de apresentação (landing page).
- `triagem.html`: a pré-entrevista que o candidato responde pelo link da vaga, só com perguntas e sem documentos. A resposta aparece no painel.
- `app.html`: o painel do sistema, com dados de exemplo. Use o seletor **Ver como** no topo para alternar entre **Empresário**, **Contador** e **Funcionário**.

Os dados são fictícios e ficam só no navegador de quem abre (localStorage). Nada é enviado a servidor algum.

## Como rodar

O site é estático: não tem build nem dependências. Para abrir localmente:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

No GitHub Pages, basta publicar a branch `main` na raiz.

## O que cada requisito virou no protótipo

| Requisito | Onde está | Como funciona hoje |
|---|---|---|
| Documentos da contratação num lugar só | Admissões | Só para quem foi aprovado na entrevista: o aprovado envia, o contador confere e o empregador dá o ok final, liberado só depois da conferência. Tudo fica no histórico |
| Triagem e entrevista (CLT, freelancer etc.) | Vagas e seleção | A triagem são só perguntas e descarta quem não se encaixa. Quem passa é chamado para entrevista (dia, hora e convite no WhatsApp) e o empregador aprova ou não. Funil da vaga na tela. Perguntas discriminatórias ficam bloqueadas (Lei 9.029/95) |
| WhatsApp | Vagas | Convite de entrevista para quem passou na triagem e link de documentos para quem foi aprovado na entrevista; ao enviar o link, a admissão é aberta |
| Contratos sugeridos, editáveis e em PDF | Contratos | Base de 221 cargos em 16 setores, com CBO conferida na tabela oficial, atribuições e pontos trabalhistas. O empregador escolhe o enquadramento (cargo, prazo, jornada, turno, adicionais, salário, CCT e art. 481), o sistema verifica riscos e só libera o PDF depois do checklist. No plano de avaliação o PDF sai com marca d'água |
| Jornada, atestados e advertências | Ponto e jornada; Atestados e advertências | Situação do ponto do dia; atestado com foto para ciência e original físico pendente com prazo; advertência com ciência no app ou recusa com testemunhas |
| Segunda via do holerite | Holerites (visão Funcionário) | Lista das competências com a segunda via para imprimir |
| Holerite aprovado pela empresa | Holerites | O contador lança, a empresa aprova e só então o funcionário vê |
| Faltas não abonadas | Holerites e Início | Alerta antes da aprovação, cruzando faltas com atestados sem o original |
| Bater ponto pelo celular ou em aparelho fixo | Ponto e jornada | Autorização por pessoa, validação facial ou digital simulada e comprovante com NSR |
| Checklists com foto total ou parcial | Checklists | Por setor e responsável, com regra de foto em todos os itens, só nos marcados ou sem foto |
| Etiquetas e estoque | Estoque e etiquetas | Mínimo, validade e etiquetas com código de barras Code 39 real, prontas para imprimir |
| Lista de compras | Lista de compras (e botão no Estoque) | Sugere o que está abaixo do mínimo com a quantidade até o estoque ideal, recebe pedidos da equipe, agrupa por fornecedor, envia o pedido pelo WhatsApp, imprime e, no recebimento, soma ao estoque |
| Vales descontados em folha | Vales | Assinatura do funcionário obrigatória, alerta em 60% e trava em 70% do salário |

## Estrutura

```
index.html            landing page
app.html              painel (protótipo)
assets/css/site.css   estilo da landing
assets/css/app.css    estilo do painel
assets/js/site.js     interações da landing
assets/js/app.js      telas, regras e ações do painel
assets/js/data.js     dados de exemplo e base de contratos
assets/js/code39.js   gerador de código de barras
assets/img/           logo e favicon
SECURITY.md           análise de segurança e requisitos para a versão real
```

## Antes de virar produto

Veja o `SECURITY.md`: ele traz o que precisa existir no servidor (contas, isolamento por empresa, LGPD, REP-P e WhatsApp oficial) antes de entrar qualquer dado real.
