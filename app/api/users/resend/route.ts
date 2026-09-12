import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { telefone } = await request.json();

    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      );
    }

    const cleanPhone = telefone.replace(/\D/g, '');

    // 1. Buscar usuário
    const { data: user, error: fetchErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('telefone', cleanPhone)
      .single();

    if (fetchErr || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const urlAcesso =
      user.perfil === 'supervisor'
        ? 'https://painel.metriclab.com.br'
        : user.perfil === 'encarregado'
        ? 'https://rdo.metriclab.com.br'
        : 'https://vistoria.metriclab.com.br';

    // 2. Disparar webhook N8N
    await fetch('https://n8n.metriclab.com.br/webhook/pwa-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: user.nome,
        telefone: cleanPhone,
        perfil: user.perfil,
        senha_temporaria: user.senha_temporaria || 'Lote1519@01',
        url_acesso: urlAcesso,
        contrato: 'Consórcio Lote 15 e 19',
      }),
    });

    // 3. Atualizar status
    await supabaseAdmin
      .from('user_profiles')
      .update({
        status: 'convite_enviado',
        updated_at: new Date().toISOString(),
      })
      .eq('telefone', cleanPhone);

    return NextResponse.json({ ok: true, message: 'Convite reenviado com sucesso' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro ao reenviar convite' },
      { status: 500 }
    );
  }
}
