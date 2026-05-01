'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const GENRES = [
  { key: 'japanese',  label: '和食',          emoji: '🍱' },
  { key: 'yakiniku',  label: '焼肉・BBQ',     emoji: '🥩' },
  { key: 'korean',    label: '韓国料理',       emoji: '🫕' },
  { key: 'italian',   label: 'イタリアン',     emoji: '🍝' },
  { key: 'chinese',   label: '中華',           emoji: '🥟' },
  { key: 'ethnic',    label: 'エスニック',     emoji: '🌶️' },
  { key: 'french',    label: 'フレンチ',       emoji: '🥂' },
  { key: 'fastfood',  label: 'ファストフード', emoji: '🍔' },
  { key: 'cafe',      label: 'カフェ・スイーツ',emoji: '☕' },
  { key: 'sushi',     label: '寿司・海鮮',     emoji: '🍣' },
  { key: 'ramen',     label: 'ラーメン・麺',   emoji: '🍜' },
  { key: 'izakaya',   label: '居酒屋・バル',   emoji: '🍺' },
  { key: 'bbq',       label: 'バーベキュー',   emoji: '🔥' },
  { key: 'picnic',    label: 'テイクアウト',   emoji: '🧺' },
];

const PLACE_TYPES = [
  { key: 'restaurant', label: 'お店・レストラン', emoji: '🍽️' },
  { key: 'home',       label: '誰かの家',         emoji: '🏠' },
  { key: 'park',       label: '公園・ピクニック',  emoji: '🌳' },
  { key: 'leisure',    label: 'レジャー施設',      emoji: '🎡' },
  { key: 'outdoor',    label: 'アウトドア',        emoji: '⛺' },
  { key: 'culture',    label: '美術館・映画',      emoji: '🎨' },
  { key: 'sports',     label: 'スポーツ・体験',    emoji: '⚽' },
  { key: 'other',      label: 'なんでもOK',        emoji: '✨' },
];

export default function PreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const [session, setSession] = useState<any>(null);
  const [genres, setGenres] = useState<Record<string, string>>({});
  const [placeWants, setPlaceWants] = useState<string[]>([]);
  const [budget, setBudget] = useState('3000');
  const [maxTravel, setMaxTravel] = useState(45);
  const [options, setOptions] = useState({ privateRoom: false, quiet: false, kids: false, outside: false });
  const [mood, setMood] = useState('normal');
  const [station, setStation] = useState('');
  const [allergies, setAllergies] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const C = { primary: '#FF6B6B', border: '#F0EAE5', text: '#2D2D2D', muted: '#A0A0A0', sub: '#6B6B6B', accent: '#FF9F43' };

  useEffect(() => {
    const s = localStorage.getItem(`atsumaro_session_${roomId}`);
    if (!s) { router.replace(`/room/${roomId}/join`); return; }
    setSession(JSON.parse(s));
  }, [roomId]);

  const toggleGenre = (key: string) => setGenres(p => {
    const cur = p[key];
    if (!cur) return { ...p, [key]: 'want' };
    if (cur === 'want') return { ...p, [key]: 'avoid' };
    const n = { ...p }; delete n[key]; return n;
  });

  const togglePlace = (k: string) => setPlaceWants(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const toggleOpt = (k: string) => setOptions(p => ({ ...p, [k]: !p[k as keyof typeof p] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: session.member_id, room_id: roomId, session_token: session.session_token, genres, place_wants: placeWants, budget, max_travel_min: maxTravel, need_private_room: options.privateRoom, need_quiet: options.quiet, with_kids: options.kids, prefer_outside: options.outside, allergies: allergies.trim() || null, mood, nearest_station: station.trim() || null, free_comment: comment.trim() || null }),
      });
      setDone(true);
      setTimeout(() => router.push(`/room/${roomId}`), 1200);
    } finally {
      setSaving(false);
    }
  };

  const wantCount = Object.values(genres).filter(v => v === 'want').length;
  const avoidCount = Object.values(genres).filter(v => v === 'avoid').length;

  return (
    <div style={{ background: '#FFF9F5', minHeight: '100dvh' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,249,245,.96)', backdropFilter: 'blur(14px)', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>🎭 今の気分を入力</div>
            <div style={{ fontSize: 11, color: '#2BAB9E', fontWeight: 700 }}>あなただけが見られます</div>
          </div>
          <span style={{ padding: '5px 12px', borderRadius: 12, background: 'rgba(78,205,196,.1)', color: '#2BAB9E', fontSize: 12, fontWeight: 700 }}>{session?.nickname}</span>
        </div>
      </div>
      <div style={{ padding: 16, paddingBottom: 120 }}>
        <div style={{ background: 'rgba(78,205,196,.06)', border: '1px solid rgba(78,205,196,.25)', borderRadius: 20, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: '#2BAB9E', marginBottom: 4 }}>🔒 この情報は他の参加者には一切見えません</div>
          <div style={{ fontSize: 12, color: C.muted }}>AIが集計した結果のみが共有画面に表示されます</div>
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>🍽️ 食事・ジャンルの気分</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>タップで切り替え：<span style={{ color: '#4ECDC4', fontWeight: 700 }}>◯ 行きたい</span> → <span style={{ color: '#FF6B6B', fontWeight: 700 }}>× 避けたい</span> → 未選択</div>
          {(wantCount > 0 || avoidCount > 0) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {wantCount > 0 && <span style={{ padding: '4px 10px', borderRadius: 10, background: 'rgba(78,205,196,.15)', color: '#2BAB9E', fontSize: 12, fontWeight: 700 }}>◯ {wantCount}件</span>}
              {avoidCount > 0 && <span style={{ padding: '4px 10px', borderRadius: 10, background: 'rgba(255,107,107,.12)', color: C.primary, fontSize: 12, fontWeight: 700 }}>× {avoidCount}件</span>}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GENRES.map(g => {
              const val = genres[g.key];
              const isWant = val === 'want';
              const isAvoid = val === 'avoid';
              return (
                <button key={g.key} onClick={() => toggleGenre(g.key)} style={{ padding: '12px 10px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 8, border: `2px solid ${isWant ? '#4ECDC4' : isAvoid ? C.primary : C.border}`, background: isWant ? 'rgba(78,205,196,.1)' : isAvoid ? 'rgba(255,107,107,.08)' : 'white', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{g.emoji}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isWant ? '#2BAB9E' : isAvoid ? C.primary : C.text }}>{g.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: isWant ? '#2BAB9E' : isAvoid ? C.primary : C.muted }}>{isWant ? '◯ 行きたい' : isAvoid ? '× 避けたい' : 'タップして選択'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>📍 行きたい場所のタイプ</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>行きたいものだけ選んでください（複数OK）</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PLACE_TYPES.map(pt => {
              const sel = placeWants.includes(pt.key);
              return (
                <button key={pt.key} onClick={() => togglePlace(pt.key)} style={{ padding: '12px 10px', borderRadius: 18, textAlign: 'left', border: `2px solid ${sel ? '#4ECDC4' : C.border}`, background: sel ? 'rgba(78,205,196,.1)' : 'white', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{pt.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: sel ? '#2BAB9E' : C.text }}>{pt.label}</div>
                  {sel && <div style={{ fontSize: 10, color: '#2BAB9E', fontWeight: 900 }}>◯ 行きたい</div>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 14 }}>💰 予算感（1人あたり）</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['1000','〜1,000円','💴'],['2000','〜2,000円','💵'],['3000','〜3,000円','💶'],['5000','〜5,000円','💷']].map(([key,label,emoji]) => (
              <button key={key} onClick={() => setBudget(key)} style={{ padding: '12px 10px', borderRadius: 18, textAlign: 'left', border: `2px solid ${budget === key ? C.primary : C.border}`, background: budget === key ? 'rgba(255,107,107,.08)' : 'white', cursor: 'pointer' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: budget === key ? C.primary : C.text }}>{label}</div>
              </button>
            ))}
            <button onClick={() => setBudget('unlimited')} style={{ padding: '12px 10px', borderRadius: 18, border: `2px solid ${budget === 'unlimited' ? C.primary : C.border}`, background: budget === 'unlimited' ? 'rgba(255,107,107,.08)' : 'white', gridColumn: 'span 2', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: budget === 'unlimited' ? C.primary : C.text }}>💳 上限なし</div>
            </button>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 14 }}>🚃 移動の許容範囲</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[[20,'20分以内'],[30,'30分以内'],[45,'45分以内'],[60,'1時間OK']].map(([t,label]) => (
              <button key={t} onClick={() => setMaxTravel(Number(t))} style={{ padding: '12px 8px', borderRadius: 16, fontSize: 13, fontWeight: 900, border: `2px solid ${maxTravel === t ? '#4ECDC4' : C.border}`, background: maxTravel === t ? 'rgba(78,205,196,.1)' : 'white', color: maxTravel === t ? '#2BAB9E' : C.text, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>最寄り駅（任意）</div>
          <input value={station} onChange={e => setStation(e.target.value)} placeholder="例: 渋谷、新宿" style={{ width: '100%', padding: '13px 16px', borderRadius: 16, fontSize: 16, border: `2px solid ${C.border}`, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 14 }}>🏷️ 特別な希望</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[['privateRoom','🚪','個室希望'],['quiet','🤫','静かな場所希望'],['kids','👶','子連れ'],['outside','🌿','外・開放的な場所']].map(([k,emoji,label]) => (
              <button key={k} onClick={() => toggleOpt(k)} style={{ padding: '12px 10px', borderRadius: 18, textAlign: 'left', border: `2px solid ${options[k as keyof typeof options] ? C.accent : C.border}`, background: options[k as keyof typeof options] ? 'rgba(255,159,67,.1)' : 'white', cursor: 'pointer' }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>{emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: options[k as keyof typeof options] ? C.accent : C.text }}>{label}{options[k as keyof typeof options] ? ' ✓' : ''}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>アレルギー・NG食材（任意）</div>
          <input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="例: 海老アレルギー、貝類NG" style={{ width: '100%', padding: '13px 16px', borderRadius: 16, fontSize: 16, border: `2px solid ${C.border}`, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 14 }}>🌡️ 今回の温度感</div>
          {[['active','🎊','がっつり楽しみたい！'],['normal','😊','ほどよく楽しむ'],['early_end','🏃','早めに解散したい']].map(([key,emoji,label]) => (
            <button key={key} onClick={() => setMood(key)} style={{ width: '100%', padding: '13px 16px', borderRadius: 18, marginBottom: 8, border: `2px solid ${mood === key ? C.primary : C.border}`, background: mood === key ? 'rgba(255,107,107,.06)' : 'white', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <span style={{ fontSize: 24 }}>{emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: mood === key ? C.primary : C.text }}>{label}</span>
              {mood === key && <span style={{ marginLeft: 'auto', color: C.primary, fontWeight: 900 }}>✓</span>}
            </button>
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>💬 AIへのひとこと（任意）</div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="例：先月と被らないようにしたい、駐車場があると嬉しい" style={{ width: '100%', padding: '14px 16px', borderRadius: 16, fontSize: 14, border: `2px solid ${C.border}`, outline: 'none', background: 'white', resize: 'none', minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '14px 16px', background: 'rgba(255,249,245,.96)', backdropFilter: 'blur(14px)', borderTop: `1px solid ${C.border}` }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🎉</div>
            <div style={{ fontWeight: 900, color: '#4ECDC4' }}>送信完了！共有画面へ移動します</div>
          </div>
        ) : (
          <>
            <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '16px 20px', borderRadius: 20, background: 'linear-gradient(135deg,#FF6B6B,#E85555)', color: 'white', fontWeight: 900, fontSize: 16, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginBottom: 8 }}>
              {saving ? '送信中...' : '🔒 気分を送信（AIが集計します）'}
            </button>
            <button onClick={() => router.push(`/room/${roomId}`)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              スキップして共有画面を見る →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
