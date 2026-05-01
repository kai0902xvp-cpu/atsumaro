'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const STATUS_CFG = {
  ok:    { label: '◯ 行ける',  short: '◯', color: '#4ECDC4', bg: 'rgba(78,205,196,.14)' },
  maybe: { label: '△ たぶん', short: '△', color: '#FFB020', bg: 'rgba(255,176,32,.14)' },
  ng:    { label: '× 無理',   short: '×', color: '#FF6B6B', bg: 'rgba(255,107,107,.14)' },
};

export default function SchedulePage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const [room, setRoom] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const C = { primary: '#FF6B6B', border: '#F0EAE5', text: '#2D2D2D', muted: '#A0A0A0', sub: '#6B6B6B' };

  useEffect(() => {
    const s = localStorage.getItem(`atsumaro_session_${roomId}`);
    if (!s) { router.replace(`/room/${roomId}/join`); return; }
    setSession(JSON.parse(s));
    fetch(`/api/rooms/${roomId}`).then(r => r.json()).then(d => { if (d.room) setRoom(d.room); });
  }, [roomId]);

  const cycleStatus = (date: string) => {
    setAnswers(p => {
      const cur = p[date]?.status;
      if (!cur) return { ...p, [date]: { status: 'ok', timeType: 'allday', from: '12:00', to: '18:00' } };
      if (cur === 'ok') return { ...p, [date]: { ...p[date], status: 'maybe' } };
      if (cur === 'maybe') return { ...p, [date]: { ...p[date], status: 'ng' } };
      const n = { ...p }; delete n[date]; return n;
    });
  };

  const setStatus = (date: string, st: string) => setAnswers(p => ({ ...p, [date]: { ...(p[date] || { timeType: 'allday', from: '12:00', to: '18:00' }), status: st } }));
  const setTimeType = (date: string, tt: string) => setAnswers(p => ({ ...p, [date]: { ...(p[date] || { status: 'ok' }), timeType: tt } }));
  const setTime = (date: string, field: string, val: string) => setAnswers(p => ({ ...p, [date]: { ...(p[date] || { status: 'ok', timeType: 'custom' }), [field]: val } }));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const isWE = d.getDay() === 0 || d.getDay() === 6;
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, day: days[d.getDay()], isWE };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const availabilityData = Object.entries(answers)
        .filter(([_, v]) => v?.status)
        .map(([date, v]) => ({ date_slot: date, status: v.status, time_type: v.timeType, from: v.from, to: v.to }));
      await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: session.member_id, room_id: roomId, session_token: session.session_token, availability: availabilityData }),
      });
      setDone(true);
      setTimeout(() => router.push(`/room/${roomId}/preferences`), 1200);
    } finally {
      setSaving(false);
    }
  };

  const answered = Object.keys(answers).length;

  return (
    <div style={{ background: '#FFF9F5', minHeight: '100dvh' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,249,245,.96)', backdropFilter: 'blur(14px)', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>📅 日程を回答</div>
            <div style={{ fontSize: 11, color: C.muted }}>{room?.title} ・ {session?.nickname}</div>
          </div>
          <span style={{ padding: '5px 12px', borderRadius: 12, background: 'rgba(255,107,107,.1)', color: C.primary, fontSize: 12, fontWeight: 700 }}>{session?.nickname}</span>
        </div>
        <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: C.border, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, width: `${room?.candidate_dates?.length > 0 ? (answered / room.candidate_dates.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#FF6B6B,#FF9F43)', transition: 'width .4s' }} />
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: v.bg, color: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>{v.short}</div>
              <span style={{ fontSize: 11, color: C.muted }}>{v.label.split(' ')[1]}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(255,107,107,.05)', marginBottom: 14, textAlign: 'center', fontSize: 11, color: C.muted, fontWeight: 700 }}>
          タップで ◯ → △ → × と切り替わります
        </div>
        {room?.candidate_dates?.map((date: string) => {
          const { label, day, isWE } = formatDate(date);
          const ans = answers[date];
          const st = ans?.status;
          const cfg = st ? STATUS_CFG[st as keyof typeof STATUS_CFG] : null;
          const timeType = ans?.timeType || 'allday';
          return (
            <div key={date} style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: cfg ? 14 : 0 }}>
                <div style={{ width: 54, height: 54, borderRadius: 18, flexShrink: 0, background: isWE ? 'rgba(78,205,196,.1)' : 'rgba(255,107,107,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isWE ? '#2BAB9E' : C.muted }}>{day}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: isWE ? '#2BAB9E' : C.text }}>{label}</div>
                </div>
                <button onClick={() => cycleStatus(date)} style={{ flex: 1, padding: '14px 8px', borderRadius: 16, border: `2px solid ${cfg ? cfg.color + '44' : C.border}`, background: cfg ? cfg.bg : '#F8F4F1', color: cfg ? cfg.color : C.muted, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>
                  {cfg ? cfg.label : '– タップして回答'}
                </button>
                {cfg && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(STATUS_CFG).map(([sk, sv]) => (
                      <button key={sk} onClick={() => setStatus(date, sk)} style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${st === sk ? sv.color : C.border}`, background: st === sk ? sv.bg : 'white', color: st === sk ? sv.color : C.muted, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>{sv.short}</button>
                    ))}
                  </div>
                )}
              </div>
              {(st === 'ok' || st === 'maybe') && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8 }}>⏰ 時間は？</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: timeType === 'custom' ? 10 : 4 }}>
                    <button onClick={() => setTimeType(date, 'allday')} style={{ flex: 1, padding: '10px 8px', borderRadius: 14, fontSize: 13, fontWeight: 700, border: `2px solid ${timeType === 'allday' ? '#4ECDC4' : C.border}`, background: timeType === 'allday' ? 'rgba(78,205,196,.1)' : 'white', color: timeType === 'allday' ? '#2BAB9E' : C.text, cursor: 'pointer' }}>🌞 1日OK</button>
                    <button onClick={() => setTimeType(date, 'custom')} style={{ flex: 1, padding: '10px 8px', borderRadius: 14, fontSize: 13, fontWeight: 700, border: `2px solid ${timeType === 'custom' ? C.primary : C.border}`, background: timeType === 'custom' ? 'rgba(255,107,107,.08)' : 'white', color: timeType === 'custom' ? C.primary : C.text, cursor: 'pointer' }}>🕐 時間指定</button>
                  </div>
                  {timeType === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="time" value={ans?.from || '12:00'} onChange={e => setTime(date, 'from', e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: 14, fontSize: 16, border: `2px solid ${C.border}`, outline: 'none', fontWeight: 700 }} />
                      <span style={{ fontWeight: 900, color: C.muted }}>〜</span>
                      <input type="time" value={ans?.to || '18:00'} onChange={e => setTime(date, 'to', e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: 14, fontSize: 16, border: `2px solid ${C.border}`, outline: 'none', fontWeight: 700 }} />
                    </div>
                  )}
                  {timeType === 'allday' && <div style={{ fontSize: 11, color: C.muted }}>終日都合OK として記録されます</div>}
                </div>
              )}
            </div>
          );
        })}
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 900, color: '#4ECDC4' }}>保存しました！次へ移動します</div>
          </div>
        ) : (
          <>
            <button onClick={handleSave} disabled={saving || answered === 0} style={{ width: '100%', padding: '16px 20px', borderRadius: 20, background: 'linear-gradient(135deg,#FF6B6B,#E85555)', color: 'white', fontWeight: 900, fontSize: 16, border: 'none', cursor: saving || answered === 0 ? 'not-allowed' : 'pointer', opacity: saving || answered === 0 ? 0.6 : 1, marginBottom: 8 }}>
              {saving ? '保存中...' : `💾 回答を保存（${answered}件）→ 気分入力へ`}
            </button>
            <button onClick={() => router.push(`/room/${roomId}`)} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              スキップして共有画面を見る →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
