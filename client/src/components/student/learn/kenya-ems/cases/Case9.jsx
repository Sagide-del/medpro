// Case 9: MICHAEL WAFULA - 5 HOURS, NO AMBULANCE
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 9,
  "title": "CASE STUDY 9: MICHAEL WAFULA - 5 HOURS, NO AMBULANCE",
  "shortTitle": "MICHAEL WAFULA - 5 HOURS, NO AMBULANCE",
  "category": "Kenya EMS Case Review",
  "difficulty": "Intermediate",
  "location": "Machakos County",
  "incidentDate": "April 2026",
  "description": "Michael Wafula did not die from the impact of the vehicle that struck him. He died from what came after: 30 calls, and not one of them reached anyone who could help.",
  "passingScore": 80,
  "sections": [
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 9: MICHAEL WAFULA - 5 HOURS, NO AMBULANCE"
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-location",
      "type": "paragraph",
      "text": "Machakos County, April 2026"
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-heading-800001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800002",
      "type": "paragraph",
      "text": "Michael Wafula did not die from the impact of the vehicle that struck him. He died from what came after: 30 calls, and not one of them reached anyone who could help."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800003",
      "type": "paragraph",
      "text": "The Sequence of Events:"
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800004",
      "type": "paragraph",
      "text": "9:47 AM - The Impact:\nWafula was walking along a road in Machakos County when a vehicle struck him and drove away. He was left on the tarmac, his body broken, his breathing shallow, and his consciousness slipping in and out. A passing motorist noticed him, checked his pulse and breathing, and took out his phone to start looking for help."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800005",
      "type": "paragraph",
      "text": "9:51 AM - The First Call:\nA crowd gathered. Together with other motorists, they called the nearest public hospital. The line connected and rang. Nobody answered. They tried again. Same result."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800006",
      "type": "paragraph",
      "text": "9:58 AM - The Second Call:\nThey tried a different facility. A line connected, and a voice told them the hospital had no ambulance available, and that they should try another number. They asked for it, wrote it down, and called. It rang out. No response."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800007",
      "type": "paragraph",
      "text": "10:20 AM - The Emergency Line:\nThey found the county emergency line listed on a government website and called it. It did not connect. They called the national emergency toll-free numbers—999, 112, and 911—used to reach police, fire, or ambulance services countrywide. No one answered."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800008",
      "type": "paragraph",
      "text": "12:00 PM - More Numbers:\nOne call finally connected to a private ambulance service. When the caller explained his location and the nature of the accident, he was asked to pay a down payment of Sh300,000 before an ambulance would be dispatched and a bed secured. He did not have the money."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800009",
      "type": "paragraph",
      "text": "2:30 PM - His Breathing Changed:\nFive hours had passed. Wafula's breathing became labored. They were still trying to reach family members who were now on their way. A school bus driver agreed to take him to the nearest hospital."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800010",
      "type": "paragraph",
      "text": "3:07 PM - The Breathing Stopped:\nWafula died on the way to the hospital, surrounded by strangers who had volunteered to rush him there."
    },
    {
      "id": "45bbf657-8318-581d-b6c6-56563aaf2577-paragraph-800011",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-9-section-1-activity-1-question",
      "type": "question",
      "title": "Analysis of System Failure:",
      "phase": "Incident Background",
      "text": "1. Analysis of System Failure:\n\nYour Response: (fill in)\n\ntext\nWhat were the failures in this case? ______________________________________"
    },
    {
      "id": "case-9-section-1-activity-1-response",
      "type": "response",
      "title": "Analysis of System Failure:",
      "fields": [
        {
          "id": "what-were-the-failures-in-this-case",
          "label": "What were the failures in this case?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 20
    },
    {
      "id": "case-9-section-1-activity-2-question",
      "type": "question",
      "title": "_______________________________________________________________________",
      "phase": "Incident Background",
      "text": "1. _______________________________________________________________________"
    },
    {
      "id": "case-9-section-1-activity-2-response",
      "type": "response",
      "title": "_______________________________________________________________________",
      "fields": [
        {
          "id": "1",
          "label": "1.",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 20
    },
    {
      "id": "case-9-section-1-activity-3-question",
      "type": "question",
      "title": "_______________________________________________________________________",
      "phase": "Incident Background",
      "text": "2. _______________________________________________________________________"
    },
    {
      "id": "case-9-section-1-activity-3-response",
      "type": "response",
      "title": "_______________________________________________________________________",
      "fields": [
        {
          "id": "2",
          "label": "2.",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-9-section-1-activity-4-question",
      "type": "question",
      "title": "_______________________________________________________________________",
      "phase": "Incident Background",
      "text": "3. _______________________________________________________________________"
    },
    {
      "id": "case-9-section-1-activity-4-response",
      "type": "response",
      "title": "_______________________________________________________________________",
      "fields": [
        {
          "id": "3",
          "label": "3.",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 0
    },
    {
      "id": "case-9-section-1-activity-5-question",
      "type": "question",
      "title": "_______________________________________________________________________",
      "phase": "Incident Background",
      "text": "4. _______________________________________________________________________\n\nWhat should the family/community have been able to access? ________________\n__________________________________________________________________________"
    },
    {
      "id": "case-9-section-1-activity-5-response",
      "type": "response",
      "title": "_______________________________________________________________________",
      "fields": [
        {
          "id": "4",
          "label": "4.",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-should-the-family-community-have-been-able-",
          "label": "What should the family/community have been able to access?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 0
    },
    {
      "id": "case-9-section-1-activity-6-question",
      "type": "question",
      "title": "Recommendations:",
      "phase": "Incident Background",
      "text": "2. Recommendations:\n\nYour Response: (fill in)\n\ntext\nWhat systems need to be in place to prevent this? _________________________\n__________________________________________________________________________\n__________________________________________________________________________\n📊"
    },
    {
      "id": "case-9-section-1-activity-6-response",
      "type": "response",
      "title": "Recommendations:",
      "fields": [
        {
          "id": "what-systems-need-to-be-in-place-to-prevent-this",
          "label": "What systems need to be in place to prevent this?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 0
    }
  ]
};

export const caseMeta = {
  "id": 9,
  "title": "CASE STUDY 9: MICHAEL WAFULA - 5 HOURS, NO AMBULANCE",
  "shortTitle": "MICHAEL WAFULA - 5 HOURS, NO AMBULANCE",
  "category": "Kenya EMS Case Review",
  "difficulty": "Intermediate",
  "location": "Machakos County",
  "incidentDate": "April 2026",
  "description": "Michael Wafula did not die from the impact of the vehicle that struck him. He died from what came after: 30 calls, and not one of them reached anyone who could help.",
  "passingScore": 80
};

export default function Case9(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
