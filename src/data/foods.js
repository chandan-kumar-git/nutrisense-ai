// Food knowledge base. Values are per one serving and approximate, compiled from
// IFCT 2017 (NIN, India) and USDA FoodData Central reference values.
// n = [kcal, protein g, carbs g, fat g, fiber g, iron mg, calcium mg, vitamin D µg,
//      B12 µg, vitamin C mg, folate µg, zinc mg, magnesium mg, omega-3 g]

const KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'iron', 'calcium', 'vitD', 'b12', 'vitC', 'folate', 'zinc', 'magnesium', 'omega3']

// diet: vegan | veg | egg | nonveg     allergens: dairy, gluten, nuts, egg, seafood, soy
const RAW = [
  // ---------- breakfast ----------
  ['poha', 'Poha', 'breakfast', 150, '1 plate', [270, 5, 46, 8, 3, 2.8, 20, 0, 0, 6, 20, 0.8, 30, 0.05], 'vegan', [], '#F6D86B', ['light', 'indian']],
  ['upma', 'Upma', 'breakfast', 180, '1 bowl', [290, 7, 42, 10, 3, 1.5, 30, 0, 0, 3, 25, 0.9, 35, 0.05], 'vegan', ['gluten'], '#F3E3B0', ['indian']],
  ['idli', 'Idli (3 pcs)', 'breakfast', 150, '3 pieces', [210, 7, 42, 1, 2, 1.2, 25, 0, 0, 0, 20, 0.7, 25, 0], 'vegan', [], '#FBF6EA', ['indian', 'fermented', 'light']],
  ['dosa', 'Plain Dosa', 'breakfast', 100, '1 dosa', [168, 4, 29, 4, 1.5, 0.8, 15, 0, 0, 0, 15, 0.5, 20, 0.02], 'vegan', [], '#E9B86A', ['indian', 'fermented']],
  ['masala_dosa', 'Masala Dosa', 'breakfast', 200, '1 dosa', [380, 8, 55, 14, 4, 1.8, 40, 0, 0, 10, 30, 1, 45, 0.05], 'vegan', [], '#E3A64F', ['indian']],
  ['sambar', 'Sambar', 'side', 150, '1 bowl', [130, 6, 18, 4, 5, 1.8, 50, 0, 0, 12, 45, 0.8, 40, 0.03], 'vegan', [], '#E07B39', ['indian', 'lentil']],
  ['coconut_chutney', 'Coconut Chutney', 'side', 40, '2 tbsp', [100, 1.5, 4, 9, 2, 0.5, 8, 0, 0, 1, 8, 0.2, 15, 0], 'vegan', [], '#F4F1E4', ['indian']],
  ['aloo_paratha', 'Aloo Paratha', 'breakfast', 120, '1 paratha', [300, 6, 40, 13, 4, 1.6, 30, 0, 0, 8, 25, 0.8, 30, 0.05], 'veg', ['gluten', 'dairy'], '#D99A4E', ['indian', 'heavy']],
  ['paneer_paratha', 'Paneer Paratha', 'breakfast', 130, '1 paratha', [330, 12, 36, 15, 3, 1.4, 180, 0, 0.3, 2, 25, 1.2, 30, 0.05], 'veg', ['gluten', 'dairy'], '#E2AE62', ['indian']],
  ['besan_chilla', 'Besan Chilla (2)', 'breakfast', 140, '2 chillas', [260, 13, 28, 10, 6, 2.6, 45, 0, 0, 6, 110, 1.4, 70, 0.08], 'vegan', [], '#EDC44C', ['indian', 'high-protein']],
  ['moong_chilla', 'Moong Dal Chilla (2)', 'breakfast', 140, '2 chillas', [250, 15, 30, 7, 7, 2.5, 40, 0, 0, 4, 140, 1.5, 70, 0.05], 'vegan', [], '#B9CF63', ['indian', 'high-protein']],
  ['oats', 'Oats Porridge (milk)', 'breakfast', 250, '1 bowl', [280, 11, 42, 7, 5, 2.2, 220, 1.2, 0.9, 1, 20, 2, 80, 0.05], 'veg', ['dairy', 'gluten'], '#EFE2C8', ['high-fiber']],
  ['boiled_eggs', 'Boiled Eggs (2)', 'breakfast', 100, '2 eggs', [155, 13, 1, 11, 0, 1.8, 56, 2.2, 1.1, 0, 47, 1.3, 12, 0.08], 'egg', ['egg'], '#FFF6DD', ['high-protein']],
  ['omelette', 'Veg Omelette (2 eggs)', 'breakfast', 130, '1 omelette', [210, 14, 4, 15, 1, 2, 70, 2.2, 1.1, 10, 55, 1.4, 18, 0.08], 'egg', ['egg'], '#F7D65A', ['high-protein']],
  ['egg_bhurji', 'Egg Bhurji', 'breakfast', 130, '1 bowl', [230, 14, 5, 17, 1, 2, 70, 2.2, 1.1, 10, 55, 1.4, 18, 0.08], 'egg', ['egg'], '#F5CF4F', ['indian', 'high-protein']],
  ['toast', 'Buttered Toast (2)', 'breakfast', 70, '2 slices', [230, 6, 30, 9, 2, 1.6, 60, 0, 0, 0, 40, 0.6, 20, 0.02], 'veg', ['gluten', 'dairy'], '#D9A766', []],
  ['pb_toast', 'Peanut Butter Toast', 'breakfast', 80, '2 slices', [290, 11, 30, 15, 5, 1.6, 40, 0, 0, 0, 40, 1.4, 70, 0.03], 'vegan', ['gluten', 'nuts'], '#B97B3E', ['high-protein']],
  ['avocado_toast', 'Avocado Toast', 'breakfast', 150, '2 slices', [290, 7, 30, 16, 8, 1.8, 50, 0, 0, 10, 90, 1, 45, 0.1], 'vegan', ['gluten'], '#9BC25B', ['healthy-fat']],
  ['cereal', 'Fortified Cereal + Milk', 'breakfast', 250, '1 bowl', [260, 10, 44, 5, 3, 6, 320, 2.5, 1.8, 8, 150, 3, 50, 0.02], 'veg', ['dairy', 'gluten'], '#E7C27A', ['fortified']],
  ['chia_pudding', 'Chia Pudding', 'breakfast', 200, '1 jar', [220, 7, 22, 12, 10, 2.2, 250, 0.8, 0.5, 1, 30, 1.2, 95, 3.5], 'veg', ['dairy'], '#EEE7DA', ['omega-3', 'high-fiber']],
  ['tofu_scramble', 'Tofu Scramble', 'breakfast', 150, '1 bowl', [200, 16, 6, 13, 2, 3, 300, 0, 0, 6, 30, 1.6, 50, 0.4], 'vegan', ['soy'], '#F2DE8C', ['high-protein']],
  ['methi_thepla', 'Methi Thepla (2)', 'breakfast', 100, '2 theplas', [260, 7, 34, 11, 5, 2.8, 80, 0, 0, 8, 40, 1, 50, 0.04], 'vegan', ['gluten'], '#C6B062', ['indian']],
  ['dalia', 'Vegetable Dalia', 'breakfast', 200, '1 bowl', [230, 8, 40, 4, 6, 2, 40, 0, 0, 0, 30, 1.4, 70, 0.03], 'vegan', ['gluten'], '#D6BE84', ['high-fiber', 'indian']],
  ['ragi_roti', 'Ragi Roti (2)', 'breakfast', 100, '2 rotis', [220, 5, 44, 3, 6, 2.4, 240, 0, 0, 0, 30, 1, 90, 0.03], 'vegan', [], '#8B5E4A', ['indian', 'calcium']],
  ['smoothie', 'Banana Peanut Smoothie', 'breakfast', 300, '1 glass', [320, 12, 45, 11, 5, 1.2, 280, 1.2, 0.9, 10, 40, 1.6, 80, 0.03], 'veg', ['dairy', 'nuts'], '#EBD9A8', []],
  ['sprouts', 'Moong Sprouts Salad', 'snack', 150, '1 bowl', [140, 10, 22, 1, 6, 2.2, 30, 0, 0, 20, 120, 1.2, 45, 0.1], 'vegan', [], '#9CC86A', ['high-protein', 'light']],

  // ---------- fruit & drinks ----------
  ['banana', 'Banana', 'fruit', 120, '1 medium', [105, 1.3, 27, 0.4, 3, 0.3, 6, 0, 0, 10, 24, 0.2, 32, 0.03], 'vegan', [], '#F7DA4F', ['fruit']],
  ['apple', 'Apple', 'fruit', 180, '1 medium', [95, 0.5, 25, 0.3, 4.4, 0.2, 11, 0, 0, 8, 5, 0.1, 9, 0.02], 'vegan', [], '#E2584D', ['fruit']],
  ['orange', 'Orange', 'fruit', 130, '1 medium', [62, 1.2, 15, 0.2, 3.1, 0.1, 52, 0, 0, 70, 40, 0.1, 13, 0.01], 'vegan', [], '#F59E3B', ['fruit', 'vitamin-c']],
  ['papaya', 'Papaya Bowl', 'fruit', 150, '1 bowl', [65, 0.7, 16, 0.4, 2.5, 0.4, 30, 0, 0, 90, 55, 0.1, 30, 0], 'vegan', [], '#F8955A', ['fruit', 'vitamin-c']],
  ['guava', 'Guava', 'fruit', 100, '1 medium', [68, 2.6, 14, 1, 5.4, 0.3, 18, 0, 0, 228, 49, 0.2, 22, 0.1], 'vegan', [], '#A9CF5B', ['fruit', 'vitamin-c']],
  ['fruit_bowl', 'Mixed Fruit Bowl', 'fruit', 200, '1 bowl', [120, 1.5, 30, 0.5, 4, 0.6, 25, 0, 0, 60, 30, 0.2, 25, 0.05], 'vegan', [], '#F27E6B', ['fruit']],
  ['milk', 'Toned Milk (fortified)', 'drink', 250, '1 glass', [150, 8, 12, 8, 0, 0.1, 300, 2.5, 1.1, 0, 12, 1, 27, 0.02], 'veg', ['dairy'], '#FBFBF5', ['calcium', 'fortified']],
  ['curd', 'Curd / Dahi', 'side', 150, '1 bowl', [90, 5, 7, 5, 0, 0.1, 180, 0.1, 0.6, 1, 10, 0.8, 17, 0.01], 'veg', ['dairy'], '#F8F6EE', ['probiotic', 'calcium']],
  ['chaas', 'Chaas', 'drink', 250, '1 glass', [40, 2, 5, 1, 0, 0.1, 120, 0, 0.3, 1, 5, 0.4, 10, 0], 'veg', ['dairy'], '#EEF2E6', ['light', 'probiotic']],
  ['lassi', 'Sweet Lassi', 'drink', 250, '1 glass', [220, 7, 34, 6, 0, 0.1, 240, 0.1, 0.8, 1, 12, 0.9, 22, 0.01], 'veg', ['dairy'], '#F7F0DC', []],
  ['chai', 'Masala Chai', 'drink', 150, '1 cup', [90, 3, 12, 3.5, 0, 0.2, 100, 0.5, 0.3, 0, 5, 0.3, 10, 0], 'veg', ['dairy'], '#C99A6B', ['indian']],
  ['coffee', 'Black Coffee', 'drink', 200, '1 cup', [5, 0.3, 0, 0, 0, 0.1, 5, 0, 0, 0, 5, 0, 7, 0], 'vegan', [], '#5B3A29', []],
  ['greek_yogurt', 'Greek Yogurt', 'snack', 150, '1 cup', [130, 15, 6, 5, 0, 0.1, 170, 0, 0.8, 0, 10, 0.8, 17, 0], 'veg', ['dairy'], '#FAF8F2', ['high-protein']],
  ['coconut_water', 'Coconut Water', 'drink', 250, '1 glass', [45, 1.7, 9, 0.5, 2.6, 0.7, 58, 0, 0, 6, 7, 0.3, 60, 0], 'vegan', [], '#E6F0CF', ['hydration']],
  ['lime_water', 'Fresh Lime Water', 'drink', 250, '1 glass', [30, 0.2, 8, 0, 0, 0.1, 5, 0, 0, 15, 3, 0, 3, 0], 'vegan', [], '#E9F5B8', ['hydration']],
  ['cola', 'Cola (330 ml)', 'drink', 330, '1 can', [140, 0, 35, 0, 0, 0, 7, 0, 0, 0, 0, 0, 3, 0], 'vegan', [], '#6B3A2A', ['sugary']],
  ['protein_shake', 'Whey Protein Shake', 'drink', 300, '1 shaker', [260, 32, 18, 6, 0, 0.6, 400, 1.2, 1.5, 0, 20, 2.5, 60, 0], 'veg', ['dairy'], '#E8DCC9', ['high-protein']],

  // ---------- mains (veg) ----------
  ['dal_tadka', 'Dal Tadka', 'main', 180, '1 bowl', [220, 11, 28, 7, 7, 2.8, 45, 0, 0, 4, 140, 1.4, 60, 0.05], 'vegan', [], '#F6E7B4', ['indian', 'lentil']],
  ['palak_dal', 'Palak Dal', 'main', 180, '1 bowl', [210, 12, 26, 6, 8, 4.2, 90, 0, 0, 18, 190, 1.6, 85, 0.06], 'vegan', [], '#8DB255', ['indian', 'lentil', 'iron']],
  ['rajma', 'Rajma', 'main', 180, '1 bowl', [240, 12, 32, 7, 9, 3.8, 70, 0, 0, 4, 150, 1.6, 70, 0.1], 'vegan', [], '#A3453A', ['indian', 'iron']],
  ['chole', 'Chole', 'main', 180, '1 bowl', [270, 12, 36, 9, 9, 4, 80, 0, 0, 4, 180, 2, 70, 0.08], 'vegan', [], '#C07A3B', ['indian', 'iron']],
  ['kadhi', 'Kadhi', 'main', 180, '1 bowl', [190, 7, 14, 11, 2, 0.9, 180, 0, 0.3, 2, 30, 0.7, 25, 0.02], 'veg', ['dairy'], '#F2D25B', ['indian']],
  ['palak_paneer', 'Palak Paneer', 'main', 180, '1 bowl', [290, 14, 10, 22, 4, 3.5, 380, 0.1, 0.4, 25, 140, 1.6, 80, 0.1], 'veg', ['dairy'], '#5E9B4A', ['indian', 'iron', 'calcium']],
  ['paneer_butter_masala', 'Paneer Butter Masala', 'main', 180, '1 bowl', [420, 16, 14, 33, 2, 1.2, 350, 0.2, 0.5, 8, 25, 1.5, 35, 0.1], 'veg', ['dairy', 'nuts'], '#E8763E', ['indian', 'heavy']],
  ['paneer_tikka', 'Paneer Tikka', 'main', 150, '6 pieces', [300, 20, 8, 21, 2, 1, 420, 0.2, 0.6, 15, 20, 2, 30, 0.05], 'veg', ['dairy'], '#E58B47', ['high-protein', 'calcium']],
  ['mixed_veg', 'Mixed Veg Sabzi', 'side', 90, '1 katori', [95, 2.5, 10, 5, 3.5, 1, 40, 0, 0, 20, 30, 0.4, 25, 0.03], 'vegan', [], '#7DBE6A', ['indian']],
  ['bhindi', 'Bhindi Masala', 'side', 120, '1 katori', [130, 3, 11, 9, 4, 0.8, 90, 0, 0, 18, 70, 0.6, 55, 0.03], 'vegan', [], '#5C9E46', ['indian']],
  ['aloo_gobi', 'Aloo Gobi', 'side', 150, '1 katori', [170, 4, 20, 9, 4, 1, 30, 0, 0, 45, 50, 0.5, 25, 0.04], 'vegan', [], '#EDCB57', ['indian']],
  ['baingan_bharta', 'Baingan Bharta', 'side', 150, '1 katori', [140, 3, 13, 9, 6, 0.6, 20, 0, 0, 6, 30, 0.4, 25, 0.03], 'vegan', [], '#8A5A6E', ['indian']],
  ['mushroom_masala', 'Mushroom Masala', 'main', 150, '1 bowl', [140, 5, 10, 9, 3, 1.2, 15, 4, 0.1, 3, 25, 0.8, 15, 0.02], 'vegan', [], '#A98563', ['vitamin-d']],
  ['sarson_saag', 'Sarson ka Saag', 'main', 180, '1 bowl', [200, 6, 12, 14, 6, 3.5, 250, 0, 0, 60, 180, 0.8, 55, 0.15], 'veg', ['dairy'], '#4E8C3A', ['indian', 'iron', 'calcium']],
  ['soya_curry', 'Soya Chunks Curry', 'main', 180, '1 bowl', [230, 22, 16, 8, 7, 5, 150, 0, 0, 4, 180, 2.5, 90, 0.2], 'vegan', ['soy'], '#B5733F', ['high-protein', 'iron']],
  ['tofu_stirfry', 'Tofu Stir Fry', 'main', 200, '1 plate', [240, 18, 12, 14, 3, 3.5, 350, 0, 0, 20, 40, 2, 70, 0.5], 'vegan', ['soy'], '#E4C86E', ['high-protein', 'calcium']],
  ['khichdi', 'Moong Khichdi', 'main', 250, '1 bowl', [290, 11, 48, 6, 5, 2.2, 40, 0, 0, 2, 90, 1.5, 60, 0.03], 'vegan', [], '#EBD27E', ['indian', 'light']],
  ['curd_rice', 'Curd Rice', 'main', 220, '1 bowl', [280, 8, 44, 8, 1, 0.5, 200, 0.1, 0.6, 1, 12, 1, 25, 0.02], 'veg', ['dairy'], '#F7F4EA', ['indian', 'probiotic']],
  ['veg_biryani', 'Veg Biryani', 'main', 300, '1 plate', [440, 10, 70, 13, 5, 2, 60, 0, 0, 10, 35, 1.5, 50, 0.05], 'veg', ['dairy'], '#E9A54B', ['indian']],
  ['veg_pulao', 'Veg Pulao', 'main', 200, '1 plate', [280, 6, 46, 8, 3, 1.2, 30, 0, 0, 8, 20, 0.9, 30, 0.03], 'vegan', [], '#EFCF84', ['indian']],
  ['quinoa_salad', 'Quinoa Salad Bowl', 'main', 250, '1 bowl', [340, 12, 44, 13, 7, 3, 60, 0, 0, 25, 90, 2, 110, 0.15], 'vegan', [], '#C5D97A', ['high-fiber']],
  ['hummus_veggies', 'Hummus + Veggie Sticks', 'snack', 180, '1 plate', [200, 7, 18, 12, 6, 2, 50, 0, 0, 15, 60, 1, 50, 0.1], 'vegan', [], '#E9D29A', ['healthy-fat']],
  ['tomato_soup', 'Tomato Soup', 'side', 250, '1 bowl', [110, 2.5, 16, 4, 3, 1.2, 25, 0, 0, 25, 25, 0.3, 25, 0.02], 'veg', ['dairy'], '#DE4F3A', ['light']],
  ['green_salad', 'Green Salad', 'side', 150, '1 bowl', [40, 2, 7, 0.4, 3, 1, 45, 0, 0, 30, 90, 0.3, 25, 0.03], 'vegan', [], '#86C25E', ['light']],

  // ---------- staples ----------
  ['roti', 'Whole Wheat Roti', 'staple', 40, '1 roti', [120, 3.5, 20, 3, 3, 1.2, 12, 0, 0, 0, 10, 0.6, 30, 0.02], 'vegan', ['gluten'], '#E2C089', ['indian']],
  ['makki_roti', 'Makki Roti', 'staple', 60, '1 roti', [160, 3.5, 28, 4, 3, 1, 6, 0, 0, 0, 10, 0.6, 40, 0.02], 'vegan', [], '#E8B640', ['indian']],
  ['rice', 'Steamed Rice', 'staple', 150, '1 katori', [195, 4, 43, 0.4, 0.6, 0.3, 8, 0, 0, 0, 4, 0.6, 15, 0], 'vegan', [], '#FBF8EE', ['indian']],
  ['jeera_rice', 'Jeera Rice', 'staple', 150, '1 katori', [210, 4, 40, 4, 1, 0.6, 10, 0, 0, 0, 5, 0.7, 18, 0.01], 'vegan', [], '#F6EED2', ['indian']],
  ['brown_rice', 'Brown Rice', 'staple', 150, '1 katori', [170, 4, 36, 1.4, 2.7, 0.6, 10, 0, 0, 0, 6, 0.9, 60, 0.02], 'vegan', [], '#C9A878', ['high-fiber']],

  // ---------- mains (egg / non-veg) ----------
  ['egg_curry', 'Egg Curry', 'main', 200, '2 eggs', [280, 15, 10, 20, 2, 2.4, 80, 2.2, 1.1, 8, 60, 1.5, 25, 0.1], 'egg', ['egg'], '#E2913C', ['indian', 'vitamin-d']],
  ['chicken_curry', 'Chicken Curry', 'main', 200, '1 bowl', [330, 30, 8, 19, 2, 2, 40, 0.2, 0.7, 6, 20, 2.6, 40, 0.1], 'nonveg', [], '#C8642F', ['indian', 'high-protein']],
  ['butter_chicken', 'Butter Chicken', 'main', 200, '1 bowl', [440, 30, 10, 30, 2, 1.8, 80, 0.3, 0.7, 6, 15, 2.5, 40, 0.1], 'nonveg', ['dairy', 'nuts'], '#E66B33', ['indian', 'heavy']],
  ['grilled_chicken', 'Grilled Chicken Breast', 'main', 150, '1 breast', [250, 46, 0, 6, 0, 1.4, 20, 0.2, 0.5, 0, 6, 1.5, 45, 0.05], 'nonveg', [], '#D9A06A', ['high-protein', 'lean']],
  ['tandoori_chicken', 'Tandoori Chicken', 'main', 200, '2 pieces', [300, 40, 6, 12, 1, 2, 40, 0.2, 0.6, 3, 15, 2.6, 45, 0.06], 'nonveg', ['dairy'], '#D4482F', ['indian', 'high-protein']],
  ['chicken_biryani', 'Chicken Biryani', 'main', 300, '1 plate', [520, 28, 62, 17, 3, 2.5, 60, 0.2, 0.6, 4, 30, 2.5, 50, 0.08], 'nonveg', ['dairy'], '#DE9440', ['indian']],
  ['mutton_curry', 'Mutton Curry', 'main', 200, '1 bowl', [400, 32, 6, 27, 1, 3.6, 30, 0.1, 2.6, 4, 10, 6, 35, 0.08], 'nonveg', [], '#9C4A2B', ['indian', 'iron', 'b12']],
  ['fish_curry', 'Fish Curry', 'main', 200, '1 bowl', [260, 28, 8, 13, 2, 1.6, 60, 6, 2.4, 5, 20, 1, 50, 1.1], 'nonveg', ['seafood'], '#E5A03E', ['indian', 'omega-3', 'vitamin-d']],
  ['fish_fry', 'Fish Fry', 'main', 120, '2 pieces', [270, 24, 8, 16, 0.5, 1.2, 50, 5, 2, 0, 15, 0.8, 35, 0.8], 'nonveg', ['seafood'], '#C98A3D', ['omega-3', 'vitamin-d']],
  ['salmon', 'Grilled Salmon', 'main', 150, '1 fillet', [310, 33, 0, 19, 0, 0.8, 15, 14, 4.2, 0, 40, 0.6, 45, 2.3], 'nonveg', ['seafood'], '#F08B6A', ['omega-3', 'vitamin-d', 'b12']],
  ['prawn_curry', 'Prawn Curry', 'main', 200, '1 bowl', [250, 24, 8, 13, 2, 2.4, 90, 0.1, 1.4, 6, 20, 1.6, 50, 0.4], 'nonveg', ['seafood'], '#EA7C4F', ['indian']],
  ['chicken_quinoa', 'Grilled Chicken Quinoa Bowl', 'main', 300, '1 bowl', [450, 38, 38, 14, 6, 3.2, 50, 0.2, 0.4, 20, 60, 2.8, 110, 0.1], 'nonveg', [], '#C3B26C', ['high-protein']],
  ['caesar_salad', 'Chicken Caesar Salad', 'main', 250, '1 bowl', [380, 30, 12, 24, 4, 2, 140, 0.3, 0.6, 20, 90, 2, 40, 0.1], 'nonveg', ['dairy', 'gluten', 'egg'], '#B8D477', []],
  ['egg_sandwich', 'Egg Sandwich', 'snack', 160, '1 sandwich', [340, 17, 32, 15, 3, 2.6, 120, 1.6, 0.8, 4, 60, 1.6, 30, 0.06], 'egg', ['gluten', 'egg'], '#F0D36E', []],
  ['chicken_momos', 'Chicken Momos (6)', 'snack', 180, '6 pieces', [320, 18, 38, 10, 2, 1.8, 30, 0.1, 0.3, 4, 25, 1.6, 30, 0.03], 'nonveg', ['gluten'], '#F4EDE0', ['street']],
  ['chicken_burger', 'Chicken Burger', 'junk', 200, '1 burger', [480, 25, 45, 22, 3, 3, 90, 0.2, 0.4, 3, 40, 2, 40, 0.06], 'nonveg', ['gluten', 'egg'], '#C88A44', ['fast-food']],

  // ---------- snacks ----------
  ['roasted_chana', 'Roasted Chana', 'snack', 40, '1 handful', [150, 8, 24, 2.5, 6, 2, 24, 0, 0, 0, 80, 1.2, 60, 0.03], 'vegan', [], '#C99245', ['high-protein', 'iron']],
  ['makhana', 'Roasted Makhana', 'snack', 30, '1 bowl', [110, 3, 20, 1, 4, 0.5, 15, 0, 0, 0, 5, 0.3, 60, 0], 'vegan', [], '#F4EFE2', ['light']],
  ['almonds', 'Almonds (15)', 'snack', 20, '15 almonds', [115, 4.2, 4.3, 10, 2.5, 0.7, 54, 0, 0, 0, 10, 0.6, 54, 0], 'vegan', ['nuts'], '#B07A4E', ['healthy-fat']],
  ['walnuts', 'Walnuts (5)', 'snack', 20, '5 halves', [130, 3, 2.7, 13, 1.3, 0.6, 20, 0, 0, 0, 20, 0.6, 32, 1.8], 'vegan', ['nuts'], '#A9805A', ['omega-3', 'healthy-fat']],
  ['peanut_chikki', 'Peanut Chikki', 'snack', 30, '1 bar', [150, 4, 16, 8, 1.5, 1, 15, 0, 0, 0, 20, 0.6, 35, 0], 'vegan', ['nuts'], '#C08A3E', []],
  ['dates', 'Dates (3)', 'snack', 24, '3 dates', [70, 0.6, 18, 0, 2, 0.3, 15, 0, 0, 0, 4, 0.1, 13, 0], 'vegan', [], '#7A4630', ['iron']],
  ['jaggery', 'Jaggery (gur)', 'snack', 15, '1 piece', [57, 0, 14, 0, 0, 1.6, 12, 0, 0, 0, 0, 0, 10, 0], 'vegan', [], '#B5772C', ['iron']],
  ['dark_chocolate', 'Dark Chocolate (70%)', 'snack', 20, '2 squares', [120, 1.5, 9, 8.5, 2, 2.4, 15, 0, 0, 0, 0, 0.7, 45, 0], 'vegan', [], '#4A2C22', ['iron']],
  ['dhokla', 'Dhokla (4)', 'snack', 120, '4 pieces', [160, 6, 26, 4, 2, 1.2, 30, 0, 0, 1, 30, 0.5, 30, 0.02], 'vegan', [], '#F1D35A', ['indian', 'fermented']],
  ['bhel', 'Bhel Puri', 'snack', 120, '1 plate', [230, 5, 38, 7, 4, 1.6, 25, 0, 0, 12, 30, 0.6, 35, 0.03], 'vegan', [], '#E5BE6B', ['street']],
  ['veg_sandwich', 'Grilled Veg Sandwich', 'snack', 170, '1 sandwich', [300, 9, 40, 11, 5, 2, 150, 0, 0.2, 15, 50, 1, 35, 0.03], 'veg', ['gluten', 'dairy'], '#D8B26C', []],
  ['veg_momos', 'Veg Momos (6)', 'snack', 180, '6 pieces', [270, 8, 42, 7, 3, 1.6, 40, 0, 0, 8, 30, 0.6, 25, 0.02], 'vegan', ['gluten'], '#F6F0E4', ['street']],

  // ---------- street food / fast food / dessert ----------
  ['samosa', 'Samosa', 'junk', 80, '1 piece', [260, 4, 24, 17, 2, 1, 15, 0, 0, 4, 15, 0.4, 15, 0.02], 'vegan', ['gluten'], '#D59A45', ['fried', 'street']],
  ['vada_pav', 'Vada Pav', 'junk', 140, '1 piece', [290, 6, 40, 12, 3, 1.6, 40, 0, 0, 6, 25, 0.6, 25, 0.02], 'vegan', ['gluten'], '#D9A24C', ['fried', 'street']],
  ['pani_puri', 'Pani Puri (6)', 'junk', 120, '6 puris', [220, 4, 34, 8, 3, 1.2, 20, 0, 0, 8, 30, 0.5, 20, 0.02], 'vegan', ['gluten'], '#E6C27A', ['street']],
  ['pav_bhaji', 'Pav Bhaji', 'junk', 300, '1 plate', [480, 11, 62, 21, 8, 2.6, 90, 0, 0, 30, 60, 1.4, 60, 0.05], 'veg', ['gluten', 'dairy'], '#D8582F', ['street']],
  ['chole_bhature', 'Chole Bhature', 'junk', 300, '1 plate', [650, 16, 72, 32, 8, 4, 90, 0, 0, 4, 150, 2, 70, 0.1], 'veg', ['gluten', 'dairy'], '#C9853A', ['fried', 'heavy']],
  ['pizza', 'Margherita Pizza (2 slices)', 'junk', 220, '2 slices', [540, 22, 66, 20, 3, 3, 380, 0.2, 0.8, 4, 60, 2.5, 40, 0.05], 'veg', ['gluten', 'dairy'], '#E14F35', ['fast-food']],
  ['veg_burger', 'Veg Burger', 'junk', 190, '1 burger', [420, 11, 52, 18, 4, 2.6, 120, 0, 0, 4, 50, 1.2, 40, 0.05], 'veg', ['gluten', 'dairy'], '#C78B49', ['fast-food']],
  ['fries', 'French Fries (medium)', 'junk', 117, '1 medium', [365, 4, 48, 17, 4, 0.9, 19, 0, 0, 6, 45, 0.6, 40, 0.1], 'vegan', [], '#F2C14E', ['fried', 'fast-food']],
  ['pasta_white', 'White Sauce Pasta', 'junk', 250, '1 plate', [480, 15, 58, 21, 3, 1.6, 220, 0.4, 0.6, 4, 40, 1.4, 40, 0.05], 'veg', ['gluten', 'dairy'], '#F2E6C4', ['heavy']],
  ['pasta_red', 'Arrabbiata Pasta', 'main', 250, '1 plate', [390, 12, 64, 10, 5, 2.4, 50, 0, 0, 15, 60, 1.2, 60, 0.05], 'vegan', ['gluten'], '#D9483A', []],
  ['maggi', 'Instant Noodles', 'junk', 300, '1 pack', [350, 8, 50, 13, 2, 2.5, 20, 0, 0, 0, 30, 0.6, 20, 0], 'vegan', ['gluten'], '#F0C94A', ['processed']],
  ['hakka_noodles', 'Hakka Noodles', 'junk', 250, '1 plate', [420, 9, 58, 16, 3, 2, 30, 0, 0, 15, 40, 0.8, 30, 0.03], 'vegan', ['gluten', 'soy'], '#D6A55A', []],
  ['fried_rice', 'Veg Fried Rice', 'junk', 250, '1 plate', [390, 8, 62, 12, 3, 1.4, 30, 0, 0, 8, 25, 0.9, 30, 0.03], 'vegan', ['soy'], '#E1C27A', []],
  ['gulab_jamun', 'Gulab Jamun (2)', 'dessert', 80, '2 pieces', [300, 4, 46, 12, 0.5, 0.6, 80, 0, 0.2, 0, 5, 0.3, 10, 0], 'veg', ['dairy', 'gluten'], '#8C3B24', ['sugary']],
  ['kheer', 'Rice Kheer', 'dessert', 150, '1 bowl', [250, 7, 38, 8, 0.5, 0.3, 220, 0.3, 0.6, 1, 10, 0.8, 25, 0], 'veg', ['dairy', 'nuts'], '#F7EED8', ['sugary']],
  ['ice_cream', 'Ice Cream (1 scoop)', 'dessert', 70, '1 scoop', [140, 2.5, 16, 7, 0.5, 0.1, 90, 0.1, 0.3, 0, 5, 0.4, 10, 0], 'veg', ['dairy'], '#F6D9E2', ['sugary']],
]

export const FOODS = RAW.map(([id, name, category, grams, serving, n, diet, allergens, color, tags]) => {
  const nutrients = {}
  KEYS.forEach((k, i) => { nutrients[k] = n[i] })
  return { id, name, category, grams, serving, n: nutrients, diet, allergens, color, tags }
})

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]))

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'main', label: 'Mains' },
  { id: 'staple', label: 'Roti & Rice' },
  { id: 'side', label: 'Sides' },
  { id: 'snack', label: 'Snacks' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'drink', label: 'Drinks' },
  { id: 'junk', label: 'Street & Fast' },
  { id: 'dessert', label: 'Desserts' },
]

export function getFood(id) {
  return FOOD_BY_ID[id]
}
