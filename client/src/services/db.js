import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbxerewphusfequsqthz.supabase.co';
const supabaseKey = 'sb_publishable_8hLBy1wLAbZQ-jeHrac-ag_FNg32_LK';

export const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache for synchronous reads matching legacy behavior
let memoryDB = {
  users: [],
  movies: [],
  locations: [],
  scenes: [],
  reviews: [],
  rewards: [],
  ads: [],
  points: {}
};

export const initDB = async () => {
  try {
    const [uRes, mRes, lRes, sRes, rvRes, rwRes, aRes, pRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('movies').select('*'),
      supabase.from('locations').select('*'),
      supabase.from('scenes').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('rewards').select('*'),
      supabase.from('ads').select('*'),
      supabase.from('points').select('*')
    ]);

    if (mRes.error) console.error('Supabase Error (movies): ' + mRes.error.message);
    if (lRes.error) console.error('Supabase Error (locations): ' + lRes.error.message);
    if (sRes.error) console.error('Supabase Error (scenes): ' + sRes.error.message);

    // Normalize keys (PostgreSQL lowercases column names)
    const normalize = (list) => (list || []).map(item => {
      const obj = {};
      Object.keys(item).forEach(k => {
        // Map common lowercased keys to CamelCase required by the App
        let key = k;
        if (k === 'movieid') key = 'movieId';
        if (k === 'locationid') key = 'locationId';
        if (k === 'userid') key = 'userId';
        if (k === 'username') key = 'userName';
        if (k === 'createdat') key = 'createdAt';
        if (k === 'partnerid') key = 'partnerId';
        if (k === 'releaseyear') key = 'releaseYear';
        if (k === 'imgurl') key = 'imgUrl';
        obj[key] = item[k];
      });
      return obj;
    });

    memoryDB.users = normalize(uRes.data);
    memoryDB.movies = normalize(mRes.data);
    memoryDB.locations = normalize(lRes.data);
    memoryDB.scenes = normalize(sRes.data);
    memoryDB.reviews = normalize(rvRes.data);
    memoryDB.rewards = normalize(rwRes.data);
    memoryDB.ads = normalize(aRes.data);
    
    // Process points into key-value map
    if (!pRes.error) {
      const pmap = {};
      (pRes.data || []).forEach(p => {
         const uid = p.userId || p.userid;
         pmap[uid] = p.amount;
      });
      memoryDB.points = pmap;
    }
    console.log('✅ Supabase initialized', memoryDB);
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
  }
};

export const AuthController = {
  async login(email, pass) {
    // In a real app we'd use Supabase Auth. For compatibility we look up the table.
    const u = memoryDB.users.find(u => u.email === email && u.password === pass);
    return u || null;
  },
  async register(email, pass, name) {
    if (memoryDB.users.find(u => u.email === email)) throw new Error('Email already exists');
    const nw = { email, password: pass, name, role: 'member', createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('users').insert(nw).select().single();
    if (error) throw new Error(error.message);
    memoryDB.users.push(data);
    
    // Welcome points
    const { data: pData } = await supabase.from('points').insert({ userId: data.id, amount: 100 }).select().single();
    memoryDB.points[data.id] = (pData?.amount || 100);
    return data;
  }
};

export const PointController = {
  get(userId) { return memoryDB.points[userId] || 0; },
  async spend(userId, amount) {
    const current = memoryDB.points[userId] || 0;
    if (current < amount) throw new Error('Not enough points');
    const nw = current - amount;
    
    const { error } = await supabase.from('points').update({ amount: nw }).eq('userId', userId);
    if (error) throw new Error(error.message);
    
    memoryDB.points[userId] = nw;
  }
};

export const MovieController = {
  list() { return memoryDB.movies; },
  get(id) { return memoryDB.movies.find(m => m.id === parseInt(id)); },
  scenes(movieId) { 
    // PostgreSQL usually lowercases column names like 'movieId' to 'movieid' 
    return memoryDB.scenes.filter(s => 
      (s.movieId === parseInt(movieId)) || (s.movieid === parseInt(movieId))
    ); 
  },
  async add(data) {
    const dDate = { ...data, createdAt: new Date().toISOString() };
    const { data: res, error } = await supabase.from('movies').insert(dDate).select().single();
    if (error) throw error;
    memoryDB.movies.push(res);
    return res;
  },
  async update(id, data) {
    const { data: res, error } = await supabase.from('movies').update(data).eq('id', id).select().single();
    if (error) throw error;
    const idx = memoryDB.movies.findIndex(m => m.id === parseInt(id));
    if (idx !== -1) memoryDB.movies[idx] = res;
    return res;
  },
  async delete(id) {
    await supabase.from('movies').delete().eq('id', id);
    memoryDB.movies = memoryDB.movies.filter(m => m.id !== parseInt(id));
  }
};

export const LocationController = {
  list() { return memoryDB.locations; },
  get(id) { return memoryDB.locations.find(l => l.id === parseInt(id)); },
  async add(data) {
    const dDate = { ...data, hidden: false, createdAt: new Date().toISOString() };
    const { data: res, error } = await supabase.from('locations').insert(dDate).select().single();
    if (error) throw error;
    memoryDB.locations.push(res);
    return res;
  },
  async update(id, data) {
    const { data: res, error } = await supabase.from('locations').update(data).eq('id', id).select().single();
    if (error) throw error;
    const idx = memoryDB.locations.findIndex(l => l.id === parseInt(id));
    if (idx !== -1) memoryDB.locations[idx] = res;
  },
  async delete(id) {
    await supabase.from('locations').delete().eq('id', id);
    memoryDB.locations = memoryDB.locations.filter(l => l.id !== parseInt(id));
  },
  async toggleVisibility(id) {
    const l = memoryDB.locations.find(x => x.id === parseInt(id));
    if (l) {
      const { data, error } = await supabase.from('locations').update({ hidden: !l.hidden }).eq('id', id).select().single();
      if (!error) l.hidden = data.hidden;
    }
  }
};

export const AdController = {
  list() { return memoryDB.ads; },
  async add(data) {
    const dDate = { ...data, hidden: false, createdAt: new Date().toISOString() };
    const { data: res, error } = await supabase.from('ads').insert(dDate).select().single();
    if (error) throw error;
    memoryDB.ads.push(res);
    return res;
  },
  async update(id, data) {
    const { data: res, error } = await supabase.from('ads').update(data).eq('id', id).select().single();
    if (error) throw error;
    const idx = memoryDB.ads.findIndex(a => a.id === parseInt(id));
    if (idx !== -1) memoryDB.ads[idx] = res;
  },
  async delete(id) {
    await supabase.from('ads').delete().eq('id', id);
    memoryDB.ads = memoryDB.ads.filter(a => a.id !== parseInt(id));
  },
  async toggleVisibility(id) {
    const a = memoryDB.ads.find(x => x.id === parseInt(id));
    if (a) {
      const { data, error } = await supabase.from('ads').update({ hidden: !a.hidden }).eq('id', id).select().single();
      if (!error) a.hidden = data.hidden;
    }
  }
};

export const RewardController = {
  list() { return memoryDB.rewards; },
  async add(data) {
    const dDate = { ...data, hidden: false };
    const { data: res, error } = await supabase.from('rewards').insert(dDate).select().single();
    if (error) throw error;
    memoryDB.rewards.push(res);
  },
  async update(id, data) {
    const { data: res, error } = await supabase.from('rewards').update(data).eq('id', id).select().single();
    if (error) throw error;
    const idx = memoryDB.rewards.findIndex(r => r.id === parseInt(id));
    if (idx !== -1) memoryDB.rewards[idx] = res;
  },
  async delete(id) {
    await supabase.from('rewards').delete().eq('id', id);
    memoryDB.rewards = memoryDB.rewards.filter(r => r.id !== parseInt(id));
  },
  async toggleVisibility(id) {
    const r = memoryDB.rewards.find(x => x.id === parseInt(id));
    if (r) {
      const { data, error } = await supabase.from('rewards').update({ hidden: !r.hidden }).eq('id', id).select().single();
      if (!error) r.hidden = data.hidden;
    }
  }
};

export const ReviewController = {
  list(locationId) { return memoryDB.reviews.filter(r => r.locationId === parseInt(locationId)); },
  async add(data) {
    const dDate = { ...data, createdAt: new Date().toISOString() };
    const { data: res, error } = await supabase.from('reviews').insert(dDate).select().single();
    if (error) throw error;
    memoryDB.reviews.push(res);
    return res;
  },
  async delete(id) {
    await supabase.from('reviews').delete().eq('id', id);
    memoryDB.reviews = memoryDB.reviews.filter(r => r.id !== parseInt(id));
  }
};

export const UserDB = {
  list() { return memoryDB.users; }
};
