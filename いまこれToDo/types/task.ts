export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  emoji?: string;
}

export interface PomodoroSettings {
  enabled: boolean;
  workDuration: number; // 分
  breakDuration: number; // 分
  longBreakDuration: number; // 分
  sessionsUntilLongBreak: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedTime: number; // 分単位
  bufferTime: number; // 予備時間（分）
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  completedAt?: Date;
  snoozedUntil?: Date;
  dueDate?: Date;
  actualDeadline?: Date; // 実際の締切（入力日時の1日前）
  labels: Label[];
  subTasks: SubTask[];
  pomodoroSettings: PomodoroSettings;
  snoozeCount: number; // 後回し回数
  lastSnoozedAt?: Date; // 最後に後回しにした日時
  // 完了時の記録
  completionRecord?: {
    actualTime: number; // 実際にかかった時間
    difficulty: 1 | 2 | 3 | 4 | 5; // 難易度評価
    satisfaction: 1 | 2 | 3 | 4 | 5; // 満足度
    notes?: string;
  };
}

export interface AppSettings {
  motivationMode: boolean;
  soundEnabled: boolean;
  defaultPomodoroWork: number;
  defaultPomodoroBreak: number;
  autoStartNextTask: boolean;
}

export interface TaskSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // 分
  type: 'work' | 'break' | 'longBreak';
  pomodoroSession?: number;
}