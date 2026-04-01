-- 🎬 movemovemovie : Seed Data Only (Fixed with New Locations) --
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

-- 2. เติมข้อมูลผู้ใช้
INSERT INTO users (id, email, password, name, role) VALUES 
(1, 'admin@mmm.com', 'admin', 'Admin', 'admin'),
(2, 'user@mmm.com', 'user', 'Member A', 'member'),
(3, 'partner@mmm.com', 'partner', 'Partner One', 'partner');

INSERT INTO points (userId, amount) VALUES 
(1, 0),
(2, 600),
(3, 100);

-- 3. เติมข้อมูลหนัง
INSERT INTO movies (id, title, poster, description, releaseYear, genre) VALUES 
(1, 'พี่มาก..พระโขนง', 'https://picsum.photos/500/750?movie=1', 'ภาพยนตร์สยองขวัญสุดฮิต ตำนานรักพี่มากและแม่นาคที่ทำรายได้ทะลุพันล้าน', 2013, 'Horror'),
(2, 'ฉลาดเกมส์โกง', 'https://picsum.photos/500/750?movie=2', 'เรื่องราวของนักเรียนหญิงฉลาดที่พลิกแพลงการโกงข้อสอบระดับโลก', 2017, 'Thriller'),
(5, 'SuckSeed ห่วยขั้นเทพ', 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/vE2eUunIdWvYfL6E61qWwN1X9Fm.jpg', 'หนังว่าด้วยเรื่องราวของ “เป็ด” “คุ้ง” และ “เอ็กซ์” ที่ตัดสินใจก่อตั้งวงดนตรีของตัวเองขึ้นมาด้วยเป้าหมายที่อยากจะเป็นนักดนตรีระดับประเทศ...', 2011, 'Comedy/Music'),
(6, 'วิมานหนาม', 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/6YV2L6hS7wz3q3UfQ3E8b6nS7S4.jpg', '“ทองคำ” และ “เสก” คู่รักหนุ่มชาวสวน ช่วยกันปลูกบ้านและทำสวนทุเรียนบนที่ดินของเสกที่ติดจำนองอยู่...', 2024, 'Drama/Thriller');

-- 4. เติมข้อมูลสถานที่
INSERT INTO locations (id, name, lat, lng, province, description, type, hidden) VALUES
(1, 'วัดมหาบุศย์ พระโขนง', 13.7063, 100.6018, 'Bangkok', 'วัดเก่าแก่ริมคลอง... ถ่ายทำพี่มาก', 'Temple', false),
(10, 'สะพานเหล็ก', 18.7844, 99.0012, 'Chiang Mai', 'เมืองเชียงใหม่', 'Landmark', false),
(11, 'หอประชุม มหาวิทยาลัยเชียงใหม่', 18.8012, 98.9610, 'Chiang Mai', 'เมืองเชียงใหม่', 'Hall', false),
(12, 'โรงเรียนกุหลาบวิทยา', 13.7342, 100.5141, 'Bangkok', 'บางรัก', 'School', false),
(13, 'อินดอร์สเตเดี้ยม หัวหมาก', 13.7581, 100.6235, 'Bangkok', 'บางกะปิ', 'Stadium', false),
(14, 'เกาะสุนัข พุทธมณฑล', 13.7765, 100.3221, 'Nakhon Pathom', 'พุทธมณฑล', 'Park', false);

-- 5. เติมข้อมูลฉาก (Scenes) ที่เชื่อมกับสถานที่ใหม่
INSERT INTO scenes (id, movieId, locationId, description, imgUrl) VALUES
(1, 1, 1, 'ฉากที่มากและเพื่อนมาเยี่ยมนาค', 'https://picsum.photos/400/250?scene=1'),
(10, 5, 10, '“ไม่มีใครแต่อย่างน้อยมีน้ำตาคอยปลอบใจ”', 'https://picsum.photos/400/250?suckseed=1'),
(11, 5, 11, '“กูชอบเอิญก่อนมึงอีกนะเว้ย”', 'https://picsum.photos/400/250?suckseed=2'),
(12, 5, 12, '“สักครั้งในชีวิตลูกผู้ชายอย่างเรา การมาเยือนโรงเรียนหญิงล้วนฯ”', 'https://picsum.photos/400/250?suckseed=3'),
(13, 5, 13, '“ที่นี่แหละเว้ย เวทีประกวดรอบสุดท้าย Hot Wave”', 'https://picsum.photos/400/250?suckseed=4'),
(14, 5, 14, '“คือทำนองแห่งความหลังระหว่างเรา”', 'https://picsum.photos/400/250?suckseed=5');

-- 6. รีสตาร์ทตัวเลข ID (Sequence)
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('movies_id_seq', (SELECT MAX(id) FROM movies));
SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations));
SELECT setval('points_id_seq', (SELECT MAX(id) FROM points));
SELECT setval('scenes_id_seq', (SELECT MAX(id) FROM scenes));

-- 7. ย้ำสิทธิ์การเข้าถึง
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
