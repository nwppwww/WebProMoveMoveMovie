import { createClient } from '@supabase/supabase-js';

// เปลี่ยนให้เรียก Supabase ตรงๆ (เพื่อให้ใช้บน Vercel ได้เลยโดยไม่ต้องมัวแต่รัน Express)
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
  points: {},
  favorites: [],
  checkins: [],
  tickets: []
};

// Normalize keys (PostgreSQL lowercases column names)
const normalize = (list) => (list || []).map(item => {
  const obj = {};
  Object.keys(item).forEach(k => {
    let key = k;
    if (k === 'movieid') key = 'movieId';
    if (k === 'locationid') key = 'locationId';
    if (k === 'userid') key = 'userId';
    if (k === 'username') key = 'userName';
    if (k === 'createdat') key = 'createdAt';
    if (k === 'partnerid') key = 'partnerId';
    if (k === 'releaseyear') key = 'releaseYear';
    if (k === 'imgurl') key = 'imgUrl';
    if (k === 'ticket_code') key = 'ticketCode';
    if (k === 'redeemed_at') key = 'redeemedAt';
    if (k === 'pointsrequired') key = 'pointsRequired';
    if (k === 'adid') key = 'adId';
    obj[key] = item[k];
  });
  return obj;
});

export const initDB = async () => {
  try {
    const fetchTable = async (table) => {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn(`Failed to fetch ${table}:`, e.message);
        return [];
      }
    };

    const [uData, mData, lData, sData, rvData, rwData, aData, pData, fData, cData, tData] = await Promise.all([
      fetchTable('users'), fetchTable('movies'), fetchTable('locations'),
      fetchTable('scenes'), fetchTable('reviews'), fetchTable('rewards'),
      fetchTable('ads'), fetchTable('points'), fetchTable('favorites'),
      fetchTable('checkins'), fetchTable('tickets')
    ]);

    memoryDB.users = normalize(uData);
    memoryDB.movies = normalize(mData);
    memoryDB.locations = normalize(lData);
    memoryDB.scenes = normalize(sData);
    memoryDB.reviews = normalize(rvData);
    memoryDB.rewards = normalize(rwData);
    memoryDB.ads = normalize(aData);
    memoryDB.favorites = fData;
    memoryDB.checkins = cData;
    memoryDB.tickets = normalize(tData);

    // Bind movieId to locations for AdminPage display
    memoryDB.locations.forEach(loc => {
      const scene = memoryDB.scenes.find(s => s.locationId === loc.id);
      if (scene) loc.movieId = scene.movieId;
    });
    
    // Process points into key-value map
    const pmap = {};
    pData.forEach(p => {
       const uid = p.userId || p.userid || p.user_id;
       if (uid !== undefined && uid !== null) {
         pmap[uid] = p.amount;
       }
    });
    memoryDB.points = pmap;
    
    console.log('✅ Supabase initialized', memoryDB);
  } catch (error) {
    console.error('❌ Critical initialization error:', error);
  }
};

// Helper for Supabase Writes (converts camelCase to DB lowercase)
const denormalize = (data) => {
  const obj = {};
  Object.keys(data).forEach(k => {
    let key = k;
    if (k === 'movieId') key = 'movieid';
    if (k === 'locationId') key = 'locationid';
    if (k === 'userId') key = 'userid';
    if (k === 'userName') key = 'username';
    if (k === 'createdAt') key = 'createdat';
    if (k === 'partnerId') key = 'partnerid';
    if (k === 'releaseYear') key = 'releaseyear';
    if (k === 'imgUrl') key = 'imgurl';
    if (k === 'pointsRequired') key = 'pointsrequired';
    if (k === 'ticketCode') key = 'ticket_code';
    if (k === 'redeemedAt') key = 'redeemed_at';
    if (k === 'adId') key = 'adid';
    obj[key] = data[k];
  });
  return obj;
};

export const AuthController = {
  async login(email, pass) {
    // Look up user by email first, then check password
    // Try both in-memory (which already loaded) and direct Supabase query
    let u = memoryDB.users.find(u => 
      u.email && u.email.toLowerCase() === email.toLowerCase() && u.password === pass
    );
    
    // If not found in memory cache (e.g. newly registered), query Supabase directly
    if (!u) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .eq('password', pass)
        .single();
      
      if (!error && data) {
        u = normalize([data])[0];
        // Add to memory cache if missing
        const existing = memoryDB.users.findIndex(x => x.id === u.id);
        if (existing === -1) memoryDB.users.push(u);
        
        // Also load points for this user
        const { data: pData } = await supabase.from('points').select('*').eq('userid', u.id).single();
        if (pData) memoryDB.points[u.id] = pData.amount;
      }
    }
    
    return u || null;
  },

  async register(email, pass, name) {
    if (memoryDB.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    }
    
    // Supabase column is createdat (lowercase)
    const nw = { email, password: pass, name, role: 'member', createdat: new Date().toISOString() };
    const { data, error } = await supabase.from('users').insert(nw).select().single();
    if (error) throw new Error(error.message);
    
    const normalizedUser = normalize([data])[0];
    memoryDB.users.push(normalizedUser);
    
    // Give welcome 100 points - insert to DB
    try {
      const pointPayload = { userid: normalizedUser.id, amount: 100 };
      const { data: pData, error: pError } = await supabase
        .from('points')
        .insert(pointPayload)
        .select()
        .single();
      
      if (!pError && pData) {
        memoryDB.points[normalizedUser.id] = pData.amount;
        console.log('✅ Welcome points granted:', pData);
      } else if (pError) {
        // Try upsert in case userid column name differs
        console.warn('Points insert failed, trying upsert:', pError.message);
        await supabase.from('points').upsert({ userid: normalizedUser.id, amount: 100 });
        memoryDB.points[normalizedUser.id] = 100;
      }
    } catch (pErr) {
      console.error('Failed to grant welcome points:', pErr);
      memoryDB.points[normalizedUser.id] = 100; // set in memory at least
    }
    
    return normalizedUser;
  }
};

export const PointController = {
  get(userId) { 
    if (userId === undefined || userId === null) return 0;
    return memoryDB.points[userId] || 0; 
  },
  async spend(userId, amount) {
    const current = memoryDB.points[userId] || 0;
    if (current < amount) throw new Error('Not enough points');
    const nw = current - amount;
    
    const { error } = await supabase.from('points').update({ amount: nw }).eq('userid', userId);
    if (error) throw new Error(error.message);
    
    memoryDB.points[userId] = nw;
  },
  async add(userId, amount) {
    const current = memoryDB.points[userId] || 0;
    const nw = current + amount;
    
    // Upsert (update or insert)
    const { error } = await supabase.from('points').upsert({ userid: userId, amount: nw });
    if (error) console.error('Failed to add points:', error.message);
    
    memoryDB.points[userId] = nw;
    return nw;
  }
};

export const MovieController = {
  list() { return memoryDB.movies; },
  get(id) { return memoryDB.movies.find(m => m.id === parseInt(id)); },
  scenes(movieId) { 
    const pid = parseInt(movieId);
    return memoryDB.scenes.filter(s => 
      (s.movieId === pid) || (s.movieid === pid)
    ); 
  },
  async add(data) {
    const payload = denormalize({ ...data, createdAt: new Date().toISOString() });
    const { data: res, error } = await supabase.from('movies').insert(payload).select().single();
    if (error) throw error;
    const normalized = normalize([res])[0];
    memoryDB.movies.push(normalized);
    return normalized;
  },
  async update(id, data) {
    const payload = denormalize(data);
    const { data: res, error } = await supabase.from('movies').update(payload).eq('id', id).select().single();
    if (error) throw error;
    const normalized = normalize([res])[0];
    const idx = memoryDB.movies.findIndex(m => m.id === parseInt(id));
    if (idx !== -1) memoryDB.movies[idx] = normalized;
    return normalized;
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
    const { movieId, ...locationData } = data;
    const payload = denormalize({ ...locationData, hidden: false, createdAt: new Date().toISOString() });
    const { data: res, error } = await supabase.from('locations').insert(payload).select().single();
    if (error) throw error;
    
    const normalized = normalize([res])[0];
    
    if (movieId) {
      const scenePayload = { movieid: movieId, locationid: normalized.id, description: locationData.description || '', imgurl: '' };
      const { data: sRes, error: sErr } = await supabase.from('scenes').insert(scenePayload).select().single();
      if (!sErr && sRes) {
        memoryDB.scenes.push(normalize([sRes])[0]);
      }
      normalized.movieId = parseInt(movieId);
    }
    
    memoryDB.locations.push(normalized);
    return normalized;
  },
  async update(id, data) {
    const { movieId, ...locationData } = data;
    const payload = denormalize(locationData);
    const { data: res, error } = await supabase.from('locations').update(payload).eq('id', id).select().single();
    if (error) throw error;
    
    const normalized = normalize([res])[0];
    const idx = memoryDB.locations.findIndex(l => l.id === parseInt(id));
    
    // Manage scene relation
    if (movieId !== undefined) {
      const existingScene = memoryDB.scenes.find(s => s.locationId === parseInt(id));
      if (existingScene) {
        if (existingScene.movieId !== parseInt(movieId)) {
          await supabase.from('scenes').update({ movieid: movieId }).eq('id', existingScene.id);
          existingScene.movieId = parseInt(movieId);
        }
      } else if (movieId) {
        const scenePayload = { movieid: movieId, locationid: parseInt(id), description: locationData.description || normalized.description || '', imgurl: '' };
        const { data: sRes, error: sErr } = await supabase.from('scenes').insert(scenePayload).select().single();
        if (!sErr && sRes) memoryDB.scenes.push(normalize([sRes])[0]);
      }
      normalized.movieId = parseInt(movieId);
    } else {
      const existingScene = memoryDB.scenes.find(s => s.locationId === parseInt(id));
      if (existingScene) normalized.movieId = existingScene.movieId;
    }

    if (idx !== -1) memoryDB.locations[idx] = normalized;
    return normalized;
  },
  async delete(id) {
    await supabase.from('locations').delete().eq('id', id);
    memoryDB.locations = memoryDB.locations.filter(l => l.id !== parseInt(id));
    memoryDB.scenes = memoryDB.scenes.filter(s => s.locationId !== parseInt(id));
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
    const payload = denormalize({ ...data, hidden: false, createdAt: new Date().toISOString() });
    const { data: res, error } = await supabase.from('ads').insert(payload).select().single();
    if (error) throw error;
    const normalized = normalize([res])[0];
    memoryDB.ads.push(normalized);
    return normalized;
  },
  async update(id, data) {
    const payload = denormalize(data);
    const { data: res, error } = await supabase.from('ads').update(payload).eq('id', id).select().single();
    if (error) throw error;
    const normalized = normalize([res])[0];
    const idx = memoryDB.ads.findIndex(a => a.id === parseInt(id));
    if (idx !== -1) memoryDB.ads[idx] = normalized;
    return normalized;
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
    const payload = denormalize({ ...data, hidden: false });
    const { data: res, error } = await supabase.from('rewards').insert(payload).select().single();
    if (error) throw error;
    const normalized = normalize([res])[0];
    memoryDB.rewards.push(normalized);
    return normalized;
  },
  async update(id, data) {
    const payload = denormalize(data);
    const { data: res, error } = await supabase.from('rewards').update(payload).eq('id', id).select().single();
    if (error) throw error;
    const normalized = normalize([res])[0];
    const idx = memoryDB.rewards.findIndex(r => r.id === parseInt(id));
    if (idx !== -1) memoryDB.rewards[idx] = normalized;
    return normalized;
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
    const payload = denormalize({ ...data, createdAt: new Date().toISOString() });
    const { data: res, error } = await supabase.from('reviews').insert(payload).select().single();
    if (error) throw error;
    const normalized = normalize([res])[0];
    memoryDB.reviews.push(normalized);
    return normalized;
  },
  async delete(id) {
    await supabase.from('reviews').delete().eq('id', id);
    memoryDB.reviews = memoryDB.reviews.filter(r => r.id !== parseInt(id));
  }
};

export const UserDB = {
  list() { return memoryDB.users; },
  async updateName(userId, newName) {
    const u = memoryDB.users.find(x => x.id === parseInt(userId));
    if (!u) throw new Error('ไม่พบข้อมูลผู้ใช้');
    
    const oldName = u.name;
    if (oldName === newName) return u;

    // 1. Update users table
    const { data: res, error } = await supabase
      .from('users')
      .update({ name: newName })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;

    // 2. Record name history
    // Note: Column names are old_name and new_name as per our SQL setup
    const { error: hError } = await supabase.from('name_history').insert({
      userid: userId,
      old_name: oldName,
      new_name: newName
    });

    if (hError) {
      console.error('❌ Failed to record name history:', hError.message);
    }

    const normalized = normalize([res])[0];
    const idx = memoryDB.users.findIndex(x => x.id === parseInt(userId));
    if (idx !== -1) memoryDB.users[idx] = normalized;
    
    return normalized;
  },
  async getNameHistory(userId) {
    const { data, error } = await supabase
      .from('name_history')
      .select('*')
      .eq('userid', userId)
      .order('changed_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(h => ({
      id: h.id,
      oldName: h.old_name || h.oldname,
      newName: h.new_name || h.newname,
      changedAt: h.changed_at || h.changedat
    }));
  }
};

export const FavoriteController = {
  // Check if user has favorited a location
  isFavorite(userId, locationId) {
    if (!userId) return false;
    return memoryDB.favorites.some(
      f => (f.userid || f.userId) === userId && (f.locationid || f.locationId) === parseInt(locationId)
    );
  },

  // Get all favorite location IDs for a user
  getUserFavorites(userId) {
    if (!userId) return [];
    return memoryDB.favorites
      .filter(f => (f.userid || f.userId) === userId)
      .map(f => f.locationid || f.locationId);
  },

  // Get favorite location objects for a user
  getUserFavoriteLocations(userId) {
    const favIds = this.getUserFavorites(userId);
    return memoryDB.locations.filter(l => favIds.includes(l.id) && !l.hidden);
  },

  // Toggle favorite (add or remove)
  async toggle(userId, locationId) {
    const locId = parseInt(locationId);
    const already = this.isFavorite(userId, locId);

    if (already) {
      // Remove
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('userid', userId)
        .eq('locationid', locId);
      if (error) throw new Error(error.message);
      memoryDB.favorites = memoryDB.favorites.filter(
        f => !((f.userid || f.userId) === userId && (f.locationid || f.locationId) === locId)
      );
      return false; // not favorited anymore
    } else {
      // Add
      const { data, error } = await supabase
        .from('favorites')
        .insert({ userid: userId, locationid: locId })
        .select()
        .single();
      if (error) throw new Error(error.message);
      memoryDB.favorites.push(data);
      return true; // now favorited
    }
  }
};

export const CheckInController = {
  // Check cache if user has already checked into a location
  hasCheckedIn(userId, locationId) {
    if (!userId) return false;
    return memoryDB.checkins.some(
      c => (c.userid || c.userId) === userId && (c.locationid || c.locationId) === parseInt(locationId)
    );
  },

  // Query DB directly (used on page load to get latest truth)
  async hasCheckedInDB(userId, locationId) {
    const { data, error } = await supabase
      .from('checkins')
      .select('id')
      .eq('userid', userId)
      .eq('locationid', parseInt(locationId))
      .maybeSingle();
    if (error) return false;
    return !!data;
  },

  // Get all checked-in location IDs for a user
  getUserCheckIns(userId) {
    if (!userId) return [];
    return memoryDB.checkins
      .filter(c => (c.userid || c.userId) === userId)
      .map(c => c.locationid || c.locationId);
  },

  // Get full location objects for checked-in locations
  getUserCheckInLocations(userId) {
    const ids = this.getUserCheckIns(userId);
    return memoryDB.locations.filter(l => ids.includes(l.id));
  },

  // Record a check-in and award points (enforced at DB level via UNIQUE constraint)
  async checkIn(userId, locationId, pointsToAdd = 500) {
    const locId = parseInt(locationId);

    // Insert to checkins (will fail if already exists due to UNIQUE constraint)
    const { data, error } = await supabase
      .from('checkins')
      .insert({ userid: userId, locationid: locId })
      .select()
      .single();

    if (error) {
      // Unique violation = already checked in
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        throw new Error('ALREADY_CHECKED_IN');
      }
      throw new Error(error.message);
    }

    // Update cache
    memoryDB.checkins.push(data);

    // Award points
    const current = memoryDB.points[userId] || 0;
    const newTotal = current + pointsToAdd;
    await supabase.from('points').upsert({ userid: userId, amount: newTotal });
    memoryDB.points[userId] = newTotal;

    return { checkIn: data, newPoints: newTotal };
  }
};

export const TicketController = {
  list() { return memoryDB.tickets; },

  getUserTickets(userId) {
    if (!userId) return [];
    return memoryDB.tickets.filter(t =>
      (t.userId || t.userid) === parseInt(userId)
    );
  },

  // Generate human-readable, non-ambiguous ticket code
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = (n = 4) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `MMM-${seg()}-${seg()}-${seg()}`;
  },

  // Redeem a campaign ticket — points already deducted by caller
  async redeem(userId, adId) {
    const code = this.generateCode();
    const { data, error } = await supabase
      .from('tickets')
      .insert({ userid: parseInt(userId), adid: parseInt(adId), ticket_code: code })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const normalized = normalize([data])[0];
    memoryDB.tickets.push(normalized);
    return normalized;
  },

  // Admin / partner marks ticket as used
  async markUsed(ticketId, usedState = true) {
    const t = memoryDB.tickets.find(x => x.id === parseInt(ticketId));
    if (!t) return;
    const { error } = await supabase.from('tickets').update({ used: usedState }).eq('id', ticketId);
    if (!error) t.used = usedState;
  },

  async delete(id) {
    await supabase.from('tickets').delete().eq('id', id);
    memoryDB.tickets = memoryDB.tickets.filter(t => t.id !== parseInt(id));
  }
};
