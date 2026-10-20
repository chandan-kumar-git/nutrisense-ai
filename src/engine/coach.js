import { FOODS, FOOD_BY_ID } from '../data/foods'
import { MEAL_BY_ID } from '../data/meals'
import { NUTRIENT_BY_KEY, fitsDiet, fmt, fmtNutrient, pct, lc } from './nutrition'
import { recommendMeals, topFoodsFor, hashStr, mealTotals, slotForNow } from './recommend'

// Rule-based NLU + template generation over the user's live nutrition data.
// Every reply is grounded in the profile, today's log and the 7-day gap analysis,
// and the wording rotates so repeated questions read differently.

const HINGLISH = /\b(kya|kyu|kyun|hai|hain|mera|meri|mere|mujhe|khau|khaun|khaoon|khana|khaana|batao|bata|kaise|kitna|kitni|nahi|nhi|aaj|raat|accha|acha|chahiye|karu|karo|kar|thoda|bahut|bhi|sakta|sakti|hoga|wala|wali)\b/i

const ALIASES = {
  dal: 'dal_tadka', daal: 'dal_tadka', roti: 'roti', chapati: 'roti', phulka: 'roti', egg: 'boiled_eggs', eggs: 'boiled_eggs', anda: 'boiled_eggs', ande: 'boiled_eggs',
  paneer: 'paneer_tikka', chicken: 'grilled_chicken', rice: 'rice', chawal: 'rice', milk: 'milk', doodh: 'milk', banana: 'banana', kela: 'banana', apple: 'apple', seb: 'apple',
  curd: 'curd', dahi: 'curd', yogurt: 'greek_yogurt', maggi: 'maggi', noodles: 'maggi', biryani: 'chicken_biryani', pizza: 'pizza', burger: 'veg_burger', samosa: 'samosa',
  poha: 'poha', idli: 'idli', dosa: 'masala_dosa', oats: 'oats', rajma: 'rajma', chole: 'chole', chana: 'roasted_chana', makhana: 'makhana', almonds: 'almonds', badam: 'almonds',
  walnut: 'walnuts', akhrot: 'walnuts', dates: 'dates', khajur: 'dates', jaggery: 'jaggery', gur: 'jaggery', chai: 'chai', tea: 'chai', coffee: 'coffee', fish: 'fish_curry',
  salmon: 'salmon', mutton: 'mutton_curry', tofu: 'tofu_stirfry', soya: 'soya_curry', sprouts: 'sprouts', quinoa: 'quinoa_salad', khichdi: 'khichdi', paratha: 'aloo_paratha',
  lassi: 'lassi', chaas: 'chaas', buttermilk: 'chaas', momos: 'veg_momos', fries: 'fries', cola: 'cola', coke: 'cola', 'gulab jamun': 'gulab_jamun', kheer: 'kheer',
  'ice cream': 'ice_cream', chocolate: 'dark_chocolate', guava: 'guava', amrood: 'guava', orange: 'orange', papaya: 'papaya', spinach: 'palak_dal', palak: 'palak_paneer',
  upma: 'upma', dhokla: 'dhokla', 'vada pav': 'vada_pav', 'pav bhaji': 'pav_bhaji', 'pani puri': 'pani_puri', golgappa: 'pani_puri', 'peanut butter': 'pb_toast', avocado: 'avocado_toast',
  'coconut water': 'coconut_water', nariyal: 'coconut_water', whey: 'protein_shake', 'protein shake': 'protein_shake', mushroom: 'mushroom_masala', kadhi: 'kadhi', bhindi: 'bhindi',
}

const NUTRIENT_PATTERNS = [
  ['iron', /\b(iron|anemi\w*|anaemi\w*|haemoglobin|hemoglobin|hb|khoon|loha)\b/i],
  ['protein', /\bprotein\w*\b/i],
  ['vitD', /\b(vitamin\s*d|vit\s*d|d3|sunlight|dhoop|sun)\b/i],
  ['b12', /\b(b12|b-12|vitamin\s*b|cobalamin)\b/i],
  ['calcium', /\b(calcium|bones?|haddi|haddiyan|teeth)\b/i],
  ['fiber', /\b(fib(er|re)|constipat\w*|digestion|pet\s*saaf|bloat\w*)\b/i],
  ['omega3', /\b(omega|healthy fats?|good fats?)\b/i],
  ['vitC', /\b(vitamin\s*c|vit\s*c|immunity|cold|cough)\b/i],
  ['zinc', /\bzinc\b/i],
  ['magnesium', /\b(magnesium|sleep|cramps?)\b/i],
  ['folate', /\b(folate|folic)\b/i],
]

const INTENTS = [
  ['medical', /\b(diabet\w*|sugar level|blood sugar|bp|blood pressure|hypertension|thyroid|pcos|pcod|kidney|liver|cholesterol|heart (disease|problem)|medicine|tablet|dawai|dawa|insulin|pregnan\w*|breastfeed\w*|ulcer|gerd|ibs|allergic reaction)\b/i],
  ['supplement', /\b(supplement\w*|capsule|multivitamin|pills?|tablet le)\b/i],
  ['thanks', /\b(thank\w*|thx|shukriya|dhanyavad|great help|awesome|nice)\b/i],
  ['bye', /\b(bye|good night|see you|tata|alvida)\b/i],
  ['score', /\b(score|why.*(low|high)|explain|how.*(calculat|work))\b/i],
  ['status', /\b(how am i doing|how'?s my day|today|aaj|remaining|left|bacha|bachi|status|progress|summary|report)\b/i],
  ['plan', /\b(meal plan|diet plan|diet chart|week plan|weekly|plan bana\w*|plan)\b/i],
  ['swap', /\b(swap|replace|alternative|instead|substitute|badle|healthier version)\b/i],
  ['lose', /\b(lose|losing|weight loss|fat loss|cut|patla|vajan kam|wajan kam|slim|belly|tummy|pet kam)\b/i],
  ['gain', /\b(gain|bulk|muscle|mass|mota|weight badh\w*|vajan badh\w*)\b/i],
  ['workout', /\b(workout|gym|pre[- ]?workout|post[- ]?workout|exercise|training|run|running|cricket|football)\b/i],
  ['water', /\b(water|hydrat\w*|paani|thirst\w*)\b/i],
  ['sweet', /\b(sweet|dessert|meetha|mithai|craving|crave)\b/i],
  ['late', /\b(late night|midnight|2 ?am|night craving|raat ko bhook)\b/i],
  ['eatout', /\b(restaurant|eating out|eat out|party|outside|zomato|swiggy|order\w*|cafe|dhaba|wedding|shaadi)\b/i],
  ['fasting', /\b(fast|fasting|vrat|upvas|navratri|ramadan|roza|intermittent)\b/i],
  ['energy', /\b(tired|energy|thak\w*|sleepy|lazy|focus|study|exam|concentrat\w*|weak|kamzori)\b/i],
  ['budget', /\b(cheap|budget|sasta|hostel|student|pg|mess|affordable)\b/i],
  ['breakfast', /\b(breakfast|nashta|naashta|subah|morning)\b/i],
  ['lunch', /\b(lunch|dopahar|tiffin|office meal)\b/i],
  ['dinner', /\b(dinner|raat|supper|night meal|tonight)\b/i],
  ['snack', /\b(snack\w*|hungry|bhook|bhookh|munch\w*|evening|nibble)\b/i],
  ['greeting', /^\s*(hi+|hello|hey+|namaste|namaskar|hola|yo|good (morning|afternoon|evening)|sup)\b/i],
  ['whatcan', /\b(what can you do|help|kya kar sakte|features|how to use)\b/i],
]

function variant(arr, seed) {
  return arr[seed % arr.length]
}

// Built once: longest phrases first so "pav bhaji" wins over "pav".
const FOOD_MATCHERS = [...Object.keys(ALIASES), ...FOODS.map((f) => f.name.toLowerCase())]
  .sort((a, b) => b.length - a.length)
  .map((k) => ({
    re: new RegExp(`[^a-z]${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?[^a-z]`),
    id: ALIASES[k] || FOODS.find((f) => f.name.toLowerCase() === k)?.id,
  }))

function findFoods(text) {
  const found = []
  let rest = ` ${text.toLowerCase()} `
  for (const { re, id } of FOOD_MATCHERS) {
    if (re.test(rest)) {
      if (id && !found.includes(id)) found.push(id)
      rest = rest.replace(re, ' ')
    }
  }
  return found.map((id) => FOOD_BY_ID[id]).filter(Boolean)
}

// Nutrients that a single meal can realistically move (vitamin D and omega-3 mostly can't).
const FIXABLE = ['iron', 'protein', 'calcium', 'b12', 'fiber', 'zinc', 'magnesium', 'vitC', 'folate', 'vitD', 'omega3']

// The gap a meal suggestion should target: headline nutrients first, and never one
// that food alone can't move for this diet (vitamin D, omega-3, B12 for vegans).
const HEADLINE = ['iron', 'protein', 'calcium', 'fiber', 'b12']

export function focusGap(gaps, profile) {
  const skip = ['vitD', 'omega3', ...(profile?.diet === 'vegan' ? ['b12'] : [])]
  const low = gaps.filter((g) => g.pct < 80 && !skip.includes(g.key))
  return low.find((g) => HEADLINE.includes(g.key)) || low[0] || gaps.find((g) => g.key === 'protein')
}

function bestKey(totals, targets, preferKey, gaps) {
  if (preferKey && pct(totals[preferKey], targets[preferKey]) >= 8) return preferKey
  const pool = (gaps || []).filter((g) => g.pct < 80).map((g) => g.key)
  const keys = pool.length ? pool : FIXABLE
  return keys.map((k) => [k, pct(totals[k], targets[k])]).sort((a, b) => b[1] - a[1])[0][0]
}

export function mealCard(m, totals, targets, focusKey, gaps) {
  const key = bestKey(totals, targets, focusKey, gaps)
  return {
    kind: 'meal',
    id: m.id,
    title: m.name,
    sub: `${fmt(totals.kcal)} kcal · ${fmt(totals.protein)}g P`,
    badge: `+${pct(totals[key], targets[key])}% ${lc(NUTRIENT_BY_KEY[key].label)}`,
    items: m.items,
  }
}

export function foodCard(f, targets, key) {
  return {
    kind: 'food',
    id: f.id,
    title: f.name,
    sub: `${f.serving} · ${fmt(f.n.kcal)} kcal`,
    badge: key ? `${fmtNutrient(key, f.n[key])}${NUTRIENT_BY_KEY[key].unit} ${lc(NUTRIENT_BY_KEY[key].label)}` : `${fmt(f.n.protein, 1)}g protein`,
    items: [{ foodId: f.id, servings: 1 }],
  }
}

function suggestMeals(ctx, type, { focus, limit = 3, budgetShare } = {}) {
  let budget = budgetShare ? ctx.targets.kcal * budgetShare : Math.max(250, ctx.remaining * 0.6)
  if (ctx.kcalCap) budget = Math.min(budget, ctx.kcalCap)
  let recs = recommendMeals(ctx.profile, ctx.targets, ctx.gaps, { type, limit: ctx.kcalCap ? 12 : limit, kcalBudget: budget, focus, seed: ctx.seed, exclude: ctx.exclude || [] })
  if (ctx.kcalCap) recs = recs.filter((r) => r.totals.kcal <= ctx.kcalCap * 1.08).slice(0, limit)
  const key = focus || focusGap(ctx.gaps, ctx.profile).key
  return recs.map((r) => mealCard(r.meal, r.totals, ctx.targets, key, ctx.gaps))
}

const STATUS_WORD = { good: 'on track', watch: 'a bit low', low: 'low' }

// ------------------------------------------------------------------
function coreReply(message, ctx) {
  const text = message.trim()
  const hi = ctx.allowHinglish !== false && HINGLISH.test(text)
  const seed = (ctx.turn || 0) + hashStr(text)
  ctx = { ...ctx, seed }
  const name = ctx.profile.name?.split(' ')[0] || 'there'
  const topGap = ctx.gaps[0]
  const lowGaps = ctx.gaps.filter((g) => g.pct < 80)
  // a generic dish name resolves to the version that fits the user's diet ("biryani" → veg biryani)
  const foods = findFoods(text).map((f) => (f.id === 'chicken_biryani' && !/chicken/i.test(text) && !fitsDiet(f, ctx.profile) ? FOOD_BY_ID.veg_biryani : f))

  let intent = INTENTS.find(([, re]) => re.test(text))?.[0]
  const nutrientHit = NUTRIENT_PATTERNS.find(([, re]) => re.test(text))?.[0]

  // compare two foods
  if (foods.length >= 2 && /\b(vs|versus|or|ya|better|compare|ki jagah)\b/i.test(text) && intent !== 'medical') {
    return compareFoods(foods[0], foods[1], ctx, hi)
  }
  // nutrient question that mentions a meal ("iron rich dinner") -> meal intent with focus
  if (nutrientHit && ['breakfast', 'lunch', 'dinner', 'snack'].includes(intent)) {
    return mealReply(intent, ctx, hi, nutrientHit)
  }
  if (intent === 'medical') return medicalReply(text, ctx, hi)
  if (intent === 'supplement') return supplementReply(ctx, hi, nutrientHit)
  if (nutrientHit && !['plan', 'status', 'score', 'budget', 'workout', 'lose', 'gain', 'energy', 'fasting', 'eatout', 'late', 'sweet', 'swap'].includes(intent)) return nutrientReply(nutrientHit, ctx, hi)
  if (foods.length >= 1 && (!intent || ['lose', 'gain', 'snack', 'sweet', 'late'].includes(intent) || /\b(calorie|kcal|kitna|kitni|how much|nutrition|healthy|accha|good|bad|kha sakta|can i eat|should i)\b/i.test(text))) {
    if (!['plan', 'status'].includes(intent)) return foodReply(foods[0], ctx, hi, text)
  }

  switch (intent) {
    case 'greeting':
      return {
        intent,
        text: variant(
          [
            `${hi ? 'Namaste' : 'Hey'} ${name}! You have **${fmt(ctx.remaining)} kcal** left today. Your biggest gap this week is **${topGap.label} (${topGap.pct}%)**. Want a meal idea that helps with it?`,
            `Hi ${name} 👋 Today so far: ${fmt(ctx.today.kcal)} kcal and ${fmt(ctx.today.protein)}g protein. Ask me about a meal, a food, or your nutrient gaps.`,
            `${hi ? 'Namaste' : 'Hello'} ${name}! Your weekly nutrition score is **${ctx.weekScore ?? ctx.score}/100**. Want to push it higher? ${focusGap(ctx.gaps, ctx.profile).label} is the quickest win.`,
          ],
          seed,
        ),
        chips: ['What should I eat next?', `Boost my ${lc(topGap.label)}`, 'How am I doing today?'],
      }
    case 'thanks':
      return { intent, text: variant(['Anytime! Small, consistent swaps add up. 🌱', `Happy to help, ${name}. Log your next meal and I'll update your gaps.`, hi ? 'Koi baat nahi! Kal phir check karte hain. 💚' : 'You got it. Keep the streak going! 🔥'], seed), chips: ['Make a meal plan', 'Quick snack'] }
    case 'bye':
      return { intent, text: variant([`Good night ${name}! Aim for 7–8 hours of sleep. It helps appetite control more than people think.`, 'See you! Don’t forget a glass of water before bed.', 'Bye! I’ll have fresh suggestions ready tomorrow.'], seed) }
    case 'whatcan':
      return {
        intent,
        text: 'Here’s what I can help with:\n• **Meal ideas** for breakfast, lunch, snacks and dinner that fit your calories\n• **Nutrient gaps** (iron, vitamin D, B12, protein…) and which foods fix them\n• **Food facts**: “calories in biryani”, “paneer vs chicken”\n• **Weekly meal plans** and smart swaps\n• Weight-loss or muscle-gain guidance\nI give general guidance, not a medical diagnosis.',
        chips: ['Calories in biryani', 'Paneer vs chicken', 'Make a meal plan'],
      }
    case 'status':
      return statusReply(ctx, hi)
    case 'score':
      return scoreReply(ctx, hi)
    case 'plan':
      return {
        intent,
        text: variant(
          [
            `I’ll build a 7-day plan around **${fmt(ctx.targets.kcal)} kcal/day** that targets your gaps (${lowGaps.slice(0, 3).map((g) => g.label).join(', ') || 'overall balance'}). Here’s a preview of tomorrow:`,
            `Planning time! Your plan prioritises ${lowGaps[0]?.label || 'protein'} and stays ${ctx.profile.diet === 'veg' ? 'vegetarian' : ctx.profile.diet === 'vegan' ? 'vegan' : ctx.profile.diet === 'egg' ? 'eggetarian' : 'flexible'}. A sample day:`,
            hi ? `Chalo plan banate hain! Roz ka target ${fmt(ctx.targets.kcal)} kcal. Ek din aisa dikhega:` : `Here’s how a balanced day could look for you at ${fmt(ctx.targets.kcal)} kcal:`,
          ],
          seed,
        ),
        cards: [
          ...suggestMeals(ctx, 'breakfast', { limit: 1, budgetShare: 0.25 }),
          ...suggestMeals(ctx, 'main', { limit: 1, budgetShare: 0.35 }),
          ...suggestMeals(ctx, 'snack', { limit: 1, budgetShare: 0.1 }),
        ],
        actions: [{ label: 'Open full 7-day plan', to: '/plan' }],
      }
    case 'swap':
      return swapReply(ctx, hi)
    case 'lose':
      return goalReply('lose', ctx, hi)
    case 'gain':
      return goalReply('gain', ctx, hi)
    case 'workout':
      return workoutReply(ctx, hi, text)
    case 'water':
      return {
        intent,
        text: variant(
          [
            `You’ve had **${ctx.water} of ${ctx.targets.water} glasses** today. ${ctx.water >= ctx.targets.water ? 'Nice, you’re there! 💧' : `Just ${ctx.targets.water - ctx.water} more to go. Keep a bottle at your desk.`}`,
            `Your target is about ${ctx.targets.water} glasses (≈${fmt(ctx.profile.weightKg * 35)} ml) based on your weight. Coconut water, chaas and lime water count too.`,
            hi ? `Aaj ${ctx.water} glass paani hua hai. Target ${ctx.targets.water} hai, thoda aur piyo! 💧` : `Tip: thirst is often mistaken for hunger. Have a glass of water before your next snack. You’re at ${ctx.water}/${ctx.targets.water}.`,
          ],
          seed,
        ),
        actions: [{ label: 'Log a glass', do: 'water+1' }],
      }
    case 'sweet':
      return {
        intent,
        text: variant(
          [
            'Sweet craving? These satisfy it without a sugar crash:',
            hi ? 'Meetha khana hai? Ye options better hain:' : 'Totally normal! Pair something sweet with protein or fiber so it doesn’t spike your blood sugar:',
            'Try these first. If you still want a dessert, have a small portion after a meal rather than on an empty stomach.',
          ],
          seed,
        ),
        cards: ['dates', 'dark_chocolate', 'fruit_bowl', 'greek_yogurt'].map((id) => FOOD_BY_ID[id]).filter((f) => fitsDiet(f, ctx.profile)).slice(0, 3).map((f) => foodCard(f, ctx.targets)),
      }
    case 'late':
      return {
        intent,
        text: variant(['Late-night hunger? Keep it light and protein-forward:', 'If it’s real hunger (not boredom), these won’t disturb your sleep:', hi ? 'Raat ko bhook lage toh ye try karo:' : 'Something small and warm works best at night:'], seed),
        cards: ['milk', 'makhana', 'greek_yogurt', 'almonds', 'chaas'].map((id) => FOOD_BY_ID[id]).filter((f) => fitsDiet(f, ctx.profile)).slice(0, 3).map((f) => foodCard(f, ctx.targets)),
        tips: ['Avoid fried snacks and caffeine after 9 PM.'],
      }
    case 'eatout':
      return {
        intent,
        text: variant(
          [
            'Eating out? A few rules that keep it balanced:\n• Start with a salad or soup\n• Pick **tandoori/grilled** over butter/cream gravies\n• Choose **roti over naan**, and share the rice\n• Skip the sugary drink (that’s about 140 kcal saved)',
            'Restaurant strategy:\n• Order dal or a dry protein (tikka, tandoori) as your main\n• One carb, not three (naan + rice + fries adds up fast)\n• Ask for less oil and butter\n• Dessert? Split it.',
            hi ? 'Bahar khana hai? Tandoori/tikka lo, gravy kam, roti > naan, aur cold drink skip karo. Simple!' : 'Party mode tips: eat a protein snack before you go, fill half your plate with salad/tikka, and alternate drinks with water.',
          ],
          seed,
        ),
        cards: ['tandoori_chicken', 'paneer_tikka', 'dal_tadka', 'green_salad'].map((id) => FOOD_BY_ID[id]).filter((f) => fitsDiet(f, ctx.profile)).slice(0, 2).map((f) => foodCard(f, ctx.targets)),
      }
    case 'fasting':
      return {
        intent,
        text: variant(
          [
            'Fasting-friendly picks that keep energy steady: makhana, fruit, curd, coconut water and nuts. Break your fast with something light (fruit and curd) before a heavy meal.',
            'If you’re fasting, protein and fluids matter most. Have curd, paneer, nuts and plenty of water. Avoid breaking the fast with fried food.',
            'For intermittent fasting, make the first meal protein-rich (eggs, paneer, dal) and don’t drop below your protein target overall.',
          ],
          seed,
        ),
        cards: ['makhana', 'curd', 'coconut_water', 'fruit_bowl'].map((id) => FOOD_BY_ID[id]).filter((f) => fitsDiet(f, ctx.profile)).slice(0, 3).map((f) => foodCard(f, ctx.targets)),
        tips: ['If you have a medical condition, check with a doctor before extended fasting.'],
      }
    case 'energy':
      return {
        intent,
        text: variant(
          [
            `Feeling low on energy can link to **iron** (yours is ${ctx.gapMap.iron}% this week) and **B12** (${ctx.gapMap.b12}%), as well as sleep and hydration. Food-wise, these help:`,
            `Study mode fuel 🧠: steady carbs plus protein beats sugar spikes. Your hydration today is ${ctx.water}/${ctx.targets.water} glasses, and topping that up helps focus too.`,
            hi ? `Thakaan lag rahi hai? Iron (${ctx.gapMap.iron}%) aur B12 (${ctx.gapMap.b12}%) check karo, aur paani piyo. Ye foods madad karenge:` : 'For steady energy: don’t skip breakfast, add protein to every meal and keep snacks whole-food based.',
          ],
          seed,
        ),
        cards: suggestMeals(ctx, 'snack', { focus: ctx.gapMap.iron < ctx.gapMap.b12 ? 'iron' : 'b12', limit: 2 }),
        tips: ['If tiredness persists for weeks, see a doctor. A simple blood test can check iron and B12 levels.'],
      }
    case 'budget':
      return {
        intent,
        text: variant(
          [
            'Budget-friendly nutrition all-stars 💸: **roasted chana, eggs, dal, soya chunks, peanuts, seasonal fruit, curd**. These cost under ₹20 a serving and are rich in protein and iron.',
            'Hostel or mess hack: add a bowl of curd and a handful of roasted chana to your mess thali. That’s about 13 g of protein for around ₹15.',
            'Cheapest protein per rupee in India: soya chunks > eggs > dal/chana > milk/curd > paneer. Mix two of them every day.',
          ],
          seed,
        ),
        cards: ['roasted_chana', 'soya_curry', 'boiled_eggs', 'sprouts'].map((id) => FOOD_BY_ID[id]).filter((f) => fitsDiet(f, ctx.profile)).slice(0, 3).map((f) => foodCard(f, ctx.targets, 'protein')),
      }
    case 'breakfast':
    case 'lunch':
    case 'dinner':
    case 'snack':
      return mealReply(intent, ctx, hi)
    default:
      break
  }

  // "what should I eat" style
  if (/\b(eat|khau|khaun|khaoon|khana|suggest|recommend|idea|next meal)\b/i.test(text)) {
    const slot = slotForNow()
    return mealReply(slot === 'lunch' || slot === 'dinner' ? slot : slot === 'snack' ? 'snack' : 'breakfast', ctx, hi)
  }

  return {
    intent: 'fallback',
    text: variant(
      [
        `I’m not sure I got that, ${name}. I’m best at meals, foods and nutrients. Try one of these:`,
        hi ? 'Hmm, ye samajh nahi aaya. Aise puchho:' : 'I can help with meal ideas, food facts and your nutrient gaps. For example:',
        'I didn’t quite catch that. Try asking about a food, a meal or a nutrient:',
      ],
      seed,
    ),
    chips: ['What should I eat for dinner?', `Foods high in ${lc(topGap.label)}`, 'Calories in paneer', 'How am I doing today?'],
  }
}

// ------------------------------------------------------------------
export function mealReply(slot, ctx, hi, focus) {
  const type = slot === 'breakfast' ? 'breakfast' : slot === 'snack' ? 'snack' : 'main'
  const f = focus || focusGap(ctx.gaps, ctx.profile).key
  const fl = lc(NUTRIENT_BY_KEY[f].label)
  const share = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 }[slot]
  const cards = suggestMeals(ctx, type, { focus: f, limit: 3, budgetShare: Math.max(share, Math.min(0.45, ctx.remaining / ctx.targets.kcal)) })
  const labels = { breakfast: 'breakfasts', lunch: 'lunches', dinner: 'dinners', snack: 'snacks' }
  const single = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
  const intro = variant(
    [
      `Here are ${fl}-rich ${labels[slot]} that fit your **${fmt(ctx.remaining)} kcal** left:`,
      hi ? `Aapka ${fl} ${STATUS_WORD[ctx.gapStatus[f]] || 'low'} hai, toh ye ${labels[slot]} try karo:` : `Your ${fl} is ${STATUS_WORD[ctx.gapStatus[f]] || 'low'} this week (${ctx.gapMap[f]}%). These ${labels[slot]} help close the gap:`,
      `Picked for you: ${ctx.profile.diet === 'veg' ? 'vegetarian ' : ctx.profile.diet === 'vegan' ? 'vegan ' : ''}${labels[slot]} ranked by how much they boost your ${fl}, within your calories.`,
      `${single[slot]} ideas, ranked for your ${fl} gap and ${fmt(ctx.targets.protein)} g protein goal:`,
    ],
    ctx.seed,
  )
  const tipPool = {
    iron: ['Add lemon or have a vitamin-C fruit with these. It can double plant-iron absorption.', 'Avoid tea or coffee within an hour of iron-rich meals, because tannins block absorption.', 'Cooking in a cast-iron kadhai adds a little extra iron too.'],
    vitD: ['15–20 minutes of morning sunlight (arms exposed) is the best vitamin D source.', 'Choose fortified milk or curd, and sun-dried (UV) mushrooms.'],
    b12: ['Vegetarian? Dairy is your main B12 source, so include 2–3 servings a day.', 'If you’re vegan, B12-fortified foods or a supplement (ask a doctor) are usually needed.'],
    protein: ['Aim for 20–30 g of protein per meal rather than all at dinner.', 'Dal + rice together gives a complete protein profile.'],
    calcium: ['Ragi has about 10× the calcium of rice. Try ragi roti or dosa.', 'Pair calcium foods with vitamin D for absorption.'],
    fiber: ['Increase fiber gradually and drink more water alongside.', 'Keep the skin on fruits and pick whole grains.'],
  }
  return {
    intent: slot,
    text: intro,
    cards,
    tips: tipPool[f] ? [variant(tipPool[f], ctx.seed)] : undefined,
    chips: [slot === 'dinner' ? 'Quick snack' : 'What about dinner?', 'Make a meal plan', 'Swap my lunch'],
  }
}

function nutrientReply(key, ctx, hi) {
  const n = NUTRIENT_BY_KEY[key]
  const p = ctx.gapMap[key]
  const st = ctx.gapStatus[key]
  const sources = topFoodsFor(key, ctx.profile, { limit: 4 })
  const target = ctx.targets[key]
  const intro = variant(
    [
      `**${n.label}**: you’re averaging **${p}%** of your ${fmtNutrient(key, target)} ${n.unit} daily need (${STATUS_WORD[st]}). ${n.why}`,
      hi ? `Aapka ${n.label} is hafte ${p}% hai, jo ${st === 'good' ? 'theek hai 👍' : 'kam hai'}. Target ${fmtNutrient(key, target)} ${n.unit}/day. Best sources:` : `Your ${lc(n.label)} intake is at ${p}% of target this week. ${st === 'good' ? 'Nice work. Keep these foods in rotation:' : 'Here are the most efficient foods for your diet to close the gap:'}`,
      `Why ${n.label} matters: ${n.why} Your 7-day average covers ${p}% of your ${fmtNutrient(key, target)} ${n.unit} target.`,
    ],
    ctx.seed,
  )
  const extra = {
    iron: 'Plant iron absorbs better with vitamin C (lemon, amla, guava), so skip chai with meals.',
    vitD: 'Sunlight is the main source: 15–20 min of morning sun on your arms. Food alone rarely covers it.',
    b12: ctx.profile.diet === 'vegan' ? 'On a vegan diet, B12 almost always needs fortified foods or a supplement. Ask your doctor.' : 'Dairy and eggs are the easiest vegetarian B12 sources.',
    protein: `Spread it out: about ${Math.round(ctx.targets.protein / 3.5)} g per meal works better than one big serving.`,
    calcium: 'Ragi, curd, paneer, tofu and sesame are calcium powerhouses.',
    fiber: 'Whole grains, dals, sprouts and fruit with the skin on. Drink more water as you increase fiber.',
    omega3: ctx.profile.diet === 'nonveg' ? 'Fatty fish twice a week covers most needs.' : 'Walnuts, chia and flax seeds are your plant omega-3 sources.',
    vitC: 'Amla, guava and oranges beat most supplements for vitamin C.',
    magnesium: 'Nuts, seeds, whole grains and leafy greens are the top sources.',
    zinc: 'Pumpkin seeds, chickpeas and dairy help with zinc.',
    folate: 'Leafy greens, dals and sprouts are rich in folate.',
  }[key]
  return {
    intent: 'nutrient',
    text: intro,
    cards: sources.slice(0, 3).map((f) => foodCard(f, ctx.targets, key)),
    tips: extra ? [extra] : undefined,
    actions: [{ label: 'Open nutrient profile', to: '/nutrients' }],
    chips: [`${n.label}-rich dinner`, 'Make a meal plan'],
  }
}

function foodReply(food, ctx, hi, text) {
  const qty = Number((text.match(/\b(\d+(?:\.\d+)?)\s*(?:x\s*)?(?:pcs?|pieces?|plates?|bowls?|cups?|glass(?:es)?|slices?)?\s*[a-z]/i) || [])[1])
  const units = parseFloat(food.serving) || 1
  const mult = qty > 0 && qty <= 20 ? qty / units : 1
  const n = Object.fromEntries(Object.entries(food.n).map(([k, v]) => [k, v * mult]))
  const ok = fitsDiet(food, ctx.profile)
  const best = ['protein', 'fiber', 'iron', 'calcium', 'vitD', 'b12', 'vitC']
    .map((k) => ({ k, p: pct(n[k], ctx.targets[k]) }))
    .sort((a, b) => b.p - a.p)
  const strong = best.filter((b) => b.p >= 12).slice(0, 2)
  const share = pct(n.kcal, ctx.targets.kcal)
  const junk = ['junk', 'dessert'].includes(food.category)
  const canEat = /\b(can i|should i|kha sakta|kha sakti|healthy|good|bad|accha)\b/i.test(text)
  let verdict
  if (!ok) verdict = `Heads up: this doesn’t match your ${ctx.profile.diet === 'veg' ? 'vegetarian' : ctx.profile.diet} preference or allergy settings.`
  else if (junk) verdict = variant([`It’s fine occasionally. It would use ${share}% of your daily calories with little micronutrient value.`, `Treat food! Have it after a protein-rich meal, and maybe skip the sugary drink with it.`, hi ? `Kabhi kabhi chalega 😄. Ye ${share}% calories le lega aapke din ka.` : `Enjoy it mindfully. Balance the rest of the day with veggies and protein.`], ctx.seed)
  else if (strong.length) verdict = `A good pick: it gives ${strong.map((s) => `**${s.p}%** of your ${lc(NUTRIENT_BY_KEY[s.k].label)}`).join(' and ')} need.`
  else verdict = 'A reasonable choice. Pair it with a protein or veggie side for balance.'
  const remainingAfter = ctx.remaining - n.kcal
  return {
    intent: 'food',
    text: `**${food.name}** (${mult !== 1 ? `${qty} × ${food.serving.replace(/^\d+\s*/, '').replace(/s$/, '') || 'serving'}` : food.serving}, ~${Math.round(food.grams * mult)} g): **${fmt(n.kcal)} kcal**, ${fmt(n.protein, 1)} g protein, ${fmt(n.carbs)} g carbs, ${fmt(n.fat, 1)} g fat, ${fmt(n.fiber, 1)} g fiber.\n${verdict}${canEat && ok ? `\nIf you have it now you’ll have **${fmt(Math.max(0, remainingAfter))} kcal** left today.` : ''}`,
    cards: [foodCard(food, ctx.targets, strong[0]?.k)],
    actions: [{ label: 'View full nutrition', to: `/food/${food.id}` }],
    chips: ['Healthier alternative?', 'What should I eat for dinner?'],
  }
}

function compareFoods(a, b, ctx, hi) {
  const rows = ['kcal', 'protein', 'fiber', 'iron', 'calcium', 'fat']
  const per100 = (f, k) => (f.n[k] / f.n.kcal) * 100
  const winsA = ['protein', 'fiber', 'iron', 'calcium'].filter((k) => per100(a, k) > per100(b, k)).length
  const winner = winsA >= 2 ? a : b
  const gapKey = ctx.gaps[0].key
  const table = rows.map((k) => `• ${k === 'kcal' ? 'Calories' : NUTRIENT_BY_KEY[k]?.label || 'Fat'}: ${fmtNutrient(k, a.n[k])} vs ${fmtNutrient(k, b.n[k])}${k === 'kcal' ? '' : k === 'iron' || k === 'calcium' ? ' mg' : ' g'}`).join('\n')
  return {
    intent: 'compare',
    text: `**${a.name}** (${a.serving}) vs **${b.name}** (${b.serving}):\n${table}\n${hi ? `Mere hisaab se **${winner.name}** better hai` : `Calorie for calorie, **${winner.name}** gives more nutrition`}. Your current gap is ${lc(ctx.gaps[0].label)}, so ${a.n[gapKey] >= b.n[gapKey] ? a.name : b.name} helps more there.`,
    cards: [foodCard(a, ctx.targets, 'protein'), foodCard(b, ctx.targets, 'protein')],
  }
}

function statusReply(ctx, hi) {
  const t = ctx.today
  const lines = [
    `Calories: **${fmt(t.kcal)} / ${fmt(ctx.targets.kcal)}** (${fmt(ctx.remaining)} left)`,
    `Protein: **${fmt(t.protein)} / ${ctx.targets.protein} g**`,
    `Water: **${ctx.water} / ${ctx.targets.water}** glasses`,
    `Score: **${ctx.score}/100** today · ${ctx.weekScore ?? '–'} weekly`,
  ]
  const low = ctx.gaps.filter((g) => g.pct < 50).map((g) => g.label)
  const advice = variant(
    [
      low.length ? `This week, focus on **${low.slice(0, 2).join(' and ')}**.` : 'Your weekly nutrients look balanced. Great consistency!',
      t.protein < ctx.targets.protein * 0.5 ? 'Protein is lagging today, so make your next meal protein-forward.' : 'Protein pacing looks good so far.',
      ctx.remaining < 0 ? 'You’re over your calorie target today. Keep dinner light and veggie-heavy.' : `You have room for a solid ${ctx.remaining > 600 ? 'meal' : 'snack'} still.`,
    ],
    ctx.seed,
  )
  return {
    intent: 'status',
    text: `${hi ? 'Aaj ka summary' : 'Here’s your day so far'}:\n${lines.join('\n')}\n${advice}`,
    actions: [{ label: 'See progress', to: '/progress' }],
    chips: ['What should I eat next?', 'Explain my score'],
  }
}

function scoreReply(ctx, hi) {
  const best = [...ctx.gaps].reverse().slice(0, 2)
  return {
    intent: 'score',
    text: `Your **weekly score is ${ctx.weekScore ?? ctx.score}/100** (today so far: ${ctx.score}). Each day’s score combines two things:\n• **70% nutrient adequacy**: how close you are to targets for 11 nutrients, with protein and iron weighted higher\n• **30% calorie fit**: how close you are to ${fmt(ctx.targets.kcal)} kcal\nStrongest this week: ${best.map((b) => `${b.label} (${b.pct}%)`).join(', ')}. Weakest: ${ctx.gaps.slice(0, 2).map((b) => `${b.label} (${b.pct}%)`).join(', ')}. Fixing the weakest gives the biggest jump.`,
    actions: [{ label: 'How the AI works', to: '/how-it-works' }],
  }
}

function swapReply(ctx, hi) {
  const lunch = ctx.todayEntries.filter((e) => e.slot === 'lunch')
  const base = lunch.length ? lunch : ctx.todayEntries
  const nameOf = base[0]?.groupName
  const cards = suggestMeals(ctx, 'main', { limit: 3, budgetShare: 0.35 })
  return {
    intent: 'swap',
    text: variant(
      [
        nameOf ? `Instead of **${nameOf}**, these give you more ${lc(ctx.gaps[0].label)} for similar calories:` : 'Here are swaps that close your nutrient gaps for similar calories:',
        hi ? 'Ye options try karo, same calories mein zyada nutrition:' : 'Smart swaps ranked by nutrient gain:',
        'Swapping one meal a day is the easiest way to raise your score. Try:',
      ],
      ctx.seed,
    ),
    cards,
    tips: [variant(['Brown rice instead of white adds fiber and keeps you full longer.', 'Add a bowl of palak or salad to any thali for iron and fiber.', 'Swap one roti for a bowl of dal to add protein.'], ctx.seed)],
  }
}

function goalReply(goal, ctx, hi) {
  const cards = goal === 'lose' ? suggestMeals(ctx, 'main', { focus: 'protein', limit: 3, budgetShare: 0.28 }) : suggestMeals(ctx, 'any', { focus: 'protein', limit: 3, budgetShare: 0.4 })
  const tdee = ctx.targets.tdee
  const text =
    goal === 'lose'
      ? variant(
          [
            `For steady fat loss, aim for about **${fmt(tdee - 450)} kcal/day** (≈450 below your ${fmt(tdee)} maintenance). That’s roughly 0.4 kg a week. Keep protein high (${Math.round(ctx.profile.weightKg * 1.2)} g) to protect muscle. High-protein, high-volume meals:`,
            hi ? `Weight kam karna hai? Roz ~${fmt(tdee - 450)} kcal, protein zyada, aur meetha/fried kam. Ye meals filling hain:` : 'Three habits matter most: protein at every meal, veggies filling half the plate, and fewer liquid calories (juices, sodas, sweet chai). Try:',
            'No crash diets: a 15–20% deficit is sustainable. Walk 7–8k steps and sleep 7+ hours. These meals keep you full:',
          ],
          ctx.seed,
        )
      : variant(
          [
            `For lean muscle gain, eat about **${fmt(tdee + 300)} kcal/day** with **${Math.round(ctx.profile.weightKg * 1.6)} g protein**, plus strength training 3–4×/week. Calorie-dense, protein-rich picks:`,
            hi ? `Muscle banana hai? ${Math.round(ctx.profile.weightKg * 1.6)}g protein roz, aur 4–5 meals. Ye try karo:` : 'Muscle gain = progressive training + a small calorie surplus + enough protein. Easy adds: milk, paneer, eggs, peanuts, banana shakes.',
            'Add one extra mini-meal (shake, PB toast, paneer roll) and spread protein across 4 meals. Ideas:',
          ],
          ctx.seed,
        )
  return { intent: goal, text, cards, chips: ['Make a meal plan', 'Post-workout meal?'] }
}

function workoutReply(ctx, hi, text) {
  const post = /post|after|baad/i.test(text)
  const pre = /pre|before|pehle/i.test(text)
  const ids = pre ? ['banana', 'pb_toast', 'dates', 'coffee', 'oats'] : ['protein_shake', 'boiled_eggs', 'greek_yogurt', 'paneer_tikka', 'sprouts', 'smoothie']
  return {
    intent: 'workout',
    text: pre
      ? 'Pre-workout (60–90 min before): easy carbs plus a little protein, low fat and fiber:'
      : post
        ? 'Post-workout (within ~2 hours): 20–30 g protein plus some carbs to refill glycogen:'
        : variant(['Training day nutrition: carbs before, protein after, water throughout. Good options:', `On workout days your needs rise to about ${fmt(ctx.targets.kcal + 200)} kcal. Protein-rich recovery foods:`, hi ? 'Gym ke baad protein zaroori hai. Ye options:' : 'Fuel smart around workouts:'], ctx.seed),
    cards: ids.map((id) => FOOD_BY_ID[id]).filter((f) => fitsDiet(f, ctx.profile)).slice(0, 3).map((f) => foodCard(f, ctx.targets, 'protein')),
  }
}

function medicalReply(text, ctx, hi) {
  const t = text.toLowerCase()
  let topic = 'your condition'
  let general = 'Balanced meals with whole grains, vegetables, dal and fruit are a safe base for most people.'
  if (/diabet|sugar|insulin/.test(t)) {
    topic = 'blood sugar'
    general = 'General guidance often includes high-fiber whole grains, pairing carbs with protein, limiting sugary drinks and sweets, and regular meal timing.'
  } else if (/bp|pressure|hypertension/.test(t)) {
    topic = 'blood pressure'
    general = 'General guidance often includes less salt and packaged food, more fruits and vegetables (potassium) and regular activity.'
  } else if (/pcos|pcod/.test(t)) {
    topic = 'PCOS'
    general = 'General guidance often emphasises protein and fiber at each meal, fewer refined carbs and regular exercise.'
  } else if (/thyroid/.test(t)) {
    topic = 'thyroid health'
    general = 'Iodised salt, adequate protein and a balanced diet are commonly advised. Medicine timing around meals matters, so ask your doctor.'
  } else if (/pregnan|breastfeed/.test(t)) {
    topic = 'pregnancy / breastfeeding'
    general = 'Nutrient needs (iron, folate, calcium, protein) rise significantly. Your obstetrician will tailor them and may prescribe supplements.'
  } else if (/cholesterol|heart/.test(t)) {
    topic = 'heart health'
    general = 'General guidance often includes more fiber (oats, dal), omega-3 sources, nuts, and fewer fried and processed foods.'
  } else if (/kidney|liver/.test(t)) {
    topic = 'kidney or liver health'
    general = 'Protein, potassium and sodium needs can change a lot with these conditions, so this really needs a doctor or dietitian.'
  }
  return {
    intent: 'medical',
    text: `${hi ? 'Ye ek medical topic hai.' : 'That’s a medical topic, so I’ll be careful here.'} I can’t diagnose or manage **${topic}**, and my targets are estimates for healthy adults.\n${general}\nPlease talk to a **doctor or registered dietitian** for advice that fits your reports and medicines.`,
    tips: ['NutriSense AI gives general nutrition guidance. It is not a medical diagnosis system.'],
    actions: [{ label: 'Read medical disclaimer', to: '/privacy' }],
    boundary: true,
  }
}

function supplementReply(ctx, hi, key) {
  const k = key || ctx.gaps[0].key
  const n = NUTRIENT_BY_KEY[k]
  return {
    intent: 'supplement',
    text: `I can’t recommend supplements or doses. That’s for a doctor, ideally after a blood test. Food-first, your ${lc(n.label)} is at **${ctx.gapMap[k]}%**, and these foods can help:`,
    cards: topFoodsFor(k, ctx.profile, { limit: 3 }).map((f) => foodCard(f, ctx.targets, k)),
    tips: ['Vitamin D and B12 are the two nutrients where doctors most often suggest supplements in India.'],
    boundary: true,
  }
}

export const STARTER_CHIPS = ['Make a meal plan', 'Quick snack', 'Swap my lunch', 'How am I doing today?', 'Iron-rich dinner', 'Calories in biryani', 'Paneer vs chicken', 'I want to lose weight']

export function mealCardTotals(card) {
  if (card.kind === 'meal') return mealTotals(MEAL_BY_ID[card.id])
  return FOOD_BY_ID[card.id].n
}

export { coreReply, findFoods, HINGLISH, ALIASES, suggestMeals }
