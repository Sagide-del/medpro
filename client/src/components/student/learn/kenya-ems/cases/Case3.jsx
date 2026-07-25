// Case 3: KAKAMEGA PRIMARY SCHOOL STAMPEDE
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 3,
  "title": "CASE STUDY 3: KAKAMEGA PRIMARY SCHOOL STAMPEDE",
  "shortTitle": "KAKAMEGA PRIMARY SCHOOL STAMPEDE",
  "category": "Pediatric Mass Casualty",
  "difficulty": "Advanced",
  "location": "Kakamega, Western Kenya",
  "incidentDate": "February 3, 2020",
  "description": "On February 3, 2020, at approximately 5:00 PM, a tragic stampede occurred at Kakamega Primary School in Western Kenya, resulting in the deaths of 13 children.",
  "passingScore": 75,
  "sections": [
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 3: KAKAMEGA PRIMARY SCHOOL STAMPEDE"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-location",
      "type": "paragraph",
      "text": "Kakamega, Western Kenya, February 3, 2020"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-heading-200001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200002",
      "type": "paragraph",
      "text": "On February 3, 2020, at approximately 5:00 PM, a tragic stampede occurred at Kakamega Primary School in Western Kenya, resulting in the deaths of 13 children."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-heading-200003",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200004",
      "type": "paragraph",
      "text": "13 children killed"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200005",
      "type": "paragraph",
      "text": "39 students admitted to hospital"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200006",
      "type": "paragraph",
      "text": "37 students treated and discharged"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200007",
      "type": "paragraph",
      "text": "2 students in intensive care"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200008",
      "type": "paragraph",
      "text": "Age of victims: Mostly grade five, aged 10-12"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200009",
      "type": "paragraph",
      "text": "Time of incident: Around 5:00 PM (1400 GMT)"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200010",
      "type": "paragraph",
      "text": "The Tragedy:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200011",
      "type": "paragraph",
      "text": "The stampede occurred as children were leaving their primary school. The police have launched an inquiry into what caused the crowd of students to panic, leading to the crush. Images broadcast by local media showed parents gathered in front of the emergency ward of a hospital in the town, waiting for news of their children."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200012",
      "type": "paragraph",
      "text": "Witness Accounts:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200013",
      "type": "paragraph",
      "text": "One of the children's mothers blamed the teachers: \"Those who survived said they were running because there were teachers who were beating them, and that is why they were escaping and fell on each other.\""
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200014",
      "type": "paragraph",
      "text": "Corporal punishment is banned in Kenya."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200015",
      "type": "paragraph",
      "text": "Government Response:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200016",
      "type": "paragraph",
      "text": "Kenya's Vice President William Ruto stated: \"We are devastated by the tragedy that has hit Kakamega Primary School this evening. Our prayers, love and thoughts to the families and relatives of the victims of the misfortune.\""
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200017",
      "type": "paragraph",
      "text": "Kenya Red Cross set up psychological support services and a \"tracing desk\" to help relatives locate potentially affected students."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200018",
      "type": "paragraph",
      "text": "Kakamega police chief David Kabena: \"We have launched an investigation to establish what exactly happened.\""
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200019",
      "type": "paragraph",
      "text": "Parliamentary Follow-up:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200020",
      "type": "paragraph",
      "text": "Senator Bonny Khalwale raised questions in the Senate asking for:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200021",
      "type": "paragraph",
      "text": "A list of the learners who lost their lives"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200022",
      "type": "paragraph",
      "text": "When families will receive compensation awarded by courts"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200023",
      "type": "paragraph",
      "text": "The amount due to each family"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-200024",
      "type": "paragraph",
      "text": "When families of three students and a teacher who died from water poisoning at Mukumu Girls' High School will receive compensation"
    },
    {
      "id": "case-3-section-2-scenario-dispatch",
      "type": "dispatch",
      "text": "You are an EMT-Basic with the Kakamega County Ambulance Service. Dispatch receives the following call:\n\nCALLER: \"There has been a stampede at Kakamega Primary School! Children are injured! Many are lying on the ground! Please send help immediately!\"\n\nDISPATCH RECORDS: The call is received at approximately 5:15 PM. Multiple calls are coming in from the school and surrounding area. The county fire brigade and disaster response teams are being mobilized.\n\nYou receive the following dispatch:\n\n\"MASS CASUALTY INCIDENT - SCHOOL STAMPEDE - KAKAMEGA PRIMARY SCHOOL.\n\nConfirmed: Multiple pediatric casualties. Unknown number of injured. Students reportedly trampled.\n\nMulti-agency response: County Disaster Response Teams, Kenya Red Cross, National Police Service, St John Ambulance.\n\nRespond immediately. Be prepared for mass casualty triage of pediatric patients.\"\n\n🛑"
    },
    {
      "id": "case-3-section-2-activity-1-question",
      "type": "question",
      "title": "Dispatch & Pre-Arrival Assessment:",
      "phase": "Part 1: Dispatch Information",
      "text": "1. Dispatch & Pre-Arrival Assessment:\n\nYour Response: (fill in)\n\ntext\nWhat is the estimated time to the scene? __________________________________\n\nWhat resources are you bringing? _________________________________________\n\nWhat additional resources should be requested? ____________________________\n\nWhat are your primary concerns for a pediatric mass casualty incident? ______\n__________________________________________________________________________"
    },
    {
      "id": "case-3-section-2-activity-1-response",
      "type": "response",
      "title": "Dispatch & Pre-Arrival Assessment:",
      "fields": [
        {
          "id": "what-is-the-estimated-time-to-the-scene",
          "label": "What is the estimated time to the scene?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-resources-are-you-bringing",
          "label": "What resources are you bringing?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-additional-resources-should-be-requested",
          "label": "What additional resources should be requested?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-are-your-primary-concerns-for-a-pediatric-m",
          "label": "What are your primary concerns for a pediatric mass casualty incident?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "case-3-section-2-activity-2-question",
      "type": "question",
      "title": "Pediatric Mass Casualty Considerations:",
      "phase": "Part 1: Dispatch Information",
      "text": "2. Pediatric Mass Casualty Considerations:\n\nYour Response: (fill in)\n\ntext\nWhat are the key differences in managing pediatric patients in a mass casualty?\n__________________________________________________________________________\n\nWhat equipment considerations are important? ______________________________\n\nWhat triage considerations apply to pediatric patients? ____________________\n__________________________________________________________________________"
    },
    {
      "id": "case-3-section-2-activity-2-response",
      "type": "response",
      "title": "Pediatric Mass Casualty Considerations:",
      "fields": [
        {
          "id": "what-equipment-considerations-are-important",
          "label": "What equipment considerations are important?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-triage-considerations-apply-to-pediatric-pa",
          "label": "What triage considerations apply to pediatric patients?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204001",
      "type": "paragraph",
      "text": "You arrive at approximately 5:45 PM. The scene is chaotic and emotionally charged:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204002",
      "type": "paragraph",
      "text": "Location: Kakamega Primary School, a large public school in Kakamega town"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204003",
      "type": "paragraph",
      "text": "Scene: Children are lying on the ground in the school compound. Some are crying, others are silent. There is blood visible on the ground."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204004",
      "type": "paragraph",
      "text": "Bystanders: Parents have arrived in large numbers. Many are crying and searching for their children. The police are struggling to control the crowd."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204005",
      "type": "paragraph",
      "text": "First Responders: St John Ambulance and Kenya Red Cross are on scene but appear overwhelmed by the number of pediatric casualties."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204006",
      "type": "paragraph",
      "text": "Security: Police have cordoned off the area, but parents are breaking through the perimeter."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204007",
      "type": "paragraph",
      "text": "Patients observed:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-table-204008",
      "type": "table",
      "headers": [
        "Patient",
        "Age/Sex",
        "Injuries",
        "Status"
      ],
      "rows": [
        [
          "A",
          "10/F",
          "Unresponsive, no pulse, visible head trauma",
          "Apneic, pulseless"
        ],
        [
          "B",
          "11/M",
          "Difficulty breathing, cyanotic, chest pain, RR 40",
          "Conscious, in severe distress"
        ],
        [
          "C",
          "12/F",
          "Open fracture of leg, visible deformity, RR 28",
          "Conscious, crying, in pain"
        ],
        [
          "D",
          "10/M",
          "Multiple abrasions, minor lacerations, RR 24",
          "Conscious, crying"
        ],
        [
          "E",
          "11/F",
          "Head injury, GCS 10, vomiting, RR 30",
          "Semi-conscious"
        ],
        [
          "F",
          "12/M",
          "Abdominal pain, difficulty breathing, RR 35",
          "Conscious, anxious"
        ],
        [
          "G",
          "10/F",
          "Ankle injury, cannot walk, RR 22",
          "Conscious, crying"
        ],
        [
          "H",
          "11/M",
          "Unresponsive, pulse present, RR 28, GCS 8",
          "Unresponsive"
        ],
        [
          "I",
          "12/F",
          "Minor abrasions, walking, RR 20",
          "Conscious, crying"
        ],
        [
          "J",
          "10/M",
          "Crush injury to chest, RR 38, HR 140",
          "Conscious, in severe distress"
        ]
      ]
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-204009",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-3-section-3-activity-1-table",
      "type": "table",
      "headers": [
        "Patient",
        "Color",
        "Priority",
        "Rationale"
      ],
      "rows": [
        [
          "Patient A (10/F, unresponsive, apneic, pulseless, head trauma)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient B (11/M, difficulty breathing, cyanotic, RR 40)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient C (12/F, open leg fracture, RR 28)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient D (10/M, minor abrasions, RR 24)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient E (11/F, head injury, GCS 10, vomiting, RR 30)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient F (12/M, abdominal pain, RR 35)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient G (10/F, ankle injury, RR 22)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient H (11/M, unresponsive, GCS 8, RR 28)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient I (12/F, minor abrasions, RR 20)",
          "color",
          "priority",
          "rationale"
        ],
        [
          "Patient J (10/M, crush injury chest, RR 38, HR 140)",
          "color",
          "priority",
          "rationale"
        ]
      ]
    },
    {
      "id": "case-3-section-3-activity-1-question",
      "type": "question",
      "title": "Pediatric Triage Decision:",
      "phase": "Part 2: Arrival at Scene",
      "text": "3. Pediatric Triage Decision:\nUsing the START triage system adapted for pediatric patients, classify each patient:\n\nYour Response: (fill in)\n\ntext\nPatient A (10/F, unresponsive, apneic, pulseless, head trauma):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient B (11/M, difficulty breathing, cyanotic, RR 40):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient C (12/F, open leg fracture, RR 28):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient D (10/M, minor abrasions, RR 24):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient E (11/F, head injury, GCS 10, vomiting, RR 30):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient F (12/M, abdominal pain, RR 35):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient G (10/F, ankle injury, RR 22):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient H (11/M, unresponsive, GCS 8, RR 28):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient I (12/F, minor abrasions, RR 20):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________\n\nPatient J (10/M, crush injury chest, RR 38, HR 140):\nColor: _______________ Priority: _______________\nRationale: ________________________________________________________________"
    },
    {
      "id": "case-3-section-3-activity-1-response",
      "type": "response",
      "title": "Pediatric Triage Decision:",
      "fields": [
        {
          "id": "color-priority",
          "label": "Color:                 Priority",
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
          "id": "color-priority-2",
          "label": "Color:                 Priority",
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
          "id": "color-priority-3",
          "label": "Color:                 Priority",
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
          "id": "color-priority-4",
          "label": "Color:                 Priority",
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
          "id": "color-priority-5",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-5",
          "label": "Rationale",
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
          "id": "rationale-6",
          "label": "Rationale",
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
          "id": "rationale-7",
          "label": "Rationale",
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
          "id": "rationale-8",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-9",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-9",
          "label": "Rationale",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "color-priority-10",
          "label": "Color:                 Priority",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "rationale-10",
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
            "label": "Patient A (10/F, unresponsive, apneic, pulseless, head trauma)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "b",
            "label": "Patient B (11/M, difficulty breathing, cyanotic, RR 40)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "c",
            "label": "Patient C (12/F, open leg fracture, RR 28)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "d",
            "label": "Patient D (10/M, minor abrasions, RR 24)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "e",
            "label": "Patient E (11/F, head injury, GCS 10, vomiting, RR 30)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "f",
            "label": "Patient F (12/M, abdominal pain, RR 35)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "g",
            "label": "Patient G (10/F, ankle injury, RR 22)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "h",
            "label": "Patient H (11/M, unresponsive, GCS 8, RR 28)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "i",
            "label": "Patient I (12/F, minor abrasions, RR 20)",
            "fields": [
              "color",
              "priority",
              "rationale"
            ]
          },
          {
            "row_id": "j",
            "label": "Patient J (10/M, crush injury chest, RR 38, HR 140)",
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
      "id": "case-3-section-3-activity-2-question",
      "type": "question",
      "title": "Critical Decision: Managing Parents & Bystanders:",
      "phase": "Part 2: Arrival at Scene",
      "text": "4. Critical Decision: Managing Parents & Bystanders:\n\nHow do you manage the parents who are breaking through the perimeter?\n\nWhat is your communication strategy with families?\n\nHow do you handle the emotional trauma of this incident?\n\nYour Response: (fill in)\n\ntext\nParent management: ________________________________________________________\n__________________________________________________________________________\n\nCommunication with families: ______________________________________________\n__________________________________________________________________________\n\nEmotional trauma support: _________________________________________________\n__________________________________________________________________________"
    },
    {
      "id": "case-3-section-3-activity-2-response",
      "type": "response",
      "title": "Critical Decision: Managing Parents & Bystanders:",
      "fields": [
        {
          "id": "parent-management",
          "label": "Parent management",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "communication-with-families",
          "label": "Communication with families",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "emotional-trauma-support",
          "label": "Emotional trauma support",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207001",
      "type": "paragraph",
      "text": "The situation requires significant coordination."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207002",
      "type": "paragraph",
      "text": "Available Resources:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207003",
      "type": "paragraph",
      "text": "Your ambulance (BLS unit)"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207004",
      "type": "paragraph",
      "text": "2 other county ambulances"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207005",
      "type": "paragraph",
      "text": "St John Ambulance vehicles"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207006",
      "type": "paragraph",
      "text": "Kenya Red Cross first aid teams"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207007",
      "type": "paragraph",
      "text": "2 private ambulances"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207008",
      "type": "paragraph",
      "text": "Hospitals Available:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207009",
      "type": "paragraph",
      "text": "Kakamega County Referral Hospital - 10 minutes away - Pediatric ward available"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207010",
      "type": "paragraph",
      "text": "Masinde Muliro Hospital - 20 minutes away - Limited pediatric capacity"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207011",
      "type": "paragraph",
      "text": "Jaramogi Oginga Odinga Teaching and Referral Hospital (Kisumu) - 1 hour away - Full pediatric services"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207012",
      "type": "paragraph",
      "text": "Patient Count Update:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207013",
      "type": "paragraph",
      "text": "13 confirmed fatalities"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207014",
      "type": "paragraph",
      "text": "39 hospital admissions"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207015",
      "type": "paragraph",
      "text": "37 treated and discharged"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-207016",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-3-section-4-activity-1-question",
      "type": "question",
      "title": "Transport Planning & Resource Allocation:",
      "phase": "Part 3: Resource Management & Transport",
      "text": "5. Transport Planning & Resource Allocation:\n\nYour Response: (fill in)\n\ntext\nPriority 1 Patients (Immediate):\nPatient IDs: ____________________________________________________________\nInterventions needed en route: __________________________________________\nDestination hospital: ___________________________________________________\n\nPriority 2 Patients (Urgent):\nPatient IDs: ____________________________________________________________\nInterventions needed en route: __________________________________________\nDestination hospital: ___________________________________________________\n\nPriority 3 Patients (Delayed):\nPatient IDs: ____________________________________________________________\nDestination hospital: ___________________________________________________\n\nFatality Management:\n- Number of deceased: ___________________________________________________\n- Protocol for handling: ________________________________________________\n- Documentation required: _______________________________________________"
    },
    {
      "id": "case-3-section-4-activity-1-response",
      "type": "response",
      "title": "Transport Planning & Resource Allocation:",
      "fields": [
        {
          "id": "patient-ids",
          "label": "Patient IDs",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-needed-en-route",
          "label": "Interventions needed en route",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "destination-hospital",
          "label": "Destination hospital",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "patient-ids-2",
          "label": "Patient IDs",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "interventions-needed-en-route-2",
          "label": "Interventions needed en route",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "destination-hospital-2",
          "label": "Destination hospital",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "patient-ids-3",
          "label": "Patient IDs",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "destination-hospital-3",
          "label": "Destination hospital",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "number-of-deceased",
          "label": "Number of deceased",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "protocol-for-handling",
          "label": "Protocol for handling",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "documentation-required",
          "label": "Documentation required",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    },
    {
      "id": "case-3-section-4-activity-2-question",
      "type": "question",
      "title": "Psychosocial Support:",
      "phase": "Part 3: Resource Management & Transport",
      "text": "6. Psychosocial Support:\n\nHow do you provide psychological support to the survivors?\n\nWhat support is needed for the families?\n\nWhat support is needed for the first responders?\n\nYour Response: (fill in)\n\ntext\nSurvivor support: ________________________________________________________\n__________________________________________________________________________\n\nFamily support: __________________________________________________________\n__________________________________________________________________________\n\nFirst responder support: _________________________________________________\n__________________________________________________________________________"
    },
    {
      "id": "case-3-section-4-activity-2-response",
      "type": "response",
      "title": "Psychosocial Support:",
      "fields": [
        {
          "id": "survivor-support",
          "label": "Survivor support",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "family-support",
          "label": "Family support",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "first-responder-support",
          "label": "First responder support",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 10
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-210001",
      "type": "paragraph",
      "text": "Key Issues Identified:"
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-210002",
      "type": "paragraph",
      "text": "Corporal punishment: \"Those who survived said they were running because there were teachers who were beating them, and that is why they were escaping and fell on each other.\" Despite corporal punishment being banned in Kenya, it continues to occur."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-210003",
      "type": "paragraph",
      "text": "School safety protocols: The incident highlighted the need for improved safety procedures in schools."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-210004",
      "type": "paragraph",
      "text": "Emergency response: While response was swift, the scale of pediatric casualties overwhelmed available resources."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-210005",
      "type": "paragraph",
      "text": "Government compensation: Four years later, families were still awaiting compensation awarded by the courts."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-210006",
      "type": "paragraph",
      "text": "Psychosocial support: Kenya Red Cross established psychological support services and a \"tracing desk\" to help relatives locate potentially affected students."
    },
    {
      "id": "63b4d62d-a515-52a3-bfd1-42956861d589-paragraph-210007",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-3-section-5-activity-1-question",
      "type": "question",
      "title": "Reflection & Prevention:",
      "phase": "Part 4: Lessons Learned",
      "text": "7. Reflection & Prevention:\n\nYour Response: (fill in)\n\ntext"
    },
    {
      "id": "case-3-section-5-activity-1-reflection",
      "type": "reflection",
      "title": "Reflection & Prevention:",
      "fields": [],
      "points": 10
    },
    {
      "id": "case-3-section-5-activity-2-question",
      "type": "question",
      "title": "What are the systemic issues that contributed to this tragedy?",
      "phase": "Part 4: Lessons Learned",
      "text": "1. What are the systemic issues that contributed to this tragedy?\n\n______________________________________________________________________\n______________________________________________________________________"
    },
    {
      "id": "case-3-section-5-activity-2-response",
      "type": "response",
      "title": "What are the systemic issues that contributed to this tragedy?",
      "fields": [],
      "points": 0
    },
    {
      "id": "case-3-section-5-activity-3-question",
      "type": "question",
      "title": "What could have prevented this stampede?",
      "phase": "Part 4: Lessons Learned",
      "text": "2. What could have prevented this stampede?\n\n______________________________________________________________________\n______________________________________________________________________"
    },
    {
      "id": "case-3-section-5-activity-3-response",
      "type": "response",
      "title": "What could have prevented this stampede?",
      "fields": [],
      "points": 0
    },
    {
      "id": "case-3-section-5-activity-4-question",
      "type": "question",
      "title": "How can EMS prepare for pediatric mass casualty incidents?",
      "phase": "Part 4: Lessons Learned",
      "text": "3. How can EMS prepare for pediatric mass casualty incidents?\n\n______________________________________________________________________\n______________________________________________________________________"
    },
    {
      "id": "case-3-section-5-activity-4-response",
      "type": "response",
      "title": "How can EMS prepare for pediatric mass casualty incidents?",
      "fields": [],
      "points": 0
    },
    {
      "id": "case-3-section-5-activity-5-question",
      "type": "question",
      "title": "What role does psychosocial support play in school emergencies?",
      "phase": "Part 4: Lessons Learned",
      "text": "4. What role does psychosocial support play in school emergencies?\n\n______________________________________________________________________\n______________________________________________________________________"
    },
    {
      "id": "case-3-section-5-activity-5-response",
      "type": "response",
      "title": "What role does psychosocial support play in school emergencies?",
      "fields": [],
      "points": 0
    },
    {
      "id": "case-3-section-5-activity-6-question",
      "type": "question",
      "title": "As an EMT, what would you recommend to prevent future school tragedies?",
      "phase": "Part 4: Lessons Learned",
      "text": "5. As an EMT, what would you recommend to prevent future school tragedies?\n\n______________________________________________________________________\n______________________________________________________________________\n📊"
    },
    {
      "id": "case-3-section-5-activity-6-response",
      "type": "response",
      "title": "As an EMT, what would you recommend to prevent future school tragedies?",
      "fields": [],
      "points": 0
    }
  ]
};

export const caseMeta = {
  "id": 3,
  "title": "CASE STUDY 3: KAKAMEGA PRIMARY SCHOOL STAMPEDE",
  "shortTitle": "KAKAMEGA PRIMARY SCHOOL STAMPEDE",
  "category": "Pediatric Mass Casualty",
  "difficulty": "Advanced",
  "location": "Kakamega, Western Kenya",
  "incidentDate": "February 3, 2020",
  "description": "On February 3, 2020, at approximately 5:00 PM, a tragic stampede occurred at Kakamega Primary School in Western Kenya, resulting in the deaths of 13 children.",
  "passingScore": 75
};

export default function Case3(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
