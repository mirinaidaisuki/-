export interface SocraticStep {
  stepNumber: number;
  title: string;
  guidanceText: string;
  probingQuestion: string;
  hintText: string;
}

export interface CoachingTips {
  keyInventionPoint: string;
  commonMistakes: string[];
  howToGuide: string;
  recommendedAnalogy: string;
}

export interface FullExplanation {
  stepByStepResolution: string[];
  finalAnswer: string;
  coreFormulaOrConcept: string;
}

export interface SocraticPlan {
  problemSummary: string;
  subject: string;
  difficultyLevel: string;
  socraticSteps: SocraticStep[];
  coachingTips: CoachingTips;
  fullExplanation: FullExplanation;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
