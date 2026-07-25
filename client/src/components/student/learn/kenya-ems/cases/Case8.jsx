// Case 8: JOMO KENYATTA INTERNATIONAL AIRPORT (JKIA) EMERGENCY DRILL & INCIDENTS
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 8,
  "title": "CASE STUDY 8: JOMO KENYATTA INTERNATIONAL AIRPORT (JKIA) EMERGENCY DRILL & INCIDENTS",
  "shortTitle": "JOMO KENYATTA INTERNATIONAL AIRPORT (JKIA) EMERGENCY DRILL & INCIDENTS",
  "category": "Kenya EMS Case Review",
  "difficulty": "Intermediate",
  "location": "Nairobi - Various Dates",
  "incidentDate": "Not specified",
  "description": "March 20, 2026 - Wilson Airport Crash Landing: A passenger plane crash-landed at Wilson Airport in Nairobi, triggering an emergency response. The aircraft, registered as 5Y-BXI and operated by Aircraft Leasing Services (ALS), had been flying from Kisumu. ALS was known for operating flights for humanitarian agencies including the UN World Food Programme and the International Committee of the Red Cross.",
  "passingScore": 70,
  "sections": [
    {
      "id": "3465510c-791b-5773-8af4-fce06aa8a522-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 8: JOMO KENYATTA INTERNATIONAL AIRPORT (JKIA) EMERGENCY DRILL & INCIDENTS"
    },
    {
      "id": "3465510c-791b-5773-8af4-fce06aa8a522-location",
      "type": "paragraph",
      "text": "Nairobi - Various Dates, Not specified"
    },
    {
      "id": "3465510c-791b-5773-8af4-fce06aa8a522-heading-700001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "3465510c-791b-5773-8af4-fce06aa8a522-paragraph-700002",
      "type": "paragraph",
      "text": "March 20, 2026 - Wilson Airport Crash Landing: A passenger plane crash-landed at Wilson Airport in Nairobi, triggering an emergency response. The aircraft, registered as 5Y-BXI and operated by Aircraft Leasing Services (ALS), had been flying from Kisumu. ALS was known for operating flights for humanitarian agencies including the UN World Food Programme and the International Committee of the Red Cross."
    },
    {
      "id": "3465510c-791b-5773-8af4-fce06aa8a522-paragraph-700003",
      "type": "paragraph",
      "text": "April 24, 2026 - Mandera Runway Excursion: A commercial passenger plane on the Nairobi-Mandera route veered off the runway and ended up in surrounding vegetation at the Mandera Airstrip. All 32 passengers and 4 crew members were safely evacuated with no injuries reported."
    },
    {
      "id": "3465510c-791b-5773-8af4-fce06aa8a522-paragraph-700004",
      "type": "paragraph",
      "text": "June 11, 2026 - JKIA Emergency Drill: The Kenya Airports Authority (KAA) confirmed an emergency situation at JKIA was actually a simulated scenario conducted as part of a planned Full-Scale Emergency Exercise. Emergency response teams and agencies had been activated in accordance with established emergency procedures."
    },
    {
      "id": "3465510c-791b-5773-8af4-fce06aa8a522-paragraph-700005",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-8-section-1-activity-1-question",
      "type": "question",
      "title": "Aircraft Incident Response Planning:",
      "phase": "Incident Background",
      "text": "1. Aircraft Incident Response Planning:\n\nYour Response: (fill in)\n\ntext\nWhat are the unique challenges of an aircraft incident response? ___________\n\nWhat are the triage considerations for an aircraft incident? ______________\n\nWhat resources are typically required? ____________________________________"
    },
    {
      "id": "case-8-section-1-activity-1-response",
      "type": "response",
      "title": "Aircraft Incident Response Planning:",
      "fields": [
        {
          "id": "what-are-the-unique-challenges-of-an-aircraft-in",
          "label": "What are the unique challenges of an aircraft incident response?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-are-the-triage-considerations-for-an-aircra",
          "label": "What are the triage considerations for an aircraft incident?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-resources-are-typically-required",
          "label": "What resources are typically required?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    },
    {
      "id": "case-8-section-1-activity-2-question",
      "type": "question",
      "title": "Emergency Drill Considerations:",
      "phase": "Incident Background",
      "text": "2. Emergency Drill Considerations:\n\nYour Response: (fill in)\n\ntext\nWhy are emergency drills important for airport incidents? _________________\n\nHow do drills help prepare for real incidents? ___________________________\n📊"
    },
    {
      "id": "case-8-section-1-activity-2-response",
      "type": "response",
      "title": "Emergency Drill Considerations:",
      "fields": [
        {
          "id": "why-are-emergency-drills-important-for-airport-i",
          "label": "Why are emergency drills important for airport incidents?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "how-do-drills-help-prepare-for-real-incidents",
          "label": "How do drills help prepare for real incidents?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    }
  ]
};

export const caseMeta = {
  "id": 8,
  "title": "CASE STUDY 8: JOMO KENYATTA INTERNATIONAL AIRPORT (JKIA) EMERGENCY DRILL & INCIDENTS",
  "shortTitle": "JOMO KENYATTA INTERNATIONAL AIRPORT (JKIA) EMERGENCY DRILL & INCIDENTS",
  "category": "Kenya EMS Case Review",
  "difficulty": "Intermediate",
  "location": "Nairobi - Various Dates",
  "incidentDate": "Not specified",
  "description": "March 20, 2026 - Wilson Airport Crash Landing: A passenger plane crash-landed at Wilson Airport in Nairobi, triggering an emergency response. The aircraft, registered as 5Y-BXI and operated by Aircraft Leasing Services (ALS), had been flying from Kisumu. ALS was known for operating flights for humanitarian agencies including the UN World Food Programme and the International Committee of the Red Cross.",
  "passingScore": 70
};

export default function Case8(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
