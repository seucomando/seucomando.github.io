/* Seu Comando · entrar, primeiro acesso, criar conta, recuperar senha e código de convite. */
(function () {
  'use strict';
  var doc = document, N = window.Nuvem || { ativa: false };
  var $ = function (s) { return doc.querySelector(s); };
  var erro = $('#e-erro'), ok = $('#e-ok');
  function msg(el, t) { erro.hidden = true; ok.hidden = true; if (!t) return; el.textContent = t; el.hidden = false; el.focus(); }
  function tela(t) { doc.querySelectorAll('[data-tela]').forEach(function (s) { s.hidden = s.getAttribute('data-tela') !== t; }); msg(null); }
  function rota() { var h = (location.hash || '#entrar').slice(1).split('&')[0]; if (/type=recovery|access_token/.test(location.hash)) h = 'nova-senha'; tela(doc.querySelector('[data-tela="' + h + '"]') ? h : 'entrar'); }
  function senhaOk(s) { return s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s); }
  function cpfValido(c) { c = String(c || '').replace(/\D/g, ''); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false; var s = 0, i; for (i = 0; i < 9; i++) s += +c[i] * (10 - i); if ((s * 10) % 11 % 10 !== +c[9]) return false; s = 0; for (i = 0; i < 10; i++) s += +c[i] * (11 - i); return (s * 10) % 11 % 10 === +c[10]; }
  function ocupado(form, sim) { var b = form.querySelector('button[type=submit]'); if (b) { b.disabled = sim; b.dataset.txt = b.dataset.txt || b.textContent; b.textContent = sim ? 'Aguarde…' : b.dataset.txt; } }
  function ir() { location.href = 'app.html'; }
  window.addEventListener('hashchange', rota); rota();
  if (!N.ativa) { $('#e-offline').hidden = false; doc.querySelectorAll('form button[type=submit]').forEach(function (b) { b.disabled = true; }); }

  // ramos para o cadastro
  var sel = $('#cr-tipo'); (window.CENTRALIZAR_TIPOS_GRUPOS || [['Ramos', [['padaria', 'Padaria e confeitaria'], ['hamburgueria', 'Hamburgueria e lanchonete'], ['restaurante', 'Restaurante'], ['mercado', 'Mercado'], ['loja', 'Loja'], ['oficina', 'Oficina'], ['metalurgica', 'Indústria metalúrgica'], ['confeccao', 'Confecção'], ['construtora', 'Construtora'], ['salao', 'Salão de beleza'], ['clinica', 'Clínica'], ['escritorio', 'Escritório'], ['recrutamento', 'Recrutamento e seleção']]]]).forEach(function (gr) {
    var og = doc.createElement('optgroup'); og.label = gr[0]; gr[1].forEach(function (t) { var o = doc.createElement('option'); o.value = t[0]; o.textContent = t[1]; og.appendChild(o); }); sel.appendChild(og);
  });

  // funcionário (CPF) ou empresário/contador (e-mail)
  var quem = 'func';
  doc.querySelectorAll('[data-quem]').forEach(function (b) {
    b.addEventListener('click', function () {
      quem = b.getAttribute('data-quem'); doc.querySelectorAll('[data-quem]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var i = $('#en-login'); $('#en-login-l').textContent = quem === 'func' ? 'CPF' : 'E-mail'; i.type = quem === 'func' ? 'text' : 'email'; i.inputMode = quem === 'func' ? 'numeric' : 'email'; i.value = ''; i.focus();
    });
  });

  $('#f-entrar').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, d = new FormData(f), login = String(d.get('login') || '').trim(), senha = String(d.get('senha') || '');
    if (quem === 'func' && !cpfValido(login)) return msg(erro, 'CPF inválido.');
    if (quem === 'adm' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(login)) return msg(erro, 'E-mail inválido.');
    if (!senha) return msg(erro, 'Digite a senha.');
    ocupado(f, true); N.entrar(login, senha).then(ir, function (er) { ocupado(f, false); msg(erro, er.message); });
  });

  $('#f-primeiro').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, d = new FormData(f), cpf = String(d.get('cpf') || '').replace(/\D/g, ''), cod = String(d.get('codigo') || '').trim().toUpperCase(), s1 = String(d.get('s1') || ''), s2 = String(d.get('s2') || '');
    if (!cpfValido(cpf)) return msg(erro, 'CPF inválido.');
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{6}$/.test(cod)) return msg(erro, 'Código no formato ABCD-EF2345.');
    if (!senhaOk(s1)) return msg(erro, 'A senha precisa ter pelo menos 8 caracteres, com letras e números.');
    if (s1 !== s2) return msg(erro, 'As senhas não conferem.');
    ocupado(f, true);
    N.primeiroAcesso(cpf, cod, s1).then(function () { return N.entrar(cpf, s1); }).then(ir, function (er) { ocupado(f, false); msg(erro, er.message); });
  });

  $('#f-criar').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, d = new FormData(f), nome = String(d.get('nome') || '').trim(), email = String(d.get('email') || '').trim(), s1 = String(d.get('s1') || ''), s2 = String(d.get('s2') || ''), emp = String(d.get('empresa') || '').trim(), tipo = String(d.get('tipo') || 'padaria');
    if (nome.split(' ').length < 2) return msg(erro, 'Informe seu nome completo.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg(erro, 'E-mail inválido.');
    if (!senhaOk(s1)) return msg(erro, 'A senha precisa ter pelo menos 8 caracteres, com letras e números.');
    if (s1 !== s2) return msg(erro, 'As senhas não conferem.');
    if (emp.length < 2) return msg(erro, 'Informe o nome da empresa.');
    if (d.get('termos') !== 'sim') return msg(erro, 'Para continuar, aceite o tratamento dos dados.');
    try { localStorage.setItem('seucomando-nova-empresa', JSON.stringify({ nome: emp, tipo: tipo })); } catch (er) { /* ignora */ }
    ocupado(f, true);
    N.cadastrar(email, s1, nome).then(function (r) {
      if (r && r.session) return ir();
      ocupado(f, false); f.reset(); msg(ok, 'Conta criada. Enviamos um link de confirmação para ' + email + '. Depois de confirmar, entre com o e-mail e a senha: a empresa é criada no primeiro acesso.');
    }, function (er) { ocupado(f, false); msg(erro, er.message); });
  });

  $('#f-recuperar').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, email = String(new FormData(f).get('email') || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg(erro, 'E-mail inválido.');
    ocupado(f, true); N.recuperar(email).then(function () { ocupado(f, false); msg(ok, 'Se o e-mail tiver conta, o link para criar uma nova senha chega em alguns minutos.'); }, function () { ocupado(f, false); msg(ok, 'Se o e-mail tiver conta, o link para criar uma nova senha chega em alguns minutos.'); });
  });

  $('#f-nova').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, d = new FormData(f), s1 = String(d.get('s1') || ''), s2 = String(d.get('s2') || '');
    if (!senhaOk(s1)) return msg(erro, 'A senha precisa ter pelo menos 8 caracteres, com letras e números.');
    if (s1 !== s2) return msg(erro, 'As senhas não conferem.');
    ocupado(f, true); N.novaSenha(s1).then(ir, function (er) { ocupado(f, false); msg(erro, er.message); });
  });

  $('#f-codigo').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, d = new FormData(f), cod = String(d.get('codigo') || '').trim().toUpperCase(), cpf = String(d.get('cpf') || '').replace(/\D/g, '');
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{6}$/.test(cod)) return msg(erro, 'Código no formato ABCD-EF2345.');
    ocupado(f, true);
    N.sessao().then(function (s) {
      if (!s) { ocupado(f, false); location.hash = '#entrar'; msg(erro, 'Entre na sua conta primeiro e depois volte em "Tenho um código".'); return; }
      return N.aceitarConvite(cod, cpf || null).then(function (emp) { try { localStorage.setItem('seucomando-empresa', emp); } catch (er) { /* ignora */ } ir(); });
    }).catch(function (er) { ocupado(f, false); msg(erro, er.message); });
  });

  // quem já está logado vai direto para o app
  if (N.ativa && !/nova-senha|codigo|type=recovery/.test(location.hash)) N.sessao().then(function (s) { if (s) ir(); });
})();
