import { useState, useEffect, useCallback } from 'react';
import { Task, AppSettings, SubTask, Label, TaskSession } from '../types/task';

const STORAGE_KEY = 'focus-tasks';
const SETTINGS_KEY = 'focus-settings';
const SESSIONS_KEY = 'focus-sessions';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<TaskSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    motivationMode: false,
    soundEnabled: true,
    defaultPomodoroWork: 25,
    defaultPomodoroBreak: 5,
    autoStartNextTask: false,
  });

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const savedSessions = localStorage.getItem(SESSIONS_KEY);
    
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        snoozedUntil: task.snoozedUntil ? new Date(task.snoozedUntil) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        actualDeadline: task.actualDeadline ? new Date(task.actualDeadline) : undefined,
        lastSnoozedAt: task.lastSnoozedAt ? new Date(task.lastSnoozedAt) : undefined,
        snoozeCount: task.snoozeCount || 0,
      }));
      setTasks(parsedTasks);
    }
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
      }));
      setSessions(parsedSessions);
    }
  }, []);

  // データを保存
  const saveTasks = useCallback((newTasks: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    setTasks(newTasks);
  }, []);

  const saveSettings = useCallback((newSettings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  }, []);

  const saveSessions = useCallback((newSessions: TaskSession[]) => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
    setSessions(newSessions);
  }, []);

  // 現在やるべきタスクを取得
  const getCurrentTask = useCallback((): Task | null => {
    const now = new Date();
    const availableTasks = tasks.filter(task => 
      !task.completedAt && 
      (!task.snoozedUntil || task.snoozedUntil <= now)
    );

    if (availableTasks.length === 0) return null;

    // 優先度でソート、その後期限、その後作成日時順
    availableTasks.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 期限があるタスクを優先
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) {
        const dueDiff = a.dueDate.getTime() - b.dueDate.getTime();
        if (dueDiff !== 0) return dueDiff;
      }
      
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return availableTasks[0];
  }, [tasks]);

  // 完了済みタスクを取得
  const getCompletedTasks = useCallback((): Task[] => {
    return tasks
      .filter(task => task.completedAt)
      .sort((a, b) => {
        if (!a.completedAt || !b.completedAt) return 0;
        return b.completedAt.getTime() - a.completedAt.getTime();
      });
  }, [tasks]);

  // タスクを追加
  const addTask = useCallback((
    title: string, 
    description?: string, 
    estimatedTime: number = 30,
    bufferTime: number = 5,
    priority: Task['priority'] = 'medium',
    dueDate?: Date,
    labels: Label[] = [],
    pomodoroEnabled: boolean = false,
    steps: string[] = []
  ) => {
    // 手順からサブタスクを作成
    const subTasks: SubTask[] = steps.map((step, index) => ({
      id: `${Date.now()}-${index}`,
      title: step,
      completed: false,
      order: index,
    }));

    // 締切日時が設定されている場合、1日前を実際の締切として設定
    const actualDeadline = dueDate ? new Date(dueDate.getTime() - 24 * 60 * 60 * 1000) : undefined;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      estimatedTime,
      bufferTime,
      priority,
      createdAt: new Date(),
      dueDate,
      actualDeadline,
      labels,
      subTasks,
      snoozeCount: 0,
      pomodoroSettings: {
        enabled: pomodoroEnabled,
        workDuration: settings.defaultPomodoroWork,
        breakDuration: settings.defaultPomodoroBreak,
        longBreakDuration: settings.defaultPomodoroBreak * 3,
        sessionsUntilLongBreak: 4,
      },
    };
    
    saveTasks([...tasks, newTask]);
  }, [tasks, saveTasks, settings]);

  // タスクを完了
  const completeTask = useCallback((taskId: string, completionRecord?: Task['completionRecord']) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { 
        ...task, 
        completedAt: new Date(),
        completionRecord
      } : task
    );
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // タスクをスヌーズ
  const snoozeTask = useCallback((taskId: string, minutes: number = 30) => {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { 
        ...task, 
        snoozedUntil: snoozeTime,
        snoozeCount: task.snoozeCount + 1,
        lastSnoozedAt: new Date()
      } : task
    );
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // サブタスクを追加
  const addSubTask = useCallback((taskId: string, title: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const newSubTask: SubTask = {
          id: Date.now().toString(),
          title,
          completed: false,
          order: task.subTasks.length,
        };
        return {
          ...task,
          subTasks: [...task.subTasks, newSubTask],
        };
      }
      return task;
    });
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // サブタスクを更新
  const updateSubTask = useCallback((taskId: string, subTaskId: string, updates: Partial<SubTask>) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubTasks = task.subTasks.map(subTask =>
          subTask.id === subTaskId ? { ...subTask, ...updates } : subTask
        );
        return { ...task, subTasks: updatedSubTasks };
      }
      return task;
    });
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // サブタスクを削除
  const deleteSubTask = useCallback((taskId: string, subTaskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const filteredSubTasks = task.subTasks.filter(subTask => subTask.id !== subTaskId);
        return { ...task, subTasks: filteredSubTasks };
      }
      return task;
    });
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // サブタスクの順序を変更
  const reorderSubTasks = useCallback((taskId: string, newSubTasks: SubTask[]) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, subTasks: newSubTasks };
      }
      return task;
    });
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // セッションを記録
  const addSession = useCallback((session: TaskSession) => {
    const newSessions = [...sessions, session];
    saveSessions(newSessions);
  }, [sessions, saveSessions]);

  // 後回しにしたタスクを取得
  const getSnoozedTasks = useCallback((): Task[] => {
    const now = new Date();
    return tasks
      .filter(task => 
        !task.completedAt && 
        task.snoozedUntil && 
        task.snoozedUntil > now
      )
      .sort((a, b) => b.snoozeCount - a.snoozeCount); // 後回し回数の多い順
  }, [tasks]);

  // 次に推奨するタスクを取得
  const getRecommendedTasks = useCallback((): Task[] => {
    const now = new Date();
    const availableTasks = tasks.filter(task => 
      !task.completedAt && 
      (!task.snoozedUntil || task.snoozedUntil <= now)
    );

    return availableTasks
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 期限があるタスクを優先
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) {
          const dueDiff = a.dueDate.getTime() - b.dueDate.getTime();
          if (dueDiff !== 0) return dueDiff;
        }
        
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, 3); // 上位3件を推奨
  }, [tasks]);

  // 設定を更新
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    saveSettings({ ...settings, ...newSettings });
  }, [settings, saveSettings]);

  return {
    tasks,
    sessions,
    settings,
    getCurrentTask,
    getCompletedTasks,
    getSnoozedTasks,
    getRecommendedTasks,
    addTask,
    completeTask,
    snoozeTask,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    reorderSubTasks,
    addSession,
    updateSettings,
  };
}