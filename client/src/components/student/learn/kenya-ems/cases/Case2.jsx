// Case 2: UTUMISHI GIRLS ACADEMY DORMITORY FIRE
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 2,
  "title": "CASE STUDY 2: UTUMISHI GIRLS ACADEMY DORMITORY FIRE",
  "shortTitle": "UTUMISHI GIRLS ACADEMY DORMITORY FIRE",
  "category": "School Fire Response",
  "difficulty": "Advanced",
  "location": "Gilgil, Nakuru County",
  "incidentDate": "May 28, 2026",
  "description": "At approximately 3:30 AM on May 28, 2026, a devastating fire broke out in a dormitory at Utumishi Girls Academy in Gilgil, Nakuru County, approximately 120 km (76 miles) northwest of Nairobi.",
  "passingScore": 75,
  "sections": [
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 2: UTUMISHI GIRLS ACADEMY DORMITORY FIRE"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-location",
      "type": "paragraph",
      "text": "Gilgil, Nakuru County, May 28, 2026"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-heading-100001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100002",
      "type": "paragraph",
      "text": "At approximately 3:30 AM on May 28, 2026, a devastating fire broke out in a dormitory at Utumishi Girls Academy in Gilgil, Nakuru County, approximately 120 km (76 miles) northwest of Nairobi."
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-heading-100003",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100004",
      "type": "paragraph",
      "text": "16 confirmed fatalities (students)"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100005",
      "type": "paragraph",
      "text": "79 injured students requiring medical attention"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100006",
      "type": "paragraph",
      "text": "220 students in the dormitory when the fire started"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100007",
      "type": "paragraph",
      "text": "Response time: First responders arrived approximately 2 hours after the fire was reported"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100008",
      "type": "paragraph",
      "text": "School Fire Context (Kenya)\n2024: 21 boys killed in a dormitory fire at Hillside Endarasha Academy, Nyeri County"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100009",
      "type": "paragraph",
      "text": "2017: 10 students died in a dormitory fire at Moi Girls High School in Nairobi"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100010",
      "type": "paragraph",
      "text": "2001: 67 students died in the deadliest school fire in Kenya's history at Kyanguli Secondary School"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-100011",
      "type": "paragraph",
      "text": "2022 Auditor General Report: Found most state secondary schools were not prepared to deal with fires"
    },
    {
      "id": "case-2-section-2-scenario-dispatch",
      "type": "dispatch",
      "text": "You receive the following dispatch message:\n\n\"MAJOR INCIDENT - STRUCTURE FIRE - UTUMISHI GIRLS ACADEMY, GILGIL, NAKURU COUNTY.\n\nConfirmed: Dormitory fire with multiple casualties. Students trapped. Jumpers reported.\n\nMulti-agency response: County Fire Brigade, County Disaster Response Teams, Kenya Red Cross, National Police Service.\n\nRespond immediately. Stage at the school entrance. Be prepared for mass casualty triage.\"\n\n🛑"
    },
    {
      "id": "case-2-section-2-activity-1-question",
      "type": "question",
      "title": "Dispatch & Response Assessment:",
      "phase": "Part 1: Dispatch Information",
      "text": "1. Dispatch & Response Assessment:\n\nYour Response: (fill in)\n\ntext\nTime to scene (estimated distance 30 km): ________________________________\nInitial patient count estimate: __________________________________________\nResources you are bringing: _____________________________________________\nWhat additional resources should be requested immediately? _______________"
    },
    {
      "id": "case-2-section-2-activity-1-response",
      "type": "response",
      "title": "Dispatch & Response Assessment:",
      "fields": [
        {
          "id": "time-to-scene-estimated-distance-30-km",
          "label": "Time to scene (estimated distance 30 km)",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "initial-patient-count-estimate",
          "label": "Initial patient count estimate",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "resources-you-are-bringing",
          "label": "Resources you are bringing",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-additional-resources-should-be-requested-im",
          "label": "What additional resources should be requested immediately?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-2-section-2-activity-2-question",
      "type": "question",
      "title": "Safety & Scene Considerations:",
      "phase": "Part 1: Dispatch Information",
      "text": "2. Safety & Scene Considerations:\n\nYour Response: (fill in)\n\ntext\nSafety concerns: ________________________________________________________\nBSI precautions: ________________________________________________________\nTriage considerations: __________________________________________________"
    },
    {
      "id": "case-2-section-2-activity-2-response",
      "type": "response",
      "title": "Safety & Scene Considerations:",
      "fields": [
        {
          "id": "safety-concerns",
          "label": "Safety concerns",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "bsi-precautions",
          "label": "BSI precautions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "triage-considerations",
          "label": "Triage considerations",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104001",
      "type": "paragraph",
      "text": "You arrive at the school approximately 45 minutes after dispatch. The scene is chaotic:"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104002",
      "type": "paragraph",
      "text": "Fire: The dormitory fire is still burning. Three fire engines are on scene but have difficulty accessing the building."
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104003",
      "type": "paragraph",
      "text": "Students: Injured students are everywhere. Some are lying on the ground, others are being carried by teachers and fellow students."
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104004",
      "type": "paragraph",
      "text": "Parents: Dozens of parents have already arrived, frantically searching for their children."
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104005",
      "type": "paragraph",
      "text": "Security: Police have established a perimeter, but it is not fully secure."
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104006",
      "type": "paragraph",
      "text": "Other Responders: Kenya Red Cross personnel are on scene but appear overwhelmed."
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104007",
      "type": "paragraph",
      "text": "Patients observed:"
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-table-104008",
      "type": "table",
      "headers": [
        "Patient",
        "Age/Sex",
        "Injuries",
        "Status"
      ],
      "rows": [
        [
          "1",
          "15/F",
          "Burns to arms and face, singed hair, RR 30, HR 110",
          "Conscious, in severe distress"
        ],
        [
          "2",
          "17/F",
          "Burn injuries to >50% of body, RR 36, HR 140, BP 85/50",
          "Semi-conscious, severe respiratory distress"
        ],
        [
          "3",
          "16/F",
          "Fractured leg from jumping, open fracture tibia, RR 22, HR 110",
          "Conscious, in pain, BP 110/70"
        ],
        [
          "4",
          "16/F",
          "Unresponsive, not breathing, visible burns",
          "Apneic, pulseless"
        ],
        [
          "5",
          "18/F",
          "Smoke inhalation, coughing, O2 sat 90%, RR 30",
          "Conscious, anxious"
        ],
        [
          "6",
          "15/F",
          "Multiple lacerations from glass, bleeding, RR 24, HR 100",
          "Conscious, BP 110/70"
        ],
        [
          "7",
          "17/F",
          "Second-degree burns to both hands, RR 25, HR 115",
          "Conscious, anxious"
        ]
      ]
    },
    {
      "id": "73d0fb30-71b2-58b7-924c-6b81bcd8ac2e-paragraph-104009",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-2-section-3-activity-1-table",
      "type": "table",
      "headers": [
        "Patient",
        "Color",
        "Priority",
        "Rationale"
      ],
      "rows": [
        [
          "Patient 1 (15/F, burns to arms/face, RR 30, HR 110)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient 2 (17/F, >50% burns, RR 36, HR 140, BP 85/50)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient 3 (16/F, open fracture tibia, RR 22, HR 110)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient 4 (16/F, unresponsive, apneic, pulseless)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient 5 (18/F, smoke inhalation, RR 30, O2 sat 90%)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient 6 (15/F, lacerations, RR 24, HR 100)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient 7 (17/F, hand burns, RR 25, HR 115)",
          "color",
          "priority",
          "rationale"
        ]
      ]
    },
    {
      "id": "case-2-section-3-activity-1-question",
      "type": "question",
      "title": "Triage & Initial Assessment:",
      "phase": "Part 2: Arrival at Scene",
      "text": "3. Triage & Initial Assessment:\n\nYour Response: (fill in)\n\ntext\nPatient 1 (15/F, burns to arms/face, RR 30, HR 110):\nColor: _______________ Priority: _______________\nInterventions: ___________________________________________________________\n\nPatient 2 (17/F, >50% burns, RR 36, HR 140, BP 85/50):\nColor: _______________ Priority: _______________\nInterventions: ___________________________________________________________\n\nPatient 3 (16/F, open fracture tibia, RR 22, HR 110):\nColor: _______________ Priority: _______________\nInterventions: ___________________________________________________________\n\nPatient 4 (16/F, unresponsive, apneic, pulseless):\nColor: _______________ Priority: _______________\nInterventions: ___________________________________________________________\n\nPatient 5 (18/F, smoke inhalation, RR 30, O2 sat 90%):\nColor: _______________ Priority: _______________\nInterventions: ___________________________________________________________\n\nPatient 6 (15/F, lacerations, RR 24, HR 100):\nColor: _______________ Priority: _______________\nInterventions: ___________________________________________________________\n\nPatient 7 (17/F, hand burns, RR 25, HR 115):\nColor: _______________ Priority: _______________\nInterventions: ___________________________________________________________"
    },
    {
      "id": "case-2-section-3-activity-1-response",
      "type": "response",
      "title": "Triage & Initial Assessment:",
      "fields": [
        {
          "id": "color-priority",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions",
          "label": "Interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-2",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-2",
          "label": "Interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-3",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-3",
          "label": "Interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-4",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-4",
          "label": "Interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-5",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-5",
          "label": "Interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-6",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-6",
          "label": "Interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-7",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-7",
          "label": "Interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "table": {
        "columns": [
          "Patient",
          "Color",
          "Priority",
          "Rationale"
        ],
        "rows": [
          {
            "row_id": "1",
            "label": "Patient 1 (15/F, burns to arms/face, RR 30, HR 110)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "2",
            "label": "Patient 2 (17/F, >50% burns, RR 36, HR 140, BP 85/50)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "3",
            "label": "Patient 3 (16/F, open fracture tibia, RR 22, HR 110)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "4",
            "label": "Patient 4 (16/F, unresponsive, apneic, pulseless)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "5",
            "label": "Patient 5 (18/F, smoke inhalation, RR 30, O2 sat 90%)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "6",
            "label": "Patient 6 (15/F, lacerations, RR 24, HR 100)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "7",
            "label": "Patient 7 (17/F, hand burns, RR 25, HR 115)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          }
        ]
      },
      "points": 15
    },
    {
      "id": "case-2-section-3-activity-2-question",
      "type": "question",
      "title": "Critical Decision: Burn Triage:",
      "phase": "Part 2: Arrival at Scene",
      "text": "4. Critical Decision: Burn Triage:\n\nYour Response: (fill in)\n\ntext\nFor Patient 2 (17/F, >50% burns, BP 85/50, RR 36):\n- Rule of Nines estimate: ________________________________________________\n- Critical burn criteria: ________________________________________________\n- Transport priority: ____________________________________________________\n- Most likely complications: _____________________________________________\n\nFor Patient 7 (17/F, hand burns):\n- Burn severity: ________________________________________________________\n- Critical burn? Why/why not: ___________________________________________\n- Special considerations: ________________________________________________\n📊"
    },
    {
      "id": "case-2-section-3-activity-2-response",
      "type": "response",
      "title": "Critical Decision: Burn Triage:",
      "fields": [
        {
          "id": "rule-of-nines-estimate",
          "label": "Rule of Nines estimate",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "critical-burn-criteria",
          "label": "Critical burn criteria",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "transport-priority",
          "label": "Transport priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "most-likely-complications",
          "label": "Most likely complications",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "burn-severity",
          "label": "Burn severity",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "critical-burn-why-why-not",
          "label": "Critical burn? Why/why not",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "special-considerations",
          "label": "Special considerations",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    }
  ]
};

export const caseMeta = {
  "id": 2,
  "title": "CASE STUDY 2: UTUMISHI GIRLS ACADEMY DORMITORY FIRE",
  "shortTitle": "UTUMISHI GIRLS ACADEMY DORMITORY FIRE",
  "category": "School Fire Response",
  "difficulty": "Advanced",
  "location": "Gilgil, Nakuru County",
  "incidentDate": "May 28, 2026",
  "description": "At approximately 3:30 AM on May 28, 2026, a devastating fire broke out in a dormitory at Utumishi Girls Academy in Gilgil, Nakuru County, approximately 120 km (76 miles) northwest of Nairobi.",
  "passingScore": 75
};

export default function Case2(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
