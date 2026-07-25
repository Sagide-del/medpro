// Case 5: KISUMU BUILDING COLLAPSE RESCUE
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 5,
  "title": "CASE STUDY 5: KISUMU BUILDING COLLAPSE RESCUE",
  "shortTitle": "KISUMU BUILDING COLLAPSE RESCUE",
  "category": "Urban Search and Rescue",
  "difficulty": "Advanced",
  "location": "Tom Mboya Estate, Kisumu",
  "incidentDate": "May 11, 2026",
  "description": "On May 11, 2026, at approximately 8:00 PM, a four-storey building under construction collapsed in the Tom Mboya Estate, Kisumu.",
  "passingScore": 75,
  "sections": [
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 5: KISUMU BUILDING COLLAPSE RESCUE"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-location",
      "type": "paragraph",
      "text": "Tom Mboya Estate, Kisumu, May 11, 2026"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-heading-400001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400002",
      "type": "paragraph",
      "text": "On May 11, 2026, at approximately 8:00 PM, a four-storey building under construction collapsed in the Tom Mboya Estate, Kisumu."
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-heading-400003",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400004",
      "type": "paragraph",
      "text": "1 victim successfully rescued alive"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400005",
      "type": "paragraph",
      "text": "Distress call: Received at 8:06 PM"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400006",
      "type": "paragraph",
      "text": "Response time: 20 minutes (within international standards)"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400007",
      "type": "paragraph",
      "text": "Rescue time: Victim rescued at 3:00 AM (7 hours after collapse)"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400008",
      "type": "paragraph",
      "text": "Multiple agencies: Emergency Operations Centre, Fire Department, Kenya Red Cross, County Police, Ambulance Services"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400009",
      "type": "paragraph",
      "text": "The Successful Response:\n\"The victim was successfully rescued at around 3 a.m. after hours of careful excavation and rescue efforts\""
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400010",
      "type": "paragraph",
      "text": "The Building Collapse Crisis (Kenya)\n2026 Incidents in Nairobi alone:"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400011",
      "type": "paragraph",
      "text": "January 2: Multi-storey building collapsed in South C estate, 2 guards killed"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400012",
      "type": "paragraph",
      "text": "January 10: Building crumbled in Karen, 2 lives lost, several injured"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400013",
      "type": "paragraph",
      "text": "February 10: Building collapsed near OTC, 6 workers rescued"
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400014",
      "type": "paragraph",
      "text": "The South C Incident: \"Early assessments by Cabinet Secretary Geoffrey Ruku suggest the structure may have failed due to column overload. Officials say the building had been approved for 12 storeys but had reportedly reached between 14 and 16 storeys before it collapsed\""
    },
    {
      "id": "4d95f3a6-2251-55d5-bd64-3be2fa165f9c-paragraph-400015",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-5-section-1-activity-1-question",
      "type": "question",
      "title": "Scene Assessment:",
      "phase": "Incident Background",
      "text": "1. Scene Assessment:\n\nYour Response: (fill in)\n\ntext\nPrimary safety concerns: __________________________________________________\nEquipment needed: ________________________________________________________\nResource requirements: ____________________________________________________\nStaging plan: ____________________________________________________________"
    },
    {
      "id": "case-5-section-1-activity-1-response",
      "type": "response",
      "title": "Scene Assessment:",
      "fields": [
        {
          "id": "primary-safety-concerns",
          "label": "Primary safety concerns",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "equipment-needed",
          "label": "Equipment needed",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "resource-requirements",
          "label": "Resource requirements",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "staging-plan",
          "label": "Staging plan",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-5-section-1-activity-2-question",
      "type": "question",
      "title": "Triage Categories for Rescue Operations:",
      "phase": "Incident Background",
      "text": "2. Triage Categories for Rescue Operations:\n\nYour Response: (fill in)\n\ntext\nUnique challenges: ________________________________________________________\nRescue triage differences: ________________________________________________\n📊"
    },
    {
      "id": "case-5-section-1-activity-2-response",
      "type": "response",
      "title": "Triage Categories for Rescue Operations:",
      "fields": [
        {
          "id": "unique-challenges",
          "label": "Unique challenges",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rescue-triage-differences",
          "label": "Rescue triage differences",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    }
  ]
};

export const caseMeta = {
  "id": 5,
  "title": "CASE STUDY 5: KISUMU BUILDING COLLAPSE RESCUE",
  "shortTitle": "KISUMU BUILDING COLLAPSE RESCUE",
  "category": "Urban Search and Rescue",
  "difficulty": "Advanced",
  "location": "Tom Mboya Estate, Kisumu",
  "incidentDate": "May 11, 2026",
  "description": "On May 11, 2026, at approximately 8:00 PM, a four-storey building under construction collapsed in the Tom Mboya Estate, Kisumu.",
  "passingScore": 75
};

export default function Case5(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
