export interface InterviewQuestion {
  question: string;
  answer: string;
  explanation: string;
  tips: string;
}

export interface PracticeSession {
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  questions: InterviewQuestion[];
}

export interface DailyScheduleItem {
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  enabled: boolean;
}

export interface WeeklySchedule {
  [day: string]: DailyScheduleItem;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  suggestions: string;
}

