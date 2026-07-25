// Case 1: THE DUSIT D2 HOTEL TERROR ATTACK
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 1,
  "title": "CASE STUDY 1: THE DUSIT D2 HOTEL TERROR ATTACK",
  "shortTitle": "THE DUSIT D2 HOTEL TERROR ATTACK",
  "category": "Mass Casualty Incident",
  "difficulty": "Advanced",
  "location": "Nairobi",
  "incidentDate": "January 15, 2019",
  "description": "On January 15, 2019, at approximately 2:30 PM, four armed militants attacked the DusitD2 hotel complex in Nairobi's Westlands district. The attack began with an explosion in the parking lot, followed by gunfire as the attackers entered the hotel and office complex.",
  "passingScore": 75,
  "sections": [
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 1: THE DUSIT D2 HOTEL TERROR ATTACK"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-location",
      "type": "paragraph",
      "text": "Nairobi, January 15, 2019"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-heading-1",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-2",
      "type": "paragraph",
      "text": "On January 15, 2019, at approximately 2:30 PM, four armed militants attacked the DusitD2 hotel complex in Nairobi's Westlands district. The attack began with an explosion in the parking lot, followed by gunfire as the attackers entered the hotel and office complex."
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-heading-3",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-4",
      "type": "paragraph",
      "text": "21 fatalities (including civilians and security personnel)"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5",
      "type": "paragraph",
      "text": "28 injured survivors requiring medical evacuation"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-6",
      "type": "paragraph",
      "text": "Approximately 700 people successfully evacuated"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-7",
      "type": "paragraph",
      "text": "Duration of operation: Nearly 20 hours"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8",
      "type": "paragraph",
      "text": "Response time: First responders arrived within 10 minutes of the initial explosion"
    },
    {
      "id": "case-1-section-2-scenario-dispatch",
      "type": "dispatch",
      "text": "You are an EMT-Basic assigned to an ambulance stationed at Kenyatta National Hospital. The following dispatch message is received:\n\n\"MAJOR INCIDENT - ACTIVE TERROR ATTACK - DUSITD2 HOTEL, 14 RIVERSIDE DRIVE, WESTLANDS.\n\nMultiple casualties reported. Explosion and active gunfire confirmed. Unknown number of injured. Multiple agencies responding including ATPU, GSU, KDF, and Kenya Red Cross.\n\nStage at the designated casualty collection point. Proceed with caution. Security forces are clearing the area. Do not enter the hot zone.\"\n\n🛑"
    },
    {
      "id": "case-1-section-2-activity-1-question",
      "type": "question",
      "title": "Scene Size-Up & Safety (Critical First Step):",
      "phase": "Part 1: Dispatch Information",
      "text": "1. Scene Size-Up & Safety (Critical First Step):\n\nBased on the dispatch information and your knowledge of active shooter/terror incidents, what are your PRIMARY scene safety concerns?\n\nWhat is the difference between the HOT, WARM, and COLD zones at this type of incident?\n\nWhere should you position your ambulance?\n\nYour Response: (fill in)\n\ntext\nHOT ZONE: ________________________________________________________________\nWARM ZONE: _______________________________________________________________\nCOLD ZONE: ________________________________________________________________\nAmbulance positioning: ____________________________________________________\nPrimary safety concerns: __________________________________________________"
    },
    {
      "id": "case-1-section-2-activity-1-response",
      "type": "response",
      "title": "Scene Size-Up & Safety (Critical First Step):",
      "fields": [
        {
          "id": "hot-zone",
          "label": "HOT ZONE",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "warm-zone",
          "label": "WARM ZONE",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "cold-zone",
          "label": "COLD ZONE",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "ambulance-positioning",
          "label": "Ambulance positioning",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "primary-safety-concerns",
          "label": "Primary safety concerns",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-1-section-2-activity-2-question",
      "type": "question",
      "title": "BSI & PPE Considerations:",
      "phase": "Part 1: Dispatch Information",
      "text": "2. BSI & PPE Considerations:\n\nWhat personal protective equipment is essential for this scene?\n\nWhat additional precautions might be needed?\n\nYour Response: (fill in)\n\ntext\nEssential PPE: ___________________________________________________________\nAdditional precautions: ___________________________________________________"
    },
    {
      "id": "case-1-section-2-activity-2-response",
      "type": "response",
      "title": "BSI & PPE Considerations:",
      "fields": [
        {
          "id": "essential-ppe",
          "label": "Essential PPE",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "additional-precautions",
          "label": "Additional precautions",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 5
    },
    {
      "id": "case-1-section-2-activity-3-question",
      "type": "question",
      "title": "Triage & Resource Assessment:",
      "phase": "Part 1: Dispatch Information",
      "text": "3. Triage & Resource Assessment:\n\nWhat is the estimated number of patients based on dispatch?\n\nWhat additional resources would you request?\n\nHow would you establish communication with command?\n\nYour Response: (fill in)\n\ntext\nEstimated patient count: __________________________________________________\nAdditional resources needed: _____________________________________________\nCommunication plan: ______________________________________________________"
    },
    {
      "id": "case-1-section-2-activity-3-response",
      "type": "response",
      "title": "Triage & Resource Assessment:",
      "fields": [
        {
          "id": "estimated-patient-count",
          "label": "Estimated patient count",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "additional-resources-needed",
          "label": "Additional resources needed",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "communication-plan",
          "label": "Communication plan",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 5
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5001",
      "type": "paragraph",
      "text": "You arrive at the designated casualty collection point approximately 12 minutes after the first dispatch. Security forces have established a secure perimeter. First patients are being evacuated from the building by police and security personnel."
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5002",
      "type": "paragraph",
      "text": "Your initial scene assessment reveals:"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5003",
      "type": "paragraph",
      "text": "Situation: Active shooter incident with hostages reportedly still inside"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5004",
      "type": "paragraph",
      "text": "Security: GSU and ATPU are clearing the building floor by floor"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5005",
      "type": "paragraph",
      "text": "Patients: Approximately 15-20 casualties are being brought to the collection point"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5006",
      "type": "paragraph",
      "text": "Triage set-up: The Kenya Red Cross has established a basic triage area"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5007",
      "type": "paragraph",
      "text": "Communication: Command post established at the corner of Riverside Drive"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5008",
      "type": "paragraph",
      "text": "You observe the following patients arriving:"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-table-5009",
      "type": "table",
      "headers": [
        "Patient",
        "Age/Sex",
        "Presentation",
        "Status"
      ],
      "rows": [
        [
          "A",
          "35/M",
          "Gunshot wound to the chest, GCS 14, RR 28, BP 100/70",
          "Conscious, in distress"
        ],
        [
          "B",
          "42/F",
          "Shrapnel wounds to both legs, profuse bleeding, GCS 15",
          "Conscious, anxious"
        ],
        [
          "C",
          "60/M",
          "Gunshot wound to the abdomen, GCS 10, RR 32, BP 85/55",
          "Semi-conscious"
        ],
        [
          "D",
          "28/M",
          "Panic attack, no visible injuries, GCS 15",
          "Conscious, hyperventilating"
        ],
        [
          "E",
          "45/F",
          "Gunshot wound to the head, GCS 3, not breathing",
          "Unconscious, apneic"
        ]
      ]
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-5010",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-1-section-3-activity-1-table",
      "type": "table",
      "headers": [
        "Patient",
        "Color",
        "Priority",
        "Rationale"
      ],
      "rows": [
        [
          "Patient A (35/M, chest wound, GCS 14, RR 28, BP 100/70)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient B (42/F, shrapnel wounds, GCS 15)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient C (60/M, abdominal wound, GCS 10, RR 32, BP 85/55)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient D (28/M, panic attack, GCS 15)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient E (45/F, head wound, GCS 3, apneic)",
          "color",
          "priority",
          "rationale"
        ]
      ]
    },
    {
      "id": "case-1-section-3-activity-1-question",
      "type": "question",
      "title": "Initial Triage Decision:",
      "phase": "Part 2: Arrival at Scene",
      "text": "4. Initial Triage Decision:\nUsing the START (Simple Triage and Rapid Treatment) system, classify each patient:\n\nYour Response: (fill in)\n\ntext\nPatient A (35/M, chest wound, GCS 14, RR 28, BP 100/70):\nColor: _______________\nPriority: _______________\nRationale: ________________________________________________________________\n\nPatient B (42/F, shrapnel wounds, GCS 15):\nColor: _______________\nPriority: _______________\nRationale: ________________________________________________________________\n\nPatient C (60/M, abdominal wound, GCS 10, RR 32, BP 85/55):\nColor: _______________\nPriority: _______________\nRationale: ________________________________________________________________\n\nPatient D (28/M, panic attack, GCS 15):\nColor: _______________\nPriority: _______________\nRationale: ________________________________________________________________\n\nPatient E (45/F, head wound, GCS 3, apneic):\nColor: _______________\nPriority: _______________\nRationale: ________________________________________________________________"
    },
    {
      "id": "case-1-section-3-activity-1-response",
      "type": "response",
      "title": "Initial Triage Decision:",
      "fields": [
        {
          "id": "color",
          "label": "Color",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "priority",
          "label": "Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-2",
          "label": "Color",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "priority-2",
          "label": "Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-2",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-3",
          "label": "Color",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "priority-3",
          "label": "Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-3",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-4",
          "label": "Color",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "priority-4",
          "label": "Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-4",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-5",
          "label": "Color",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "priority-5",
          "label": "Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-5",
          "label": "Rationale",
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
            "label": "Patient A (35/M, chest wound, GCS 14, RR 28, BP 100/70)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "b",
            "label": "Patient B (42/F, shrapnel wounds, GCS 15)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "c",
            "label": "Patient C (60/M, abdominal wound, GCS 10, RR 32, BP 85/55)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "d",
            "label": "Patient D (28/M, panic attack, GCS 15)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "e",
            "label": "Patient E (45/F, head wound, GCS 3, apneic)",
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
      "id": "case-1-section-3-activity-2-question",
      "type": "question",
      "title": "Treatment Prioritization:",
      "phase": "Part 2: Arrival at Scene",
      "text": "5. Treatment Prioritization:\n\nWhich patient requires immediate intervention?\n\nWhat specific interventions would you perform for each priority patient?\n\nHow would you coordinate with the Kenya Red Cross team?\n\nYour Response: (fill in)\n\ntext\nImmediate intervention patient: __________________________________________\nInterventions: ___________________________________________________________\nCoordination with Red Cross: _____________________________________________"
    },
    {
      "id": "case-1-section-3-activity-2-response",
      "type": "response",
      "title": "Treatment Prioritization:",
      "fields": [
        {
          "id": "immediate-intervention-patient",
          "label": "Immediate intervention patient",
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
          "id": "coordination-with-red-cross",
          "label": "Coordination with Red Cross",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8001",
      "type": "paragraph",
      "text": "The situation escalates. More patients are being evacuated from the building. Approximately 30 additional casualties are being transported to the collection point. Security forces are reporting that the attack is still ongoing. Your ambulance can transport 2 patients at a time. Additional ambulances are 15-20 minutes away."
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8002",
      "type": "paragraph",
      "text": "New arrivals include:"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8003",
      "type": "paragraph",
      "text": "5 patients with blast injuries from the initial explosion"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8004",
      "type": "paragraph",
      "text": "3 patients with gunshot wounds to the extremities"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8005",
      "type": "paragraph",
      "text": "8 patients with smoke inhalation"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8006",
      "type": "paragraph",
      "text": "2 pediatric patients (ages 6 and 8) with shrapnel injuries"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8007",
      "type": "paragraph",
      "text": "12 patients with anxiety/panic attacks"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8008",
      "type": "paragraph",
      "text": "1 pregnant woman with signs of labor (initiated by the stress)"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8009",
      "type": "paragraph",
      "text": "The Kenya Red Cross triage officer requests your assistance in coordinating the evacuation plan."
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-8010",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-1-section-4-activity-1-question",
      "type": "question",
      "title": "Resource Management & Transport Prioritization:",
      "phase": "Part 3: Mass Casualty Management",
      "text": "6. Resource Management & Transport Prioritization:\nDevelop a transport priority plan considering:\n\nAvailable ambulances (your one ALS unit + 2 BLS units on scene)\n\nHospital destination selection (KNH, Aga Khan, Nairobi Hospital)\n\nThe \"Golden Hour\" concept for trauma patients\n\nYour Response: (fill in)\n\ntext\nTransport Priority 1 (Immediate):\nPatient(s): ____________________________________________________________\nDestination: ___________________________________________________________\nRationale: _____________________________________________________________\n\nTransport Priority 2 (Urgent):\nPatient(s): ____________________________________________________________\nDestination: ___________________________________________________________\nRationale: _____________________________________________________________\n\nTransport Priority 3 (Delayed):\nPatient(s): ____________________________________________________________\nDestination: ___________________________________________________________\nRationale: _____________________________________________________________"
    },
    {
      "id": "case-1-section-4-activity-1-response",
      "type": "response",
      "title": "Resource Management & Transport Prioritization:",
      "fields": [
        {
          "id": "patient-s",
          "label": "Patient(s)",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "destination",
          "label": "Destination",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "patient-s-2",
          "label": "Patient(s)",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "destination-2",
          "label": "Destination",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-2",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "patient-s-3",
          "label": "Patient(s)",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "destination-3",
          "label": "Destination",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-3",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    },
    {
      "id": "case-1-section-4-activity-2-question",
      "type": "question",
      "title": "Special Considerations:",
      "phase": "Part 3: Mass Casualty Management",
      "text": "7. Special Considerations:\n\nHow do you manage the pediatric patients in a mass casualty setting?\n\nWhat considerations apply to the pregnant patient?\n\nHow would you document this mass casualty incident?\n\nWhat would you tell the receiving hospitals?\n\nYour Response: (fill in)\n\ntext\nPediatric considerations: _______________________________________________\nPregnant patient considerations: ________________________________________\nDocumentation: __________________________________________________________\nHospital notification: __________________________________________________"
    },
    {
      "id": "case-1-section-4-activity-2-response",
      "type": "response",
      "title": "Special Considerations:",
      "fields": [
        {
          "id": "pediatric-considerations",
          "label": "Pediatric considerations",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "pregnant-patient-considerations",
          "label": "Pregnant patient considerations",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "documentation",
          "label": "Documentation",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "hospital-notification",
          "label": "Hospital notification",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11001",
      "type": "paragraph",
      "text": "The response to the Dusit D2 attack was widely praised for its coordination and efficiency compared to the 2013 Westgate Mall attack."
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11002",
      "type": "paragraph",
      "text": "What made the Dusit response different?"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11003",
      "type": "paragraph",
      "text": "Unified Command Structure - All units reported to the GSU, eliminating the power struggles seen at Westgate"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11004",
      "type": "paragraph",
      "text": "Improved Intelligence Sharing - The National Counter Terrorism Centre (NCTC) had been strengthened"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11005",
      "type": "paragraph",
      "text": "Better Equipment and Training - Elite units had received enhanced training with foreign partners"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11006",
      "type": "paragraph",
      "text": "Faster Perimeter Establishment - The area was cordoned off within minutes"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11007",
      "type": "paragraph",
      "text": "Registration of Evacuees - Survivors were registered to track them and prevent attackers from escaping"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11008",
      "type": "paragraph",
      "text": "Multi-Agency Coordination - KDF, NPS, ATPU, and GSU worked together effectively"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11009",
      "type": "paragraph",
      "text": "Survival Statistics:"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11010",
      "type": "paragraph",
      "text": "Westgate (2013): 67 deaths, 4 days operation"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11011",
      "type": "paragraph",
      "text": "DusitD2 (2019): 21 deaths, 20 hours operation"
    },
    {
      "id": "9c466d42-5c1b-5bf0-9714-1de6a7d7bb2d-paragraph-11012",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-1-section-5-activity-1-question",
      "type": "question",
      "title": "Reflection & Key Takeaways:",
      "phase": "Part 4: Lessons Learned - The Dusit Response",
      "text": "8. Reflection & Key Takeaways:\n\nYour Response: (fill in)\n\ntext"
    },
    {
      "id": "case-1-section-5-activity-1-reflection",
      "type": "reflection",
      "title": "Reflection & Key Takeaways:",
      "fields": [],
      "points": 10
    },
    {
      "id": "case-1-section-5-activity-2-question",
      "type": "question",
      "title": "What role does EMS play in a mass casualty terror incident?",
      "phase": "Part 4: Lessons Learned - The Dusit Response",
      "text": "1. What role does EMS play in a mass casualty terror incident?\n______________________________________________________________________"
    },
    {
      "id": "case-1-section-5-activity-2-response",
      "type": "response",
      "title": "What role does EMS play in a mass casualty terror incident?",
      "fields": [],
      "points": 0
    },
    {
      "id": "case-1-section-5-activity-3-question",
      "type": "question",
      "title": "How did improved incident command affect patient outcomes?",
      "phase": "Part 4: Lessons Learned - The Dusit Response",
      "text": "2. How did improved incident command affect patient outcomes?\n______________________________________________________________________"
    },
    {
      "id": "case-1-section-5-activity-3-response",
      "type": "response",
      "title": "How did improved incident command affect patient outcomes?",
      "fields": [],
      "points": 0
    },
    {
      "id": "case-1-section-5-activity-4-question",
      "type": "question",
      "title": "What are the challenges of providing care in a hostile environment?",
      "phase": "Part 4: Lessons Learned - The Dusit Response",
      "text": "3. What are the challenges of providing care in a hostile environment?\n______________________________________________________________________"
    },
    {
      "id": "case-1-section-5-activity-4-response",
      "type": "response",
      "title": "What are the challenges of providing care in a hostile environment?",
      "fields": [],
      "points": 0
    },
    {
      "id": "case-1-section-5-activity-5-question",
      "type": "question",
      "title": "How does START triage help manage mass casualty incidents?",
      "phase": "Part 4: Lessons Learned - The Dusit Response",
      "text": "4. How does START triage help manage mass casualty incidents?\n______________________________________________________________________\n📊"
    },
    {
      "id": "case-1-section-5-activity-5-response",
      "type": "response",
      "title": "How does START triage help manage mass casualty incidents?",
      "fields": [],
      "points": 0
    }
  ]
};

export const caseMeta = {
  "id": 1,
  "title": "CASE STUDY 1: THE DUSIT D2 HOTEL TERROR ATTACK",
  "shortTitle": "THE DUSIT D2 HOTEL TERROR ATTACK",
  "category": "Mass Casualty Incident",
  "difficulty": "Advanced",
  "location": "Nairobi",
  "incidentDate": "January 15, 2019",
  "description": "On January 15, 2019, at approximately 2:30 PM, four armed militants attacked the DusitD2 hotel complex in Nairobi's Westlands district. The attack began with an explosion in the parking lot, followed by gunfire as the attackers entered the hotel and office complex.",
  "passingScore": 75
};

export default function Case1(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
