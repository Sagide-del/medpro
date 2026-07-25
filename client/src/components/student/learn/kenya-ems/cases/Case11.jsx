// Case 11: NAIROBI PROTESTS MEDICAL RESPONSE
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 11,
  "title": "CASE STUDY 11: NAIROBI PROTESTS MEDICAL RESPONSE",
  "shortTitle": "NAIROBI PROTESTS MEDICAL RESPONSE",
  "category": "Civil Unrest EMS Response",
  "difficulty": "Intermediate",
  "location": "Nairobi",
  "incidentDate": "July 2024",
  "description": "During the 2024 protests in Nairobi, Médecins Sans Frontières/Doctors Without Borders (MSF) contributed to the emergency response efforts.",
  "passingScore": 80,
  "sections": [
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 11: NAIROBI PROTESTS MEDICAL RESPONSE"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-location",
      "type": "paragraph",
      "text": "Nairobi, July 2024"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-heading-1000001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000002",
      "type": "paragraph",
      "text": "During the 2024 protests in Nairobi, Médecins Sans Frontières/Doctors Without Borders (MSF) contributed to the emergency response efforts."
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000003",
      "type": "paragraph",
      "text": "The Response:"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000004",
      "type": "paragraph",
      "text": "Abbas Bahola, an Emergency Supervisor with MSF, described the response:"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000005",
      "type": "paragraph",
      "text": "\"For the recent protests, we made plans to dispatch our ambulance and medical team, we made sure we had additional staff ready to respond to an influx of patients, and arranged referral possibilities in place for people who need more advanced medical care.\""
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000006",
      "type": "paragraph",
      "text": "Medical Setup:"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000007",
      "type": "paragraph",
      "text": "Ambulances went to the Central Business District (CBD) to join other actors"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000008",
      "type": "paragraph",
      "text": "Medical post was set up by the Nairobi Emergency Operating Coordination Centre (EOC) at Jamia Mosque"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000009",
      "type": "paragraph",
      "text": "Later shifted to Holy Family Basilica"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000010",
      "type": "paragraph",
      "text": "Types of Injuries:\n\"Most of the patients we had seen had fractures, wounds, soft tissue injuries, and a few gunshot wounds, both from rubber and live bullets.\""
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000011",
      "type": "paragraph",
      "text": "Challenges:"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000012",
      "type": "paragraph",
      "text": "Access to medical sites became complicated"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000013",
      "type": "paragraph",
      "text": "An ambulance was attacked by rowdy crowds while transporting patients"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000014",
      "type": "paragraph",
      "text": "Staff were shaken, one staff got physically injured"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000015",
      "type": "paragraph",
      "text": "Delay in care of patients on board"
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000016",
      "type": "paragraph",
      "text": "Role of MSF:\n\"We treat and discharge those with less severe injuries. For more severe cases, we stabilize the patients and refer them in our ambulances to Mama Lucy hospital or Kenyatta National Hospital.\""
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000017",
      "type": "paragraph",
      "text": "MSF triaged 71 patients in the first two days."
    },
    {
      "id": "6e8120d8-9060-547c-ab6a-8b9590e0bc39-paragraph-1000018",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-11-section-1-activity-1-question",
      "type": "question",
      "title": "Protest Response Planning:",
      "phase": "Incident Background",
      "text": "1. Protest Response Planning:\n\nYour Response: (fill in)\n\ntext\nWhat are the challenges of providing medical care during protests? ________\n__________________________________________________________________________\n\nWhat are the types of injuries expected? _________________________________\n__________________________________________________________________________\n\nHow does the triage differ? _______________________________________________"
    },
    {
      "id": "case-11-section-1-activity-1-response",
      "type": "response",
      "title": "Protest Response Planning:",
      "fields": [
        {
          "id": "what-are-the-challenges-of-providing-medical-car",
          "label": "What are the challenges of providing medical care during protests?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-are-the-types-of-injuries-expected",
          "label": "What are the types of injuries expected?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "how-does-the-triage-differ",
          "label": "How does the triage differ?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    },
    {
      "id": "case-11-section-1-activity-2-question",
      "type": "question",
      "title": "Ambulance Safety:",
      "phase": "Incident Background",
      "text": "2. Ambulance Safety:\n\nYour Response: (fill in)\n\ntext\nWhat happens when an ambulance is attacked? _______________________________\n__________________________________________________________________________\n\nWhat safety measures should be in place? __________________________________\n__________________________________________________________________________\n📊"
    },
    {
      "id": "case-11-section-1-activity-2-response",
      "type": "response",
      "title": "Ambulance Safety:",
      "fields": [
        {
          "id": "what-happens-when-an-ambulance-is-attacked",
          "label": "What happens when an ambulance is attacked?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-safety-measures-should-be-in-place",
          "label": "What safety measures should be in place?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    }
  ]
};

export const caseMeta = {
  "id": 11,
  "title": "CASE STUDY 11: NAIROBI PROTESTS MEDICAL RESPONSE",
  "shortTitle": "NAIROBI PROTESTS MEDICAL RESPONSE",
  "category": "Civil Unrest EMS Response",
  "difficulty": "Intermediate",
  "location": "Nairobi",
  "incidentDate": "July 2024",
  "description": "During the 2024 protests in Nairobi, Médecins Sans Frontières/Doctors Without Borders (MSF) contributed to the emergency response efforts.",
  "passingScore": 80
};

export default function Case11(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
