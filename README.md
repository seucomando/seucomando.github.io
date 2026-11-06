# Centralizar · gestão empresarial para pequenas e médias empresas

Protótipo navegável do Centralizar: um sistema único de gestão empresarial que junta equipe, documentos, ponto, holerite, estoque e vales, com **empresário, contador, funcionário e candidato** no mesmo lugar.

- `index.html`: página de apresentação (landing page).
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
| Documentos da contratação num lugar só | Admissões | Só para os candidatos que o empregador escolheu: o escolhido preenche, o contador e a empresa corrigem, e tudo fica no histórico |
| Pré-entrevista com filtro (CLT, freelancer etc.) | Vagas e pré-entrevista | Só perguntas, sem documentos. O empregador define os critérios, o sistema marca quem está apto e o empregador escolhe quem segue. Perguntas discriminatórias ficam bloqueadas (Lei 9.029/95) |
| WhatsApp para os aprovados | Vagas › Enviar link de documentos | Só para os escolhidos que autorizaram o contato; ao enviar, a admissão de cada um é aberta |
| Contratos sugeridos, editáveis e em PDF | Contratos | 5 modelos (experiência, indeterminado, intermitente, autônomo e estágio) marcados como sugestão, editáveis na tela e com impressão em PDF |
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
