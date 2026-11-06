# Segurança do Centralizar

## 1. O que existe hoje (protótipo estático)

O protótipo **não tem servidor, banco de dados nem contas**. Os dados de exemplo ficam no `localStorage` do navegador de quem abre. Não há segredos, chaves de API nem dados reais no repositório.

### Proteções aplicadas e testadas

| Proteção | Como | Teste feito |
|---|---|---|
| Política de conteúdo (CSP) | `script-src 'self'`, sem scripts inline, `object-src 'none'`, `base-uri 'self'` e `form-action 'self'`; estilos só do próprio site e do Google Fonts | Páginas carregadas sem violação no console |
| Escape de todo dado dinâmico | Função `esc()` antes de qualquer `innerHTML`; `textContent` na landing | `?empresa=<b>Bom</b>` e um vale com `<img src=x onerror=alert(1)>` aparecem como texto e não são executados |
| Sem código de terceiros | Nenhuma biblioteca JS externa, nenhum npm, nenhum CDN de script | — |
| Fotos locais | Fotos de checklist e atestado viram `blob:` no próprio navegador e não são enviadas | — |
| Armazenamento tolerante a falhas | Leitura e escrita do `localStorage` dentro de try/catch | Funciona em aba anônima |
| Privacidade de navegação | `referrer` restrito e painel com `noindex` | — |
| Controle por papel (simulado) | Rotas e ações escondidas e bloqueadas conforme a visão (Empresário, Contador ou Funcionário) | 30 combinações de tela e visão testadas sem erro |

### Limites do GitHub Pages

O GitHub Pages não permite configurar cabeçalhos HTTP. Por isso, `frame-ancestors` e `X-Frame-Options` (proteção contra clickjacking) **não** podem ser aplicados aqui, já que a tag `<meta>` ignora essas diretivas. Para o produto real, hospede atrás de um serviço que permita cabeçalhos, como Cloudflare, Vercel, Netlify ou um servidor próprio.

## 2. O que a versão real precisa ter antes de receber dados

**Contas e acesso**
- Login com MFA obrigatório para empresa e contador.
- Isolamento por empresa no banco, com Row Level Security no Postgres ou equivalente, para que nenhuma consulta cruze empresas.
- Papéis com permissão por registro: empresa, contador (só as empresas que o adicionaram), funcionário (só os próprios dados) e candidato (só o formulário dele, por link com prazo).
- Trilha de auditoria imutável: quem alterou o quê e quando. O protótipo já mostra isso na tela.

**LGPD**
- Atestados são **dado de saúde**, e reconhecimento facial e digital são **dado biométrico**. Os dois são dados sensíveis (art. 5º, II). Faça um Relatório de Impacto (RIPD, art. 38) antes do lançamento.
- Biometria: guarde só o *template*, nunca a foto; informe o funcionário e ofereça um meio alternativo de marcar o ponto. A base legal é a prevenção à fraude na identificação (art. 11, II, g).
- Candidatos não aprovados: defina um prazo de exclusão automática.
- Contrato de tratamento de dados com as empresas clientes, definindo quem é controlador e quem é operador, inclusive na relação com o contador.
- Documentos e fotos criptografados em repouso, servidos por links assinados de curta duração.

**Ponto (REP-P, Portaria MTP 671/2021)**
- Registro do programa no INPI, comprovante de cada marcação, arquivos AFD e AEJ, sincronização com a hora legal brasileira e armazenamento inalterável pelo prazo legal.

**WhatsApp**
- Somente a API oficial (WhatsApp Business Platform), com opt-in do candidato e modelos de mensagem aprovados. As chaves ficam no servidor, nunca no navegador.

**Operação**
- Segredos em cofre (variáveis de ambiente do provedor), limite de requisições no login e nos formulários públicos, backups testados e, antes de abrir para clientes, o checklist **OWASP ASVS nível 2** e um teste de invasão.

## 3. Ferramentas recomendadas para as próximas revisões

- **Trail of Bits Skills para o Claude Code** (licença CC-BY-SA-4.0). No Claude Code do seu PC: `/plugin marketplace add trailofbits/skills` e, depois, `/plugin menu`. As mais úteis aqui:
  - `insecure-defaults`: configurações que falham de forma aberta.
  - `static-analysis`: Semgrep e CodeQL.
  - `supply-chain-risk-auditor`: dependências npm.
  - `differential-review`: revisão de segurança de cada mudança.
- **Recursos do próprio GitHub**, gratuitos em repositório público: Dependabot, CodeQL (*code scanning*), *secret scanning* e *push protection*.
