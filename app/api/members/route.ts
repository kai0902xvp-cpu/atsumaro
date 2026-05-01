import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { room_id, nickname } = await req.json();
    if (!room_id || !nickname?.trim()) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', room_id)
      .single();
    if (!room) {
      return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 });
    }
    const session_token = crypto.randomUUID();
    const { data: member, error } = await supabase
      .from('members')
      .insert({ room_id, nickname: nickname.trim(), session_token })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ member_id: member.id, session_token });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
