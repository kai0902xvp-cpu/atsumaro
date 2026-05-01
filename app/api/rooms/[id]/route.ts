import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error || !room) {
      return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 });
    }
    const { data: members } = await supabase
      .from('members')
      .select('id, nickname, joined_at, nearest_station')
      .eq('room_id', params.id)
      .order('joined_at', { ascending: true });
    return NextResponse.json({ room, members: members || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
