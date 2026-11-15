# Seu Comando · como ligar o app ao banco de dados (Supabase)

Sem estes passos o app funciona só com os dados de exemplo, no navegador. Com eles, cada empresa tem login e senha, os dados ficam num banco de dados no Brasil e cada pessoa só vê o que o papel dela permite.

## 1. Criar o projeto (5 minutos)
1. Crie a conta em supabase.com e clique em **New project**.
2. Nome: `seu-comando`. Região: **South America (São Paulo)**. Crie uma senha forte para o banco e guarde num gerenciador de senhas.
3. Espere o projeto ficar pronto.

## 2. Criar as tabelas e as regras
1. Abra **SQL Editor > New query**.
2. Cole todo o arquivo `supabase/schema.sql` e clique em **Run**. Pode rodar de novo quando houver versão nova: o arquivo não apaga dados.

## 3. Login e senhas (Authentication)
- **Sign In / Providers > Email**: deixe ativo, com **Confirm email** ligado.
- **Policies de senha**: mínimo de 8 caracteres, com letras e números.
- **URL Configuration**: em *Site URL* coloque o endereço do site (ex.: `https://seucomando.com.br`) e, em *Redirect URLs*, `https://seucomando.com.br/entrar.html`.
- Senhas ficam guardadas pelo Supabase com hash bcrypt; ninguém, nem o dono do sistema, consegue ler a senha.

## 4. Função do primeiro acesso do funcionário
1. **Edge Functions > Deploy a new function > Via editor**, nome `acesso-funcionario`.
2. Cole o arquivo `supabase/functions/acesso-funcionario/index.ts` e publique.
3. Em **Edge Functions > Secrets**, crie:
   - `DOMINIO_FUNCIONARIO` = `func.seucomando.com.br` (o mesmo de `config.js`; é só um identificador técnico do login por CPF, nenhum e-mail é enviado para ele);
   - `ORIGEM_PERMITIDA` = endereço do site (ex.: `https://seucomando.com.br`).

## 5. Ligar o site ao projeto
1. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
2. Cole em `assets/js/config.js` (`supabaseUrl` e `supabaseAnonKey`). Nunca use a chave `service_role` no site.
3. Publique o site e aumente `VERSAO` em `sw.js`: quem já instalou o app vê "Nova versão disponível".

## 6. Primeiro uso
1. `entrar.html` > **Criar conta da empresa** (nome, e-mail, senha, empresa e ramo) > confirme o e-mail > entre.
2. **Equipe e acessos**: cadastre as pessoas com CPF, escolha Funcionário ou Gerente e as permissões, e gere o código de primeiro acesso.
3. O funcionário abre `entrar.html` > **Primeiro acesso**, digita CPF, código e cria a senha. Depois entra com CPF e senha.
4. Contador: **Convidar contador** gera um código; ele cria a conta com e-mail e usa **Tenho um código**.

## Como os dados ficam protegidos
- **Por papel:** empresário e contador acessam o documento da empresa. Funcionário e gerente recebem só a parte deles (o gerente, também o que a permissão libera). Funcionário e gerente não alteram o documento da empresa: enviam o que fizeram (ponto, atestado, banco de horas, checklist, curso), e o app da empresa confere e aplica.
- **Ponto:** vale a hora do servidor, não a do celular.
- **Registro de alterações:** acessos, permissões e banco de horas ficam registrados com autor e data, sem possibilidade de apagar pelo app. Para corrigir um lançamento de banco de horas, usa-se o estorno.
- **Pré-entrevista:** o candidato não tem login. Ele só vê o título da vaga e envia as respostas; não consegue ler nada.
- **Criptografia:** HTTPS em todo o tráfego, banco cifrado em repouso pelo Supabase e senhas com hash bcrypt.

## Limites desta versão
- Fotos de atestado e de checklist ainda ficam só no aparelho; o próximo passo é o Storage do Supabase, com regras por empresa.
- Se duas pessoas salvarem ao mesmo tempo, a segunda recebe um aviso e a tela recarrega com a versão mais nova (nada é sobrescrito sem aviso).
