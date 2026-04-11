// Clarity platform type definitions

export interface AlignmentResult {
  score: number;
  meetingType: 'None' | '1:1 Meeting';
  feedback: string;
}

export interface TeamUsage {
  count: number;
  isPro: boolean;
  lastUsed: Date;
  upgradedAt?: Date;
}

export interface DeviceUsage {
  totalFreeChecks: number;
  lastUsed: Date;
  isDevDevice?: boolean;
}

export interface Mission {
  sessionId: string;
  teamName: string;
  goal: string;
  context: string;
  createdAt: string;
}

export interface AlignmentRecord {
  teamCode: string;
  role: string;
  name: string;
  understanding: string;
  analysis: AlignmentResult;
  timestamp: Date;
}

export interface CheckoutSession {
  url: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}