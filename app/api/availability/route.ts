import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room_id = searchParams.get('room_id');
    if (!room_id) return NextResponse.json({ error: 'room_idが必要です' }, { status: 400 });
    const { data: availData } = await supabase
      .from('availability')
      .select('date_slot, status, time_type, from_time, to_time')
      .eq('room_id', room_id);
    const summaryMap: Record<string, any> = {};
    for (const row of availData || []) {
      if (!summaryMap[row.date_slot]) {
        summaryMap[row.date_slot] = { date_slot: row.date_slot, ok_count: 0, maybe_count: 0, ng_count: 0, time_label: '' };
      }
      if (row.status === 'ok') summaryMap[row.date_slot].ok_count++;
      else if (row.status === 'maybe') summaryMap[row.date_slot].maybe_count++;
      else if (row.status === 'ng') summaryMap[row.date_slot].ng_count++;
      if (row.time_type === 'allday') summaryMap[row.date_slot].time_label = '1日OK';
      else if (row.time_type === 'custom' && row.from_time && row.to_time) {
        summaryMap[row.date_slot].time_label = `${row.from_time}〜${row.to_time}`;
      }
    }
    return NextResponse.json({ summary: Object.values(summaryMap) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { member_id, room_id, session_token, availability } = await req.json();
    if (!member_id || !room_id || !session_token) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('id', member_id)
      .eq('session_token', session_token)
      .single();
    if (!member) return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    await supabase.from('availability').delete().eq('member_id', member_id).eq('room_id', room_id);
    if (availability?.length > 0) {
      const rows = availability.map((a: any) => ({
        member_id, room_id,
        date_slot: a.date_slot,
        status: a.status,
        time_type: a.time_type || 'allday',
        from_time: a.from || null,
        to_time: a.to || null,
      }));
      const { error } = await supabase.from('availability').insert(rows);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
