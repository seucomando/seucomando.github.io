/* Supabase falso para testes de interface (guarda tudo no localStorage). Não testa RLS: isso é testado no Postgres. */
(function () {
  var K = 'fake-sb-db';
  function db() { try { return JSON.parse(localStorage.getItem(K)) || null; } catch (e) { return null; } }
  var D = db() || { users: [], session: null, empresas: [], membros: [], convites: [], docs_funcionario: [], eventos: [], candidaturas: [], envios: [], auditoria: [], seq: 1 };
  function sync() { var x = db(); if (x) D = x; ['registros_ponto', 'documentos_pessoa', 'holerites', 'ajustes_ponto', 'rostos', 'checklist_registros'].forEach(function (k) { if (!D[k]) D[k] = []; }); }
  sync();
  function grava() { localStorage.setItem(K, JSON.stringify(D)); }
  function id() { return 'id-' + (D.seq++) + '-' + Math.random().toString(36).slice(2, 6); }
  function res(data, error) { return Promise.resolve({ data: data === undefined ? null : data, error: error || null }); }
  function err(m) { return res(null, { message: m }); }
  function uid() { return D.session ? D.session.user.id : null; }
  function papel(e) { var m = D.membros.filter(function (x) { return x.empresa_id === e && x.user_id === uid(); })[0]; return m ? m.papel : null; }
  function Q(t) {
    var f = [], op = 'select', payload = null, one = 0, ordem = null, lim = null, opts = {}, selAfter = false;
    var b = {
      select: function () { if (op !== 'select') selAfter = true; return b; }, eq: function (c, v) { f.push(function (r) { return r[c] === v; }); return b; },
      is: function (c, v) { f.push(function (r) { return (r[c] == null) === (v === null); }); return b; },
      or: function (s) { var parts = s.split(','); f.push(function (r) { return parts.some(function (p) { var a = p.split('.'); return String(r[a[0]]) === a.slice(2).join('.'); }); }); return b; },
      gte: function (c, v) { f.push(function (r) { return r[c] >= v; }); return b; }, in: function (c, vs) { vs = vs.map(String); f.push(function (r) { return vs.indexOf(String(r[c])) > -1; }); return b; }, delete: function () { op = 'delete'; return b; },
      order: function (c) { ordem = c; return b; }, limit: function (n) { lim = n; return b; }, single: function () { one = 1; return b; }, maybeSingle: function () { one = 2; return b; },
      insert: function (p) { op = 'insert'; payload = p; return b; }, update: function (p) { op = 'update'; payload = p; return b; }, upsert: function (p, o) { op = 'upsert'; payload = p; opts = o || {}; return b; },
      then: function (ok, no) { return run().then(ok, no); }
    };
    function run() {
      sync(); var T = D[t];
      if (op === 'insert') { var rows = [].concat(payload).map(function (r) { var x = JSON.parse(JSON.stringify(r)); if (!x.id) x.id = t === 'eventos' || t === 'candidaturas' ? D.seq++ : id(); if (t === 'eventos') x.user_id = uid(); x.criado_em = new Date().toISOString();
        if (t === 'registros_ponto') { x.id = D.seq++; x.em = new Date().toISOString(); var dd = new Date(); x.dia = dd.getFullYear() + '-' + ('0' + (dd.getMonth() + 1)).slice(-2) + '-' + ('0' + dd.getDate()).slice(-2); x.nsr = T.filter(function (y) { return y.empresa_id === x.empresa_id; }).length + 1; x.user_id = uid(); if (T.some(function (y) { return y.empresa_id === x.empresa_id && y.pessoa_id === x.pessoa_id && y.dia === x.dia && y.tipo === x.tipo; })) return { erro: 'registros_ponto_unico' }; }
        if (t === 'checklist_registros') { x.id = D.seq++; x.em = new Date().toISOString(); var d2 = new Date(); x.dia = d2.getFullYear() + '-' + ('0' + (d2.getMonth() + 1)).slice(-2) + '-' + ('0' + d2.getDate()).slice(-2); x.atrasado = !!x.justificativa; if (T.some(function (y) { return y.empresa_id === x.empresa_id && y.checklist_id === x.checklist_id && y.etapa_id === x.etapa_id && y.dia === x.dia; })) return { erro: 'checklist_registros_unico' }; }
        if (t === 'rostos') { x.cadastrado_em = new Date().toISOString(); if (T.some(function (y) { return y.empresa_id === x.empresa_id && y.pessoa_id === x.pessoa_id; })) return { erro: 'rostos_pkey' }; }
        if (t === 'documentos_pessoa') { x.id = D.seq++; x.status = x.status || 'enviado'; x.enviado_em = new Date().toISOString(); }
        return x; }); var bad = rows.filter(function (r) { return r.erro; })[0]; if (bad) return res(null, { message: 'duplicate key value violates unique constraint "' + bad.erro + '"' }); rows.forEach(function (r) { T.push(r); }); grava(); return res(one ? rows[0] : rows); }
      if (op === 'upsert') { var ks = (opts.onConflict || 'id').split(','); [].concat(payload).forEach(function (r) { var ex = T.filter(function (x) { return ks.every(function (k) { return x[k] === r[k]; }); })[0]; var nv = JSON.parse(JSON.stringify(r)); if (t === 'holerites' && !nv.id) { nv.id = D.seq++; nv.enviado_em = new Date().toISOString(); } if (ex) Object.assign(ex, nv); else T.push(nv); }); grava(); var outU = [].concat(payload).map(function (r) { return T.filter(function (x) { return ks.every(function (k) { return x[k] === r[k]; }); })[0]; }); return res(one ? outU[0] : outU); }
      var L = T.filter(function (r) { return f.every(function (fn) { return fn(r); }); });
      if (t === 'empresas') L = L.filter(function (r) { return ['empresa', 'contador'].indexOf(papel(r.id)) > -1; });
      if (t === 'docs_funcionario') L = L.filter(function (r) { var p = papel(r.empresa_id); return p === 'empresa' || p === 'contador' || D.membros.some(function (m) { return m.user_id === uid() && m.empresa_id === r.empresa_id && m.pessoa_id === r.pessoa_id; }); });
      if (op === 'update') { L.forEach(function (r) { Object.assign(r, payload); }); grava(); return res(one ? L[0] : L); }
      if (op === 'delete') { D[t] = T.filter(function (r) { return L.indexOf(r) < 0; }); grava(); return res(null); }
      if (ordem) L = L.slice().sort(function (a, c) { return a[ordem] > c[ordem] ? 1 : -1; }); if (lim) L = L.slice(0, lim);
      L = JSON.parse(JSON.stringify(L));
      if (one === 1) return L.length ? res(L[0]) : err('not found'); if (one === 2) return res(L[0] || null); return res(L);
    }
    return b;
  }
  function cod() { var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)]; return s.slice(0, 4) + '-' + s.slice(4); }
  var RPC = {
    criar_empresa: function (a) { var e = { id: id(), nome: a.p_nome, tipo: a.p_tipo, codigo: a.p_tipo.slice(0, 3).toUpperCase() + '-' + (1000 + D.seq++), versao: 1, criado_por: uid() }; e.dados = a.p_dados; e.dados.empresa.codigo = e.codigo; D.empresas.push(e); D.membros.push({ empresa_id: e.id, user_id: uid(), papel: 'empresa', permissoes: [] }); grava(); return res(e.id); },
    salvar_dados: function (a) { var e = D.empresas.filter(function (x) { return x.id === a.p_empresa; })[0]; if (!e || e.versao !== a.p_versao || ['empresa', 'contador'].indexOf(papel(e.id)) < 0) return err('conflito_versao'); e.dados = a.p_dados; e.versao++; grava(); return res(e.versao); },
    criar_convite: function (a) { if (papel(a.p_empresa) !== 'empresa') return err('sem_permissao'); var c = cod(); D.convites.push({ codigo: c, empresa_id: a.p_empresa, papel: a.p_papel, pessoa_id: a.p_pessoa, cpf: (a.p_cpf || '').replace(/\D/g, '') || null, nome: a.p_nome, usado: false }); grava(); return res(c); },
    aceitar_convite: function (a) { var c = D.convites.filter(function (x) { return x.codigo === a.p_codigo && !x.usado; })[0]; if (!c) return err('codigo_invalido'); D.membros.push({ empresa_id: c.empresa_id, user_id: uid(), papel: c.papel, pessoa_id: c.pessoa_id, nome: c.nome, permissoes: [] }); c.usado = true; grava(); return res(c.empresa_id); },
    alterar_acesso: function (a) { D.membros.forEach(function (m) { if (m.empresa_id === a.p_empresa && m.pessoa_id === a.p_pessoa) { m.papel = a.p_papel; m.permissoes = a.p_papel === 'gerente' ? a.p_permissoes : []; } }); D.auditoria.push({ acao: 'Acesso alterado', detalhe: a.p_nome }); grava(); return res(1); },
    registrar: function (a) { D.auditoria.push({ acao: a.p_acao, detalhe: a.p_detalhe, autor: a.p_autor_nome }); grava(); return res(null); },
    vaga_publica: function (a) { var e = D.empresas.filter(function (x) { return x.codigo === a.p_codigo; })[0]; var v = e && (e.dados.vagas || []).filter(function (x) { return x.id === a.p_vaga; })[0]; return res(v ? { empresa: e.dados.empresa.nome, vaga: { id: v.id, titulo: v.titulo, cargo: v.cargo, regimeOferta: v.regimeOferta } } : null); },
    enviar_candidatura: function (a) { var e = D.empresas.filter(function (x) { return x.codigo === a.p_codigo; })[0]; if (!e) return err('vaga_inexistente'); D.candidaturas.push({ id: D.seq++, empresa_id: e.id, vaga_id: a.p_vaga, dados: a.p_dados, importado_em: null }); grava(); return res(null); },
    decidir_envio: function () { return res(null); }
  };
  window.SEUCOMANDO_CLIENTE = {
    auth: {
      getSession: function () { sync(); return res({ session: D.session }); },
      signInWithPassword: function (a) { sync(); var u = D.users.filter(function (x) { return x.email === a.email && x.senha === a.password; })[0]; if (!u) return err('Invalid login credentials'); D.session = { user: { id: u.id, email: u.email } }; grava(); return res({ session: D.session }); },
      signUp: function (a) { sync(); if (D.users.some(function (x) { return x.email === a.email; })) return err('User already registered'); var u = { id: id(), email: a.email, senha: a.password }; D.users.push(u); D.session = { user: { id: u.id, email: u.email } }; grava(); return res({ session: D.session, user: u }); },
      signOut: function () { sync(); D.session = null; grava(); return res(null); }, resetPasswordForEmail: function () { return res({}); }, updateUser: function () { return res({}); }
    },
    from: function (t) { return Q(t); },
    storage: { from: function () { return { upload: function (path) { return res({ path: path }); }, createSignedUrl: function (path) { return res({ signedUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==' }); }, remove: function () { return res(null); } }; } },
    rpc: function (n, a) { sync(); return RPC[n] ? RPC[n](a || {}) : err('rpc ' + n); },
    functions: { invoke: function (n, o) {
      sync(); var b = o.body, c = D.convites.filter(function (x) { return x.codigo === b.codigo && !x.usado && x.cpf === b.cpf; })[0]; if (!c) return res(null, { message: 'codigo_invalido' });
      var email = b.cpf + '@func.seucomando.com.br', u = D.users.filter(function (x) { return x.email === email; })[0];
      if (!u) { u = { id: id(), email: email, senha: b.senha }; D.users.push(u); } else u.senha = b.senha;
      D.membros.push({ empresa_id: c.empresa_id, user_id: u.id, papel: c.papel, pessoa_id: c.pessoa_id, nome: c.nome, permissoes: [] }); c.usado = true; grava(); return res({ ok: true });
    } }
  };
})();
