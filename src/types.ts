export interface InterviewQuestion {
  question: string;
  answer: string;
  tips: string;
}

export interface PracticeSession {
  topic: string;
  description: string;
  questions: InterviewQuestion[];
}
