import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { title, nickname, candidate_dates, place_types } = await req.json();
    if (!title?.trim() || !nickname?.trim()) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    const session_token = crypto.randomUUID();
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ title: title.trim(), created_by: nickname.trim(), candidate_dates: candidate_dates || [], place_types: place_types || [], status: 'open' })
      .select().single();
    if (roomError) throw roomError;
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({ room_id: room.id, nickname: nickname.trim(), session_token })
      .select().single();
    if (memberError) throw memberError;
    return NextResponse.json({ room_id: room.id, member_id: member.id, session_token });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
