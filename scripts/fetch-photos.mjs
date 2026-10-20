// Downloads one free-licensed food photo per food from Wikimedia Commons into public/food/
// and writes src/data/photoCredits.json. Run: node scripts/fetch-photos.mjs [ids...]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const Q = {
  poha: 'poha breakfast', upma: 'upma', idli: 'idli sambar', dosa: 'plain dosa', masala_dosa: 'masala dosa', sambar: 'sambar bowl', coconut_chutney: 'coconut chutney',
  aloo_paratha: 'aloo paratha', paneer_paratha: 'paneer paratha', besan_chilla: 'besan chilla', moong_chilla: 'moong dal chilla', oats: 'oatmeal porridge bowl',
  boiled_eggs: 'boiled eggs halved', omelette: 'vegetable omelette', egg_bhurji: 'egg bhurji', toast: 'buttered toast', pb_toast: 'peanut butter toast', avocado_toast: 'avocado toast',
  cereal: 'cornflakes milk bowl', chia_pudding: 'chia pudding', tofu_scramble: 'tofu scramble', methi_thepla: 'thepla', dalia: 'dalia porridge', ragi_roti: 'ragi roti',
  smoothie: 'banana smoothie', sprouts: 'sprouts salad', banana: 'bananas', apple: 'red apple fruit', orange: 'orange fruit', papaya: 'papaya cut', guava: 'guava fruit',
  fruit_bowl: 'fruit salad bowl', milk: 'glass of milk', curd: 'dahi curd bowl', chaas: 'chaas buttermilk', lassi: 'lassi glass', chai: 'masala chai', coffee: 'black coffee cup',
  greek_yogurt: 'greek yogurt bowl', coconut_water: 'tender coconut water', lime_water: 'nimbu pani', cola: 'cola glass ice', protein_shake: 'protein shake',
  dal_tadka: 'dal tadka', palak_dal: 'dal palak', rajma: 'rajma', chole: 'chana masala', kadhi: 'kadhi pakora', palak_paneer: 'palak paneer', paneer_butter_masala: 'paneer butter masala',
  paneer_tikka: 'paneer tikka', mixed_veg: 'mixed vegetable curry', bhindi: 'bhindi masala', aloo_gobi: 'aloo gobi', baingan_bharta: 'baingan bharta', mushroom_masala: 'mushroom masala',
  sarson_saag: 'sarson ka saag', soya_curry: 'soya chunks curry', tofu_stirfry: 'tofu stir fry', khichdi: 'khichdi', curd_rice: 'curd rice', veg_biryani: 'vegetable biryani',
  veg_pulao: 'veg pulao', quinoa_salad: 'quinoa salad', hummus_veggies: 'hummus vegetables', tomato_soup: 'tomato soup bowl', green_salad: 'green salad bowl',
  roti: 'chapati', makki_roti: 'makki di roti', rice: 'steamed white rice bowl', jeera_rice: 'jeera rice', brown_rice: 'brown rice bowl',
  egg_curry: 'egg curry', chicken_curry: 'chicken curry indian', butter_chicken: 'butter chicken', grilled_chicken: 'grilled chicken breast', tandoori_chicken: 'tandoori chicken',
  chicken_biryani: 'chicken biryani', mutton_curry: 'mutton curry', fish_curry: 'fish curry indian', fish_fry: 'fish fry', salmon: 'grilled salmon', prawn_curry: 'prawn curry',
  chicken_quinoa: 'chicken quinoa bowl', caesar_salad: 'caesar salad', egg_sandwich: 'egg sandwich', chicken_momos: 'momos', chicken_burger: 'chicken burger',
  roasted_chana: 'roasted chickpeas', makhana: 'makhana', almonds: 'almonds', walnuts: 'walnuts', peanut_chikki: 'chikki', dates: 'dates fruit', jaggery: 'jaggery',
  dark_chocolate: 'dark chocolate', dhokla: 'dhokla', bhel: 'bhel puri', veg_sandwich: 'grilled sandwich', veg_momos: 'steamed momos',
  samosa: 'samosa', vada_pav: 'vada pav', pani_puri: 'pani puri', pav_bhaji: 'pav bhaji', chole_bhature: 'chole bhature', pizza: 'margherita pizza', veg_burger: 'veggie burger',
  fries: 'french fries', pasta_white: 'alfredo pasta', pasta_red: 'penne arrabbiata', maggi: 'instant noodles bowl', hakka_noodles: 'hakka noodles', fried_rice: 'vegetable fried rice',
  gulab_jamun: 'gulab jamun', kheer: 'kheer', ice_cream: 'ice cream scoop',
}

const UA = 'NutriSenseIDP/1.0 (student project; offline demo)'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'food')
const creditsFile = path.join(root, 'src', 'data', 'photoCredits.json')
fs.mkdirSync(outDir, { recursive: true })
const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')) : {}
const strip = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const skipArg = process.argv.find((a) => a.startsWith('--skip='))
const skip = skipArg ? Number(skipArg.split('=')[1]) : 0
const missing = process.argv.includes('--missing')
const ids = (only.length ? only : Object.keys(Q)).filter((id) => !missing || !fs.existsSync(path.join(outDir, `${id}.jpg`)))

for (const id of ids) {
  const q = (process.env.Q && only.length === 1 ? process.env.Q : Q[id])
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent('filetype:bitmap ' + q)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=900&format=json`
  try {
    let j
    for (let t = 0; t < 6; t++) {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      const txt = await res.text()
      if (txt.startsWith('{')) { j = JSON.parse(txt); break }
      await sleep(5000 * (t + 1))
    }
    if (!j) { console.log('RATE', id); continue }
    const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index)
    const ok = pages.filter((p) => {
      const ii = p.imageinfo?.[0]
      if (!ii || ii.mime !== 'image/jpeg') return false
      const r = ii.width / ii.height
      return ii.width >= 900 && r > 0.75 && r < 1.9
    })
    const pick = ok[skip] || ok[0]
    if (!pick) { console.log('MISS', id, q); continue }
    const ii = pick.imageinfo[0]
    const img = await fetch(ii.thumburl, { headers: { 'User-Agent': UA } })
    if (!img.ok) { console.log('FAIL', id, img.status); continue }
    fs.writeFileSync(path.join(outDir, `${id}.jpg`), Buffer.from(await img.arrayBuffer()))
    const m = ii.extmetadata || {}
    credits[id] = { title: pick.title.replace(/^File:/, ''), author: strip(m.Artist?.value) || 'Unknown', license: strip(m.LicenseShortName?.value), source: ii.descriptionurl }
    console.log('OK  ', id.padEnd(20), credits[id].license.padEnd(14), pick.title)
  } catch (e) {
    console.log('ERR ', id, e.message)
  }
  await sleep(1500)
}
fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 1))
