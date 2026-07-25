// Case 6: KAKAMEGA FUNERAL BUS CRASH
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 6,
  "title": "CASE STUDY 6: KAKAMEGA FUNERAL BUS CRASH",
  "shortTitle": "KAKAMEGA FUNERAL BUS CRASH",
  "category": "Road Traffic Trauma",
  "difficulty": "Intermediate",
  "location": "Kisumu-Kakamega Highway",
  "incidentDate": "August 8, 2025",
  "description": "On August 8, 2025, a bus carrying mourners returning from a funeral crashed along the Kisumu-Kakamega Highway.",
  "passingScore": 71,
  "sections": [
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 6: KAKAMEGA FUNERAL BUS CRASH"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-location",
      "type": "paragraph",
      "text": "Kisumu-Kakamega Highway, August 8, 2025"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-heading-500001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500002",
      "type": "paragraph",
      "text": "On August 8, 2025, a bus carrying mourners returning from a funeral crashed along the Kisumu-Kakamega Highway."
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-heading-500003",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500004",
      "type": "paragraph",
      "text": "25 total deaths (21 at scene, 4 in hospital)"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500005",
      "type": "paragraph",
      "text": "10 women, 10 men, 1 girl died at the scene"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500006",
      "type": "paragraph",
      "text": "20 passengers injured (5 seriously)"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500007",
      "type": "paragraph",
      "text": "All passengers from one family"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500008",
      "type": "paragraph",
      "text": "Location: Near a roundabout on the Kisumu-Kakamega Highway"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500009",
      "type": "paragraph",
      "text": "Vehicle: Secondary school bus being used for funeral transport"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500010",
      "type": "paragraph",
      "text": "The Crash:"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500011",
      "type": "paragraph",
      "text": "\"The driver lost control, veered off the road and overturned into a ditch along the Kisumu-Kakamega Highway on Friday afternoon,\" a police report seen by the BBC says. The area is notorious for many deadly accidents."
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500012",
      "type": "paragraph",
      "text": "According to Peter Maina, a regional traffic enforcement officer for Nyanza province, the driver lost control of the bus as it approached a roundabout at high speed and plunged into a ditch."
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500013",
      "type": "paragraph",
      "text": "Government Response:"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500014",
      "type": "paragraph",
      "text": "Kenya's Ministry of Health called for an \"urgent blood drive\" to help survivors"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500015",
      "type": "paragraph",
      "text": "Kenyan President William Ruto called for authorities to quickly book \"those responsible for any acts of negligence leading to the accident\""
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500016",
      "type": "paragraph",
      "text": "National Transport and Safety Authority (NTSA) will aid investigations"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500017",
      "type": "paragraph",
      "text": "Context of Road Safety Crisis:"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500018",
      "type": "paragraph",
      "text": "Road deaths in Kenya rose more than 20% between 2020-2021"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500019",
      "type": "paragraph",
      "text": "In 2021, more than 4,500 people were killed and more than 16,000 injured"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500020",
      "type": "paragraph",
      "text": "This area is notorious for many deadly accidents"
    },
    {
      "id": "2768b6ca-5910-5712-90e7-f3573931163c-paragraph-500021",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-6-section-1-activity-1-question",
      "type": "question",
      "title": "Dispatch & Pre-Arrival Assessment:",
      "phase": "Incident Background",
      "text": "1. Dispatch & Pre-Arrival Assessment:\n\nYour Response: (fill in)\n\ntext\nLocation: Kisumu-Kakamega Highway\nEstimated time to scene: _________________________________________________\n\nWhat are the likely injuries from a rollover bus crash? ___________________\n\nWhat resources would you request? ________________________________________"
    },
    {
      "id": "case-6-section-1-activity-1-response",
      "type": "response",
      "title": "Dispatch & Pre-Arrival Assessment:",
      "fields": [
        {
          "id": "estimated-time-to-scene",
          "label": "Estimated time to scene",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-are-the-likely-injuries-from-a-rollover-bus",
          "label": "What are the likely injuries from a rollover bus crash?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-resources-would-you-request",
          "label": "What resources would you request?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-6-section-1-activity-2-question",
      "type": "question",
      "title": "Mass Casualty Considerations:",
      "phase": "Incident Background",
      "text": "2. Mass Casualty Considerations:\n\nYour Response: (fill in)\n\ntext\nWhat makes this a mass casualty incident? _________________________________\n\nWhat are the key differences between a bus crash and other MCIs? ___________\n🛑 STUDENT ACTION REQUIRED - PHASE 2"
    },
    {
      "id": "case-6-section-1-activity-2-response",
      "type": "response",
      "title": "Mass Casualty Considerations:",
      "fields": [
        {
          "id": "what-makes-this-a-mass-casualty-incident",
          "label": "What makes this a mass casualty incident?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-are-the-key-differences-between-a-bus-crash",
          "label": "What are the key differences between a bus crash and other MCIs?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-6-section-1-activity-3-question",
      "type": "question",
      "title": "Triage & Initial Assessment:",
      "phase": "Incident Background",
      "text": "3. Triage & Initial Assessment:\n\nYour Response: (fill in)\n\ntext\nHow do you prioritize patients when all are from one family? ______________\n__________________________________________________________________________\n\nWhat psychological considerations apply to this incident? _________________\n__________________________________________________________________________\n📊"
    },
    {
      "id": "case-6-section-1-activity-3-response",
      "type": "response",
      "title": "Triage & Initial Assessment:",
      "fields": [
        {
          "id": "how-do-you-prioritize-patients-when-all-are-from",
          "label": "How do you prioritize patients when all are from one family?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-psychological-considerations-apply-to-this-",
          "label": "What psychological considerations apply to this incident?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    }
  ]
};

export const caseMeta = {
  "id": 6,
  "title": "CASE STUDY 6: KAKAMEGA FUNERAL BUS CRASH",
  "shortTitle": "KAKAMEGA FUNERAL BUS CRASH",
  "category": "Road Traffic Trauma",
  "difficulty": "Intermediate",
  "location": "Kisumu-Kakamega Highway",
  "incidentDate": "August 8, 2025",
  "description": "On August 8, 2025, a bus carrying mourners returning from a funeral crashed along the Kisumu-Kakamega Highway.",
  "passingScore": 71
};

export default function Case6(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
