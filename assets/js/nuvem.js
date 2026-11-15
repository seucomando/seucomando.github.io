/* Seu Comando · conexão com o banco (Supabase). Sem configuração, o app roda só com o exemplo local.
   Senhas: tratadas pelo Supabase Auth (hash bcrypt). Dados: Postgres com regras por empresa (RLS). */
(function (g) {
  'use strict';
  var C = g.SEUCOMANDO_CONFIG || {};
  var sb = g.SEUCOMANDO_CLIENTE || (C.supabaseUrl && C.supabaseAnonKey && g.supabase ? g.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null);
  var TRAD = {
    'Invalid login credentials': 'CPF, e-mail ou senha incorretos.', 'Email not confirmed': 'Confirme o e-mail pelo link que enviamos antes de entrar.',
    'User already registered': 'Este e-mail já tem conta. Use "Entrar" ou "Esqueci a senha".', conflito_versao: 'Outra pessoa salvou alterações ao mesmo tempo.',
    codigo_invalido: 'Código inválido, vencido ou já usado. Peça um novo para a empresa.', sem_permissao: 'Você não tem permissão para isso.', cpf_invalido: 'CPF inválido.',
    limite_empresas: 'Esta conta já tem 5 empresas.', senha_fraca: 'Senha fraca: use pelo menos 8 caracteres, misturando letras e números.', conta_existe: 'Você já tem conta no app. Entre com seu CPF e senha e digite o código em "Tenho um código".',
    dados_invalidos: 'Confira o CPF e o código (formato ABCD-EF2345).', vaga_inexistente: 'Esta vaga não está mais aberta.', muitas_respostas: 'Muitas respostas agora. Tente de novo em alguns minutos.'
  };
  function erro(e) { var m = (e && (e.erro || e.message || e.error_description)) || String(e); var k = Object.keys(TRAD).filter(function (x) { return m.indexOf(x) > -1; })[0]; var er = new Error(k ? TRAD[k] : m); er.codigo = k || m; return er; }
  function r(p) { return p.then(function (x) { if (x && x.error) throw erro(x.error); return x ? x.data : x; }); }
  function base() { return location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, ''); }
  var N = { ativa: !!sb, sb: sb, empresa: null, papel: null, pessoa: null, perms: [], versao: 0, codigo: null, uid: null };
  N.emailFuncionario = function (cpf) { return String(cpf).replace(/\D/g, '') + '@' + (C.dominioFuncionario || 'func.seucomando.com.br'); };
  N.sessao = function () { return sb.auth.getSession().then(function (x) { var s = x && x.data && x.data.session; N.uid = s ? s.user.id : null; return s; }); };
  N.entrar = function (login, senha) { var email = /@/.test(login) ? String(login).trim().toLowerCase() : N.emailFuncionario(login); return r(sb.auth.signInWithPassword({ email: email, password: senha })); };
  N.cadastrar = function (email, senha, nome) { return r(sb.auth.signUp({ email: String(email).trim().toLowerCase(), password: senha, options: { data: { nome: nome }, emailRedirectTo: base() + 'entrar.html' } })); };
  N.recuperar = function (email) { return r(sb.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo: base() + 'entrar.html#nova-senha' })); };
  N.novaSenha = function (senha) { return r(sb.auth.updateUser({ password: senha })); };
  N.sair = function () { try { localStorage.removeItem('seucomando-empresa'); } catch (e) { /* ignora */ } return sb.auth.signOut(); };
  N.vinculos = function () { return N.sessao().then(function (s) { if (!s) return []; return r(sb.from('membros').select('empresa_id, papel, pessoa_id, permissoes, nome').eq('user_id', s.user.id)); }); };
  N.criarEmpresa = function (nome, tipo, dados) { return r(sb.rpc('criar_empresa', { p_nome: nome, p_tipo: tipo, p_dados: dados })); };
  N.escolher = function (v) { N.empresa = v.empresa_id; N.papel = v.papel; N.pessoa = v.pessoa_id; N.perms = v.permissoes || []; try { localStorage.setItem('seucomando-empresa', v.empresa_id); } catch (e) { /* ignora */ } };
  N.carregar = function () {
    if (N.papel === 'empresa' || N.papel === 'contador') {
      return r(sb.from('empresas').select('nome, codigo, tipo, dados, versao').eq('id', N.empresa).single()).then(function (e) { N.versao = e.versao; N.codigo = e.codigo; var d = e.dados || {}; d.empresa = d.empresa || {}; d.empresa.codigo = e.codigo; d.tipo = d.tipo || e.tipo; return d; });
    }
    return r(sb.from('docs_funcionario').select('dados').eq('empresa_id', N.empresa).eq('pessoa_id', N.pessoa).maybeSingle()).then(function (x) { return x ? x.dados : null; });
  };
  N.meusEventosPendentes = function () { return r(sb.from('eventos').select('id, ops, criado_em').eq('empresa_id', N.empresa).eq('user_id', N.uid).is('aplicado_em', null).order('id')); };
  N.salvar = function (dados) { return r(sb.rpc('salvar_dados', { p_empresa: N.empresa, p_dados: dados, p_versao: N.versao })).then(function (v) { N.versao = v; return v; }); };
  N.membros = function () { return r(sb.from('membros').select('user_id, papel, pessoa_id, permissoes, nome').eq('empresa_id', N.empresa)); };
  N.publicar = function (docs) { if (!docs.length) return Promise.resolve(); return r(sb.from('docs_funcionario').upsert(docs.map(function (d) { return { empresa_id: N.empresa, pessoa_id: d.pessoa_id, dados: d.dados, atualizado_em: new Date().toISOString() }; }), { onConflict: 'empresa_id,pessoa_id' })); };
  N.enviarOps = function (ops) { return r(sb.from('eventos').insert({ empresa_id: N.empresa, pessoa_id: N.pessoa, ops: ops })); };
  N.eventosPendentes = function () { return r(sb.from('eventos').select('id, pessoa_id, user_id, ops, criado_em').eq('empresa_id', N.empresa).is('aplicado_em', null).order('id').limit(500)); };
  N.marcarEvento = function (id, resultado) { return r(sb.from('eventos').update({ aplicado_em: new Date().toISOString(), resultado: resultado }).eq('id', id)); };
  N.candidaturas = function () { return r(sb.from('candidaturas').select('id, vaga_id, dados, criado_em').eq('empresa_id', N.empresa).is('importado_em', null).order('id').limit(500)); };
  N.marcarCandidatura = function (id) { return r(sb.from('candidaturas').update({ importado_em: new Date().toISOString() }).eq('id', id)); };
  N.criarConvite = function (papel, pessoa, cpf, nome) { return r(sb.rpc('criar_convite', { p_empresa: N.empresa, p_papel: papel, p_pessoa: pessoa, p_cpf: cpf, p_nome: nome })); };
  N.aceitarConvite = function (codigo, cpf) { return r(sb.rpc('aceitar_convite', { p_codigo: String(codigo).trim().toUpperCase(), p_cpf: cpf || null })); };
  N.alterarAcesso = function (pessoa, papel, perms, nome) { return r(sb.rpc('alterar_acesso', { p_empresa: N.empresa, p_pessoa: pessoa, p_papel: papel, p_permissoes: perms || [], p_nome: nome || null })); };
  N.registrar = function (acao, detalhe, autor) { return r(sb.rpc('registrar', { p_empresa: N.empresa, p_acao: acao, p_detalhe: detalhe, p_autor_nome: autor })).catch(function () { /* registro local continua */ }); };
  N.primeiroAcesso = function (cpf, codigo, senha) {
    return sb.functions.invoke('acesso-funcionario', { body: { cpf: cpf, codigo: String(codigo).trim().toUpperCase(), senha: senha } }).then(function (x) {
      if (x.error) { var ctx = x.error.context; if (ctx && ctx.json) return ctx.json().then(function (j) { throw erro(j); }, function () { throw erro(x.error); }); throw erro(x.error); }
      if (x.data && x.data.erro) throw erro(x.data); return x.data;
    });
  };
  N.vagaPublica = function (codigo, vaga) { return r(sb.rpc('vaga_publica', { p_codigo: codigo, p_vaga: vaga })); };
  N.enviarCandidatura = function (codigo, vaga, dados) { return r(sb.rpc('enviar_candidatura', { p_codigo: codigo, p_vaga: vaga, p_dados: dados })); };
  N.envios = function (codigo) { return r(sb.from('envios').select('id, de_empresa, de_nome, para_codigo, dados, status, motivo, criado_em, decidido_em').or('de_empresa.eq.' + N.empresa + ',para_codigo.eq.' + codigo).order('criado_em').limit(500)); };
  N.enviar = function (deNome, para, dados, id) { var row = { de_empresa: N.empresa, de_nome: deNome, para_codigo: para, dados: dados }; if (id) row.id = id; return r(sb.from('envios').insert(row)); };
  N.decidir = function (id, status, motivo) { return r(sb.rpc('decidir_envio', { p_id: id, p_status: status, p_motivo: motivo || '' })); };
  g.Nuvem = N;
})(window);
