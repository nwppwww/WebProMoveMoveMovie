import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { Field } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { AuthController } from '../services/db';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, toast } = useAppContext();
  
  const [tab, setTab] = useState('login');
  const [err, setErr] = useState('');
  
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const u = await AuthController.login(email, pass);
      if (!u) return setErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      login(u);
      toast('เข้าสู่ระบบสำเร็จ');
      navigate('/');
    } catch (ex) {
      setErr(ex.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !pass) return setErr('กรุณากรอกข้อมูลให้ครบถ้วน');
    try {
      const u = await AuthController.register(email, pass, name);
      login(u);
      toast('สมัครสมาชิกสำเร็จ (ยินดีต้อนรับ +100 แต้ม)');
      navigate('/');
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-[100px] px-6">
      <div className="animate-fade-up bg-card border border-white/10 rounded-3xl p-10 w-full max-w-[420px] max-md:p-8 shrink-0">
        
        <div className="text-center mb-8">
          <h1 className="font-serif text-[32px] m-0 mb-2">Move<span className="gold-text">Move</span>Movie</h1>
          <p className="text-muted text-[14px]">ระบบแนะนำสถานที่ถ่ายทำตามรอยภาพยนตร์</p>
        </div>

        <div className="flex border-b border-white/10 mb-7">
          {[['login', 'เข้าสู่ระบบ'], ['register', 'สมัครสมาชิก']].map(([v, l]) => (
            <button key={v} onClick={() => { setTab(v); setErr(''); }}
              className={`flex-1 text-center text-[14px] py-2.5 -mb-[1px] flex items-center justify-center gap-1.5 transition-all outline-none bg-transparent border-none border-b-[2px] cursor-pointer 
                ${tab === v ? 'text-gold border-gold font-medium' : 'text-muted border-transparent hover:text-main'}`}>
              {v === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />} 
              {l}
            </button>
          ))}
        </div>

        {err && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-[10px] text-[13px] mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {err}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <Field label="อีเมล">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-xl text-main text-sm outline-none transition-all focus:border-gold/50 focus:ring-4 focus:ring-gold/10 placeholder:text-muted" placeholder="admin@mmm.com" />
            </Field>
            <Field label="รหัสผ่าน">
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-xl text-main text-sm outline-none transition-all focus:border-gold/50 focus:ring-4 focus:ring-gold/10 placeholder:text-muted" placeholder="••••••••" />
            </Field>
            <button type="submit" className="btn-gold w-full py-3 rounded-xl mt-4 text-[14px] flex items-center justify-center gap-2">
              <LogIn size={16} />
              เข้าสู่ระบบ
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <Field label="ชื่อ-นามสกุล">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-xl text-main text-sm outline-none transition-all focus:border-gold/50 focus:ring-4 focus:ring-gold/10 placeholder:text-muted" placeholder="สมชาย ใจดี" />
            </Field>
            <Field label="อีเมล">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-xl text-main text-sm outline-none transition-all focus:border-gold/50 focus:ring-4 focus:ring-gold/10 placeholder:text-muted" placeholder="somchai@example.com" />
            </Field>
            <Field label="รหัสผ่าน">
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-xl text-main text-sm outline-none transition-all focus:border-gold/50 focus:ring-4 focus:ring-gold/10 placeholder:text-muted" placeholder="••••••••" />
            </Field>
            <button type="submit" className="btn-gold w-full py-3 rounded-xl mt-4 text-[14px] flex items-center justify-center gap-2">
              <UserPlus size={16} />
              สร้างบัญชีใหม่
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
