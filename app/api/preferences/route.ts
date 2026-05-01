import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { member_id, room_id, session_token, nearest_station, ...prefData } = body;
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
    if (nearest_station) {
      await supabase.from('members').update({ nearest_station }).eq('id', member_id);
    }
    const { error } = await supabase
      .from('private_preferences')
      .upsert({
        member_id, room_id,
        genres: prefData.genres || {},
        place_wants: prefData.place_wants || [],
        budget: prefData.budget || '3000',
        max_travel_min: prefData.max_travel_min || 45,
        need_private_room: prefData.need_private_room || false,
        need_quiet: prefData.need_quiet || false,
        with_kids: prefData.with_kids || false,
        prefer_outside: prefData.prefer_outside || false,
        allergies: prefData.allergies || null,
        mood: prefData.mood || 'normal',
        free_comment: prefData.free_comment || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'member_id,room_id' });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
