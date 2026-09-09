import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import KenyaEMSWorksheet from './KenyaEMSWorksheet';
import UiIcon from '../shared/UiIcon';

function formatCaseTitle(title) {
  return String(title || '').toUpperCase();
}

function labelForStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'available') return 'Available';
  return 'Locked';
}

function badgeClassForStatus(status) {
  if (status === 'completed') return 'completed';
  if (status === 'available') return 'approved';
  return 'draft';
}

function CaseLibrary() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [program, setProgram] = useState('EMT');
  const [type, setType] = useState('All types');
  const [search, setSearch] = useState('');

  const featuredCases = [
    { id: '1', order_number: 1, title: 'US Embassy Bombing', year: 1998, location: 'Nairobi', emergencyType: 'MCI / Terror', keySkill: 'START triage and ICS', program: 'EMT' },
    { id: '2', order_number: 2, title: 'Kyanguli School Fire', year: 2001, location: 'Machakos', emergencyType: 'MCI / Fire', keySkill: 'Paediatric triage and burns', program: 'EMT' },
    { id: '3', order_number: 3, title: 'Molo Tanker Explosion', year: 2009, location: 'Nakuru', emergencyType: 'MCI / Burn', keySkill: 'Burn management', program: 'EMT' },
    { id: '4', order_number: 4, title: 'Nairobi Supermarket Fire', year: 2009, location: 'Nairobi', emergencyType: 'MCI / Fire', keySkill: 'Smoke inhalation and collapse', program: 'EMT' },
    { id: '5', order_number: 5, title: 'Westgate Mall Attack', year: 2013, location: 'Nairobi', emergencyType: 'MCI / Terror', keySkill: 'Active threat evacuation', program: 'EMT' },
    { id: '14', order_number: 14, title: 'Dusit Hotel Attack', year: 2019, location: 'Nairobi', emergencyType: 'MCI / Terror', keySkill: 'Complex evacuation', program: 'EMT' },
    { id: '29', order_number: 29, title: 'Rural Snakebite', year: 2023, location: 'Kisumu', emergencyType: 'Medical', keySkill: 'Antivenom and referral', program: 'EMT' },
    { id: '30', order_number: 30, title: 'Malaria in Pregnancy', year: 2024, location: 'Western', emergencyType: 'Medical', keySkill: 'Tropical disease management', program: 'EMT' },
    { id: '51', order_number: 51, title: 'Advanced Westgate Response', year: 2013, location: 'Nairobi', emergencyType: 'MCI / Terror', keySkill: 'Complex MCI leadership', program: 'Paramedic' },
    { id: '57', order_number: 57, title: 'Complex OB Emergency', year: 2024, location: 'Siaya', emergencyType: 'OB/GYN', keySkill: 'Referral system failure', program: 'Paramedic' },
    { id: '66', order_number: 66, title: 'Tension Pneumothorax', year: 2025, location: 'Trauma referral', emergencyType: 'Trauma', keySkill: 'Needle decompression', program: 'Paramedic' },
    { id: '81', order_number: 81, title: 'DKA with Shock', year: 2025, location: 'Nairobi', emergencyType: 'Medical', keySkill: 'Fluid resuscitation', program: 'Paramedic' },
  ];

  useEffect(() => {
    api('/cases')
      .then((data) => {
        setCases(Array.isArray(data?.cases) && data.cases.length ? data.cases : featuredCases);
        setSubscription(data?.subscription || null);
      })
      .catch(() => setCases(featuredCases))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading Kenya EMS cases..." />;
  if (error) return <div className="alert">{error}</div>;

  const sourceCases = cases.length ? cases : featuredCases;
  const visibleCases = sourceCases.filter((studyCase) => {
    const caseProgram = studyCase.program || (Number(studyCase.order_number) > 50 ? 'Paramedic' : 'EMT');
    const caseType = studyCase.emergencyType || studyCase.type || 'Clinical';
    const haystack = `${studyCase.title} ${studyCase.location} ${caseType} ${studyCase.keySkill || ''}`.toLowerCase();
    return caseProgram === program && (type === 'All types' || caseType === type) && haystack.includes(search.toLowerCase());
  });
  const typeOptions = ['All types', ...new Set(sourceCases.map((item) => item.emergencyType || item.type || 'Clinical'))];

  return (
    <section className="kenya-cases-v2">
      <header className="kenya-cases-v2-hero">
        <div>
          <span className="platform-eyebrow">Kenya EMS case library</span>
          <h1>Practise the calls that matter here.</h1>
          <p>Real Kenyan locations, realistic constraints, and structured clinical decisions for EMT and Paramedic learners.</p>
        </div>
        <div className="kenya-cases-v2-hero-stat"><strong>100</strong><span>case scenarios</span></div>
      </header>

      <div className="kenya-cases-v2-stats">
        <div><UiIcon name="cases" /><strong>50</strong><span>EMT cases</span></div>
        <div><UiIcon name="activity" /><strong>50</strong><span>Paramedic cases</span></div>
        <div><UiIcon name="dispatch" /><strong>20+</strong><span>counties and regions</span></div>
        <div><UiIcon name="learn" /><strong>8</strong><span>clinical phases</span></div>
      </div>

      <section className="kenya-cases-v2-panel">
        <div className="kenya-cases-v2-panel-head"><div><span className="platform-eyebrow">Choose your revision track</span><h2>Case scenarios</h2></div><span>{visibleCases.length} shown</span></div>
        <div className="kenya-cases-v2-controls">
          <div className="kenya-cases-v2-programs" role="tablist" aria-label="Revision track">
            {['EMT', 'Paramedic'].map((item) => <button type="button" role="tab" aria-selected={program === item} className={program === item ? 'is-active' : ''} onClick={() => { setProgram(item); setType('All types'); }} key={item}>{item}</button>)}
          </div>
          <label className="kenya-cases-v2-search"><UiIcon name="question" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cases, counties, or skills" aria-label="Search Kenya EMS cases" /></label>
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by case type">{typeOptions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="kenya-cases-v2-grid">
          {visibleCases.map((studyCase) => {
            const caseType = studyCase.emergencyType || studyCase.type || 'Clinical';
            return <button key={studyCase.id} type="button" className="kenya-case-v2-card" onClick={() => navigate(`/student/learn/kenya-ems/${studyCase.case_number || studyCase.id}`)}><div className="kenya-case-v2-card-top"><span>Case {String(studyCase.order_number || '').padStart(2, '0')}</span><UiIcon name="arrowRight" /></div><h3>{studyCase.title}</h3><div className="kenya-case-v2-meta"><span>{studyCase.location || 'Kenya'}</span><span>{studyCase.year || studyCase.incident_date || 'Current'}</span><span>{caseType}</span></div><p>{studyCase.keySkill || 'Assessment, treatment, transport, and handover decisions.'}</p><span className="kenya-case-v2-action">Start case <UiIcon name="arrowRight" /></span></button>;
          })}
        </div>
        {!visibleCases.length && <div className="kenya-cases-v2-empty">No cases match those filters. Try another county, type, or revision track.</div>}
      </section>

      <section className="kenya-cases-v2-method"><div><span className="platform-eyebrow">Built for clinical reasoning</span><h2>Every case follows the same field-ready structure.</h2></div><div className="kenya-cases-v2-phases">{['Emergency activation', 'Scene assessment', 'Patient assessment', 'Treatment and vitals', 'Transport decision', 'SBAR handover', 'Post-call debrief', 'Clinical reasoning'].map((phase, index) => <span key={phase}><b>{String(index + 1).padStart(2, '0')}</b>{phase}</span>)}</div></section>
    </section>
  );
}

function CaseSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const hydratedRef = useRef(false);
  const skipAutosaveRef = useRef(true);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    setBusy(true);
    hydratedRef.current = false;
    api(`/cases/${id}`)
      .then((data) => {
        setPayload(data);
        setResult(null);
        setResponses(data?.responses || {});
        setSaveState('saved');
        skipAutosaveRef.current = true;
        hydratedRef.current = true;
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [id]);

  useEffect(() => {
    if (!payload || !hydratedRef.current) return undefined;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return undefined;
    }
    setSaveState('unsaved');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api(`/cases/${id}/progress`, {
          method: 'POST',
          body: { responses },
        });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [id, payload, responses]);

  const blocks = payload?.blocks || [];
  const caseStudy = payload?.caseStudy;

  async function saveNow() {
    setSaveState('saving');
    try {
      await api(`/cases/${id}/progress`, {
        method: 'POST',
        body: { responses },
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const response = await api(`/cases/${id}/submit`, {
        method: 'POST',
        body: { answers: responses },
      });
      setResult(response);
      setSaveState('saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (busy && !payload) return <Loading label="Loading Kenya EMS case..." />;
  if (!payload || !caseStudy) return <Loading label="Loading Kenya EMS case..." />;

  if (result) {
    return (
      <section className="case-worksheet-page">
        <div className="case-worksheet-sheet">
          <header className="case-result-sheet-simple">
            <h1>{formatCaseTitle(result.caseStudy.title)}</h1>
            <div className="case-result-summary-line">
              <span>Score: {result.attempt.percentage}%</span>
              <span>{result.attempt.score} points earned</span>
              <span>Attempt #{result.attempt.attempt_number}</span>
              <span>{result.attempt.passed ? 'Passed' : 'Retry Required'}</span>
            </div>
          </header>

          <div className="case-review-stack-simple">
            {result.review.map((item) => (
              <section key={item.activityId} className="case-review-sheet-simple">
                <h2>{item.phase} - {item.title}</h2>
                <p><strong>Your response:</strong> {item.selectedAnswerText || 'No answer provided'}</p>
                <p><strong>Expected focus:</strong> {item.expectedAnswerText || 'Review the worksheet criteria.'}</p>
                <p><strong>Points:</strong> {item.earnedPoints} / {item.points}</p>
                <p><strong>Feedback:</strong> {item.explanation}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="case-sticky-actions">
          <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back to Case Library</button>
          {!result.attempt.passed ? (
            <button
              type="button"
              className="primary"
              onClick={() => {
                setResult(null);
              }}
            >
              Retry Case
            </button>
          ) : null}
          {result.nextCaseUnlocked ? (
            <button
              type="button"
              className="primary"
              onClick={() => navigate(`/student/kenya-ems-cases/${result.nextCaseUnlocked.id}`)}
            >
              Open Next Case
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="case-worksheet-page">
      <div className="case-worksheet-sheet">
        <KenyaEMSWorksheet
          caseStudy={caseStudy}
          blocks={blocks}
          responses={responses}
          saveState={saveState}
          onChange={(activityId, nextValue) => {
            hydratedRef.current = true;
            setResponses((current) => ({
              ...current,
              [activityId]: nextValue,
            }));
          }}
        />
      </div>

      <div className="case-sticky-actions">
        <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back</button>
        <button type="button" className="ghost" onClick={saveNow}>{saveState === 'saving' ? 'Saving...' : 'Save Progress'}</button>
        <button type="button" className="primary" onClick={submit} disabled={busy}>{busy ? 'Submitting...' : 'Submit Case'}</button>
      </div>
    </section>
  );
}

export default function KenyaCaseStudies() {
  const { id } = useParams();
  return id ? <CaseSession /> : <CaseLibrary />;
}
