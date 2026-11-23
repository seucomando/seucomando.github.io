# Seu Comando · banco de dados (Supabase) e publicação

## Situação atual (23/11/2026)
| Item | Situação |
|---|---|
| Projeto Supabase `seu-comando` | Criado em São Paulo (sa-east-1), ref. `owwwhiswwtddchizoljm` |
| Tabelas, regras (RLS) e funções | `supabase/schema.sql` rodado e conferido: 8 tabelas, 18 regras, 15 funções, RLS ligado |
| Parte 2 (18/11/2026) | `supabase/schema-2.sql` rodado: ponto com foto e local (`registros_ponto`, hora e NSR do servidor, sem edição nem exclusão), documentos do funcionário (`documentos_pessoa`), holerites em PDF (`holerites`) e depósito privado `arquivos` com regras por empresa e por pessoa |
| Parte 3 (18/11/2026) | `supabase/schema-3.sql` rodado: ajuste de marcação (`ajustes_ponto`). O funcionário pede, só a empresa aprova ou recusa com resposta; a marcação original não muda e nada se apaga |
| Parte 4 (23/11/2026) | `supabase/schema-4.sql`: até 4 intervalos por jornada (marcações 0 a 9), fuso horário da empresa ou da pessoa, jornada que passa da meia-noite, reconhecimento facial (`rostos`, só a empresa apaga) e checklists com horário (`checklist_registros`: hora do servidor, justificativa depois do limite, foto obrigatória quando a etapa pede) |
| Login | E-mail com confirmação; senha mínima de 8 caracteres com letras e números |
| Função `acesso-funcionario` | Publicada, com "Verify JWT" desligado (a própria função confere CPF e código) |
| Chave do site | `assets/js/config.js` usa a chave **publishable** (pública por natureza) |
| Site | GitHub Pages: `https://seucomando.github.io/` (temporário até o domínio sair) |
| Endereços liberados no login | `seucomando.github.io`, `seucomando.com.br` e `www.seucomando.com.br` |
| E-mails de confirmação | **Pendente:** SMTP próprio (veja o item 4) |

## 1. Como o site decide entre exemplo e uso real
- `app.html?exemplo=1` abre o protótipo com dados fictícios, só no navegador, sem tocar no banco. É o que a landing abre em "Ver o sistema" e "Abrir o painel".
- `app.html` sem `?exemplo=1` é o app de verdade: pede login (CPF e senha para funcionário e gerente; e-mail e senha para empresa e contador).
- `entrar.html` é a porta de entrada: criar conta da empresa, primeiro acesso do funcionário, esqueci a senha e "Tenho um código".

## 2. Primeiro uso
1. `entrar.html` > **Criar conta da empresa** (nome, e-mail, senha, empresa e ramo) > confirme o e-mail > entre.
2. **Equipe e acessos**: cadastre as pessoas com CPF, escolha Funcionário ou Gerente e as permissões, e gere o código de primeiro acesso.
3. O funcionário abre `entrar.html` > **Primeiro acesso**, digita CPF, código e cria a senha. Depois entra com CPF e senha. Funcionário não precisa de e-mail.
4. Contador: **Convidar contador** gera um código; ele cria a conta com e-mail e usa **Tenho um código**.

## 3. Publicar uma versão nova
1. Altere os arquivos, aumente `VERSAO` em `sw.js` e envie para a branch `main` do repositório `seucomando/seucomando.github.io` (organização seucomando no GitHub).
2. O GitHub Pages publica em cerca de 1 minuto. Quem já instalou o app vê "Nova versão do Seu Comando disponível".
3. Mudou o banco? Rode `supabase/schema.sql`, `supabase/schema-2.sql`, `supabase/schema-3.sql` e `supabase/schema-4.sql` de novo no SQL Editor, nessa ordem: eles não apagam dados.

## 4. Antes de abrir para clientes: e-mail próprio (SMTP)
O serviço de e-mail que vem com o Supabase só entrega para quem faz parte da equipe do projeto (hoje, só a sua conta) e no máximo 2 e-mails por hora. Para clientes criarem conta e recuperarem senha:
1. Crie uma conta num serviço de envio (Brevo ou Resend têm plano gratuito) e verifique o domínio `seucomando.com.br` quando ele sair.
2. Supabase > **Authentication > Emails > SMTP Settings**: preencha servidor, porta, usuário e senha do serviço, com remetente `nao-responda@seucomando.com.br`.
3. Com o SMTP ligado, os modelos ficam editáveis: use os textos em português de `supabase/emails/`.

## 5. Quando o domínio seucomando.com.br sair
1. Repositório > **Settings > Pages > Custom domain**: `seucomando.com.br` (o GitHub cria o arquivo CNAME) e marque **Enforce HTTPS**.
2. No registro do domínio, aponte o domínio para o GitHub Pages (registros A para 185.199.108.153, .109.153, .110.153 e .111.153, e CNAME `www` para `seucomando.github.io`).
3. Supabase > **Authentication > URL Configuration**: troque o *Site URL* para `https://seucomando.com.br` (os endereços do domínio já estão liberados).
4. Supabase > **Edge Functions > Secrets**: crie `ORIGEM_PERMITIDA` = `https://seucomando.com.br`. Enquanto não existir, a função aceita chamadas de qualquer site, o que é seguro porque ela só funciona com CPF e código válidos.

## Como os dados ficam protegidos
- **Por papel:** empresário e contador acessam o documento da empresa. Funcionário e gerente recebem só a parte deles (o gerente, também o que a permissão libera). Funcionário e gerente não alteram o documento da empresa: enviam o que fizeram (ponto, atestado, banco de horas, checklist, curso), e o app da empresa confere e aplica.
- **Ponto:** vale a hora do servidor, não a do celular. O dia da marcação segue o fuso da pessoa (ou da empresa).
- **Rosto:** a comparação roda no aparelho; o banco guarda só o código numérico do rosto (128 números) e a foto do cadastro. O contador não vê. Só a empresa apaga um cadastro para refazer.
- **Checklists:** cada etapa marcada fica com a hora do servidor e não se edita. Depois do limite, o banco só aceita com justificativa; etapa que pede foto só entra com foto. A empresa pode desfazer uma marcação, e isso fica no registro de alterações.
- **Registro de alterações:** acessos, permissões e banco de horas ficam registrados com autor e data, sem possibilidade de apagar pelo app. Para corrigir um lançamento de banco de horas, usa-se o estorno.
- **Pré-entrevista:** o candidato não tem login. Ele só vê o título da vaga e envia as respostas; não consegue ler nada.
- **Criptografia:** HTTPS em todo o tráfego, banco cifrado em repouso pelo Supabase e senhas com hash bcrypt. Ninguém, nem o dono do sistema, consegue ler a senha.
- **Chaves:** o site só tem a chave publishable. A chave secreta fica apenas dentro do Supabase, usada pela função do primeiro acesso. Nunca coloque uma chave secreta no site nem no repositório.

## Limites desta versão
- Se duas pessoas salvarem ao mesmo tempo, a segunda recebe um aviso e a tela recarrega com a versão mais nova (nada é sobrescrito sem aviso).
- O envio de candidatos da recrutadora para empresas clientes pelo banco ainda não passou por teste com contas reais.
