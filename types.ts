
export enum EvaluationStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING'
}

export interface EvaluationDetail {
  criterion: string;
  status: EvaluationStatus;
  finding: string;
  recommendation: string;
}

export interface EvaluationReport {
  id: string;
  timestamp: number;
  assetName: string;
  overallScore: number;
  logoDetected: boolean;
  userGuidePresent: boolean;
  videoAudit: {
    openingValid: boolean;
    closingValid: boolean;
    durationOk: boolean;
  };
  typosFound: string[];
  details: EvaluationDetail[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppState {
  view: 'home' | 'report' | 'history' | 'guideline';
  files: {
    pdf: File | null;
    scorm: File | null;
    videoOpening: File | null;
    videoClosing: File | null;
  };
  isAnalyzing: boolean;
  report: EvaluationReport | null;
  history: EvaluationReport[];
  error: string | null;
  progress: number;
  chatHistory: ChatMessage[];
  isChatting: boolean;
}
