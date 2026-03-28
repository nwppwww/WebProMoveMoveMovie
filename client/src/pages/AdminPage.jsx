import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Edit2, Plus, Users, Film, MapPin, LayoutDashboard, Megaphone, LogIn, Shield, Ticket, Check } from 'lucide-react';
import { Modal, Field, MapPicker } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { UserDB, MovieController, LocationController, AdController, TicketController, supabase } from '../services/db';
import { Navigate, useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const { user, toast, confirm, impersonate } = useAppContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState('movies');
  const [updater, setUpdater] = useState(0);

  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // User edit modal
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({});

  if (!user || user.role !== 'admin') {
    return <Navigate to="/auth" />;
  }

  const refresh = () => setUpdater(x => x + 1);

  // --- Actions ---
  const handleEdit = (item, type) => {
    setEditingItem(item);
    setFormData(item);
    setModalType(type);
  };
  
  const handleCreate = (type) => {
    setEditingItem(null);
    setFormData({});
    setModalType(type);
  };

  const handleDelete = (id, controller, typeName) => {
    confirm(`ยืนยันการลบ${typeName} ID: ${id} ออกจากระบบ?`, async () => {
      await controller.delete(id);
      toast(`ลบ${typeName}เรียบร้อย`);
      refresh();
    });
  };

  const handleToggleVis = (id, controller) => {
    controller.toggleVisibility(id);
    toast('เปลี่ยนสถานะการมองเห็นแล้ว');
    refresh();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'movies') {
        if (editingItem) await MovieController.update(editingItem.id, formData);
        else await MovieController.add(formData);
      } else if (modalType === 'locations') {
        if (editingItem) await LocationController.update(editingItem.id, formData);
        else await LocationController.add(formData);
      }
      toast('บันทึกข้อมูลสำเร็จ');
      setModalType(null);
      refresh();
    } catch(err) {
      toast(err.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    }
  };

  // --- User management ---
  const handleEditUser = (u) => {
    setEditingUser(u);
    setUserForm({ name: u.name, email: u.email, role: u.role, password: '' });
    setUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const updates = { name: userForm.name, email: userForm.email, role: userForm.role };
      if (userForm.password) updates.password = userForm.password;
      
      const { data, error } = await supabase.from('users').update(updates).eq('id', editingUser.id).select().single();
      if (error) throw error;
      
      const users = UserDB.list();
      const idx = users.findIndex(u => u.id === editingUser.id);
      if (idx !== -1) Object.assign(users[idx], data);
      
      toast('แก้ไขข้อมูลผู้ใช้สำเร็จ');
      setUserModal(false);
      refresh();
    } catch (err) {
      toast(err.message || 'แก้ไขข้อมูลไม่สำเร็จ', 'error');
    }
  };

  const handleDeleteUser = (u) => {
    if (u.id === user.id) return toast('ไม่สามารถลบบัญชีตัวเองได้', 'error');
    confirm(`ยืนยันการลบบัญชี "${u.name}" (${u.email})?\nการกระทำนี้ไม่สามารถย้อนกลับได้`, async () => {
      const { error } = await supabase.from('users').delete().eq('id', u.id);
      if (error) return toast(error.message, 'error');
      const list = UserDB.list();
      const idx = list.findIndex(x => x.id === u.id);
      if (idx !== -1) list.splice(idx, 1);
      toast(`ลบบัญชี ${u.name} สำเร็จ`);
      refresh();
    });
  };

  const handleImpersonate = (targetUser) => {
    confirm(`เข้าสู่ระบบแทน "${targetUser.name}" (${targetUser.email})?\nบทบาท: ${targetUser.role}`, () => {
      impersonate(targetUser);
      toast(`เข้าสู่ระบบแทน ${targetUser.name} สำเร็จ`);
      navigate('/');
    }, 'info');
  };

  const movies = MovieController.list();
  const locations = LocationController.list();
  const ads = AdController.list();
  const users = UserDB.list();
  const tickets = TicketController.list();

  return (
    <div className="max-w-[1200px] mx-auto pt-[100px] pb-16 px-6">
      <div className="animate-fade-up">
        <h1 className="font-serif text-[36px] mb-8 flex items-center gap-3">
          <LayoutDashboard size={32} className="text-gold" /> จัดการระบบ <span className="gold-text">(Admin)</span>
        </h1>

        <div className="flex gap-2 border-b border-white/10 pb-4 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'movies', l: 'ภาพยนตร์', icon: Film },
            { id: 'locations', l: 'สถานที่', icon: MapPin },
            { id: 'ads', l: 'ตั๋วสิทธิพิเศษ (Partner)', icon: Ticket },
            { id: 'users', l: 'ผู้ใช้งาน', icon: Users },
            { id: 'tickets', l: 'ประวัติการแลกตั๋ว', icon: Check }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} 
              className={`tab-item flex items-center gap-2 whitespace-nowrap min-w-max ${tab === t.id ? 'active' : ''}`}>
              <t.icon size={16} /> {t.l}
            </button>
          ))}
        </div>

        {/* MOVIES TAB */}
        {tab === 'movies' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => handleCreate('movies')} className="btn-gold flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm">
                <Plus size={16} /> เพิ่มภาพยนตร์
              </button>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>ID</th><th>ชื่อเรื่อง</th><th>ปีที่ฉาย</th><th>หมวดหมู่</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {movies.map(m => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.title}</td>
                      <td>{m.releaseYear}</td>
                      <td>{m.genre}</td>
                      <td>
                        <button onClick={() => handleEdit(m, 'movies')} className="btn-ghost p-1.5 rounded-md mr-2"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(m.id, MovieController, 'ภาพยนตร์')} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOCATIONS TAB */}
        {tab === 'locations' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => handleCreate('locations')} className="btn-gold flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm">
                <Plus size={16} /> เพิ่มสถานที่
              </button>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>ID</th><th>ชื่อสถานที่</th><th>ภาพยนตร์</th><th>จังหวัด</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {locations.map(l => (
                    <tr key={l.id}>
                      <td>{l.id}</td>
                      <td>{l.name}</td>
                      <td className="text-gold font-medium">{movies.find(m => m.id === l.movieId)?.title || '-'}</td>
                      <td>{l.province}</td>
                      <td>{l.hidden ? <span className="text-muted"><EyeOff size={14} className="inline mr-1" /> ซ่อน</span> : <span className="text-gold"><Eye size={14} className="inline mr-1" /> แสดง</span>}</td>
                      <td>
                        <button onClick={() => handleToggleVis(l.id, LocationController)} className="btn-ghost p-1.5 rounded-md mr-2">{l.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                        <button onClick={() => handleEdit(l, 'locations')} className="btn-ghost p-1.5 rounded-md mr-2"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(l.id, LocationController, 'สถานที่')} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADS TAB */}
        {tab === 'ads' && (
          <div>
            <h3 className="font-serif mb-4 text-[20px]">อนุมัติตั๋วสิทธิพิเศษจาก Partner</h3>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>ID</th><th>หัวข้อ</th><th>ชื่อ Partner</th><th>แต้มที่ใช้แลก</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {ads.map(a => {
                    const partner = users.find(u => u.id === a.partnerId);
                    return (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.title}</td>
                        <td>{partner ? partner.name : 'Unknown Partner'}</td>
                        <td className="text-gold font-medium">{a.pointsRequired > 0 ? `${a.pointsRequired} แต้ม` : '-'}</td>
                        <td>
                          {a.hidden ? 
                            <span className="text-muted bg-white/5 px-2 py-0.5 rounded-full text-xs">รออนุมัติ / ซ่อน</span> : 
                            <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full text-xs">อนุมัติแล้ว / แสดง</span>
                          }
                        </td>
                        <td>
                          <button onClick={() => handleToggleVis(a.id, AdController)} className="btn-ghost py-1.5 px-3 rounded-md mr-2 text-[13px] inline-flex items-center gap-1.5">
                            {a.hidden ? <Eye size={14} /> : <EyeOff size={14} />} 
                            {a.hidden ? 'อนุมัติ (แสดงผล)' : 'ระงับ (ซ่อน)'}
                          </button>
                          <button onClick={() => handleDelete(a.id, AdController, 'ตั๋วสิทธิพิเศษ')} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {tab === 'tickets' && (
          <div>
            <h3 className="font-serif mb-4 text-[20px]">ประวัติตั๋วและสิทธิ์พิเศษที่ถูกผู้ใช้แลกไป</h3>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>ID</th><th>รหัสตั๋ว</th><th>ชื่อตั๋ว (สิทธิพิเศษ)</th><th>ผู้ใช้</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {tickets.map(t => {
                    const ad = ads.find(a => a.id === t.adId || a.id === t.adid);
                    const usr = users.find(u => u.id === t.userId || u.id === t.userid);
                    return (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td className="font-mono text-gold font-bold tracking-wider">{t.ticketCode}</td>
                        <td>{ad?.title || 'Unknown Ad'}</td>
                        <td>{usr ? `${usr.name}` : 'Unknown'}</td>
                        <td className={t.used ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{t.used ? 'ใช้สิทธิ์แล้ว' : 'พร้อมใช้งาน'}</td>
                        <td>
                          <button onClick={async () => {
                            await TicketController.markUsed(t.id, !t.used);
                            refresh();
                            toast(`เปลี่ยนสถานะตั๋ว ${t.ticketCode} สำเร็จ`);
                          }} className="btn-ghost py-1.5 px-3 rounded-md mr-2 text-[13px] border border-white/20">
                            {t.used ? 'รีเซ็ตเป็น "พร้อมใช้"' : 'ใช้งานตั๋วนี้'}
                          </button>
                          <button onClick={() => handleDelete(t.id, TicketController, 'ตั๋ว')} className="btn-danger p-1.5 rounded-md"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-muted text-[13px]">
                รวม {users.length} บัญชี · สามารถแก้ไขข้อมูลและเข้าสู่ระบบแทนได้
              </div>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>ID</th><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>วันที่สมัคร</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="text-muted text-[12px]">{u.id}</td>
                      <td className="font-medium">{u.name}</td>
                      <td className="text-muted">{u.email}</td>
                      <td><span className={u.role === 'admin' ? 'badge badge-green' : u.role === 'partner' ? 'badge' : 'badge badge-gray'}>{u.role}</span></td>
                      <td className="text-muted text-[12px]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : '-'}</td>
                      <td>
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => handleEditUser(u)} className="btn-ghost px-2.5 py-1 rounded-md text-[12px] flex items-center gap-1" title="แก้ไขข้อมูล">
                            <Edit2 size={13} /> แก้ไข
                          </button>
                          {u.id !== user.id && (
                            <button onClick={() => handleImpersonate(u)} className="btn-ghost px-2.5 py-1 rounded-md text-[12px] flex items-center gap-1 border-gold/30 text-gold" title="เข้าสู่ระบบแทน">
                              <LogIn size={13} /> Login แทน
                            </button>
                          )}
                          {u.id !== user.id && u.role !== 'admin' && (
                            <button onClick={() => handleDeleteUser(u)} className="btn-danger p-1 rounded-md" title="ลบบัญชี">
                              <Trash2 size={13} />
                            </button>
                          )}
                          {u.id === user.id && (
                            <span className="text-muted text-[11px] px-2 py-1 flex items-center gap-1">
                              <Shield size={12} />คุณ
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!modalType} onClose={() => setModalType(null)} title={editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}>
        <form onSubmit={handleSubmit}>
          {modalType === 'movies' && (
            <>
              <Field label="ชื่อภาพยนตร์"><input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="inp" /></Field>
              <Field label="ปีที่ฉาย"><input type="number" required value={formData.releaseYear || ''} onChange={e => setFormData({ ...formData, releaseYear: e.target.value })} className="inp" /></Field>
              <Field label="หมวดหมู่"><input required value={formData.genre || ''} onChange={e => setFormData({ ...formData, genre: e.target.value })} className="inp" /></Field>
              <Field label="URL โปสเตอร์"><input required value={formData.poster || ''} onChange={e => setFormData({ ...formData, poster: e.target.value })} className="inp" /></Field>
              <Field label="เรื่องย่อ"><textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="inp" /></Field>
            </>
          )}

          {modalType === 'locations' && (
            <>
              <Field label="ชื่อสถานที่"><input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="inp" /></Field>
              <Field label="ภาพยนตร์ที่เกี่ยวข้อง">
                <select 
                  required 
                  value={formData.movieId || ''} 
                  onChange={e => setFormData({ ...formData, movieId: parseInt(e.target.value) })}
                  className="inp px-3"
                >
                  <option value="">-- เลือกภาพยนตร์ --</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.releaseYear})</option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-4 max-md:flex-col">
                <Field label="จังหวัด" className="flex-1"><input required value={formData.province || ''} onChange={e => setFormData({ ...formData, province: e.target.value })} className="inp" /></Field>
                <Field label="ประเภท" className="flex-1"><input required value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })} className="inp" placeholder="Temple, Beach, Cafe..."/></Field>
              </div>
              
              <MapPicker 
                lat={formData.lat} 
                lng={formData.lng} 
                onPick={(lat, lng, province) => {
                  setFormData(prev => ({ ...prev, lat, lng, province: province || prev.province }));
                }} 
              />

              <div className="flex gap-4 max-md:flex-col mt-4">
                <Field label="ละติจูด (Lat)"><input type="number" step="0.0001" required value={formData.lat || ''} onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })} className="inp" /></Field>
                <Field label="ลองจิจูด (Lng)"><input type="number" step="0.0001" required value={formData.lng || ''} onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })} className="inp" /></Field>
              </div>
              <Field label="รายละเอียด"><textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="inp min-h-[80px]" /></Field>
            </>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setModalType(null)} className="btn-ghost flex-1 py-3 rounded-xl">ยกเลิก</button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl">บันทึกข้อมูล</button>
          </div>
        </form>
      </Modal>

      <Modal open={userModal} onClose={() => setUserModal(false)} title={`แก้ไขข้อมูลผู้ใช้: ${editingUser?.name}`}>
        <form onSubmit={handleSaveUser}>
          <Field label="ชื่อ-นามสกุล">
            <input required value={userForm.name || ''} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="inp" />
          </Field>
          <Field label="อีเมล">
            <input type="email" required value={userForm.email || ''} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="inp" />
          </Field>
          <Field label="บทบาท (Role)">
            <select value={userForm.role || 'member'} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="inp px-3">
              <option value="member">member</option>
              <option value="partner">partner</option>
              <option value="admin">admin</option>
            </select>
          </Field>
          <Field label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)">
            <input type="password" value={userForm.password || ''} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="inp" placeholder="••••••••" />
          </Field>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setUserModal(false)} className="btn-ghost flex-1 py-3 rounded-xl">ยกเลิก</button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl">บันทึกการเปลี่ยนแปลง</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPage;
