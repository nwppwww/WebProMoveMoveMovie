import { Navigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user } = useAppContext();
  const pts = PointController.get(user?.id);

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div style={{ maxWidth: 800, margin: '140px auto 100px', padding: '0 24px' }}>
      <div className="animate-fadeUp">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 40 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#07070F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, flexShrink: 0 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 className="font-serif" style={{ fontSize: 32, margin: 0 }}>{user.name}</h1>
              <span className="badge badge-gray">{user.role}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <User size={16} /> {user.email}
            </div>
            <div style={{ background: 'rgba(232,160,32,.1)', border: '1px solid rgba(232,160,32,.2)', borderRadius: 20, padding: '4px 16px', display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--gold)', fontWeight: 600 }}>
              <Star size={16} fill="var(--gold)" /> แต้มสะสม: {pts} แต้ม
            </div>
          </div>
        </div>

        <h2 className="font-serif" style={{ fontSize: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={24} color="var(--gold)" /> กิจกรรมล่าสุด
        </h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '32px', textAlign: 'center' }}>
          <Gift size={48} color="rgba(255,255,255,.1)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 4 }}>ยังไม่มีประวัติการแลกของรางวัล หรือเขียนรีวิว</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.2)' }}>สะสมแต้มจากการแชร์ประสบการณ์ แล้วนำมาแลกรางวัลได้เลย!</div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
