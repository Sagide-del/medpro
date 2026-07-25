// Case 4: NAIROBI BUS MASS CASUALTY INCIDENT
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 4,
  "title": "CASE STUDY 4: NAIROBI BUS MASS CASUALTY INCIDENT",
  "shortTitle": "NAIROBI BUS MASS CASUALTY INCIDENT",
  "category": "Road Traffic Mass Casualty",
  "difficulty": "Intermediate",
  "location": "Kenyatta Avenue, Nairobi",
  "incidentDate": "October 14, 2025",
  "description": "At approximately 12:30 AM on October 14, 2025, a Citi Hoppa bus was involved in a serious accident along Kenyatta Avenue near Serena Hotel in Nairobi.",
  "passingScore": 71,
  "sections": [
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 4: NAIROBI BUS MASS CASUALTY INCIDENT"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-location",
      "type": "paragraph",
      "text": "Kenyatta Avenue, Nairobi, October 14, 2025"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-heading-300001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300002",
      "type": "paragraph",
      "text": "At approximately 12:30 AM on October 14, 2025, a Citi Hoppa bus was involved in a serious accident along Kenyatta Avenue near Serena Hotel in Nairobi."
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-heading-300003",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300004",
      "type": "paragraph",
      "text": "24 casualties admitted to Kenyatta National Hospital"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300005",
      "type": "paragraph",
      "text": "11 females, 13 males among the casualties"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300006",
      "type": "paragraph",
      "text": "Multiple patients were trapped under the bus"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300007",
      "type": "paragraph",
      "text": "Resources overwhelmed: \"I have mobilised all available county ambulances, but they are not enough. If you have an ambulance, please come and assist us immediately\""
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300008",
      "type": "paragraph",
      "text": "Context of Road Safety Crisis:"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300009",
      "type": "paragraph",
      "text": "Just days earlier, another accident occurred at Waruku"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300010",
      "type": "paragraph",
      "text": "Nairobi County has only 20 ambulances - far short of the 50 required"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-300011",
      "type": "paragraph",
      "text": "Response times range from 20 to 60 minutes depending on traffic"
    },
    {
      "id": "case-4-section-2-scenario-dispatch",
      "type": "dispatch",
      "text": "You receive the following dispatch:\n\n\"MASS CASUALTY INCIDENT - ROAD TRAFFIC CRASH - KENYATTA AVENUE NEAR SERENA HOTEL.\n\nConfirmed: Bus accident with multiple trapped and injured.\n\nResponse: All available ambulances in Nairobi are being mobilised.\n\nProceed immediately. Coordinate with Kenya Red Cross at the scene.\"\n\n🛑"
    },
    {
      "id": "case-4-section-2-activity-1-question",
      "type": "question",
      "title": "Pre-Arrival Assessment:",
      "phase": "Part 1: Dispatch Information",
      "text": "1. Pre-Arrival Assessment:\n\nYour Response: (fill in)\n\ntext\nLocation and route considerations: ________________________________________\nWhat equipment is most critical for this call? ___________________________\nWhat information do you need from dispatch? ______________________________"
    },
    {
      "id": "case-4-section-2-activity-1-response",
      "type": "response",
      "title": "Pre-Arrival Assessment:",
      "fields": [
        {
          "id": "location-and-route-considerations",
          "label": "Location and route considerations",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-equipment-is-most-critical-for-this-call",
          "label": "What equipment is most critical for this call?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-information-do-you-need-from-dispatch",
          "label": "What information do you need from dispatch?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-4-section-2-activity-2-question",
      "type": "question",
      "title": "Anticipating Mass Casualty Needs:",
      "phase": "Part 1: Dispatch Information",
      "text": "2. Anticipating Mass Casualty Needs:\n\nYour Response: (fill in)\n\ntext\nResource needs: __________________________________________________________\nExpected injury patterns: ________________________________________________"
    },
    {
      "id": "case-4-section-2-activity-2-response",
      "type": "response",
      "title": "Anticipating Mass Casualty Needs:",
      "fields": [
        {
          "id": "resource-needs",
          "label": "Resource needs",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "expected-injury-patterns",
          "label": "Expected injury patterns",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304001",
      "type": "paragraph",
      "text": "Scene Assessment:"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304002",
      "type": "paragraph",
      "text": "You arrive at 12:45 AM. The scene is chaotic:"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304003",
      "type": "paragraph",
      "text": "Vehicle: A Citi Hoppa bus on its side, with significant damage. The front of the bus is crushed. Several passengers are trapped inside."
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304004",
      "type": "paragraph",
      "text": "Patients: Victims are everywhere - some are lying on the road, others are wandering in shock. Some are trapped under the vehicle."
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304005",
      "type": "paragraph",
      "text": "Bystanders: A large crowd has gathered. Many are trying to help, but this is complicating access for responders."
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304006",
      "type": "paragraph",
      "text": "Police: Police are on scene but are struggling to control the crowd."
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304007",
      "type": "paragraph",
      "text": "Ambulances: Four ambulances are on scene (including yours). More are needed."
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304008",
      "type": "paragraph",
      "text": "Patients you identify:"
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-table-304009",
      "type": "table",
      "headers": [
        "Patient",
        "Age/Sex",
        "Injuries",
        "Priority"
      ],
      "rows": [
        [
          "A",
          "35/M",
          "Trapped under bus, conscious, leg crushed, BP 85/55, HR 120",
          "?"
        ],
        [
          "B",
          "28/F",
          "Multiple lacerations, head injury, GCS 12, BP 100/70",
          "?"
        ],
        [
          "C",
          "42/M",
          "Ambulatory, minor abrasions, GCS 15",
          "?"
        ],
        [
          "D",
          "60/F",
          "Chest pain, difficulty breathing, BP 140/90, HR 100",
          "?"
        ],
        [
          "E",
          "22/F",
          "Unconscious, trapped in bus, head injury, GCS 6, RR 28",
          "?"
        ],
        [
          "F",
          "45/M",
          "Spinal injury suspected, GCS 15, no motor function in legs",
          "?"
        ],
        [
          "G",
          "30/F",
          "Panic attack, hyperventilating, no visible injuries",
          "?"
        ],
        [
          "H",
          "50/M",
          "Severe bleeding from arm laceration, BP 90/60, HR 125",
          "?"
        ]
      ]
    },
    {
      "id": "6833a9c4-9d43-5ea1-a9d5-295e84dec990-paragraph-304010",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-4-section-3-activity-1-table",
      "type": "table",
      "headers": [
        "Patient",
        "Color",
        "Priority",
        "Rationale"
      ],
      "rows": [
        [
          "Patient A (35/M, trapped, leg crushed, BP 85/55, HR 120)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient B (28/F, head injury, GCS 12, BP 100/70)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient C (42/M, ambulatory, minor abrasions)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient D (60/F, chest pain, BP 140/90)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient E (22/F, trapped, head injury, GCS 6, RR 28)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient F (45/M, spinal injury, paralysis suspected)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient G (30/F, panic attack)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient H (50/M, severe bleeding, BP 90/60, HR 125)",
          "color",
          "priority",
          "rationale"
        ]
      ]
    },
    {
      "id": "case-4-section-3-activity-1-question",
      "type": "question",
      "title": "Triage & Treatment Decisions:",
      "phase": "Part 2: Arrival at Scene",
      "text": "3. Triage & Treatment Decisions:\n\nYour Response: (fill in)\n\ntext\nPatient A (35/M, trapped, leg crushed, BP 85/55, HR 120):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n\nPatient B (28/F, head injury, GCS 12, BP 100/70):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n\nPatient C (42/M, ambulatory, minor abrasions):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n\nPatient D (60/F, chest pain, BP 140/90):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n\nPatient E (22/F, trapped, head injury, GCS 6, RR 28):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n\nPatient F (45/M, spinal injury, paralysis suspected):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n\nPatient G (30/F, panic attack):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n\nPatient H (50/M, severe bleeding, BP 90/60, HR 125):\nColor: _______________ Priority: _______________\nImmediate interventions: __________________________________________________\n📊"
    },
    {
      "id": "case-4-section-3-activity-1-response",
      "type": "response",
      "title": "Triage & Treatment Decisions:",
      "fields": [
        {
          "id": "color-priority",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "immediate-interventions",
          "label": "Immediate interventions",
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
          "id": "immediate-interventions-2",
          "label": "Immediate interventions",
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
          "id": "immediate-interventions-3",
          "label": "Immediate interventions",
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
          "id": "immediate-interventions-4",
          "label": "Immediate interventions",
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
          "id": "immediate-interventions-5",
          "label": "Immediate interventions",
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
          "id": "immediate-interventions-6",
          "label": "Immediate interventions",
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
          "id": "immediate-interventions-7",
          "label": "Immediate interventions",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-8",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "immediate-interventions-8",
          "label": "Immediate interventions",
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
            "row_id": "a",
            "label": "Patient A (35/M, trapped, leg crushed, BP 85/55, HR 120)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "b",
            "label": "Patient B (28/F, head injury, GCS 12, BP 100/70)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "c",
            "label": "Patient C (42/M, ambulatory, minor abrasions)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "d",
            "label": "Patient D (60/F, chest pain, BP 140/90)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "e",
            "label": "Patient E (22/F, trapped, head injury, GCS 6, RR 28)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "f",
            "label": "Patient F (45/M, spinal injury, paralysis suspected)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "g",
            "label": "Patient G (30/F, panic attack)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "h",
            "label": "Patient H (50/M, severe bleeding, BP 90/60, HR 125)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          }
        ]
      },
      "points": 10
    }
  ]
};

export const caseMeta = {
  "id": 4,
  "title": "CASE STUDY 4: NAIROBI BUS MASS CASUALTY INCIDENT",
  "shortTitle": "NAIROBI BUS MASS CASUALTY INCIDENT",
  "category": "Road Traffic Mass Casualty",
  "difficulty": "Intermediate",
  "location": "Kenyatta Avenue, Nairobi",
  "incidentDate": "October 14, 2025",
  "description": "At approximately 12:30 AM on October 14, 2025, a Citi Hoppa bus was involved in a serious accident along Kenyatta Avenue near Serena Hotel in Nairobi.",
  "passingScore": 71
};

export default function Case4(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
