import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UiIcon from '../shared/UiIcon';
import { useAuth } from '../../context/AuthContext';
import PublishedLibrary from './PublishedLibrary';

const LIBRARIES = {
  guides: {
    title: 'Study Guides', subtitle: 'Structured clinical review guides for every stage of EMS learning.', count: '24 guides', feature: ['CORE', 'Emergency Assessment Framework', 'A systematic approach to patient assessment, from scene size-up to ongoing reassessment.', 'learn'],
    items: [['Preparatory Care for EMS', 'Foundations of safety, communication, consent, documentation, and professional practice.', 'practice', 'Foundations'], ['Airway & Breathing', 'Assessment and management of the airway, ventilation, oxygenation, and respiratory emergencies.', 'lungs', 'Medical'], ['Patient Assessment', 'Scene size-up, primary assessment, history taking, examination techniques, and reassessment.', 'document', 'Foundations'], ['Medical Emergencies', 'Recognition and initial management of time-critical medical conditions across body systems.', 'heart', 'Medical'], ['Trauma Care', 'Mechanism of injury, assessment, life threats, shock, and ongoing management.', 'bandage', 'Trauma'], ['Infants & Children', 'Age-appropriate assessment and management, common emergencies, and special considerations.', 'baby', 'Special populations']],
  },
  protocols: {
    title: 'Clinical Protocols', subtitle: 'Structured field guidance aligned to your learning pathway.', count: '18 protocols', feature: ['CORE PROTOCOL', 'Approach to the Unwell Patient', 'A structured sequence from scene safety to reassessment.', 'cases'],
    items: [['Scene Safety & Initial Approach', 'Ensure a safe environment and establish an initial assessment.', 'shield', 'General'], ['Airway Management', 'Identify and manage airway compromise across age groups.', 'lungs', 'Airway'], ['Cardiac Chest Pain', 'Assessment and management of suspected cardiac chest pain.', 'heart', 'Medical'], ['Seizure Management', 'Assessment and management of the patient with a seizure.', 'activity', 'Medical'], ['Major Trauma', 'Systematic assessment and management of the major trauma patient.', 'bandage', 'Trauma'], ['Paediatric Assessment', 'Age-appropriate assessment and management of paediatric patients.', 'baby', 'Special populations']],
  },
  drugs: {
    title: 'Drug Reference', subtitle: 'Quick, clinically structured medicine reference for EMS practice.', count: '48 medicines', feature: ['SAFETY NOTE', 'Use approved local protocols', 'Always follow local protocols and your scope of practice.', 'pill'],
    items: [['Aspirin', 'Antiplatelet · Suspected acute coronary syndrome.', 'pill', 'Cardiac'], ['Salbutamol', 'Bronchodilator · Bronchospasm and wheeze.', 'lungs', 'Respiratory'], ['Adrenaline', 'Sympathomimetic · Anaphylaxis and cardiac arrest.', 'pill', 'Emergency'], ['Paracetamol', 'Analgesic · Mild to moderate pain and fever.', 'pill', 'Analgesia'], ['Nitroglycerin', 'Vasodilator · Cardiac chest pain.', 'heart', 'Cardiac'], ['Dextrose 10%', 'Glucose · Hypoglycaemia.', 'pill', 'Emergency']],
  },
  sheets: {
    title: 'Cheat Sheets', subtitle: 'Fast clinical references for confident decisions in the field.', count: '16 quick references', feature: ['MOST USED THIS WEEK', 'Adult Vital Signs', 'A quick reference for normal adult vital sign ranges.', 'heart'],
    items: [['Adult Vital Signs', 'Normal adult vital sign ranges at a glance.', 'activity', 'Assessment'], ['Paediatric Vital Signs', 'Age-based normal vital sign ranges for age groups.', 'baby', 'Paediatric'], ['ECG Lead Placement', 'Visual guide to standard 12-lead ECG electrode placement.', 'heart', 'Medical'], ['Airway Adjunct Sizing', 'Quick reference for common airway adjunct sizes by age group.', 'lungs', 'Airway'], ['Burn Surface Area', 'Visual guide to estimating total body surface area.', 'bandage', 'Trauma'], ['Glasgow Coma Scale', 'Quick reference for adult and paediatric GCS scoring.', 'activity', 'Neurological']],
  },
};

const PARAMEDIC_ITEMS = {
  guides: [
    ['Preparatory & Professional Practice', 'EMS systems, safety and wellness, communications, law, ethics, and evidence-based practice.', 'document', 'Preparatory'],
    ['Anatomy & Pathophysiology', 'Human systems, medical terminology, pathophysiology, and lifespan development.', 'learn', 'Foundations'],
    ['Pharmacology & Medication Administration', 'Emergency medications, pharmacology principles, and safe administration.', 'pill', 'Pharmacology'],
    ['Airway & Artificial Ventilation', 'Airway management, respiration, oxygenation, and artificial ventilation.', 'lungs', 'Airway'],
    ['Patient Assessment & Clinical Decisions', 'History taking, assessment, reassessment, communication, and clinical decision making.', 'document', 'Assessment'],
    ['Medical, Trauma & Special Populations', 'Advanced medical, trauma, obstetric, neonatal, paediatric, geriatric, and special-population review.', 'heart', 'Clinical'],
  ],
  protocols: [
    ['Advanced Scene Management', 'Risk assessment, incident command, communications, and evidence-based field decisions.', 'shield', 'Operations'],
    ['Advanced Airway Management', 'Airway strategy, ventilation, monitoring, and escalation across patient groups.', 'lungs', 'Airway'],
    ['Cardiovascular Emergencies', 'Advanced assessment and management of cardiovascular presentations.', 'heart', 'Cardiology'],
    ['Shock & Resuscitation', 'Recognition, reassessment, and structured management of shock states.', 'activity', 'Resuscitation'],
    ['Major Trauma Management', 'Mechanism of injury, haemorrhage, burns, and region-specific trauma care.', 'bandage', 'Trauma'],
    ['Obstetric, Neonatal & Paediatric Care', 'Age- and condition-appropriate assessment for special populations.', 'baby', 'Special populations'],
  ],
  drugs: [
    ['Emergency Pharmacology', 'Principles of pharmacology and emergency medication selection.', 'pill', 'Pharmacology'],
    ['Medication Administration', 'Routes, safety checks, dosing principles, and documentation.', 'document', 'Administration'],
    ['Cardiovascular Medications', 'Medication considerations for cardiovascular emergencies.', 'heart', 'Cardiology'],
    ['Respiratory Medications', 'Medication considerations for respiratory and airway emergencies.', 'lungs', 'Respiratory'],
    ['Toxicology & Antidotes', 'Recognition and treatment principles for toxic exposures.', 'activity', 'Toxicology'],
    ['Paediatric Medication Safety', 'Age-appropriate medication safety and dose-checking principles.', 'baby', 'Paediatrics'],
  ],
  sheets: [
    ['Advanced Patient Assessment', 'A quick reference for primary, secondary, and reassessment decisions.', 'document', 'Assessment'],
    ['Airway & Ventilation', 'Advanced airway and ventilation checkpoints across patient groups.', 'lungs', 'Airway'],
    ['Cardiology Reference', 'Rapid cardiovascular assessment and resuscitation reminders.', 'heart', 'Cardiology'],
    ['Shock Recognition', 'Patterns, reassessment triggers, and structured shock review.', 'activity', 'Resuscitation'],
    ['Trauma Priorities', 'Region-specific trauma priorities and haemorrhage control reminders.', 'bandage', 'Trauma'],
    ['Obstetric & Neonatal Reference', 'Fast reference for obstetric and neonatal assessment priorities.', 'baby', 'Special populations'],
  ],
};

export default function ResourceLibrary({ kind = 'guides' }) {
  const destinations = { guides: 'study_guides', protocols: 'clinical_protocols', drugs: 'drug_reference', sheets: 'cheat_sheets' };
  return <PublishedLibrary destination={destinations[kind] || 'study_guides'} title={(LIBRARIES[kind] || LIBRARIES.guides).title} />;
}

function LegacyResourceLibrary({ kind = 'guides' }) {
  const { user } = useAuth();
  const isParamedic = user?.program === 'Paramedic';
  const baseLibrary = LIBRARIES[kind] || LIBRARIES.guides;
  const library = isParamedic ? { ...baseLibrary, items: PARAMEDIC_ITEMS[kind] || baseLibrary.items } : baseLibrary;
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const categories = ['All', ...new Set(library.items.map((item) => item[3]))];
  const visible = useMemo(() => library.items.filter((item) => (category === 'All' || item[3] === category) && `${item[0]} ${item[1]}`.toLowerCase().includes(search.toLowerCase())), [category, library.items, search]);
  return <div className="resource-library-v2"><header className="resource-library-v2-head"><div><span className="platform-eyebrow">MedPro Resources</span><h1>{library.title}</h1><p>{library.subtitle}</p></div><span className="resource-library-v2-count"><UiIcon name={kind === 'drugs' ? 'pill' : kind === 'protocols' ? 'document' : kind === 'sheets' ? 'learn' : 'learn'} />{library.count}</span></header><section className="resource-library-v2-feature"><span className="resource-library-v2-feature-icon"><UiIcon name={library.feature[3]} /></span><div><span className="platform-eyebrow">{library.feature[0]}</span><h2>{library.feature[1]}</h2><p>{library.feature[2]}</p></div><Link className="new-button new-button-primary" to={kind === 'sheets' ? '/student/reference-cards' : '/student/notes'}>Open resource <UiIcon name="arrowRight" /></Link></section><section className="resource-library-v2-browse"><div className="resource-library-v2-browse-head"><div><span className="platform-eyebrow">Browse library</span><h2>{kind === 'drugs' ? 'Medicines' : kind === 'protocols' ? 'Protocol library' : kind === 'sheets' ? 'Clinical quick reference' : 'Browse by module'}</h2></div><label><UiIcon name="question" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${library.title.toLowerCase()}...`} aria-label={`Search ${library.title}`} /></label></div><div className="resource-library-v2-tabs">{categories.map((item) => <button type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><div className="resource-library-v2-grid">{visible.map(([title, description, icon, tag]) => <article className="resource-library-v2-card" key={title}><span className="resource-library-v2-icon"><UiIcon name={icon} /></span><span className="platform-eyebrow">{tag}</span><h3>{title}</h3><p>{description}</p><div><span><UiIcon name="document" />1 page</span><span><UiIcon name="simulation" />~10 min</span><Link to={kind === 'sheets' ? '/student/reference-cards' : '/student/notes'}>Open <UiIcon name="arrowRight" /></Link></div></article>)}</div>{!visible.length && <p className="resource-library-v2-empty">No resources match your search.</p>}</section></div>;
}
