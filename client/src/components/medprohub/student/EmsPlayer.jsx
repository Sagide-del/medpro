import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import CaseRenderer from '../../student/CaseRenderer';
import ProgressBar from '../../common/ProgressBar';
import Loading from '../../shared/Loading';
import UiIcon from '../../shared/UiIcon';

function groupStages(blocks = []) {
  const map = new Map();
  blocks.forEach((block) => {
    const stage = Number(block.stage || 1);
    if (!map.has(stage)) {
      map.set(stage, { stage, title: `Stage ${stage}`, blocks: [] });
    }
    const entry = map.get(stage);
    entry.blocks.push(block);
    if (block.type === 'instruction' && block.text) {
      entry.title = block.text;
    }
  });
  return [...map.values()].sort((a, b) => a.stage - b.stage);
}

export default function EmsPlayer() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [responses, setResponses] = useState({});
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const timers = useRef({});

  useEffect(() => {
    if (!id) return undefined;
    setAssignment(null);
    setResult(null);
    setStatus('');
    api(`/v1/student/medprohub/ems/${id}`)
      .then((data) => {
        const next = data?.assignment || null;
        setAssignment(next);
        setResponses(next?.answers || {});
      })
      .catch((error) => setStatus(error.message));
    return () => {
      Object.values(timers.current).forEach((timer) => clearTimeout(timer));
      timers.current = {};
    };
  }, [id]);

  const blocks = useMemo(() => assignment?.content_json?.sections || [], [assignment]);
  const stages = useMemo(() => groupStages(blocks), [blocks]);
  const answered = useMemo(() => blocks.filter((block) => block.activityId && responses[block.activityId]).length, [blocks, responses]);

  function queueSave(activityId, value, stage) {
    if (!id) return;
    if (timers.current[activityId]) clearTimeout(timers.current[activityId]);
    timers.current[activityId] = setTimeout(async () => {
      try {
        await api(`/v1/student/medprohub/ems/${id}/answer`, {
          method: 'POST',
          body: {
            activityId,
            value,
            currentStage: stage,
            contentFrom: assignment?.content_from,
          },
        });
        setStatus('Saved');
      } catch (error) {
        setStatus(error.message);
      }
    }, 650);
  }

  function handleChange(activityId, value) {
    const block = blocks.find((item) => item.activityId === activityId);
    const stage = Number(block?.stage || 1);
    setResponses((current) => ({ ...current, [activityId]: value }));
    queueSave(activityId, value, stage);
  }

  async function saveAll() {
    if (!id) return;
    setSaving(true);
    setStatus('');
    try {
      for (const [activityId, value] of Object.entries(responses)) {
        const block = blocks.find((item) => item.activityId === activityId);
        await api(`/v1/student/medprohub/ems/${id}/answer`, {
          method: 'POST',
          body: {
            activityId,
            value,
            currentStage: Number(block?.stage || 1),
            contentFrom: assignment?.content_from,
          },
        });
      }
      setStatus('Progress saved.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitCase() {
    if (!id) return;
    setSaving(true);
    setStatus('');
    try {
      const response = await api(`/v1/student/medprohub/ems/${id}/complete`, {
        method: 'POST',
        body: { answers: responses },
      });
      setResult(response);
      setStatus('Case submitted.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (!assignment) return <Loading label="Loading EMS case..." />;

  if (result) {
    return (
      <section className="page-stack">
        <div className="page-head">
          <div>
            <h1>{result.assignment?.title || assignment.title}</h1>
            <div className="sub">Completed submission and review</div>
          </div>
          <Link className="ghost" to="/student/medprohub/cases">Back to assignments</Link>
        </div>

        <div className="card">
          <ProgressBar
            label="Final score"
            status={`${result.score}% ${result.passed ? '(passed)' : '(retry needed)'}`}
            value={result.score}
          />
        </div>

        <div className="grid-auto">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Strengths</h2>
            <ul>
              {(result.strengths || []).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Review areas</h2>
            <ul>
              {(result.improvements || []).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        <div className="card">
          <CaseRenderer blocks={result.assignment?.content_json?.sections || blocks} responses={responses} onChange={() => {}} />
        </div>

        <div className="logbook-actions">
          <Link className="ghost" to="/student/medprohub/cases">Back to assignments</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <h1>{assignment.title}</h1>
          <div className="sub">{assignment.event_type} · {assignment.location} · {assignment.difficulty}</div>
        </div>
        <div className="logbook-actions">
          <Link className="ghost" to="/student/medprohub/cases">Assignments</Link>
        </div>
      </div>

      <div className="card">
        <ProgressBar
          label="Case progress"
          status={`${answered} answered · stage ${assignment.current_stage || 1}`}
          value={blocks.length ? Math.round((answered / blocks.filter((block) => block.activityId).length) * 100) : 0}
        />
      </div>

      <div className="grid-auto">
        <div className="card">
          <div className="form-grid">
            <div className="field"><span>Level</span><input readOnly value={assignment.level || ''} /></div>
            <div className="field"><span>Difficulty</span><input readOnly value={assignment.difficulty || ''} /></div>
            <div className="field"><span>Current stage</span><input readOnly value={assignment.current_stage || 1} /></div>
            <div className="field"><span>Time spent</span><input readOnly value={`${Math.max(0, Math.round((assignment.time_spent || 0) / 60))} min`} /></div>
          </div>

          <div className="logbook-actions" style={{ marginTop: 12 }}>
            <button type="button" className="ghost" onClick={saveAll} disabled={saving}>Save Progress</button>
            <button type="button" className="primary" onClick={submitCase} disabled={saving}>Submit Case</button>
          </div>

          {status ? <div className="ok-note" style={{ marginTop: 12 }}>{status}</div> : null}
        </div>

        <div className="card">
          <div className="sub" style={{ marginBottom: 8 }}>Stages</div>
          <div className="stack" style={{ gap: 10 }}>
            {stages.map((stage) => (
              <div key={stage.stage} className={`card ${stage.stage === assignment.current_stage ? 'active' : ''}`} style={{ margin: 0 }}>
                <div className="page-head" style={{ marginBottom: 0 }}>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 4 }}>{stage.title}</h3>
                    <div className="sub">{stage.blocks.filter((block) => block.activityId).length} activities</div>
                  </div>
                  <UiIcon name={stage.stage <= assignment.current_stage ? 'result' : 'lock'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <CaseRenderer blocks={blocks} responses={responses} onChange={handleChange} />
      </div>

      <div className="logbook-actions">
        <button type="button" className="ghost" onClick={saveAll} disabled={saving}>Save Progress</button>
        <button type="button" className="primary" onClick={submitCase} disabled={saving}>Submit Case</button>
      </div>
    </section>
  );
}

