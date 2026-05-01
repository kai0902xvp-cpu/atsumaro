'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLACE_TYPES = [
  { key: 'restaurant', label: 'お店・レストラン', emoji: '🍽️' },
  { key: 'home',       label: '誰かの家',         emoji: '🏠' },
  { key: 'park',       label: '公園・ピクニック',   emoji: '🌳' },
  { key: 'leisure',    label: 'レジャー施設',       emoji: '🎡' },
  { key: 'outdoor',    label: 'アウトドア',         emoji: '⛺' },
  { key: 'culture',    label: '美術館・映画・文化', emoji: '🎨' },
  { key: 'sports',     label: 'スポーツ・体験',     emoji: '⚽' },
  { key: 'other',      label: 'なんでもOK',         emoji: '✨' },
];

function generateCandidateDates() {
  const dates = [];
  const today = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const day = days[d.getDay()];
    const isWE = d.getDay() === 0 || d.getDay() === 6;
    dates.push({
      date: `${d.getFullYear()}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`,
      label: `${mm}/${dd}(${day})`,
      isWE,
    });
  }
  return dates;
}

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [eventName, setEventName] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [placeTypes, setPlaceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const candidateDates = generateCandidateDates();
  const C = { primary: '#FF6B6B', border: '#F0EAE5', text: '#2D2D2D', muted: '#A0A0A0', sub: '#6B6B6B' };

  const toggleDate = (d: string) => setSelectedDates(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const togglePlace = (k: string) => setPlaceTypes(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  const handleSubmit = async () => {
    if (!nickname.trim() || !eventName.trim() || selectedDates.length === 0) {
      setError('ニックネーム・イベント名・候補日は必須です'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: eventName.trim(), nickname: nickname.trim(), candidate_dates: selectedDates, place_types: placeTypes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました');
      localStorage.setItem(`atsumaro_session_${data.room_id}`, JSON.stringify({ member_id: data.member_id, nickname: nickname.trim(), session_token: data.session_token }));
      router.push(`/room/${data.room_id}/schedule`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#FFF9F5', minHeight: '100dvh' }}>
      <div style={{ background: 'linear-gradient(150deg,#FF6B6B 0%,#FF9F43 100%)', borderRadius: '0 0 36px 36px', padding: '60px 24px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px' }}>あつまろ</h1>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>本音を言っても大丈夫。<br />AIが全員に最適なプランを提案します</p>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: C.sub, marginBottom: 6 }}>👤 ニックネーム *</div>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="例: たかし、幹事" style={{ width: '100%', padding: '13px 16px', borderRadius: 16, fontSize: 16, border: `2px solid ${C.border}`, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
          <div style={{ fontWeight: 900, fontSize: 13, color: C.sub, marginBottom: 6 }}>✏️ イベント名 *</div>
          <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="例: 久々ランチ会、春の集まり" style={{ width: '100%', padding: '13px 16px', borderRadius: 16, fontSize: 16, border: `2px solid ${C.border}`, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: C.sub, marginBottom: 10 }}>📅 候補日を選択 *（複数OK）</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {candidateDates.map(({ date, label, isWE }) => {
              const sel = selectedDates.includes(date);
              return (
                <button key={date} onClick={() => toggleDate(date)} style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: `2px solid ${sel ? C.primary : isWE ? 'rgba(78,205,196,.4)' : C.border}`, background: sel ? 'rgba(255,107,107,.1)' : isWE ? 'rgba(78,205,196,.06)' : 'white', color: sel ? C.primary : isWE ? '#2BAB9E' : C.text, cursor: 'pointer' }}>
                  {sel ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
          {selectedDates.length > 0 && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: C.primary }}>✓ {selectedDates.length}日選択中</div>}
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: C.sub, marginBottom: 4 }}>📍 どんな集まりにしたい？（任意）</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>お店以外でもOK！複数選択可</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PLACE_TYPES.map(pt => {
              const sel = placeTypes.includes(pt.key);
              return (
                <button key={pt.key} onClick={() => togglePlace(pt.key)} style={{ padding: '12px 10px', borderRadius: 18, textAlign: 'left', border: `2px solid ${sel ? C.primary : C.border}`, background: sel ? 'rgba(255,107,107,.08)' : 'white', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{pt.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: sel ? C.primary : C.text }}>{pt.label}</div>
                </button>
              );
            })}
          </div>
        </div>
        {error && <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(255,107,107,.1)', color: C.primary, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '16px 20px', borderRadius: 20, background: 'linear-gradient(135deg,#FF6B6B,#E85555)', color: 'white', fontWeight: 900, fontSize: 16, border: 'none', boxShadow: '0 4px 20px rgba(255,107,107,0.3)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? '作成中...' : '✨ ルームを作成 → 日程回答へ'}
        </button>
      </div>
    </div>
  );
}
