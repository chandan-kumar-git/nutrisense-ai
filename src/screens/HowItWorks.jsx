import { TopBar } from '../components/ui'
import { FOODS } from '../data/foods'
import { MEALS, SCAN_SCENARIOS } from '../data/meals'
import { NUTRIENTS } from '../engine/nutrition'

const STEPS = [
  ['User input', 'Age, sex, height, weight, activity, diet preference, allergies, goal, plus meals via photo, barcode, label or search.'],
  ['Preprocessing', 'Images are centre-cropped, resized to 224×224 and normalised. Profile data is validated, missing values defaulted and categories encoded.'],
  ['Deep learning', 'A CNN (transfer-learned from ImageNet) classifies each food region; portion size is estimated from plate-relative area.'],
  ['Requirement estimation', 'Energy: Mifflin-St Jeor BMR × activity factor ± goal. Micronutrients: ICMR-NIN 2020 RDAs by age and sex.'],
  ['Gap analysis', '7-day average intake ÷ requirement → ≥80% adequate, 50–79% needs attention, <50% higher priority.'],
  ['Recommendation', 'Meals are scored by how much of each gap they close per calorie, filtered by diet and allergies, and diversified to avoid repeats.'],
  ['Personalised output', 'What needs attention, why it matters, food sources, meal ideas and how to spread them across the day.'],
]

const APPROACHES = [
  ['Rule-based', 'Simple, explainable, low compute', 'Limited personalisation', 'Baseline', false],
  ['ML recommender', 'Learns patterns beyond fixed rules', 'Depends on features & data quality', 'Stronger personalisation', false],
  ['Deep learning + personalised rec.', 'Complex relationships, multiple data types, image analysis', 'More data, validation & development', 'Selected', true],
]

export default function HowItWorks() {
  return (
    <div className="screen no-nav">
      <TopBar title="How the AI works" />
      <div className="card-lime">
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginTop: 4 }}>From your plate to a decision, in six steps</div>
      </div>

      <div className="card">
        {STEPS.map(([t, d], i) => (
          <div key={t} className="row" style={{ alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < STEPS.length - 1 ? '1px solid var(--line)' : 0 }}>
            <span className="list-ic" style={{ background: i === 2 ? 'var(--lime)' : 'var(--chip)', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
            <div>
              <div className="small bold">{t}</div>
              <div className="tiny muted" style={{ lineHeight: 1.5, marginTop: 2 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Model card</div>
      <div className="card">
        <div className="kv"><span>Task</span><span>Multi-item food recognition</span></div>
        <div className="kv"><span>Architecture</span><span>EfficientNet-B0 / MobileNetV3</span></div>
        <div className="kv"><span>Training data</span><span>Food-101 + Indian food sets</span></div>
        <div className="kv"><span>Classes in this build</span><span>{FOODS.length} foods · {SCAN_SCENARIOS.length} plates</span></div>
        <div className="kv"><span>Nutrient knowledge base</span><span>IFCT 2017 + USDA FDC</span></div>
        <div className="kv"><span>Meal combinations</span><span>{MEALS.length}</span></div>
        <div className="kv"><span>Nutrients tracked</span><span>{NUTRIENTS.length + 3}</span></div>
        <div className="kv"><span>Target top-1 accuracy</span><span>≥ 85% (to be validated)</span></div>
        <div className="kv"><span>Portion error target</span><span>± 15%</span></div>
        <div className="tip small" style={{ background: '#fff4cc', borderRadius: 12, padding: 10, marginTop: 10, lineHeight: 1.5 }}>
          <b>Prototype note:</b> this demo build runs fully offline. Recognition results come from a curated set of labelled plates that mimic model output (confidence, alternatives, portions) so the full workflow can be tested before the trained model is integrated.
        </div>
      </div>

      <div className="section-title">Why deep learning</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {APPROACHES.map(([a, s, t, f, sel]) => (
          <div key={a} style={{ padding: 12, background: sel ? '#FFD84D' : '#fff', borderBottom: '1px solid var(--line)' }}>
            <div className="between">
              <span className="small bold">{a}</span>
              <span className="badge" style={{ background: sel ? '#fff' : 'var(--chip)' }}>{f}</span>
            </div>
            <div className="tiny" style={{ marginTop: 4, lineHeight: 1.5 }}>
              <b>Strength:</b> {s} · <b>Trade-off:</b> {t}
            </div>
          </div>
        ))}
        <div className="tiny" style={{ padding: 12, background: '#AAEAC8', lineHeight: 1.5 }}>
          <b>Decision:</b> chosen for personalisation, learning capability, adaptability and scalability, not because deep learning is automatically more accurate.
        </div>
      </div>

      <div className="section-title">Known limitations</div>
      <div className="card col small" style={{ gap: 8, lineHeight: 1.5 }}>
        <div>• Mixed dishes (curries, thalis) vary by recipe; values are averages.</div>
        <div>• Portion size from a single photo is approximate. Adjust it in Meal details.</div>
        <div>• RDAs are population estimates for healthy adults, not individual prescriptions.</div>
        <div>• Gap analysis is only as good as what you log. Missed meals look like gaps.</div>
        <div>• Not validated for pregnancy, children, athletes or clinical conditions.</div>
      </div>
      <div className="disclaimer">Illustrative stack: React · FastAPI · TensorFlow/PyTorch · scikit-learn · Pandas · PostgreSQL</div>
    </div>
  )
}
