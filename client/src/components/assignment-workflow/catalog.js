import { DIFFICULTY_OPTIONS, MODULES_BY_PROGRAM, PROGRAM_OPTIONS } from '../reference-cards/catalog';

export { DIFFICULTY_OPTIONS, MODULES_BY_PROGRAM, PROGRAM_OPTIONS };

export const ASSIGNMENT_TYPES = [
  'Multiple Choice',
  'Scenario Based',
  'Short Answer',
  'Practical Knowledge',
];

export function toQuestionType(assignmentType) {
  switch (assignmentType) {
    case 'Multiple Choice': return 'mcq';
    case 'Scenario Based': return 'scenario_step';
    case 'Short Answer': return 'short_answer';
    default: return 'short_answer';
  }
}
