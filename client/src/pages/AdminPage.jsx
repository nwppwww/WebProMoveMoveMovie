import React, { useState } from 'react';
import { Plus, Users, Film, MapPin, LayoutDashboard, Ticket, Check, Search } from 'lucide-react';
import { Modal, Field, MapPicker } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { UserDB, MovieController, LocationController, AdController, TicketController, supabase } from '../services/db';
import { Navigate, useNavigate } from 'react-router-dom';

// Sub-components
import MoviesTab from './admin/MoviesTab';
import LocationsTab from './admin/LocationsTab';
import AdsTab from './admin/AdsTab';
import TicketsTab from './admin/TicketsTab';
import UsersTab from './admin/UsersTab';

const AdminPage = () => {
  const { user, toast, confirm, impersonate } = useAppContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState('movies');
  const [updater, setUpdater] = useState(0);
  const [ticketSearch, setTicketSearch] = useState('');

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

  const handleDelete = (id, controller, typeName, displayName) => {
    confirm(`ยืนยันการลบ${typeName} "${displayName}" ออกจากระบบ?`, async () => {
      await controller.delete(id);
      toast(`ลบ${typeName}เรียบร้อย`);
      refresh();
    });
  };

  const handleToggleVis = async (id, controller) => {
    await controller.toggleVisibility(id);
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
      } else if (modalType === 'ads') {
        if (editingItem) await AdController.update(editingItem.id, formData);
        else await AdController.add(formData);
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

  const filteredTickets = React.useMemo(() => {
    let list = tickets;
    if (ticketSearch) {
      list = list.filter(t => t.ticketCode?.toLowerCase().includes(ticketSearch.toLowerCase()));
    }
    return list.sort((a, b) => new Date(b.redeemedAt || b.redeemed_at) - new Date(a.redeemedAt || a.redeemed_at));
  }, [tickets, ticketSearch]);

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

        {tab === 'movies' && (
          <MoviesTab 
            movies={movies} 
            onEdit={(m) => handleEdit(m, 'movies')} 
            onCreate={() => handleCreate('movies')} 
            onDelete={handleDelete} 
          />
        )}

        {tab === 'locations' && (
          <LocationsTab 
            locations={locations} 
            movies={movies} 
            onEdit={(l) => handleEdit(l, 'locations')} 
            onCreate={() => handleCreate('locations')} 
            onDelete={handleDelete} 
            onToggleVis={handleToggleVis} 
          />
        )}

        {tab === 'ads' && (
          <AdsTab 
            ads={ads} 
            users={users} 
            onToggleVis={handleToggleVis} 
            onDelete={handleDelete}
            onCreate={() => handleCreate('ads')}
          />
        )}

        {tab === 'tickets' && (
          <TicketsTab 
            filteredTickets={filteredTickets} 
            ads={ads} 
            users={users} 
            ticketSearch={ticketSearch} 
            setTicketSearch={setTicketSearch} 
            onRefresh={refresh} 
            onToast={toast} 
            onDelete={handleDelete} 
          />
        )}

        {tab === 'users' && (
          <UsersTab 
            users={users} 
            currentUser={user} 
            onEditUser={handleEditUser} 
            onImpersonate={handleImpersonate} 
            onDeleteUser={handleDeleteUser} 
          />
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

          {modalType === 'ads' && (
            <>
              <Field label="หัวข้อ / ชื่อตั๋ว"><input required value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="inp" placeholder="เช่น ส่วนลด 30% ร้าน AAA..." /></Field>
              <Field label="รายละเอียด"><textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="inp min-h-[80px]" /></Field>
              <Field label="แต้มที่ใช้แลก (0 = ฟรี)"><input type="number" min="0" value={formData.pointsRequired ?? 0} onChange={e => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) })} className="inp" /></Field>
            </>
          )}

          {modalType === 'locations' && (
            <>
              <Field label="ชื่อสถานที่"><input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="inp" /></Field>
              <Field label="URL รูปสถานที่ (ถ้ามี)"><input value={formData.imgUrl || ''} onChange={e => setFormData({ ...formData, imgUrl: e.target.value })} className="inp" placeholder="https://..." /></Field>
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
