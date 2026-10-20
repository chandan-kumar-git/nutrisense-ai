import { FOOD_BY_ID } from './foods'

// Meal combinations used by the recommender, the meal planner, the coach and the scanner.
// items: [foodId, servings]
const RAW = [
  // breakfast
  ['b_poha', 'Poha + Masala Chai', 'breakfast', [['poha', 1], ['chai', 1]], 10],
  ['b_idli', 'Idli Sambar', 'breakfast', [['idli', 1], ['sambar', 1], ['coconut_chutney', 1]], 15],
  ['b_masala_dosa', 'Masala Dosa + Sambar', 'breakfast', [['masala_dosa', 1], ['sambar', 1]], 20],
  ['b_besan', 'Besan Chilla + Curd', 'breakfast', [['besan_chilla', 1], ['curd', 1]], 15],
  ['b_moong', 'Moong Chilla + Salad', 'breakfast', [['moong_chilla', 1], ['green_salad', 0.5]], 15],
  ['b_oats', 'Oats Porridge + Banana', 'breakfast', [['oats', 1], ['banana', 1]], 8],
  ['b_eggs', 'Boiled Eggs + Toast', 'breakfast', [['boiled_eggs', 1], ['toast', 1]], 10],
  ['b_omelette', 'Veg Omelette + Orange', 'breakfast', [['omelette', 1], ['toast', 0.5], ['orange', 1]], 12],
  ['b_aloo_paratha', 'Aloo Paratha + Curd', 'breakfast', [['aloo_paratha', 1], ['curd', 1]], 20],
  ['b_paneer_paratha', 'Paneer Paratha + Chai', 'breakfast', [['paneer_paratha', 1], ['chai', 1]], 20],
  ['b_upma', 'Upma + Coconut Chutney', 'breakfast', [['upma', 1], ['coconut_chutney', 1]], 15],
  ['b_cereal', 'Fortified Cereal + Banana', 'breakfast', [['cereal', 1], ['banana', 0.5]], 3],
  ['b_ragi', 'Ragi Roti + Curd', 'breakfast', [['ragi_roti', 1], ['curd', 1]], 15],
  ['b_chia', 'Chia Pudding + Fruit', 'breakfast', [['chia_pudding', 1], ['fruit_bowl', 0.5]], 5],
  ['b_tofu', 'Tofu Scramble + Toast', 'breakfast', [['tofu_scramble', 1], ['pb_toast', 0.5]], 12],
  ['b_sprouts', 'Sprouts Salad + Guava', 'breakfast', [['sprouts', 1], ['guava', 1]], 8],
  ['b_thepla', 'Methi Thepla + Curd', 'breakfast', [['methi_thepla', 1], ['curd', 1]], 15],
  ['b_dalia', 'Vegetable Dalia + Almonds', 'breakfast', [['dalia', 1], ['almonds', 1]], 15],
  ['b_avocado', 'Avocado Toast + Coffee', 'breakfast', [['avocado_toast', 1], ['coffee', 1]], 8],
  ['b_bhurji', 'Egg Bhurji + 2 Roti', 'breakfast', [['egg_bhurji', 1], ['roti', 2]], 15],
  ['b_smoothie', 'Banana Peanut Smoothie', 'breakfast', [['smoothie', 1], ['almonds', 0.5]], 5],
  ['b_milk_oats', 'Milk + PB Toast', 'breakfast', [['milk', 1], ['pb_toast', 1]], 5],

  // lunch / dinner
  ['m_dal_roti', 'Dal Tadka + Roti', 'main', [['dal_tadka', 1], ['roti', 2]], 20],
  ['m_dal_rice', 'Dal Tadka + Jeera Rice', 'main', [['dal_tadka', 1], ['jeera_rice', 1], ['mixed_veg', 1]], 30],
  ['m_rajma', 'Rajma Chawal', 'main', [['rajma', 1], ['rice', 1], ['green_salad', 0.5]], 35],
  ['m_chole', 'Chole + 2 Roti', 'main', [['chole', 1], ['roti', 2], ['green_salad', 0.5]], 30],
  ['m_palak_dal', 'Palak Dal + 2 Roti', 'main', [['palak_dal', 1], ['roti', 2]], 25],
  ['m_palak_paneer', 'Palak Paneer + Roti', 'main', [['palak_paneer', 1], ['roti', 2]], 30],
  ['m_kadhi', 'Kadhi Chawal', 'main', [['kadhi', 1], ['rice', 1]], 30],
  ['m_thali', 'Home-style Thali', 'main', [['dal_tadka', 1], ['rice', 0.75], ['roti', 1], ['mixed_veg', 1], ['curd', 0.5]], 40],
  ['m_khichdi', 'Moong Khichdi + Curd', 'main', [['khichdi', 1], ['curd', 0.5]], 25],
  ['m_curd_rice', 'Curd Rice + Salad', 'main', [['curd_rice', 1], ['green_salad', 1]], 15],
  ['m_soya', 'Soya Chunks Curry + Roti', 'main', [['soya_curry', 1], ['roti', 2]], 30],
  ['m_tofu', 'Tofu Stir Fry + Brown Rice', 'main', [['tofu_stirfry', 1], ['brown_rice', 1]], 25],
  ['m_quinoa', 'Quinoa Salad Bowl', 'main', [['quinoa_salad', 1]], 20],
  ['m_saag', 'Sarson Saag + Makki Roti', 'main', [['sarson_saag', 1], ['makki_roti', 2]], 40],
  ['m_bhindi', 'Bhindi + Dal + Roti', 'main', [['bhindi', 1], ['dal_tadka', 0.75], ['roti', 2]], 30],
  ['m_aloo_gobi', 'Aloo Gobi + Roti + Curd', 'main', [['aloo_gobi', 1], ['roti', 2], ['curd', 0.5]], 30],
  ['m_baingan', 'Baingan Bharta + Dal + Roti', 'main', [['baingan_bharta', 1], ['dal_tadka', 0.75], ['roti', 2]], 35],
  ['m_mushroom', 'Mushroom Masala + Roti', 'main', [['mushroom_masala', 1], ['roti', 2], ['green_salad', 0.5]], 25],
  ['m_paneer_tikka', 'Paneer Tikka + Salad', 'main', [['paneer_tikka', 1], ['green_salad', 1]], 25],
  ['m_veg_biryani', 'Veg Biryani + Raita', 'main', [['veg_biryani', 1], ['curd', 0.5]], 40],
  ['m_pulao', 'Veg Pulao + Raita', 'main', [['veg_pulao', 1], ['curd', 0.75]], 30],
  ['m_pbm', 'Paneer Butter Masala + Roti', 'main', [['paneer_butter_masala', 1], ['roti', 2]], 35],
  ['m_soup_sandwich', 'Tomato Soup + Egg Sandwich', 'main', [['tomato_soup', 1], ['egg_sandwich', 1]], 15],
  ['m_egg_curry', 'Egg Curry + 2 Roti', 'main', [['egg_curry', 1], ['roti', 2]], 30],
  ['m_chicken_curry', 'Chicken Curry + Rice', 'main', [['chicken_curry', 1], ['rice', 1]], 40],
  ['m_chicken_biryani', 'Chicken Biryani + Raita', 'main', [['chicken_biryani', 1], ['curd', 0.5]], 45],
  ['m_fish_curry', 'Fish Curry + Rice', 'main', [['fish_curry', 1], ['rice', 1]], 35],
  ['m_tandoori', 'Tandoori Chicken + Salad', 'main', [['tandoori_chicken', 1], ['green_salad', 1], ['roti', 1]], 30],
  ['m_salmon', 'Grilled Salmon + Brown Rice', 'main', [['salmon', 1], ['brown_rice', 1], ['green_salad', 0.5]], 25],
  ['m_mutton', 'Mutton Curry + Rice', 'main', [['mutton_curry', 1], ['rice', 1]], 60],
  ['m_prawn', 'Prawn Curry + Rice', 'main', [['prawn_curry', 1], ['rice', 1]], 35],
  ['m_butter_chicken', 'Butter Chicken + Roti', 'main', [['butter_chicken', 1], ['roti', 2]], 40],
  ['m_chicken_quinoa', 'Grilled Chicken Quinoa Bowl', 'main', [['chicken_quinoa', 1]], 30],
  ['m_grilled_chicken', 'Grilled Chicken + Salad', 'main', [['grilled_chicken', 1], ['green_salad', 1], ['brown_rice', 0.5]], 25],
  ['m_caesar', 'Chicken Caesar Salad', 'main', [['caesar_salad', 1]], 15],
  ['m_pasta_red', 'Arrabbiata Pasta + Salad', 'main', [['pasta_red', 1], ['green_salad', 0.5]], 25],
  ['m_fish_fry', 'Fish Fry + Dal + Rice', 'main', [['fish_fry', 1], ['dal_tadka', 0.5], ['rice', 1]], 35],

  // snacks
  ['s_chana', 'Roasted Chana', 'snack', [['roasted_chana', 1]], 1],
  ['s_makhana', 'Roasted Makhana', 'snack', [['makhana', 1]], 5],
  ['s_nuts', 'Almonds + Walnuts', 'snack', [['almonds', 1], ['walnuts', 1]], 1],
  ['s_fruit', 'Mixed Fruit Bowl', 'snack', [['fruit_bowl', 1]], 5],
  ['s_yogurt', 'Greek Yogurt + Fruit', 'snack', [['greek_yogurt', 1], ['banana', 0.5]], 3],
  ['s_sprouts', 'Sprouts Chaat', 'snack', [['sprouts', 1]], 10],
  ['s_dhokla', 'Dhokla', 'snack', [['dhokla', 1]], 5],
  ['s_chikki', 'Peanut Chikki', 'snack', [['peanut_chikki', 1]], 1],
  ['s_dates', 'Dates + Almonds', 'snack', [['dates', 1], ['almonds', 1]], 1],
  ['s_coconut', 'Coconut Water + Banana', 'snack', [['coconut_water', 1], ['banana', 1]], 2],
  ['s_shake', 'Whey Protein Shake', 'snack', [['protein_shake', 1]], 3],
  ['s_bhel', 'Bhel Puri', 'snack', [['bhel', 1]], 10],
  ['s_chaas', 'Chaas + Roasted Chana', 'snack', [['chaas', 1], ['roasted_chana', 1]], 3],
  ['s_guava', 'Guava + Jaggery', 'snack', [['guava', 1], ['jaggery', 1]], 1],
  ['s_hummus', 'Hummus + Veggie Sticks', 'snack', [['hummus_veggies', 1]], 10],
  ['s_milk', 'Glass of Fortified Milk', 'snack', [['milk', 1]], 2],
  ['s_dark_choc', 'Dark Chocolate + Walnuts', 'snack', [['dark_chocolate', 1], ['walnuts', 1]], 1],
  ['s_veg_sandwich', 'Grilled Veg Sandwich', 'snack', [['veg_sandwich', 1]], 10],

  // indulgent (mostly reached through scanning)
  ['j_pizza', 'Margherita Pizza', 'junk', [['pizza', 1]], 20],
  ['j_burger', 'Burger, Fries + Cola', 'junk', [['veg_burger', 1], ['fries', 1], ['cola', 1]], 15],
  ['j_chicken_burger', 'Chicken Burger + Fries', 'junk', [['chicken_burger', 1], ['fries', 1]], 15],
  ['j_samosa', 'Samosa + Chai', 'junk', [['samosa', 2], ['chai', 1]], 10],
  ['j_vada_pav', 'Vada Pav', 'junk', [['vada_pav', 1]], 5],
  ['j_pani_puri', 'Pani Puri', 'junk', [['pani_puri', 1]], 10],
  ['j_pav_bhaji', 'Pav Bhaji', 'junk', [['pav_bhaji', 1]], 25],
  ['j_chole_bhature', 'Chole Bhature', 'junk', [['chole_bhature', 1]], 30],
  ['j_momos', 'Veg Momos', 'junk', [['veg_momos', 1]], 20],
  ['j_chicken_momos', 'Chicken Momos', 'junk', [['chicken_momos', 1]], 20],
  ['j_maggi', 'Instant Noodles', 'junk', [['maggi', 1]], 5],
  ['j_pasta', 'White Sauce Pasta', 'junk', [['pasta_white', 1]], 20],
  ['j_hakka', 'Hakka Noodles', 'junk', [['hakka_noodles', 1]], 20],
  ['j_fried_rice', 'Veg Fried Rice', 'junk', [['fried_rice', 1]], 20],
  ['j_gulab', 'Gulab Jamun', 'junk', [['gulab_jamun', 1]], 5],
  ['j_kheer', 'Rice Kheer', 'junk', [['kheer', 1]], 40],
]

const DIET_RANK = { vegan: 0, veg: 1, egg: 2, nonveg: 3 }
const RANK_DIET = ['vegan', 'veg', 'egg', 'nonveg']

export const MEALS = RAW.map(([id, name, type, items, prepMin]) => {
  const foods = items.map(([foodId, servings]) => ({ food: FOOD_BY_ID[foodId], servings }))
  const missing = foods.find((x) => !x.food)
  if (missing) throw new Error(`Meal ${id} references unknown food`)
  const diet = RANK_DIET[Math.max(...foods.map((x) => DIET_RANK[x.food.diet]))]
  const allergens = [...new Set(foods.flatMap((x) => x.food.allergens))]
  return { id, name, type, items: items.map(([foodId, servings]) => ({ foodId, servings })), prepMin, diet, allergens }
})

export const MEAL_BY_ID = Object.fromEntries(MEALS.map((m) => [m.id, m]))

// Scanner scenarios: what the "vision model" returns for a given plate.
// conf = top-1 confidence, alt = alternative labels with lower probability.
export const SCAN_SCENARIOS = [
  { mealId: 'm_dal_roti', conf: 0.93, alt: [['Dal Fry + Chapati', 0.05], ['Sambar + Dosa', 0.01]], keys: ['dal', 'roti', 'chapati'] },
  { mealId: 'm_dal_rice', conf: 0.92, alt: [['Dal Fry + Plain Rice', 0.05], ['Sambar Rice', 0.02]], keys: ['rice', 'thali'] },
  { mealId: 'm_rajma', conf: 0.94, alt: [['Lobia Masala + Rice', 0.04]], keys: ['rajma', 'kidney'] },
  { mealId: 'b_idli', conf: 0.97, alt: [['Rava Idli', 0.02]], keys: ['idli', 'sambar'] },
  { mealId: 'j_pizza', conf: 0.98, alt: [['Garlic Bread', 0.01]], keys: ['pizza'] },
  { mealId: 'b_masala_dosa', conf: 0.95, alt: [['Plain Dosa', 0.03], ['Uttapam', 0.01]], keys: ['dosa'] },
  { mealId: 'm_chicken_biryani', conf: 0.91, alt: [['Mutton Biryani', 0.06], ['Veg Biryani', 0.02]], keys: ['biryani', 'chicken'] },
  { mealId: 'm_palak_paneer', conf: 0.89, alt: [['Sarson Saag', 0.07], ['Hara Bhara Kabab', 0.02]], keys: ['palak', 'paneer', 'spinach'] },
  { mealId: 'j_burger', conf: 0.96, alt: [['Chicken Burger Meal', 0.03]], keys: ['burger', 'fries'] },
  { mealId: 'b_poha', conf: 0.93, alt: [['Upma', 0.05]], keys: ['poha'] },
  { mealId: 'm_chole', conf: 0.9, alt: [['Rajma + Roti', 0.06]], keys: ['chole', 'chana', 'chickpea'] },
  { mealId: 'j_samosa', conf: 0.95, alt: [['Kachori + Chai', 0.04]], keys: ['samosa'] },
  { mealId: 'm_thali', conf: 0.86, alt: [['Gujarati Thali', 0.08], ['Rajasthani Thali', 0.04]], keys: ['thali', 'plate'] },
  { mealId: 'b_aloo_paratha', conf: 0.92, alt: [['Gobi Paratha', 0.05]], keys: ['paratha'] },
  { mealId: 'j_momos', conf: 0.94, alt: [['Chicken Momos', 0.05]], keys: ['momo', 'dumpling'] },
  { mealId: 'm_fish_curry', conf: 0.88, alt: [['Prawn Curry + Rice', 0.07], ['Egg Curry + Rice', 0.03]], keys: ['fish'] },
  { mealId: 'j_pav_bhaji', conf: 0.95, alt: [['Misal Pav', 0.03]], keys: ['pav', 'bhaji'] },
  { mealId: 'b_omelette', conf: 0.9, alt: [['Egg Bhurji + Toast', 0.07]], keys: ['omelette', 'egg'] },
  { mealId: 's_fruit', conf: 0.97, alt: [['Fruit Chaat', 0.02]], keys: ['fruit', 'salad', 'apple', 'banana'] },
  { mealId: 'm_butter_chicken', conf: 0.91, alt: [['Chicken Tikka Masala', 0.07]], keys: ['butter'] },
  { mealId: 'j_maggi', conf: 0.96, alt: [['Hakka Noodles', 0.03]], keys: ['maggi', 'noodle'] },
  { mealId: 'm_quinoa', conf: 0.87, alt: [['Couscous Salad', 0.08]], keys: ['quinoa', 'bowl'] },
  { mealId: 'j_chole_bhature', conf: 0.93, alt: [['Puri Bhaji', 0.05]], keys: ['bhature', 'puri'] },
  { mealId: 'm_kadhi', conf: 0.88, alt: [['Dal + Rice', 0.08]], keys: ['kadhi'] },
  { mealId: 'b_oats', conf: 0.9, alt: [['Dalia', 0.07]], keys: ['oats', 'porridge'] },
  { mealId: 'j_pani_puri', conf: 0.97, alt: [['Dahi Puri', 0.02]], keys: ['golgappa', 'panipuri', 'pani'] },
  { mealId: 'm_tandoori', conf: 0.92, alt: [['Chicken Tikka', 0.06]], keys: ['tandoori'] },
  { mealId: 'j_gulab', conf: 0.96, alt: [['Kala Jamun', 0.03]], keys: ['gulab', 'jamun', 'sweet', 'dessert'] },
  { mealId: 'm_salmon', conf: 0.89, alt: [['Grilled Trout', 0.06]], keys: ['salmon'] },
]

// Packaged products for barcode mode. Values are per pack/serving shown.
export const PACKAGED = [
  { code: '8901030865278', name: 'Toned Milk 500 ml', brand: 'Local Dairy', servingLabel: '250 ml', foodId: 'milk', servings: 2, verdict: 'good', note: 'Good calcium + vitamin D (fortified).' },
  { code: '8901719110016', name: 'Whole Wheat Bread', brand: 'Bakery Co.', servingLabel: '2 slices', foodId: 'toast', servings: 1, verdict: 'ok', note: 'Choose 100% whole wheat for more fiber.' },
  { code: '8901058851298', name: 'Instant Masala Noodles', brand: 'Quick Bites', servingLabel: '1 pack', foodId: 'maggi', servings: 1, verdict: 'limit', note: 'High sodium (~1,100 mg). Add veggies + egg to balance.' },
  { code: '8906010500016', name: 'Whey Protein Shake', brand: 'FitFuel', servingLabel: '1 scoop + milk', foodId: 'protein_shake', servings: 1, verdict: 'good', note: '32 g protein. Not needed if diet already meets protein.' },
  { code: '8901725181222', name: 'Salted Potato Chips', brand: 'Crispy', servingLabel: '50 g', foodId: 'fries', servings: 0.75, verdict: 'limit', note: 'Mostly refined carbs + fat. Roasted makhana is a better crunch.' },
  { code: '8901764042709', name: 'Cola 330 ml', brand: 'Fizz', servingLabel: '1 can', foodId: 'cola', servings: 1, verdict: 'limit', note: '35 g added sugar ≈ 9 teaspoons.' },
  { code: '8901262150019', name: 'Greek Yogurt Cup', brand: 'Dairy Fresh', servingLabel: '150 g', foodId: 'greek_yogurt', servings: 1, verdict: 'good', note: 'High protein, gut-friendly. Great snack.' },
  { code: '8904109400121', name: 'Rolled Oats', brand: 'Morning Grain', servingLabel: '1 bowl (with milk)', foodId: 'oats', servings: 1, verdict: 'good', note: 'Beta-glucan fiber supports fullness.' },
  { code: '8901058000207', name: 'Fortified Corn Flakes', brand: 'Grain Co.', servingLabel: '1 bowl + milk', foodId: 'cereal', servings: 1, verdict: 'ok', note: 'Fortified with iron + B12. Check added sugar.' },
  { code: '8908001158244', name: 'Dark Chocolate 70%', brand: 'Cocoa Lab', servingLabel: '2 squares', foodId: 'dark_chocolate', servings: 1, verdict: 'ok', note: 'Some iron + magnesium. Keep portion small.' },
  { code: '8901233021157', name: 'Peanut Butter Toast Kit', brand: 'Nutty', servingLabel: '2 slices', foodId: 'pb_toast', servings: 1, verdict: 'good', note: 'Protein + healthy fats. Watch added sugar variants.' },
  { code: '8902080011438', name: 'Coconut Water 200 ml', brand: 'Tender', servingLabel: '1 pack', foodId: 'coconut_water', servings: 0.8, verdict: 'good', note: 'Natural electrolytes, low calorie.' },
]

// Nutrition-label OCR mode: "extracted" panels.
export const LABELS = [
  { name: 'Multigrain Biscuits', per: '30 g (4 biscuits)', kcal: 145, protein: 2.4, carbs: 20, sugar: 6.5, fat: 6, satFat: 3, sodium: 120, fiber: 1.8, verdict: 'limit', note: 'Sugar and palm-fat heavy despite the "multigrain" claim.' },
  { name: 'Masala Oats Pouch', per: '40 g', kcal: 152, protein: 4.6, carbs: 25, sugar: 1.2, fat: 3.8, satFat: 0.9, sodium: 480, fiber: 3.2, verdict: 'ok', note: 'Decent fiber; sodium is high for one pouch.' },
  { name: 'Protein Bar (Choco)', per: '60 g bar', kcal: 245, protein: 20, carbs: 22, sugar: 4, fat: 9, satFat: 4, sodium: 180, fiber: 6, verdict: 'good', note: '20 g protein, low sugar. Fine as an occasional snack.' },
  { name: 'Mango Fruit Drink', per: '200 ml', kcal: 128, protein: 0, carbs: 32, sugar: 30, fat: 0, satFat: 0, sodium: 25, fiber: 0, verdict: 'limit', note: '30 g sugar with almost no fruit fiber. A whole mango is better.' },
  { name: 'Roasted Makhana (Peri Peri)', per: '30 g', kcal: 125, protein: 3.2, carbs: 19, sugar: 1, fat: 4, satFat: 0.6, sodium: 210, fiber: 4, verdict: 'good', note: 'Light, crunchy, low sugar.' },
  { name: 'Paneer (Malai)', per: '100 g', kcal: 265, protein: 18, carbs: 3, sugar: 2, fat: 20, satFat: 13, sodium: 30, fiber: 0, verdict: 'ok', note: 'Great calcium + protein; high in saturated fat.' },
]
