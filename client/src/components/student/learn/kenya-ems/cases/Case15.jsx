// Case 15: THE STATE OF EMERGENCY CARE - SYSTEM FAILURES
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 15,
  "title": "CASE STUDY 15: THE STATE OF EMERGENCY CARE - SYSTEM FAILURES",
  "shortTitle": "THE STATE OF EMERGENCY CARE - SYSTEM FAILURES",
  "category": "Emergency Care Systems Review",
  "difficulty": "Advanced",
  "location": "Summary of Critical Issues",
  "incidentDate": "Not specified",
  "description": "Based on all case studies, the following systemic issues have been identified:",
  "passingScore": 70,
  "sections": [
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 15: THE STATE OF EMERGENCY CARE - SYSTEM FAILURES"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-location",
      "type": "paragraph",
      "text": "Summary of Critical Issues, Not specified"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400001",
      "type": "paragraph",
      "text": "Based on all case studies, the following systemic issues have been identified:"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400002",
      "type": "paragraph",
      "text": "Ambulance Shortage: Nairobi County has only 20 of the 50 ambulances required"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400003",
      "type": "paragraph",
      "text": "Response Time Failures: Delays ranging from 20 minutes to over 5 hours"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400004",
      "type": "paragraph",
      "text": "Equipment Gaps: Ambulances \"empty, carrying no equipment at all\""
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400005",
      "type": "paragraph",
      "text": "Emergency Line Failures: 999, 112, and 911 calls not connecting"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400006",
      "type": "paragraph",
      "text": "Private Ambulance Barriers: Sh300,000 down payment required"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400007",
      "type": "paragraph",
      "text": "Hospital Overload: Kenyatta National Hospital queue delays causing deaths"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400008",
      "type": "paragraph",
      "text": "School Safety Failures: Locked dormitory doors, corporal punishment, fire safety gaps"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400009",
      "type": "paragraph",
      "text": "Building Regulation Failures: Substandard materials, structural violations"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400010",
      "type": "paragraph",
      "text": "🛑 FINAL REFLECTION\nYour Response: (fill in)"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400011",
      "type": "paragraph",
      "text": "text\nWhat are the THREE most important lessons you have learned from these case studies?"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400012",
      "type": "paragraph",
      "text": "1. _______________________________________________________________________"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400013",
      "type": "paragraph",
      "text": "2. _______________________________________________________________________"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400014",
      "type": "paragraph",
      "text": "3. _______________________________________________________________________"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400015",
      "type": "paragraph",
      "text": "How will this affect your practice as an EMT? ____________________________\n__________________________________________________________________________"
    },
    {
      "id": "d0644624-1417-5046-ad93-53eae32d833b-paragraph-1400016",
      "type": "paragraph",
      "text": "What will you do to advocate for system improvement? ______________________\n__________________________________________________________________________"
    }
  ]
};

export const caseMeta = {
  "id": 15,
  "title": "CASE STUDY 15: THE STATE OF EMERGENCY CARE - SYSTEM FAILURES",
  "shortTitle": "THE STATE OF EMERGENCY CARE - SYSTEM FAILURES",
  "category": "Emergency Care Systems Review",
  "difficulty": "Advanced",
  "location": "Summary of Critical Issues",
  "incidentDate": "Not specified",
  "description": "Based on all case studies, the following systemic issues have been identified:",
  "passingScore": 70
};

export default function Case15(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
