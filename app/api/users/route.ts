import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const [usersRes, credsRes] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('demo_credentials')
        .select('*')
        .order('id', { ascending: true }),
    ]);

    return NextResponse.json({
      users: usersRes.data || [],
      credentials: credsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, telefone, perfil, senhaTemporaria } = body;

    if (!nome || !telefone || !perfil || !senhaTemporaria) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanPhone = telefone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55')
      ? `+${cleanPhone}`
      : `+55${cleanPhone}`;

    // 1. Criar usuário no Supabase Auth via Admin API
    let authUserId: string | null = null;
    try {
      const { data: authUser, error: authErr } =
        await supabaseAdmin.auth.admin.createUser({
          phone: formattedPhone,
          password: senhaTemporaria,
          phone_confirm: true,
          user_metadata: { nome, perfil },
        });

      if (!authErr && authUser?.user?.id) {
        authUserId = authUser.user.id;
      } else if (authErr) {
        console.warn('Supabase Auth createUser warning:', authErr.message);
      }
    } catch (authError) {
      console.warn('Supabase Auth admin create error:', authError);
    }

    const contratoId =
      process.env.NEXT_PUBLIC_CONTRATO_ID ||
      'bc33de34-4c89-521c-9f56-c2918db3522a';

    // 2. Inserir em user_profiles
    const { data: profile, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          auth_user_id: authUserId,
          nome,
          telefone: cleanPhone,
          perfil,
          senha_temporaria: senhaTemporaria,
          status: 'pendente',
          contrato_id: contratoId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telefone' }
      )
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting user_profile:', insertError);
      return NextResponse.json(
        { error: `Erro no banco: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 3. Disparar webhook N8N
    const urlAcesso =
      perfil === 'supervisor'
        ? 'https://painel.metriclab.com.br'
        : perfil === 'encarregado'
        ? 'https://rdo.metriclab.com.br'
        : 'https://vistoria.metriclab.com.br';

    try {
      await fetch('https://n8n.metriclab.com.br/webhook/pwa-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          telefone: cleanPhone,
          perfil,
          senha_temporaria: senhaTemporaria,
          url_acesso: urlAcesso,
          contrato: 'Consórcio Lote 15 e 19',
        }),
      });
    } catch (webhookErr) {
      console.warn('N8N Webhook dispatch warning:', webhookErr);
    }

    // 4. Atualizar status para convite_enviado
    await supabaseAdmin
      .from('user_profiles')
      .update({
        status: 'convite_enviado',
        updated_at: new Date().toISOString(),
      })
      .eq('telefone', cleanPhone);

    return NextResponse.json({
      ok: true,
      profile: {
        ...profile,
        status: 'convite_enviado',
      },
    });
  } catch (err: any) {
    console.error('API /api/users error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
