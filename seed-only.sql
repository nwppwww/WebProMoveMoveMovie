-- 🎬 movemovemovie : Seed Data Only (Final Fix Version) --
-- รันโค้ดชุดนี้เพื่อล้างข้อมูลเก่าและลงข้อมูลใหม่ให้ถูกต้องครับ

-- 0. ปลดล็อคระบบความปลอดภัย (RLS) ทั้งหมด
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE scenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE points DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 1. ล้างข้อมูลเก่าออกก่อน (ลบจากตารางลูกไปตารางแม่)
DELETE FROM ads;
DELETE FROM rewards;
DELETE FROM reviews;
DELETE FROM scenes;
DELETE FROM locations;
DELETE FROM movies;
DELETE FROM points;
DELETE FROM users;

-- 2. เติมข้อมูลใหม่
INSERT INTO users (id, email, password, name, role) VALUES 
(1, 'admin@mmm.com', 'admin', 'Admin', 'admin'),
(2, 'user@mmm.com', 'user', 'Member A', 'member'),
(3, 'partner@mmm.com', 'partner', 'Partner One', 'partner');

INSERT INTO points (userId, amount) VALUES 
(1, 0),
(2, 600),
(3, 100);

INSERT INTO movies (id, title, poster, description, releaseYear, genre) VALUES 
(1, 'พี่มาก..พระโขนง', 'https://picsum.photos/500/750?movie=1', 'ภาพยนตร์สยองขวัญสุดฮิต ตำนานรักพี่มากและแม่นาคที่ทำรายได้ทะลุพันล้าน', 2013, 'Horror'),
(2, 'ฉลาดเกมส์โกง', 'https://picsum.photos/500/750?movie=2', 'เรื่องราวของนักเรียนหญิงฉลาดที่พลิกแพลงการโกงข้อสอบระดับโลก', 2017, 'Thriller');

INSERT INTO locations (id, name, lat, lng, province, description, type, hidden) VALUES
(1, 'วัดมหาบุศย์ พระโขนง', 13.7063, 100.6018, 'Bangkok', 'วัดเก่าแก่ริมคลอง... ถ่ายทำพี่มาก', 'Temple', false);

INSERT INTO scenes (id, movieId, locationId, description, imgUrl) VALUES
(1, 1, 1, 'ฉากที่มากและเพื่อนมาเยี่ยมนาค', 'https://picsum.photos/400/250?scene=1');

-- 3. รีสตาร์ทตัวเลข ID (Sequence)
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('movies_id_seq', (SELECT MAX(id) FROM movies));
SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations));
SELECT setval('points_id_seq', (SELECT MAX(id) FROM points));

-- 4. ย้ำสิทธิ์การเข้าถึง
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 5. เพิ่มคอลัมน์คะแนนในตาราง ads (หากยังไม่มี)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS pointsrequired INT DEFAULT 0;
