'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const [room, setRoom] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const C = { primary: '#FF6B6B', border: '#F0EAE5', text: '#2D2D2D', muted: '#A0A0A0' };

  useEffect(() => {
    const s = localStorage.getItem(`atsumaro_session_${roomId}`);
    if (s) { router.replace(`/room/${roomId}/schedule`); return; }
    fetch(`/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(d => { if (d.room) setRoom(d.room); })
      .finally(() => setPageLoading(false));
  }, [roomId]);

  const handleJoin = async () => {
    if (!nickname.trim()) { setError('ニックネームを入力してください'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(`atsumaro_session_${roomId}`, JSON.stringify({ member_id: data.member_id, nickname: nickname.trim(), session_token: data.session_token }));
      router.push(`/room/${roomId}/schedule`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>読み込み中...</div>;

  return (
    <div style={{ background: '#FFF9F5', minHeight: '100dvh' }}>
      <div style={{ background: 'linear-gradient(160deg,#4ECDC4 0%,#45B7D1 100%)', borderRadius: '0 0 36px 36px', padding: '60px 24px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>招待されました！</h1>
        {room && <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(255,255,255,.2)', color: 'white', fontSize: 14, fontWeight: 700 }}>{room.title}</div>}
      </div>
      <div style={{ padding: 16 }}>
        {room && (
          <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{room.title}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>主催: {room.created_by} ・ 候補日 {room.candidate_dates?.length || 0}日程</div>
          </div>
        )}
        <div style={{ background: 'white', borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>😊 ニックネームを入力</div>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="例: みき、さとし" onKeyDown={e => e.key === 'Enter' && handleJoin()} autoFocus style={{ width: '100%', padding: '13px 16px', borderRadius: 16, fontSize: 16, border: `2px solid ${C.border}`, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <div style={{ fontSize: 12, color: C.muted }}>会員登録不要。ニックネームのみで参加できます。</div>
        </div>
        {error && <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(255,107,107,.1)', color: C.primary, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
        <button onClick={handleJoin} disabled={loading || !nickname.trim()} style={{ width: '100%', padding: '16px 20px', borderRadius: 20, background: 'linear-gradient(135deg,#4ECDC4,#45B7D1)', color: 'white', fontWeight: 900, fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 8 }}>
          {loading ? '参加中...' : '🚀 参加して日程を回答する'}
        </button>
        <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(78,205,196,.08)', border: '1px solid rgba(78,205,196,.2)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2BAB9E' }}>🔒 個人の希望は他の参加者に見えません</div>
        </div>
      </div>
    </div>
  );
}
