import { useEffect, useState } from 'react';
import { SKILL_GROUPS, SCENARIO_TYPES, findScenarios } from '../../data/simulationScenarios';
import { speak, stopSpeaking, speechSupported } from '../../utils/speech';
import { ResponderAvatar, PatientAvatar, SimScene } from './simulation/Characters';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function simulationCategoryForScenario(scenario) {
  const skill = String(scenario.skill || '').toLowerCase();
  if (skill.includes('airway') || skill.includes('ventilation') || skill.includes('oxygen')) return 'Airway';
  if (skill.includes('trauma') || skill.includes('bleeding') || skill.includes('spinal')) return 'Trauma';
  if (skill.includes('cardiac') || skill.includes('stemi') || skill.includes('chest pain')) return 'Cardiology';
  if (skill.includes('ob') || skill.includes('childbirth')) return 'Obstetrics';
  if (skill.includes('mass casualty') || skill.includes('operations') || skill.includes('behavioral')) return 'Operations';
  return 'Medical Emergencies';
}

function SpeakButton({ text, label = 'Read aloud' }) {
  if (!speechSupported()) return null;
  return (
    <button type="button" className="ghost" onClick={() => speak(text)} style={{ fontSize: 12.5 }}>
      Speaker {label}
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

function SkillPicker({ onGenerate, latestResult }) {
  const [type, setType] = useState('');
  const [skills, setSkills] = useState([]);

  function toggleSkill(skill) {
    setSkills((current) => (current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]));
  }

  const matchCount = findScenarios({ type: type || null, skills }).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Simulations</h1>
          <div className="sub">
            Select a scenario type and skills to launch a scored clinical simulation that saves your competency result.
          </div>
        </div>
      </div>

      {latestResult && (
        <div className="card">
          <h2>Latest saved result</h2>
          <p style={{ marginBottom: 8 }}>
            <strong>{latestResult.title}</strong> &middot; {latestResult.category}
          </p>
          <div className="vitals">
            <div className="vital"><div className="label">Overall competency</div><div className="value">{latestResult.overall_competency_score}%</div></div>
            <div className="vital"><div className="label">Clinical judgement</div><div className="value">{latestResult.clinical_decision_score}%</div></div>
            <div className="vital"><div className="label">Critical errors</div><div className="value">{latestResult.critical_errors}</div></div>
            <div className="vital"><div className="label">Time</div><div className="value">{Math.max(1, Math.round(Number(latestResult.time_taken_seconds || 0) / 60))} min</div></div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Scenario type</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {SCENARIO_TYPES.map((scenarioType) => (
            <button key={scenarioType} type="button" className={type === scenarioType ? '' : 'ghost'} onClick={() => setType(type === scenarioType ? '' : scenarioType)}>
              {scenarioType}
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
        <button className="primary" disabled={matchCount === 0} onClick={() => onGenerate({ type: type || null, skills })}>
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
              {scenario.objectives.map((objective, index) => <li key={index}>{objective}</li>)}
            </ul>
          )}
        </div>
      )}

      {scenario.important && <div className="alert"><strong>Important:</strong> {scenario.important}</div>}

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
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
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
          {scenario.findings.map((finding, index) => <li key={index}>{finding}</li>)}
        </ul>
      </div>

      <div className="card">
        <h2>Initial Vital Signs</h2>
        <VitalsGrid vitals={scenario.initialVitals} />
      </div>

      <div className="card">
        <h2>What do you do?</h2>
        <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
          Select every action you would take in protocol order. Your saved score will measure decisions, critical errors, completion, and protocol compliance.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
          {scenario.actions.map((action) => (
            <label key={action.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, fontSize: 13.5, marginBottom: 0 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={selected.includes(action.id)} onChange={() => toggle(action.id)} />
              {action.label}
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
  const criticalActions = scenario.actions.filter((action) => action.critical);
  const criticalHit = criticalActions.filter((action) => selected.includes(action.id)).length;
  const harmfulHit = scenario.actions.some((action) => action.harmful && selected.includes(action.id));
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
      <div className="card"><h2>Second Set of Vital Signs</h2><VitalsGrid vitals={outcome.vitals} /></div>
      <div className="card">
        <h2>Action review</h2>
        {scenario.actions.map((action) => {
          const picked = selected.includes(action.id);
          const good = (action.correct && picked) || (!action.correct && !picked);
          return (
            <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span>{action.label}</span>
              <span style={{ color: good ? 'var(--success)' : 'var(--red)', fontWeight: 600 }}>
                {picked ? 'Selected' : 'Not selected'} {action.correct ? '(recommended)' : action.harmful ? '(harmful)' : ''}
              </span>
            </div>
          );
        })}
      </div>
      <div className="card"><button className="primary" onClick={onContinue}>Continue</button></div>
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

function Debrief({ scenario, selected, savedResult, saving, saveError, onRestart, onNewSkills }) {
  const criticalActions = scenario.actions.filter((action) => action.critical);
  const criticalHit = criticalActions.filter((action) => selected.includes(action.id)).length;
  const harmfulHit = scenario.actions.filter((action) => action.harmful && selected.includes(action.id)).length;
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

      {saving && <div className="alert info">Saving your simulation score...</div>}
      {saveError && <div className="alert">{saveError}</div>}

      {savedResult && (
        <div className="card">
          <h2>Saved competency score</h2>
          <div className="vitals">
            <div className="vital"><div className="label">Overall competency</div><div className="value">{savedResult.result.overall_competency_score}%</div></div>
            <div className="vital"><div className="label">Clinical decision</div><div className="value">{savedResult.result.clinical_decision_score}%</div></div>
            <div className="vital"><div className="label">Critical errors</div><div className="value">{savedResult.result.critical_errors}</div></div>
            <div className="vital"><div className="label">Time taken</div><div className="value">{Math.max(1, Math.round(Number(savedResult.result.time_taken_seconds || 0) / 60))} min</div></div>
            <div className="vital"><div className="label">Actions completed</div><div className="value">{savedResult.result.actions_completed}</div></div>
            <div className="vital"><div className="label">Protocol compliance</div><div className="value">{savedResult.result.protocol_compliance_score}%</div></div>
          </div>
          <p style={{ marginTop: 12 }}><strong>Recommendation:</strong> {savedResult.result.recommendation}</p>
          <p><strong>Weak areas:</strong> {Array.isArray(savedResult.result.weak_areas) ? savedResult.result.weak_areas.join(', ') || 'None recorded.' : savedResult.result.weak_areas || 'None recorded.'}</p>
          <p><strong>Recommended Clinical Reference Cards:</strong></p>
          <ul>
            {(savedResult.result.recommended_cards || []).map((card) => <li key={card.clinical_card_id}>{card.title} ({card.topic})</li>)}
          </ul>
          <p><strong>Recommended Simulations:</strong></p>
          <ul>
            {(savedResult.result.recommended_simulations || []).map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      )}

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
  const { user } = useAuth();
  const [stage, setStage] = useState('select');
  const [scenario, setScenario] = useState(null);
  const [selectedActions, setSelectedActions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [savedResult, setSavedResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [latestResult, setLatestResult] = useState(null);

  function loadLatestResult() {
    api('/simulations/my-results/latest').then((data) => setLatestResult(data.result)).catch(() => {});
  }

  useEffect(loadLatestResult, []);

  function reset() {
    stopSpeaking();
    setStage('select');
    setScenario(null);
    setSelectedActions([]);
    setAttemptId(null);
    setSavedResult(null);
    setSaveError('');
  }

  async function generate(filters) {
    const matches = findScenarios(filters);
    if (matches.length === 0) return;
    setBusy(true);
    stopSpeaking();
    const pick = matches[Math.floor(Math.random() * matches.length)];
    try {
      const response = await api('/simulations/attempts', {
        method: 'POST',
        body: {
          scenario: {
            ...pick,
            category: simulationCategoryForScenario(pick),
          },
        },
      });
      setAttemptId(response.attempt.simulation_attempt_id);
      setScenario(pick);
      setSelectedActions([]);
      setSavedResult(null);
      setStage('brief');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function persistResult(selected) {
    if (!attemptId || savedResult || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const response = await api(`/simulations/attempts/${attemptId}/complete`, {
        method: 'POST',
        body: {
          selectedActionIds: selected,
          program: user.program?.toLowerCase().includes('paramedic') ? 'Paramedic' : 'EMT',
        },
      });
      setSavedResult(response);
      loadLatestResult();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (stage === 'debrief' && selectedActions.length > 0) persistResult(selectedActions);
  }, [stage, selectedActions]);

  if (busy) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Preparing scored simulation...</span>
      </div>
    );
  }

  if (stage === 'select' || !scenario) {
    return <SkillPicker onGenerate={generate} latestResult={latestResult} />;
  }

  if (stage === 'brief') return <Brief scenario={scenario} onBegin={() => setStage('assess')} />;
  if (stage === 'assess') return <Assess scenario={scenario} onSubmit={(selected) => { setSelectedActions(selected); setStage('outcome'); }} />;
  if (stage === 'outcome') return <Outcome scenario={scenario} selected={selectedActions} onContinue={() => setStage('reassess')} />;
  if (stage === 'reassess') return <Reassessment scenario={scenario} onDone={() => setStage('debrief')} />;

  return (
    <Debrief
      scenario={scenario}
      selected={selectedActions}
      savedResult={savedResult}
      saving={saving}
      saveError={saveError}
      onRestart={() => generate({ type: null, skills: [] })}
      onNewSkills={reset}
    />
  );
}
