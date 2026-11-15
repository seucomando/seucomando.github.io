# Seu Comando · gestão empresarial para pequenas e médias empresas

Protótipo navegável do Seu Comando: um sistema único de gestão empresarial que junta equipe, documentos, ponto, holerite, estoque e vales, com **empresário, contador, funcionário e candidato** no mesmo lugar.

Endereço provisório (até o domínio seucomando.com.br sair): **https://rafadolivei123.github.io/seu-comando/**

- `index.html`: página de apresentação (landing page). `recrutamento.html`: página para agências de recrutamento.
- `entrar.html`: login (empresa e contador com e-mail; funcionário e gerente com CPF), criar conta, primeiro acesso e recuperar senha.
- `app.html`: o app de verdade, com dados no banco (Supabase). Pede login.
- `app.html?exemplo=1`: o protótipo com dados fictícios, que ficam só no navegador. Use o seletor **Ver como** no topo para alternar entre **Empresário**, **Contador**, **Gerente** e **Funcionário**.
- `triagem.html`: a pré-entrevista que o candidato responde pelo link da vaga, só com perguntas e sem documentos.

Configuração do banco, publicação e próximos passos: [SETUP-SUPABASE.md](SETUP-SUPABASE.md).

## Como rodar

O site é estático: não tem build nem dependências. Para abrir localmente:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Publicação: GitHub Pages a partir da branch `main`, na raiz. A cada versão, aumente `VERSAO` em `sw.js`.

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
| Pré-entrevista robusta | Página do candidato (`triagem.html`) | Contato, disponibilidade, transporte, pretensão, experiência, se já trabalhou na empresa, escolaridade, requisitos legais conforme o cargo (eliminatórios ou não) e uma situação do dia a dia do setor. O empregador vê todas as respostas em "Ver respostas" |
| Contratos robustos e cláusulas do empregador | Contratos | Motor de cláusulas por cargo e setor (jornada, adicionais, descontos, SST por NR, LGPD, monitoramento, sigilo e rescisão), cláusulas opcionais prontas (imagem, biometria, não aliciamento, não concorrência com indenização, comodato, celular, cursos, troca de turno, reembolso de km) e cláusula própria com verificação automática de nulidade |
| Prévia dos documentos e PDF | Todos os botões de imprimir | Folha A4 na tela, "Baixar PDF" (html2pdf, local) com rodapé e marca d'água no plano de avaliação, e "Imprimir" |
| Boas práticas de alimentos (adicional) | Boas práticas | Registro de temperaturas com ação corretiva obrigatória fora da faixa, planilha em PDF, prazos da vigilância sanitária (manual, POPs, caixa-d'água, pragas, ASO, alvará) e validade dos produtos (RDC Anvisa 216/2004) |
| Mini cursos para a equipe | Mini cursos | 7 cursos curtos (higiene, contaminação cruzada, temperaturas, recebimento e etiquetas, limpeza, alergênicos, segurança na cozinha) com teste e certificado em PDF, que comprova a capacitação exigida pela RDC 216 (item 4.6.7) |
| Exemplo coerente com o ramo | "Abra seu painel" na landing | 13 ramos (padaria, hamburgueria, restaurante, mercado, loja, oficina, metalúrgica, confecção, construtora, salão, clínica, escritório e agência de R&S), cada um com equipe, cargos, produtos, checklists, vagas e horários próprios |
| Recrutamento e seleção | Processos seletivos e Empresas clientes (ramo "agência") e `recrutamento.html` | Processo por cliente e função, triagem pelo link, entrevista com nota e parecer, lista curta só com quem autorizou compartilhar (LGPD, art. 7º, § 5º) e envio ao cliente: integrado (cai em Vagas do cliente para aprovar ou recusar, e a decisão volta) ou pasta .zip com dossiê PDF, CSV e arquivo de dados que outra empresa com o Seu Comando importa |

## Login, banco de dados e app instalável

- **Login e senha:** empresário e contador com e-mail; funcionário e gerente com CPF e senha (primeiro acesso por código de 72 horas). Senhas no Supabase Auth, com hash bcrypt.
- **Banco de dados:** Supabase (PostgreSQL, região São Paulo) com regras por empresa e por papel (RLS). Tabelas, regras e funções em `supabase/schema.sql`, testadas num Postgres em memória.
- **Papéis:** empresário, contador, gerente (com permissões escolhidas pelo dono, como banco de horas) e funcionário. Mudanças de acesso e lançamentos de banco de horas ficam registrados.
- **App:** instalável no celular e no computador (PWA), abre sem internet e avisa "Nova versão disponível" quando sai atualização.
- **Como ligar:** siga `SETUP-SUPABASE.md`. Sem configuração, o app roda só com o exemplo local.

## Estrutura

```
index.html            landing page
app.html              painel (protótipo)
assets/css/site.css   estilo da landing
assets/css/app.css    estilo do painel
assets/js/site.js     interações da landing
assets/js/app.js      telas, regras e ações do painel
assets/js/data.js     dados de exemplo e base de contratos
assets/js/perfis.js   exemplos de alimentação e boas práticas
assets/js/perfis2.js  demais ramos e a agência de recrutamento
assets/js/cargos.js   221 cargos com CBO e pontos trabalhistas (gerado)
assets/js/clausulas.js motor de cláusulas do contrato
assets/js/perguntas.js perguntas da pré-entrevista por cargo
assets/js/cursos.js   mini cursos de boas práticas
assets/js/vendor/     html2pdf.js 0.10.2 (MIT), usado para gerar os PDFs no navegador
recrutamento.html     página para agências de recrutamento e seleção
triagem.html          pré-entrevista que o candidato responde
entrar.html           login, primeiro acesso, criar conta e recuperar senha
manifest.webmanifest  dados do app instalável
sw.js                 service worker (instalação, uso sem internet e atualização)
assets/js/config.js   endereço e chave pública do Supabase
assets/js/nuvem.js    conexão com o banco
supabase/             schema.sql e a função de primeiro acesso do funcionário
assets/js/code39.js   gerador de código de barras
assets/img/           logo e favicon
SECURITY.md           análise de segurança e requisitos para a versão real
```

## Antes de virar produto

Veja o `SECURITY.md`: ele traz o que precisa existir no servidor (contas, isolamento por empresa, LGPD, REP-P e WhatsApp oficial) antes de entrar qualquer dado real.
