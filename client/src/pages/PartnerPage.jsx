import React, { useState } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Modal, Field, MapPicker } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { AdController } from '../services/db';

const PartnerPage = () => {
  const { user, toast } = useAppContext();
  const [updater, setUpdater] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({});

  if (!user || user.role !== 'partner') {
    return <div style={{ textAlign: 'center', padding: '120px 24px' }}><h3>ไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Partner เท่านั้น</h3></div>;
  }

  const refresh = () => setUpdater(x => x + 1);

  const myAds = AdController.list().filter(a => a.partnerId === user.id);

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData(ad);
    setModalOpen(true);
  };
  
  const handleCreate = () => {
    setEditingAd(null);
    setFormData({});
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('ยืนยันลบโฆษณานี้?')) {
      AdController.delete(id);
      toast('ลบโฆษณาเรียบร้อย');
      refresh();
    }
  };

  const handleToggleVis = (id) => {
    AdController.toggleVisibility(id);
    toast('เปลี่ยนสถานะโฆษณาเรียบร้อย');
    refresh();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await AdController.update(editingAd.id, formData);
      } else {
        await AdController.add({ ...formData, partnerId: user.id });
      }
      toast('บันทึกโฆษณาสำเร็จ (สถานะตั้งต้น: รอตรวจสอบหรือซ่อน)');
      setModalOpen(false);
      refresh();
    } catch(err) {
      toast(err.message || 'บันทึกโฆษณาไม่สำเร็จ', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 24px 64px' }}>
      <div className="animate-fadeUp">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 className="font-serif" style={{ fontSize: 32, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Megaphone size={32} color="var(--gold)" /> เสนอโฆษณา <span className="gold-text">(Partner)</span>
          </h1>
          <button onClick={handleCreate} className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10 }}>
            <Plus size={16} /> สร้างแคมเปญใหม่
          </button>
        </div>

        {myAds.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {myAds.map(a => (
              <div key={a.id} style={{ background: 'var(--bg-card)', border: `1px solid ${a.hidden ? 'rgba(255,107,107,.2)' : 'rgba(74,222,128,.2)'}`, borderRadius: 16, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <span className={`badge ${a.hidden ? 'badge-red' : 'badge-green'}`}>
                    {a.hidden ? 'ระงับ/รออนุมัติ' : 'เผยแพร่แล้ว'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleToggleVis(a.id)} className="btn-ghost" style={{ padding: '6px', borderRadius: 6 }} title={a.hidden ? 'ขอเผยแพร่' : 'ร้องขอซ่อน'}>
                      {a.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => handleEdit(a)} className="btn-ghost" style={{ padding: '6px', borderRadius: 6 }}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(a.id)} className="btn-danger" style={{ padding: '6px', borderRadius: 6 }}><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <h3 className="font-serif" style={{ fontSize: 18, marginBottom: 8, color: 'var(--text)' }}>{a.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{a.description}</p>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>เพิ่มเมื่อ: {new Date(a.createdAt).toLocaleDateString('th-TH')}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed rgba(255,255,255,.1)' }}>
            <Megaphone size={40} color="var(--muted)" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--text)', fontSize: 16, marginBottom: 8 }}>ยังไม่มีแคมเปญโฆษณา</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>สร้างโฆษณาแรกของคุณเพื่อโปรโมทสถานที่ใกล้เคียงการถ่ายทำได้เลย</div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAd ? 'แก้ไขโฆษณา' : 'สร้างโฆษณาใหม่'}>
        <form onSubmit={handleSubmit}>
          <Field label="หัวข้อแคมเปญ">
            <input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="inp" placeholder="โปรโมชั่นโรงแรมใกล้ชิดธรรมชาติ..." />
          </Field>
          <Field label="รายละเอียด">
            <textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="inp" placeholder="รับส่วนลด 20% เมื่อโชว์หน้าแอป..." />
          </Field>

          <MapPicker 
            lat={formData.lat} 
            lng={formData.lng} 
            onPick={(lat, lng) => setFormData({ ...formData, lat, lng })} 
          />

          <div style={{ display: 'flex', gap: 16 }}>
             <Field label="ละติจูดเป้าหมาย"><input type="number" step="0.0001" value={formData.lat || ''} onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })} className="inp" /></Field>
             <Field label="ลองจิจูดเป้าหมาย"><input type="number" step="0.0001" value={formData.lng || ''} onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })} className="inp" /></Field>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost" style={{ flex: 1, padding: '12px 0', borderRadius: 10 }}>ยกเลิก</button>
            <button type="submit" className="btn-gold" style={{ flex: 1, padding: '12px 0', borderRadius: 10 }}>บันทึกข้อมูล</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartnerPage;
