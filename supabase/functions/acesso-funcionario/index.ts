// Seu Comando · primeiro acesso do funcionário (e redefinição de senha pela empresa).
// O funcionário entra com CPF e senha; por baixo, o login é um e-mail técnico <cpf>@<DOMINIO_FUNCIONARIO>, nunca usado para enviar mensagens.
// Publicar: Supabase > Edge Functions > Deploy a new function > nome "acesso-funcionario" > colar este arquivo.
// Variáveis: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem; defina DOMINIO_FUNCIONARIO e ORIGEM_PERMITIDA (endereço do site).
import { createClient } from 'npm:@supabase/supabase-js@2';

const ORIGEM = Deno.env.get('ORIGEM_PERMITIDA') ?? '*';
const cors = { 'Access-Control-Allow-Origin': ORIGEM, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
const json = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { erro: 'metodo' });
  try {
    const corpo = await req.json().catch(() => ({}));
    const cpf = String(corpo.cpf ?? '').replace(/\D/g, '');
    const codigo = String(corpo.codigo ?? '').trim().toUpperCase();
    const senha = String(corpo.senha ?? '');
    if (!/^\d{11}$/.test(cpf) || !/^[A-Z0-9]{4}-[A-Z0-9]{6}$/.test(codigo)) return json(400, { erro: 'dados_invalidos' });
    if (senha.length < 8 || senha.length > 72) return json(400, { erro: 'senha_fraca' });

    const adm = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: conv, error } = await adm.rpc('conferir_convite', { p_codigo: codigo, p_cpf: cpf });
    if (error || !conv || !conv.ref || !['funcionario', 'gerente'].includes(conv.papel)) return json(400, { erro: 'codigo_invalido' });

    const email = `${cpf}@${Deno.env.get('DOMINIO_FUNCIONARIO') ?? 'func.seucomando.com.br'}`;
    const { data: existente } = await adm.rpc('usuario_por_email', { p_email: email });
    let uid: string | null = existente ?? null;
    if (uid) {
      // Só redefine a senha se a conta for usada apenas nesta empresa (uma empresa não mexe no acesso de outra).
      const { data: outras } = await adm.from('membros').select('empresa_id').eq('user_id', uid);
      if ((outras ?? []).some((m: { empresa_id: string }) => m.empresa_id !== conv.empresa_id)) return json(409, { erro: 'conta_existe' });
      const { error: e1 } = await adm.auth.admin.updateUserById(uid, { password: senha });
      if (e1) return json(400, { erro: 'senha_fraca' });
    } else {
      const { data: novo, error: e2 } = await adm.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome: conv.nome } });
      if (e2 || !novo?.user) return json(400, { erro: /password/i.test(e2?.message ?? '') ? 'senha_fraca' : 'falha_criar' });
      uid = novo.user.id;
    }
    const { error: e3 } = await adm.from('membros').upsert({ empresa_id: conv.empresa_id, user_id: uid, papel: conv.papel, pessoa_id: conv.pessoa_id, nome: conv.nome }, { onConflict: 'empresa_id,user_id' });
    if (e3) return json(500, { erro: 'falha_vincular' });
    await adm.from('convites').update({ usado_em: new Date().toISOString() }).eq('ref', conv.ref);
    await adm.from('auditoria').insert({ empresa_id: conv.empresa_id, autor: uid, autor_nome: conv.nome, acao: 'Primeiro acesso', detalhe: `${conv.nome ?? ''} criou a senha do app` });
    return json(200, { ok: true });
  } catch (_e) {
    return json(500, { erro: 'falha' });
  }
});
