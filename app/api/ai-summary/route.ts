import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room_id = searchParams.get('room_id');
    if (!room_id) return NextResponse.json({ recommendation: null });
    const { data } = await supabase
      .from('recommendations')
      .select('*')
      .eq('room_id', room_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    return NextResponse.json({ recommendation: data || null });
  } catch {
    return NextResponse.json({ recommendation: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { room_id } = await req.json();
    if (!room_id) return NextResponse.json({ error: 'room_idが必要です' }, { status: 400 });
    const { data: room } = await supabase.from('rooms').select('*').eq('id', room_id).single();
    if (!room) return NextResponse.json({ error: 'ルームが見つかりません' }, { status: 404 });
    const { data: members } = await supabase.from('members').select('id, nickname, nearest_station').eq('room_id', room_id);
    const { data: availData } = await supabase.from('availability').select('date_slot, status, time_type, from_time, to_time').eq('room_id', room_id);
    const { data: prefs } = await supabase.from('private_preferences').select('*').eq('room_id', room_id);
    const availSummary: Record<string, any> = {};
    for (const row of availData || []) {
      if (!availSummary[row.date_slot]) availSummary[row.date_slot] = { ok: 0, maybe: 0, ng: 0, time: '' };
      if (row.status === 'ok') availSummary[row.date_slot].ok++;
      else if (row.status === 'maybe') availSummary[row.date_slot].maybe++;
      else if (row.status === 'ng') availSummary[row.date_slot].ng++;
      if (row.time_type === 'allday') availSummary[row.date_slot].time = '1日OK';
      else if (row.from_time && row.to_time) availSummary[row.date_slot].time = `${row.from_time}〜${row.to_time}`;
    }
    const genreScores: Record<string, number> = {};
    const placeWantCounts: Record<string, number> = {};
    let minBudget = 5000;
    const budgetMap: Record<string, number> = { '1000': 1000, '2000': 2000, '3000': 3000, '5000': 5000, 'unlimited': 9999 };
    const stations = members?.filter((m: any) => m.nearest_station).map((m: any) => m.nearest_station) || [];
    const hasKids = prefs?.some((p: any) => p.with_kids) || false;
    const needPrivate = prefs?.some((p: any) => p.need_private_room) || false;
    const preferOutside = prefs?.some((p: any) => p.prefer_outside) || false;
    const allergies = prefs?.filter((p: any) => p.allergies).map((p: any) => p.allergies).join(', ') || 'なし';
    const moodCounts: Record<string, number> = { active: 0, normal: 0, early_end: 0 };
    for (const pref of prefs || []) {
      if (budgetMap[pref.budget] && budgetMap[pref.budget] < minBudget) minBudget = budgetMap[pref.budget];
      if (pref.mood) moodCounts[pref.mood] = (moodCounts[pref.mood] || 0) + 1;
      for (const [key, val] of Object.entries(pref.genres || {})) {
        if (!genreScores[key]) genreScores[key] = 0;
        if (val === 'want') genreScores[key] += 2;
        else if (val === 'avoid') genreScores[key] -= 3;
      }
      for (const place of pref.place_wants || []) {
        placeWantCounts[place] = (placeWantCounts[place] || 0) + 1;
      }
    }
    const topGenres = Object.entries(genreScores).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,3).map(([k]) => k);
    const avoidGenres = Object.entries(genreScores).filter(([,v]) => v < 0).map(([k]) => k);
    const topPlaces = Object.entries(placeWantCounts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([k]) => k);
    const dominantMood = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'normal';
    const prompt = `あなたはAI幹事です。以下の情報をもとに、全員が納得できるプランをJSON形式で提案してください。

イベント: ${room.title}
参加者: ${members?.map((m:any) => m.nickname).join(', ')} (${members?.length}人)
最寄り駅: ${stations.join(', ') || '未回答'}

【日程集計】
${Object.entries(availSummary).slice(0,8).map(([slot, s]:any) => {
  const d = new Date(slot);
  return `${d.getMonth()+1}/${d.getDate()} ${s.time || ''}: ◯${s.ok} △${s.maybe} ×${s.ng}`;
}).join('\n')}

【気分・希望集計（個人名非公開）】
行きたいジャンル: ${topGenres.join(', ') || 'なし'}
避けたいジャンル: ${avoidGenres.join(', ') || 'なし'}
希望の場所タイプ: ${topPlaces.join(', ') || 'なし'}
予算上限: ${minBudget === 9999 ? '上限なし' : `〜${minBudget}円`}
子連れあり: ${hasKids ? 'あり' : 'なし'}
個室希望: ${needPrivate ? 'あり' : 'なし'}
屋外希望: ${preferOutside ? 'あり' : 'なし'}
アレルギー: ${allergies}
ムード: ${dominantMood === 'active' ? 'がっつり楽しみたい' : dominantMood === 'early_end' ? '早め解散希望' : '普通'}

以下のJSONのみ返してください（説明文不要）:
{
  "suggested_date": "おすすめ日程",
  "suggested_area": "おすすめエリア",
  "summary_text": "全員へのコメント（2〜3文）",
  "suggested_plans": [
    {
      "name": "プラン名",
      "genre": "ジャンルまたは場所タイプ",
      "area": "エリア",
      "features": ["特徴1", "特徴2", "特徴3"],
      "reason": "選んだ理由（40字以内）"
    }
  ]
}
suggested_plansは3件。お店以外も積極的に含めてください。`;
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = (message.content[0] as any).text.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(text);
    const { data: rec, error: recError } = await supabase
      .from('recommendations')
      .upsert({
        room_id,
        suggested_date: parsed.suggested_date,
        suggested_area: parsed.suggested_area,
        suggested_plans: parsed.suggested_plans,
        summary_text: parsed.summary_text,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'room_id' })
      .select().single();
    if (recError) throw recError;
    return NextResponse.json({ recommendation: rec });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
