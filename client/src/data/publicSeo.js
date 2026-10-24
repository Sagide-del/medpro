// Edit public titles, descriptions and topic coverage here; the build uses the
// same data for static HTML, canonical tags and the sitemap.
export const SITE_ORIGIN = 'https://www.medprohub.co.ke';
export const HOME_SEO = {
  path: '/', title: 'EMT, Paramedic & Nursing Revision in Kenya | MedProHub',
  description: 'Build a focused revision routine with EMT and paramedic practice and a nursing fundamentals starter bank. Explore clinical questions and study tools on MedProHub.'
};
export const REVISION_PAGES = [
  {
    path: '/emt-revision', program: 'EMT', title: 'EMT Revision & Exam Practice in Kenya | MedProHub',
    heading: 'Build a stronger EMT foundation.',
    description: 'Revise EMT topics in Kenya with practice questions, explanations, and clinical study tools. Create a MedProHub student account to begin your revision.',
    intro: 'From your first patient assessment to your next exam, bring structure to your emergency medical technician revision. Practise what you know and identify what needs another look.',
    topics: ['Airway and breathing', 'Patient assessment', 'Trauma and medical emergencies', 'Paediatric and obstetric emergencies'],
    sections: [
      ['Connect the basics to patient care', 'Review core emergency care concepts, then use practice questions to identify gaps in understanding. Read the explanations and return to the topics you find difficult.'],
      ['Make EMT revision a routine', 'Use short study sessions alongside your course. Work through one topic at a time and review your progress before moving on.'],
      ['Choose the right level of support', 'MedProHub supplements your EMT course and clinical supervision. Sign in to see the available question bank, resources, and current subscription options.']
    ]
  },
  {
    path: '/paramedic-revision', program: 'Paramedic', title: 'Paramedic Revision & Clinical Exam Practice | MedProHub Kenya',
    heading: 'Think through your next clinical decision.',
    description: 'Support your paramedic studies with focused revision, clinical topics, and exam practice on MedProHub. Explore a paramedic study track for students in Kenya.',
    intro: 'Bring your paramedic revision together around assessment, clinical reasoning, and the foundations behind emergency care decisions.',
    topics: ['Anatomy and pathophysiology', 'Pharmacology and medication administration', 'Airway and ventilation', 'Cardiovascular emergencies, shock and trauma'],
    sections: [
      ['Study the reasoning behind the response', 'Organise your revision around the paramedic curriculum topics. Connect anatomy, physiology, patient assessment, and the principles of emergency care.'],
      ['Use practice to focus your next session', 'Work with the content available in your paramedic track, revisit explanations, and use your study tools to organise topics that need more attention.'],
      ['Keep learning connected to your course', 'Use MedProHub alongside your institution’s teaching, current local protocols, and supervised clinical experience. Resources support study and do not replace clinical guidance.']
    ]
  },
  {
    path: '/nursing-revision', program: 'Nursing', title: 'Nursing Fundamentals Revision in Kenya | MedProHub',
    heading: 'Start with the foundations of good nursing care.',
    description: 'Practise nursing fundamentals with MedProHub’s starter revision bank: patient assessment, infection prevention, consent, documentation, and medication safety.',
    intro: 'Create a nursing student account and begin with focused questions on the everyday principles behind safe, person-centred care.',
    topics: ['Nursing fundamentals and communication', 'Patient assessment and recognising deterioration', 'Infection prevention and sharps safety', 'Medication safety and escalation'],
    sections: [
      ['A focused starting point for nursing students', 'The Nursing track starts with eight original practice questions across four fundamentals modules. Each question includes an explanation to help you reflect on the answer.'],
      ['Your nursing revision stays in its own track', 'Choose Nursing when registering or use the study-track selector in your account. Nursing questions and topic filters are kept separate from the EMT and paramedic banks.'],
      ['Know the scope before subscribing', 'This is a starter nursing fundamentals bank, not a complete nursing curriculum or an NCK licensing examination course. Check the available content and subscription terms in your account before purchasing.']
    ]
  }
];
export const PUBLIC_PAGES = [HOME_SEO, ...REVISION_PAGES];
