import { Code2, Scale, Presentation } from 'lucide-react'
import { TopBar, FoodImg } from '../components/ui'
import CREDITS from '../data/photoCredits.json'
import { FOOD_BY_ID } from '../data/foods'

const TEAM = [
  { group: 'Computer Science · 4', role: 'Build it', Icon: Code2, people: ['Garveet Singh', 'Vishwas Ahuja', 'Chandan Kumar', 'Reedima'], body: 'Datasets, preprocessing, ML/DL models, recommendation engine, application, integration, testing and deployment.', bg: '#fff' },
  { group: 'Law · 2', role: 'Protect it', Icon: Scale, people: ['Prerna Singh', 'Mehak Kamboj'], body: 'Privacy, consent, user rights, data protection, responsible AI, terms, disclaimers and the medical boundary.', bg: '#FFD84D' },
  { group: 'Management · 1', role: 'Make it practical', Icon: Presentation, people: ['Kushagra Sharma'], body: 'Requirements, target users, feasibility, resources, risk, adoption, positioning and scalability.', bg: '#fff' },
]

const PHASES = ['Problem identification & research', 'Dataset & knowledge preparation', 'AI / model development', 'Recommendation engine', 'Application development', 'Testing, evaluation & presentation']

export default function About() {
  return (
    <div className="screen no-nav">
      <TopBar title="About the project" />
      <div className="card-dark">
        <div className="tiny" style={{ color: 'var(--lime)', fontWeight: 800, letterSpacing: '.06em' }}>INTERDISCIPLINARY DESIGN PROJECT · P020</div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>AI Nutrition Detection and Diet Suggestion using Deep Learning</div>
        <div className="small" style={{ marginTop: 8, opacity: 0.85 }}>Mentor: Dr. Vivek Sharma</div>
      </div>

      <div className="card small" style={{ lineHeight: 1.6 }}>
        <b>The problem.</b> Nutrition needs vary, but diet advice is often generic. People log food yet still can’t tell whether their intake meets their needs. The gap isn’t calorie counting; it’s turning data into a decision.
      </div>

      <div className="section-title">Accountability by design</div>
      {TEAM.map((t) => (
        <div key={t.role} className="card" style={{ background: t.bg, borderTop: '4px solid var(--ink)' }}>
          <t.Icon size={22} />
          <div className="tiny bold" style={{ color: t.bg === '#fff' ? '#2563eb' : 'var(--ink)', marginTop: 8, letterSpacing: '.04em' }}>{t.group.toUpperCase()} STUDENTS</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{t.role}</div>
          <div className="small" style={{ marginTop: 4, lineHeight: 1.5 }}>{t.body}</div>
          <div className="chips" style={{ marginTop: 10, gap: 6 }}>
            {t.people.map((p) => (
              <span key={p} className="chip soft" style={{ padding: '5px 10px', fontSize: 11 }}>{p}</span>
            ))}
          </div>
        </div>
      ))}

      <div className="section-title">Delivery plan</div>
      <div className="card">
        {PHASES.map((p, i) => (
          <div key={p} className="row" style={{ padding: '8px 0', borderBottom: i < PHASES.length - 1 ? '1px dashed var(--line)' : 0 }}>
            <span className="list-ic" style={{ width: 30, height: 30, borderRadius: 10, fontWeight: 800, fontSize: 12, background: i < 5 ? 'var(--lime)' : 'var(--chip)' }}>{String(i + 1).padStart(2, '0')}</span>
            <span className="small bold grow">{p}</span>
          </div>
        ))}
      </div>
      <div className="section-title">Photo credits</div>
      <div className="card" style={{ padding: '4px 16px' }}>
        <div className="list">
          {Object.entries(CREDITS)
            .filter(([id]) => FOOD_BY_ID[id])
            .map(([id, c]) => (
              <a key={id} className="list-row" href={c.source} target="_blank" rel="noreferrer">
                <FoodImg id={id} size={40} round alt="" />
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="small bold" style={{ display: 'block' }}>{FOOD_BY_ID[id].name}</span>
                  <span className="tiny muted ellipsis" style={{ display: 'block' }}>
                    {c.author} · {c.license} · Wikimedia Commons
                  </span>
                </span>
              </a>
            ))}
        </div>
      </div>
      <div className="boundary" style={{ textAlign: 'center' }}>
        <b>Goal:</b> an understandable, personalised, responsible nutrition assistant, not a clinical diagnosis tool.
      </div>
    </div>
  )
}
