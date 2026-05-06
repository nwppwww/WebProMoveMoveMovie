const db = require('./db')
const seed = () => {
  console.log('🌱 Seeding Thai movie data...\n')
  const movies = [
    {
      tmdb_id: 141489, title: 'พี่มาก..พระโขนง',
      poster_path: '/pK265VqPk3sB8WgBYAmBqMPiSBi.jpg',
      overview: 'ภาพยนตร์สยองขวัญสุดฮิตที่เล่าเรื่องราวความรักอันยิ่งใหญ่ของมากและนาค ในยุคสมัยรัชกาลที่ 4 ณ ชุมชนพระโขนง',
      release_year: 2013
    },
    {
      tmdb_id: 441331, title: 'ฉลาดเกมส์โกง',
      poster_path: '/feFrbJeAaKSn2MhGmwYAzVjt6sP.jpg',
      overview: 'เรื่องราวของนักเรียนหญิงฉลาดที่ใช้ความรู้ช่วยเพื่อนโกงข้อสอบ จนนำไปสู่แผนการที่ซับซ้อนในระดับนานาชาติ',
      release_year: 2017
    },
    {
      tmdb_id: 1001311, title: 'How to Make Millions Before Grandma Dies',
      poster_path: '/qGNyhxRiCOU9TJ0r2EDNVj0JMPJ.jpg',
      overview: 'ภาพยนตร์ครอบครัวที่ซาบซึ้งตรึงใจ หลานชายดูแลคุณยายด้วยหวังมรดก แต่สุดท้ายค้นพบความรักแท้จริง',
      release_year: 2024
    },
    {
      tmdb_id: 456408, title: 'แสงกระสือ',
      poster_path: '/rPOKrdjNxMGMOVgjWEZJcpRghUa.jpg',
      overview: 'สยองขวัญที่ถ่ายทอดตำนานผีกระสือแห่งชนบทภาคกลาง ถ่ายทำในทุ่งนาและหมู่บ้านชนบทจริง',
      release_year: 2019
    }
  ]
  const insertMovie = db.prepare(`
    INSERT OR IGNORE INTO movies (tmdb_id, title, poster_path, overview, release_year)
    VALUES (@tmdb_id, @title, @poster_path, @overview, @release_year)
  `)
  movies.forEach(m => {
    insertMovie.run(m)
    console.log(`  🎬 ${m.title} (${m.release_year})`)
  })
  const pimak = db.prepare('SELECT id FROM movies WHERE tmdb_id = 141489').get()
  const badGenius = db.prepare('SELECT id FROM movies WHERE tmdb_id = 441331').get()
  const grandma = db.prepare('SELECT id FROM movies WHERE tmdb_id = 1001311').get()
  const krasue = db.prepare('SELECT id FROM movies WHERE tmdb_id = 456408').get()
  const insertLoc = db.prepare(`
    INSERT OR IGNORE INTO locations (movie_id, name, description, lat, lng)
    VALUES (?, ?, ?, ?, ?)
  `)
  if (pimak) {
    insertLoc.run(pimak.id, 'วัดมหาบุศย์ พระโขนง', 'วัดเก่าแก่ริมคลองพระโขนงอายุกว่า 200 ปี ถ่ายทำฉากสำคัญของพี่มาก บรรยากาศร่มรื่น', 13.7063, 100.6018)
    insertLoc.run(pimak.id, 'คลองพระโขนง', 'คลองที่ใช้ถ่ายทำฉากล่องเรือของมากและนาค บรรยากาศย้อนยุค', 13.7050, 100.6030)
    console.log(`  📍 Added 2 locations for พี่มาก`)
  }
  if (badGenius) {
    insertLoc.run(badGenius.id, 'โรงเรียนสาธิตจุฬาลงกรณ์', 'สถาบันการศึกษาชั้นนำใจกลางกรุงเทพฯ ใช้ถ่ายทำฉากโรงเรียนหลัก', 13.7378, 100.5293)
    console.log(`  📍 Added 1 location for ฉลาดเกมส์โกง`)
  }
  if (grandma) {
    insertLoc.run(grandma.id, 'บ้านทาวน์เฮาส์ ลาดพร้าว', 'ทาวน์เฮาส์ที่ใช้ถ่ายทำบ้านยาย สภาพแวดล้อมชุมชนชานเมืองจริง', 13.8100, 100.6100)
    console.log(`  📍 Added 1 location for How to Make Millions`)
  }
  if (krasue) {
    insertLoc.run(krasue.id, 'ทุ่งนาสุพรรณบุรี', 'ทุ่งนากว้างใหญ่ใช้ถ่ายทำแสงกระสือ บรรยากาศชนบทแท้จริง', 14.4744, 100.1177)
    console.log(`  📍 Added 1 location for แสงกระสือ`)
  }
  console.log('\n✅ Seed complete!')
}
seed()