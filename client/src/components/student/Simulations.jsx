import { useState } from 'react';
import { SKILL_GROUPS, SCENARIO_TYPES, findScenarios } from '../../data/simulationScenarios';
import { speak, stopSpeaking, speechSupported } from '../../utils/speech';
import { ResponderAvatar, PatientAvatar, SimScene } from './simulation/Characters';

function SpeakButton({ text, label = 'Read aloud' }) {
  if (!speechSupported()) return null;
  return (
    <button type="button" className="ghost" onClick={() => speak(text)} style={{ fontSize: 12.5 }}>
      🔊 {label}
    </button>
  );
}

function VitalsGrid({ vitals }) {
  const rows = [
    ['Heart rate', vitals.hr],
    ['Respirations', vitals.rr],
    ['Blood pressure', vitals.bp],
    ['Skin', vitals.skin],
    ['LOC', vitals.loc],
  ];
  return (
    <div className="vitals">
      {rows.map(([label, value]) => (
        <div className="vital" key={label}>
          <div className="label">{label}</div>
          <div className="value" style={{ fontSize: 16 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function SkillPicker({ onGenerate }) {
  const [type, setType] = useState('');
  const [skills, setSkills] = useState([]);

  function toggleSkill(skill) {
    setSkills((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  }

  const matchCount = findScenarios({ type: type || null, skills }).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Simulations</h1>
          <div className="sub">
            Select a scenario type and any skills, then click Generate. Scenarios include voice-over,
            branching outcomes based on your choices, and a debrief.
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Scenario type</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {SCENARIO_TYPES.map((t) => (
            <button key={t} type="button" className={type === t ? '' : 'ghost'} onClick={() => setType(type === t ? '' : t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(SKILL_GROUPS).map(([key, group]) => (
        <div className="card" key={key}>
          <h2>{group.label}</h2>
          {group.sourceNote && (
            <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>{group.sourceNote}</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
            {group.skills.map((skill) => (
              <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, fontSize: 13.5, marginBottom: 0 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={skills.includes(skill)} onChange={() => toggleSkill(skill)} />
                {skill}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
          {type || skills.length > 0
            ? `${matchCount} scenario${matchCount === 1 ? '' : 's'} match your selection.`
            : 'Leave everything unselected to draw from every scenario.'}
        </p>
        <button
          className="primary"
          disabled={matchCount === 0}
          onClick={() => onGenerate({ type: type || null, skills })}
        >
          Generate Scenario
        </button>
      </div>
    </>
  );
}

function Brief({ scenario, onBegin }) {
  const fullText = `${scenario.instructions} ${scenario.dispatch}`;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Generated Scenario</h1>
          <div className="sub">
            <span className="badge draft" style={{ marginRight: 6 }}>{scenario.type}</span>
            <span className="badge draft">{scenario.skill}</span>
          </div>
        </div>
        <SpeakButton text={fullText} />
      </div>

      <SimScene>
        <ResponderAvatar pose="radio" label="En route to scene" />
      </SimScene>

      <div className="card">
        <h2>Instructions (Read to Candidate)</h2>
        <p>{scenario.instructions}</p>
      </div>

      <div className="card">
        <h2>Nature of Illness / Dispatch Information</h2>
        <p>{scenario.dispatch}</p>
      </div>

      {scenario.whyItMatters && (
        <div className="card">
          <h2>Why it matters</h2>
          <p>{scenario.whyItMatters}</p>
          {scenario.objectives && (
            <ul className="objective-list">
              {scenario.objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          )}
        </div>
      )}

      {scenario.important && (
        <div className="alert">
          <strong>Important:</strong> {scenario.important}
        </div>
      )}

      <div className="card">
        <button className="primary" onClick={onBegin}>Begin scenario</button>
      </div>
    </>
  );
}

function Assess({ scenario, onSubmit }) {
  const [selected, setSelected] = useState([]);
  const findingsText = scenario.findings.join('. ');

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <>
      <div className="page-head">
        <div><h1>{scenario.skill}</h1><div className="sub">Assessment findings and initial vital signs</div></div>
        <SpeakButton text={findingsText} label="Read findings" />
      </div>

      <SimScene>
        <ResponderAvatar pose="assessing" label="Assessing" />
        <PatientAvatar status="distress" label={scenario.initialVitals.skin} />
      </SimScene>

      <div className="card">
        <h2>Pertinent Information / Findings</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          {scenario.findings.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      </div>

      <div className="card">
        <h2>Initial Vital Signs</h2>
        <VitalsGrid vitals={scenario.initialVitals} />
      </div>

      <div className="card">
        <h2>What do you do?</h2>
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
          Select every action you would take, in the order your protocol calls for them. This isn't
          timed — think it through like a real call.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
          {scenario.actions.map((a) => (
            <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, fontSize: 13.5, marginBottom: 0 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
              {a.label}
            </label>
          ))}
        </div>
        <button className="primary" style={{ marginTop: 16 }} disabled={selected.length === 0} onClick={() => onSubmit(selected)}>
          Confirm actions
        </button>
      </div>
    </>
  );
}

function Outcome({ scenario, selected, onContinue }) {
  const criticalActions = scenario.actions.filter((a) => a.critical);
  const criticalHit = criticalActions.filter((a) => selected.includes(a.id)).length;
  const harmfulHit = scenario.actions.some((a) => a.harmful && selected.includes(a.id));
  const passed = criticalActions.length > 0 && criticalHit / criticalActions.length >= 0.7 && !harmfulHit;
  const outcome = passed ? scenario.correct : scenario.incorrect;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{passed ? 'Patient improves' : 'Patient deteriorates'}</h1>
          <div className="sub">Based on the actions you selected</div>
        </div>
        <SpeakButton text={outcome.narrative} label="Read outcome" />
      </div>

      <SimScene>
        <ResponderAvatar pose={passed ? 'treating' : 'monitoring'} label={passed ? 'Treating' : 'Reassessing'} />
        <PatientAvatar status={passed ? 'improving' : 'critical'} label={outcome.vitals.skin} />
      </SimScene>

      <div className={`alert ${passed ? 'success' : ''}`}>{outcome.narrative}</div>

      <div className="card">
        <h2>Second Set of Vital Signs</h2>
        <VitalsGrid vitals={outcome.vitals} />
      </div>

      <div className="card">
        <h2>Action review</h2>
        {scenario.actions.map((a) => {
          const picked = selected.includes(a.id);
          const good = (a.correct && picked) || (!a.correct && !picked);
          return (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span>{a.label}</span>
              <span style={{ color: good ? 'var(--success)' : 'var(--red)', fontWeight: 600 }}>
                {picked ? 'Selected' : 'Not selected'} {a.correct ? '(recommended)' : a.harmful ? '(harmful)' : ''}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <button className="primary" onClick={onContinue}>Continue</button>
      </div>
    </>
  );
}

function Reassessment({ scenario, onDone }) {
  const [answered, setAnswered] = useState(null);
  return (
    <>
      <div className="page-head"><div><h1>Additional information</h1></div></div>
      <div className="card">
        <p style={{ marginBottom: 14 }}>{scenario.reassessment.question}</p>
        {answered === null ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setAnswered(true)}>Yes</button>
            <button className="ghost" onClick={() => setAnswered(false)}>No</button>
          </div>
        ) : (
          <>
            {answered && <p style={{ marginBottom: 14, color: 'var(--ink-soft)' }}>{scenario.reassessment.ifYes}</p>}
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 14 }}>Transport time to the receiving facility: {scenario.transportTime}.</p>
            <button className="primary" onClick={onDone}>See debrief</button>
          </>
        )}
      </div>
    </>
  );
}

function Debrief({ scenario, selected, onRestart, onNewSkills }) {
  const criticalActions = scenario.actions.filter((a) => a.critical);
  const criticalHit = criticalActions.filter((a) => selected.includes(a.id)).length;
  const harmfulHit = scenario.actions.filter((a) => a.harmful && selected.includes(a.id)).length;
  const passed = criticalActions.length > 0 && criticalHit / criticalActions.length >= 0.7 && harmfulHit === 0;

  return (
    <>
      <div className="page-head"><div><h1>Debrief</h1></div></div>
      <div className="card">
        <span className={`badge ${passed ? 'approved' : 'rejected'}`} style={{ fontSize: 13, padding: '4px 12px' }}>
          {passed ? 'Critical actions met' : 'Critical actions missed'}
        </span>
        <p style={{ margin: '14px 0' }}>
          Critical actions taken: {criticalHit}/{criticalActions.length}
          {harmfulHit > 0 && ` · Harmful actions selected: ${harmfulHit}`}
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 4 }}>Skills tested:</p>
        <span className="badge draft">{scenario.skill}</span>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary" onClick={onRestart}>Generate another scenario</button>
          <button className="ghost" onClick={onNewSkills}>Change skills</button>
        </div>
      </div>
    </>
  );
}

export default function Simulations() {
  const [stage, setStage] = useState('select');
  const [scenario, setScenario] = useState(null);
  const [selectedActions, setSelectedActions] = useState([]);
  const [busy, setBusy] = useState(false);

  function generate(filters) {
    const matches = findScenarios(filters);
    if (matches.length === 0) return;
    setBusy(true);
    stopSpeaking();
    setTimeout(() => {
      const pick = matches[Math.floor(Math.random() * matches.length)];
      setScenario(pick);
      setSelectedActions([]);
      setBusy(false);
      setStage('brief');
    }, 1400);
  }

  function reset() {
    stopSpeaking();
    setStage('select');
    setScenario(null);
    setSelectedActions([]);
  }

  if (busy) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Generating scenario…</span>
      </div>
    );
  }

  if (stage === 'select' || !scenario) {
    return <SkillPicker onGenerate={generate} />;
  }

  if (stage === 'brief') {
    return <Brief scenario={scenario} onBegin={() => setStage('assess')} />;
  }

  if (stage === 'assess') {
    return <Assess scenario={scenario} onSubmit={(sel) => { setSelectedActions(sel); setStage('outcome'); }} />;
  }

  if (stage === 'outcome') {
    return <Outcome scenario={scenario} selected={selectedActions} onContinue={() => setStage('reassess')} />;
  }

  if (stage === 'reassess') {
    return <Reassessment scenario={scenario} onDone={() => setStage('debrief')} />;
  }

  return (
    <Debrief
      scenario={scenario}
      selected={selectedActions}
      onRestart={() => generate({ type: null, skills: [] })}
      onNewSkills={reset}
    />
  );
}
