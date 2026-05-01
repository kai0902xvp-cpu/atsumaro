'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [availSummary, setAvailSummary] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const C = { primary: '#FF6B6B', border: '#F0EAE5', text: '#2D2D2D', muted: '#A0A0A0', sub: '#6B6B6B', accent: '#FF9F43' };

  const fetchData = useCallback(async () => {
    try {
      const [roomRes, summaryRes, recRes] = await Promise.all([
        fetch(`/api/rooms/${roomId}`),
        fetch(`/api/availability?room_id=${roomId}`),
        fetch(`/api/ai-summary?room_id=${roomId}`),
      ]);
      const roomData = await roomRes.json();
      const summaryData = await summaryRes.json();
      const recData = await recRes.json();
      if (roomRes.ok) { setRoom(roomData.room); setMembers(roomData.members || []); }
      if (summaryRes.ok) setAvailSummary(summaryData.summary || []);
      if (recRes.ok) setRecommendation(recData.recommendation || null);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    const s = localStorage.getItem(`atsumaro_session_${roomId}`);
    if (s) setSession(JSON.parse(s));
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [roomId, fetchData]);

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
      });
      const data = await res.json();
      if (res.ok) setRecommendation(data.recommendation);
    } finally {
      setAiLoading(false);
    }
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/room/${roomId}/join`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSlot = (slot: string) => {
    const d = new Date(slot.split('_')[0]);
    const days = ['日','月','火','水','木','金','土'];
    return `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]})`;
  };

  const topDates = [...availSummary]
    .sort((a, b) => (b.ok_count * 2 + b.maybe_count) - (a.ok_count * 2 + a.maybe_count))
    .slice(0, 5);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🎉</div>
      <div style={{ color: '#A0A0A0', fontWeight: 700 }}>読み込み中...</div>
    </div>
  );

  return (
    <div style={{ background: '#FFF9F5', minHeight: '100dvh' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,249,245,.96)', backdropFilter: 'blur(14px)', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room?.title}</div>
            <div style={{ fontSize: 11, color: C.muted }}>主催: {room?.created_by} ・ {members.length}人参加</div>
          </div>
          <button onClick={copyUrl} style={{ padding: '7px 12px', borderRadius: 14, background: copied ? 'rgba(78,205,196,.15)' : 'rgba(255,107,107,.1)', color: copied ? '#2BAB9E' : C.primary, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
            {copied ? '✅ コピー済' : '🔗 招待URL'}
          </button>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {session && (
          <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 10 }}>👋 {session.nickname} さんの回答を更新できます</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => router.push(`/room/${roomId}/schedule`)} style={{ flex: 1, padding: '11px 4px', borderRadius: 16, fontSize: 12, fontWeight: 900, border: `2px solid ${C.primary}`, background: 'rgba(255,107,107,.08)', color: C.primary, cursor: 'pointer' }}>📅 日程を更新</button>
              <button onClick={() => router.push(`/room/${roomId}/preferences`)} style={{ flex: 1, padding: '11px 4px', borderRadius: 16, fontSize: 12, fontWeight: 900, border: '2px solid #4ECDC4', background: 'rgba(78,205,196,.08)', color: '#2BAB9E', cursor: 'pointer' }}>🎭 気分を更新</button>
            </div>
          </div>
        )}
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>👥 参加者（{members.length}人）</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {members.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 20, border: `1.5px solid ${C.border}` }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `hsl(${i*47},65%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 900 }}>{m.nickname[0]}</div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{m.nickname}</span>
              </div>
            ))}
            <button onClick={copyUrl} style={{ display: 'flex', alignItems: 'center', padding: '7px 13px', borderRadius: 20, border: `1.5px dashed ${C.border}`, background: 'none', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 招待する</button>
          </div>
        </div>
        {availSummary.length > 0 && (
          <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 16 }}>📊 日程の状況</div>
            {topDates.map((s, i) => {
              const pct = Math.round(((s.ok_count * 2 + s.maybe_count) / (members.length * 2)) * 100);
              const isBest = i === 0;
              return (
                <div key={s.date_slot} style={{ borderRadius: 18, padding: '12px 14px', marginBottom: 10, background: isBest ? 'rgba(78,205,196,.07)' : '#FFF9F5', border: `1.5px solid ${isBest ? 'rgba(78,205,196,.35)' : C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 900, fontSize: 14 }}>{isBest && '👑 '}{formatSlot(s.date_slot)}</span>
                      {s.time_label && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>⏰ {s.time_label}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, padding: '3px 9px', borderRadius: 10, background: isBest ? 'rgba(78,205,196,.2)' : C.border, color: isBest ? '#2BAB9E' : C.muted }}>{pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 7 }}>
                    <div style={{ width: `${s.ok_count / members.length * 100}%`, background: '#4ECDC4' }} />
                    <div style={{ width: `${s.maybe_count / members.length * 100}%`, background: '#FFB020' }} />
                    <div style={{ width: `${s.ng_count / members.length * 100}%`, background: '#FF6B6B' }} />
                    <div style={{ flex: 1, background: C.border }} />
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700 }}>
                    <span style={{ color: '#2BAB9E' }}>◯ {s.ok_count}</span>
                    <span style={{ color: '#FFB020' }}>△ {s.maybe_count}</span>
                    <span style={{ color: '#FF6B6B' }}>× {s.ng_count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>🤖 AIおすすめプラン</div>
            {!aiLoading && (
              <button onClick={generateAI} style={{ padding: '8px 14px', borderRadius: 14, fontSize: 12, fontWeight: 900, border: `1.5px solid ${C.primary}`, background: 'rgba(255,107,107,.09)', color: C.primary, cursor: 'pointer' }}>
                {recommendation ? '🔄 再生成' : '✨ 生成する'}
              </button>
            )}
          </div>
          {aiLoading && (
            <div style={{ background: 'white', borderRadius: 24, padding: '44px 20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: '3px solid rgba(255,107,107,.2)', borderTopColor: C.primary, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontWeight: 700, color: C.sub }}>全員の気分を分析中...</div>
            </div>
          )}
          {!recommendation && !aiLoading && (
            <div style={{ background: 'white', borderRadius: 24, padding: '40px 20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🤖</div>
              <div style={{ fontWeight: 700, color: C.sub, lineHeight: 1.6 }}>全員の回答が集まったら<br />「生成する」を押してください</div>
            </div>
          )}
          {recommendation && !aiLoading && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ background: 'rgba(78,205,196,.07)', border: '1.5px solid rgba(78,205,196,.3)', borderRadius: 24, padding: 16 }}>
                  <div style={{ fontSize: 11, color: '#2BAB9E', fontWeight: 900, marginBottom: 5 }}>📅 おすすめ日程</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#2BAB9E' }}>{recommendation.suggested_date}</div>
                </div>
                <div style={{ background: 'rgba(255,159,67,.06)', border: '1.5px solid rgba(255,159,67,.3)', borderRadius: 24, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 900, marginBottom: 5 }}>📍 エリア</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.accent }}>{recommendation.suggested_area}</div>
                </div>
              </div>
              {recommendation.summary_text && (
                <div style={{ background: 'rgba(255,107,107,.04)', border: '1.5px solid rgba(255,107,107,.15)', borderRadius: 24, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>💬</span>
                    <div>
                      <div style={{ fontSize: 11, color: C.primary, fontWeight: 900, marginBottom: 5 }}>AI幹事のコメント</div>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: C.sub, margin: 0 }}>{recommendation.summary_text}</p>
                    </div>
                  </div>
                </div>
              )}
              {recommendation.suggested_plans?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>🎯 おすすめプラン</div>
                  {recommendation.suggested_plans.map((plan: any, i: number) => (
                    <div key={i} style={{ background: i === 0 ? 'rgba(255,107,107,.03)' : 'white', border: `${i === 0 ? 2 : 1}px solid ${i === 0 ? 'rgba(255,107,107,.28)' : C.border}`, borderRadius: 24, padding: 20, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 14 }}>{i === 0 ? '⭐ ' : ''}{plan.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{plan.area} ・ {plan.genre}</div>
                        </div>
                        {i === 0 && <span style={{ padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 900, background: 'rgba(255,107,107,.12)', color: C.primary }}>イチオシ</span>}
                      </div>
                      {plan.features?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {plan.features.map((f: string, j: number) => <span key={j} style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#FFF9F5', color: C.sub, border: `1px solid ${C.border}` }}>{f}</span>)}
                        </div>
                      )}
                      {plan.reason && <div style={{ fontSize: 12, color: C.muted }}>💡 {plan.reason}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginBottom: 20 }}>🔒 個人の気分・希望は集計のみ使用。内容は非公開です。</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
