// Case 7: KAREN BUILDING COLLAPSE
// Hard-coded Kenya EMS case content -- no JSON file, no database, no uploader.
// This component owns its full worksheet content directly; CaseRunner only
// supplies the shared premium rendering shell (header, dispatch, tables, Q&A).
import CaseRunner from '../CaseRunner';

const CASE_DATA = {
  "id": 7,
  "title": "CASE STUDY 7: KAREN BUILDING COLLAPSE",
  "shortTitle": "KAREN BUILDING COLLAPSE",
  "category": "Structural Collapse Response",
  "difficulty": "Intermediate",
  "location": "Karen, Nairobi",
  "incidentDate": "January 10, 2026",
  "description": "On January 10, 2026, a residential building under construction collapsed along Ngong View Lane in Karen, Nairobi.",
  "passingScore": 69,
  "sections": [
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-title",
      "type": "heading",
      "level": 1,
      "text": "CASE STUDY 7: KAREN BUILDING COLLAPSE"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-location",
      "type": "paragraph",
      "text": "Karen, Nairobi, January 10, 2026"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-heading-600001",
      "type": "heading",
      "level": 3,
      "text": "Incident Background"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600002",
      "type": "paragraph",
      "text": "On January 10, 2026, a residential building under construction collapsed along Ngong View Lane in Karen, Nairobi."
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-heading-600003",
      "type": "heading",
      "level": 3,
      "text": "Incident Statistics:"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600004",
      "type": "paragraph",
      "text": "2 deaths (severe crush injuries)"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600005",
      "type": "paragraph",
      "text": "7 injured rescued and rushed to hospital"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600006",
      "type": "paragraph",
      "text": "Location: Karen Ward, Lang'ata Sub-County"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600007",
      "type": "paragraph",
      "text": "Time of collapse: During construction work"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600008",
      "type": "paragraph",
      "text": "Cause of Collapse:"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600009",
      "type": "paragraph",
      "text": "Preliminary investigations pointed to structural failure linked to poor workmanship and inadequate formwork."
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600010",
      "type": "paragraph",
      "text": "\"Preliminary investigations indicate the collapse was caused by structural failure resulting from poor workmanship and inadequate formwork. Initial findings show the use of sub-standard materials, where timber gum tree supports were used instead of appropriate steel props for the double-volume slab.\" - Nairobi CEC Member Patrick Mbogo"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600011",
      "type": "paragraph",
      "text": "Project Details:"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600012",
      "type": "paragraph",
      "text": "Developer: Moses A. Nyakiogora"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600013",
      "type": "paragraph",
      "text": "Structural Engineer: Eng. Edward Kariuki"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600014",
      "type": "paragraph",
      "text": "Architectural plans approved: November 14, 2024"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600015",
      "type": "paragraph",
      "text": "Structural plans approved: November 27, 2024"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600016",
      "type": "paragraph",
      "text": "The Indemnity Form:"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600017",
      "type": "paragraph",
      "text": "Under the indemnity form, developers indemnify the county and the County Structural Engineer against claims arising from collapse, injury or loss of life. By signing it, developers commit to:"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600018",
      "type": "paragraph",
      "text": "Engaging qualified and registered professionals"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600019",
      "type": "paragraph",
      "text": "Adhering to approved drawings and building codes"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600020",
      "type": "paragraph",
      "text": "Ensuring proper site supervision"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600021",
      "type": "paragraph",
      "text": "Submitting mandatory material test results"
    },
    {
      "id": "2d6a3607-0dd3-5d62-a980-b68665875e94-paragraph-600022",
      "type": "paragraph",
      "text": "🛑"
    },
    {
      "id": "case-7-section-1-activity-1-question",
      "type": "question",
      "title": "Scene & Safety Assessment:",
      "phase": "Incident Background",
      "text": "1. Scene & Safety Assessment:\n\nYour Response: (fill in)\n\ntext\nWhat are the primary safety concerns at a building collapse scene? _________\n\nWhat equipment is needed for a rescue operation? __________________________\n\nWhat additional resources would you request? _____________________________\n📊"
    },
    {
      "id": "case-7-section-1-activity-1-response",
      "type": "response",
      "title": "Scene & Safety Assessment:",
      "fields": [
        {
          "id": "what-are-the-primary-safety-concerns-at-a-buildi",
          "label": "What are the primary safety concerns at a building collapse scene?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-equipment-is-needed-for-a-rescue-operation",
          "label": "What equipment is needed for a rescue operation?",
          "type": "textarea",
          "placeholder": "Enter your response"
        },
        {
          "id": "what-additional-resources-would-you-request",
          "label": "What additional resources would you request?",
          "type": "textarea",
          "placeholder": "Enter your response"
        }
      ],
      "points": 15
    }
  ]
};

export const caseMeta = {
  "id": 7,
  "title": "CASE STUDY 7: KAREN BUILDING COLLAPSE",
  "shortTitle": "KAREN BUILDING COLLAPSE",
  "category": "Structural Collapse Response",
  "difficulty": "Intermediate",
  "location": "Karen, Nairobi",
  "incidentDate": "January 10, 2026",
  "description": "On January 10, 2026, a residential building under construction collapsed along Ngong View Lane in Karen, Nairobi.",
  "passingScore": 69
};

export default function Case7(props) {
  return <CaseRunner caseData={CASE_DATA} {...props} />;
}
