// Case 10: WESTLANDS BUILDING COLLAPSE
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 10,
  "title": "CASE STUDY 10: WESTLANDS BUILDING COLLAPSE",
  "shortTitle": "WESTLANDS BUILDING COLLAPSE",
  "category": "Urban Rescue Case Review",
  "difficulty": "Intermediate",
  "location": "Westlands, Nairobi",
  "incidentDate": "March 18, 2026",
  "description": "On March 18, 2026, at approximately 7:30 PM, a building under construction partially collapsed in Westlands, Nairobi.",
  "passingScore": 80,
  "sections": [
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 10: WESTLANDS BUILDING COLLAPSE"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-location",
      "type": "paragraph",
      "text": "Westlands, Nairobi, March 18, 2026"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-heading-900001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900002",
      "type": "paragraph",
      "text": "On March 18, 2026, at approximately 7:30 PM, a building under construction partially collapsed in Westlands, Nairobi."
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-heading-900003",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900004",
      "type": "paragraph",
      "text": "1 fatality (Vincent Mokaya, assistant crane operator)"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900005",
      "type": "paragraph",
      "text": "1 injured rescued"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900006",
      "type": "paragraph",
      "text": "2 escaped unhurt"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900007",
      "type": "paragraph",
      "text": "Total trapped: 4 workers"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900008",
      "type": "paragraph",
      "text": "Building height: 22 floors when collapse occurred"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900009",
      "type": "paragraph",
      "text": "Time of collapse: Around 8 PM"
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900010",
      "type": "paragraph",
      "text": "The Response:\nThe National Disaster Management Unit (NDMU) responded along with multiple agencies. The response operation was called off at about 3:30 AM on March 19, after successfully accounting for all persons."
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900011",
      "type": "paragraph",
      "text": "Immediate Context:\nThis was the latest such incident in the construction industry. Hours earlier, a building under construction collapsed in Chebocho Sub-location, Kericho County, leaving one person dead and several others injured."
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900012",
      "type": "paragraph",
      "text": "The Kericho incident triggered a multi-agency emergency response involving Kenya Red Cross, National Government Administrative Officers, and local rescue teams. Four people were successfully rescued and rushed to Kericho County Referral Hospital."
    },
    {
      "id": "fc126ade-6ed7-5ce8-b811-3b203ba0fd1b-paragraph-900013",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-10-section-1-activity-1-question",
      "type": "question",
      "title": "Night Rescue Operations:",
      "phase": "Incident Background",
      "text": "1. Night Rescue Operations:\n\nYour Response: (fill in)\n\ntext\nWhat are the special challenges of a night rescue operation? ______________\n__________________________________________________________________________\n\nWhat additional safety considerations apply? ______________________________\n__________________________________________________________________________"
    },
    {
      "id": "case-10-section-1-activity-1-response",
      "type": "response",
      "title": "Night Rescue Operations:",
      "fields": [
        {
          "id": "what-are-the-special-challenges-of-a-night-rescu",
          "label": "What are the special challenges of a night rescue operation?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-additional-safety-considerations-apply",
          "label": "What additional safety considerations apply?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    },
    {
      "id": "case-10-section-1-activity-2-question",
      "type": "question",
      "title": "Worker Safety:",
      "phase": "Incident Background",
      "text": "2. Worker Safety:\n\nYour Response: (fill in)\n\ntext\nWhat worker safety issues does this incident highlight? ___________________\n__________________________________________________________________________\n__________________________________________________________________________\n📊"
    },
    {
      "id": "case-10-section-1-activity-2-response",
      "type": "response",
      "title": "Worker Safety:",
      "fields": [
        {
          "id": "what-worker-safety-issues-does-this-incident-hig",
          "label": "What worker safety issues does this incident highlight?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    }
  ]
};

export const caseMeta = {
  "id": 10,
  "title": "CASE STUDY 10: WESTLANDS BUILDING COLLAPSE",
  "shortTitle": "WESTLANDS BUILDING COLLAPSE",
  "category": "Urban Rescue Case Review",
  "difficulty": "Intermediate",
  "location": "Westlands, Nairobi",
  "incidentDate": "March 18, 2026",
  "description": "On March 18, 2026, at approximately 7:30 PM, a building under construction partially collapsed in Westlands, Nairobi.",
  "passingScore": 80
};

export default function Case10(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
