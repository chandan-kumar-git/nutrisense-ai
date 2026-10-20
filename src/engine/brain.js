import { FOODS, FOOD_BY_ID } from '../data/foods'
import { NUTRIENT_BY_KEY, NUTRIENTS, bmi, bmiCategory, fitsDiet, fmt, lc, sumEntries } from './nutrition'
import { hashStr, slotForNow, topFoodsFor } from './recommend'
import { coreReply, findFoods, mealReply, foodCard, focusGap, HINGLISH, ALIASES } from './coach'

// Conversation layer in front of the rule engine: cleans the text, understands
// follow-ups ("ok", "more", "no"), handles extra question types, and replaces
// "I didn't get that" with a useful next step.

const TYPOS = {
  protien: 'protein', protine: 'protein', proteen: 'protein', prtein: 'protein',
  calries: 'calories', calroies: 'calories', calory: 'calories', calorie: 'calories', cals: 'calories', kcals: 'kcal',
  diner: 'dinner', dinnar: 'dinner', dinnr: 'dinner', brekfast: 'breakfast', breakfst: 'breakfast', brakfast: 'breakfast', bfast: 'breakfast', lunh: 'lunch', luch: 'lunch',
  vitamine: 'vitamin', vitamines: 'vitamins', vitmin: 'vitamin', vitmins: 'vitamins', vit: 'vitamin', iorn: 'iron', calcuim: 'calcium', calcim: 'calcium', fibre: 'fiber',
  wieght: 'weight', weigth: 'weight', wait: 'weight', helthy: 'healthy', healty: 'healthy', suger: 'sugar', shugar: 'sugar', snaks: 'snacks', snak: 'snack',
  plz: 'please', pls: 'please', u: 'you', ur: 'your', r: 'are', wat: 'what', wht: 'what', hw: 'how', gud: 'good', gd: 'good', nd: 'and',
}

const VOCAB = ['breakfast', 'lunch', 'dinner', 'snack', 'snacks', 'protein', 'calcium', 'vitamin', 'vitamins', 'mineral', 'minerals', 'iron', 'fiber', 'calories', 'weight', 'healthy', 'water', 'sugar', 'diabetes', 'muscle', 'workout', 'plan', 'swap', 'sweet', 'dessert', 'craving', 'hungry', 'score', 'today', 'restaurant', 'budget', 'supplement', 'magnesium', 'zinc', 'folate', 'omega', 'target', 'targets', 'suggest', 'recommend', 'nutrients', 'deficiency', 'tired', 'energy', 'breakfasts', 'dinners', 'lunches']
const WORDS = [...new Set([...VOCAB, ...Object.keys(ALIASES).filter((k) => !k.includes(' ') && k.length >= 4), ...FOODS.flatMap((f) => f.name.toLowerCase().split(/[^a-z]+/)).filter((w) => w.length >= 5)])]

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

export function normalize(raw) {
  const cleaned = raw.toLowerCase().replace(/[“”"'`’]/g, '').replace(/[^\p{L}\p{N}%+.\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
  return cleaned
    .split(' ')
    .map((w) => {
      if (TYPOS[w]) return TYPOS[w]
      if (w.length < 5 || WORDS.includes(w) || /\d/.test(w)) return w
      const max = w.length >= 7 ? 2 : 1
      let best = null
      let bd = 9
      for (const v of WORDS) {
        const dd = lev(w, v)
        if (dd < bd) {
          bd = dd
          best = v
        }
      }
      return bd <= max ? best : w
    })
    .join(' ')
}

const YES = /^(ok+|okay|okey|okk+|k+|yes+|yeah|yea|yep|yup|ya|sure|haan|han|ha|ji|haanji|ha ji|please|go ahead|do it|y|sounds good|great|cool|nice|alright|fine|why not|chalo|theek hai|thik hai)( (please|ji|sure|yes))?$/
const NO = /^(no+|nope|nah|nahi|nhi|na|not now|later|no thanks|nothing)$/
const MORE = /^(more|another|another one|something else|other options?|aur|aur batao|next|show more|different|else|any other)\b/

const DIET_WORD = { veg: 'vegetarian', vegan: 'vegan', egg: 'eggetarian', nonveg: 'non-veg' }

function slotType(slot) {
  return slot === 'breakfast' ? 'breakfast' : slot === 'snack' ? 'snack' : slot === 'lunch' || slot === 'dinner' ? slot : 'lunch'
}

function withOffer(r, ctx) {
  if (r.offer !== undefined) return r
  const focus = focusGap(ctx.gaps, ctx.profile).key
  const map = {
    greeting: { type: 'meal', focus },
    status: { type: 'meal', focus },
    score: { type: 'meal', focus },
    nutrient: { type: 'meal', focus: r.focus || focus },
    water: { type: 'water' },
    energy: { type: 'meal', focus },
    food: { type: 'alt', foodId: r.cards?.[0]?.id },
    compare: { type: 'meal', focus },
    plan: { type: 'plan' },
    breakfast: { type: 'more' },
    lunch: { type: 'more' },
    dinner: { type: 'more' },
    snack: { type: 'more' },
    swap: { type: 'more' },
    lose: { type: 'more' },
    gain: { type: 'more' },
    vitamins: { type: 'meal', focus },
  }
  return { ...r, offer: map[r.intent] || null }
}

function alternativeTo(food, ctx) {
  const score = (f) => (f.n.protein * 4 + f.n.fiber * 6 + f.n.iron * 8 + f.n.calcium / 30) / Math.max(60, f.n.kcal)
  const pool = FOODS.filter((f) => f.id !== food.id && fitsDiet(f, ctx.profile) && !['dessert', 'junk', 'drink'].includes(f.category) && (f.category === food.category || (food.category === 'junk' && ['main', 'snack', 'breakfast'].includes(f.category))))
  return pool
    .filter((f) => f.n.kcal <= food.n.kcal * 1.05)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
}

function fulfil(offer, ctx, hi, raw) {
  const lead = hi ? 'Theek hai! ' : ['Sure! ', 'Great. ', 'On it. ', 'Here you go: '][ctx.seed % 4]
  if (!offer || offer.type === 'meal') {
    const r = mealReply(slotType(slotForNow()), ctx, hi, offer?.focus)
    return { ...r, text: lead + r.text, offer: { type: 'more' } }
  }
  if (offer.type === 'more') {
    const mealish = ['breakfast', 'lunch', 'dinner', 'snack', 'swap', 'lose', 'gain', 'fallback', 'alternative', 'more', 'nutrient', 'workout', 'sweet', 'late', 'budget', 'fasting', 'eatout']
    if (ctx.lastUserText && mealish.includes(ctx.lastIntent)) {
      const r = coachReply(ctx.lastUserText, { ...ctx, turn: (ctx.turn || 0) + 7, exclude: ctx.lastCardIds || [], lastOffer: null, lastUserText: null, lastIntent: null })
      if (r.cards?.length) return { ...r, query: ctx.lastUserText, intent: 'more', text: hi ? 'Ye kuch aur options:' : ['Here are a few different options:', 'Some fresh picks for you:', 'More ideas that fit your goals:'][ctx.seed % 3], offer: { type: 'more' } }
    }
    return fulfil({ type: 'meal' }, ctx, hi, raw)
  }
  if (offer.type === 'alt' && offer.foodId && FOOD_BY_ID[offer.foodId]) {
    const food = FOOD_BY_ID[offer.foodId]
    const alts = alternativeTo(food, ctx)
    return {
      intent: 'alternative',
      text: alts.length ? `${lead}Lighter, more nutritious swaps for **${food.name}** (${fmt(food.n.kcal)} kcal):` : `${food.name} is already one of the better options in its category. 👍`,
      cards: alts.map((f) => foodCard(f, ctx.targets, 'protein')),
      offer: { type: 'meal' },
    }
  }
  if (offer.type === 'plan') return { intent: 'plan', text: `${lead}Your full 7-day plan is one tap away.`, actions: [{ label: 'Open 7-day plan', to: '/plan' }], offer: null }
  if (offer.type === 'water') return { intent: 'water', text: `${lead}Logged reminder set. Tap below to add a glass now.`, actions: [{ label: 'Log a glass', do: 'water+1' }], offer: null }
  return fulfil({ type: 'meal' }, ctx, hi, raw)
}

function vitaminsReply(ctx, hi) {
  const keys = ['vitD', 'b12', 'vitC', 'folate']
  const rows = keys.map((k) => ctx.gaps.find((g) => g.key === k)).sort((a, b) => a.pct - b.pct)
  const lines = rows.map((g) => {
    const src = topFoodsFor(g.key, ctx.profile, { limit: 1 })[0]
    return `• **${g.label}: ${g.pct}%**${g.pct < 80 ? ` · best source for you: ${src ? src.name.replace(/\s*\(.*\)/, '') : '-'}` : ' · on track'}`
  })
  const low = rows.filter((g) => g.pct < 80)
  const cards = low.slice(0, 3).map((g) => {
    const f = topFoodsFor(g.key, ctx.profile, { limit: 1 })[0]
    return f && foodCard(f, ctx.targets, g.key)
  }).filter(Boolean)
  return {
    intent: 'vitamins',
    text: `${hi ? 'Aapke vitamins is hafte:' : 'Your vitamins this week (7-day average vs. your need):'}\n${lines.join('\n')}\n${low.length ? `Start with **${low[0].label}**: ${low[0].why}` : 'All key vitamins look good. Nice!'}`,
    cards,
    tips: low.some((g) => g.key === 'vitD') ? ['Vitamin D mostly comes from 15–20 min of morning sunlight, not food.'] : undefined,
    actions: [{ label: 'Open nutrient profile', to: '/nutrients' }],
    chips: low.slice(0, 2).map((g) => `${g.label}-rich foods`).concat(['Make a meal plan']),
  }
}

function targetsReply(ctx, hi) {
  const t = ctx.targets
  return {
    intent: 'targets',
    text: `${hi ? 'Aapke daily targets' : 'Your daily targets'} (${ctx.profile.age} y, ${ctx.profile.weightKg} kg, ${DIET_WORD[ctx.profile.diet] || ''}):\n• Energy **${fmt(t.kcal)} kcal** (BMR ${fmt(t.bmr)} × activity)\n• Protein **${t.protein} g** · Carbs ${t.carbs} g · Fat ${t.fat} g\n• Fiber **${t.fiber} g** · Iron **${t.iron} mg** · Calcium **${t.calcium} mg**\n• Vitamin D ${t.vitD} µg · B12 ${t.b12} µg · Water **${t.water} glasses**\nYou've had ${fmt(ctx.today.kcal)} kcal and ${fmt(ctx.today.protein)} g protein so far today.`,
    actions: [{ label: 'Change calorie goal', to: '/goal' }],
  }
}

function bmiReply(ctx) {
  const b = bmi(ctx.profile)
  const c = bmiCategory(b)
  const h = ctx.profile.heightCm / 100
  const lo = Math.round(18.5 * h * h)
  const hiW = Math.round(22.9 * h * h)
  return {
    intent: 'bmi',
    text: `Your BMI is **${b.toFixed(1)}** (${c.label}), using Asian-Indian cut-offs. For ${ctx.profile.heightCm} cm, the healthy range is about **${lo}–${hiW} kg**; you're at ${ctx.profile.weightKg} kg.\nBMI doesn't see muscle vs fat, so treat it as a rough screen, not a diagnosis.`,
    actions: [{ label: 'Log weight', to: '/progress' }],
  }
}

function eatenReply(ctx) {
  const groups = new Map()
  for (const e of ctx.todayEntries || []) {
    if (!groups.has(e.groupId)) groups.set(e.groupId, { name: e.groupName, slot: e.slot, items: [] })
    groups.get(e.groupId).items.push(e)
  }
  const list = [...groups.values()]
  if (!list.length) return { intent: 'eaten', text: 'Nothing logged today yet. Scan your next plate and I’ll track it for you.', actions: [{ label: 'Scan a meal', to: '/scan' }], offer: { type: 'meal' } }
  return {
    intent: 'eaten',
    text: `Today you’ve logged:\n${list.map((g) => `• ${g.slot[0].toUpperCase() + g.slot.slice(1)}: **${g.name}** · ${fmt(sumEntries(g.items).kcal)} kcal`).join('\n')}\nTotal **${fmt(ctx.today.kcal)} kcal**, ${fmt(ctx.today.protein)} g protein. ${fmt(Math.max(0, ctx.remaining))} kcal left.`,
    actions: [{ label: 'Open diary', to: '/diary' }],
    offer: { type: 'meal' },
  }
}

function smartFallback(raw, text, ctx, hi) {
  // "Did you mean …?" for an unknown dish-like word
  const words = text.split(' ').filter((w) => w.length >= 4)
  const near = []
  for (const w of words) {
    for (const f of FOODS) {
      const n = f.name.toLowerCase().replace(/\s*\(.*\)/, '')
      if (n.split(' ').some((t) => t.length >= 4 && lev(w, t) <= 2) && !near.includes(f)) near.push(f)
    }
  }
  if (near.length) {
    const opts = near.filter((f) => fitsDiet(f, ctx.profile)).slice(0, 3)
    if (opts.length)
      return {
        intent: 'didyoumean',
        text: `I couldn’t find “${raw.trim()}” exactly. Did you mean one of these?`,
        cards: opts.map((f) => foodCard(f, ctx.targets, 'protein')),
        chips: opts.map((f) => `Calories in ${f.name.replace(/\s*\(.*\)/, '').toLowerCase()}`),
      }
  }
  const slot = slotForNow()
  const r = mealReply(slotType(slot), ctx, hi)
  const g = focusGap(ctx.gaps, ctx.profile)
  const intro = [
    `I’m not sure I understood “${raw.trim()}”, so here’s the most useful thing I can do right now. You have **${fmt(Math.max(0, ctx.remaining))} kcal** left and your ${lc(g.label)} is at ${g.pct}%:`,
    `Let me guess what would help most: your next ${slot} should boost **${lc(g.label)}** (${g.pct}% this week). Try:`,
    hi ? `Samajh nahi aaya, par ye kaam aayega: aapka ${lc(g.label)} ${g.pct}% hai, toh agla meal ye ho sakta hai:` : `Here’s my best suggestion based on your data (${lc(g.label)} ${g.pct}%, ${fmt(Math.max(0, ctx.remaining))} kcal left):`,
  ][ctx.seed % 3]
  return { ...r, intent: 'fallback', text: intro, chips: ['What can you do?', `Foods high in ${lc(g.label)}`, 'How am I doing today?', 'Make a meal plan'], offer: { type: 'meal' } }
}

export function coachReply(message, ctx) {
  const r = reply(message, ctx)
  return { query: message.trim(), ...r }
}

function reply(message, ctx) {
  const raw = message.trim()
  const text = normalize(raw)
  const hi = ctx.allowHinglish !== false && HINGLISH.test(raw)
  const c = { ...ctx, seed: (ctx.turn || 0) + hashStr(text) }

  if (!text) return smartFallback(raw, text, c, hi)
  if (YES.test(text)) return fulfil(ctx.lastOffer, c, hi, raw)
  if (NO.test(text)) return { intent: 'no', text: ['No problem. I’m here whenever you need a meal idea. 🌱', 'Okay! Ask me anything about food or nutrients anytime.', hi ? 'Theek hai! Jab chahiye tab puchh lena.' : 'Sure, maybe later.'][c.seed % 3], chips: ['How am I doing today?', 'Quick snack'], offer: null }
  if (MORE.test(text)) return fulfil({ type: 'more' }, c, hi, raw)

  const cap = text.match(/(?:under|below|less than|within|upto|up to|max|<)\s*(\d{2,4})\s*(?:kcal|cal|calories)?/)
  const mealWord = text.match(/\b(breakfast|lunch|dinner|snack|meal|eat|food|khana|nashta)\b/)
  if (cap && mealWord) {
    const slot = { breakfast: 'breakfast', nashta: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack' }[mealWord[1]] || slotType(slotForNow())
    const kcalCap = Number(cap[1])
    const focus = /protein/.test(text) ? 'protein' : /iron/.test(text) ? 'iron' : /fiber/.test(text) ? 'fiber' : /calcium/.test(text) ? 'calcium' : undefined
    const r = mealReply(slot, { ...c, kcalCap }, hi, focus)
    return withOffer({ ...r, text: r.cards?.length ? `${slot[0].toUpperCase() + slot.slice(1)} ideas under **${kcalCap} kcal**${focus ? `, high in ${lc(NUTRIENT_BY_KEY[focus].label)}` : ''}:` : `I couldn’t find a ${slot} under ${kcalCap} kcal that fits your diet. Try a slightly higher limit.` }, c)
  }
  if (/\b(vitamins|minerals|micronutrients|nutrients|vitamin)\b/.test(text) && !/\b(vitamin (d|c|b12|b)|d3|b12)\b/.test(text)) return withOffer(vitaminsReply(c, hi), c)
  if (/\b(bmi|overweight|underweight|ideal weight|am i (fat|thin|skinny))\b/.test(text)) return withOffer(bmiReply(c), c)
  if (/\b(how much|how many).*(need|should|require)|\b(my|daily) (targets?|goals?|needs?|requirements?)\b|\brda\b/.test(text) && !findFoods(text).length) return withOffer(targetsReply(c, hi), c)
  if (/\b(what did i eat|what have i eaten|eaten today|my meals today|today s meals|today meals|aaj kya khaya|log today|my log)\b/.test(text)) return eatenReply(c)
  if (/\b(healthier|alternative|instead|better option|replace)\b/.test(text) && ctx.lastOffer?.type === 'alt') return fulfil(ctx.lastOffer, c, hi, raw)

  const r = coreReply(text, c)
  if (r.intent === 'fallback') return smartFallback(raw, text, c, hi)
  return withOffer({ ...r, focus: NUTRIENTS.find((n) => r.intent === 'nutrient' && r.text.includes(n.label))?.key }, c)
}

