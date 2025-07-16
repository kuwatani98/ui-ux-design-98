import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, Clock, Coffee, RotateCcw, Play, Timer, Plus } from 'lucide-react';
import { Task, TaskSession } from '../../types/task';
import { CircularProgress } from '../atoms/CircularProgress';
import { TimeProgressBar } from '../atoms/TimeProgressBar';
import { SubTaskList } from '../molecules/SubTaskList';
import { PomodoroTimer } from '../molecules/PomodoroTimer';
import { getRandomMotivationMessage, priorityColors, priorityLabels } from '../../utils/motivation';
import { cn } from '../ui/utils';

interface TaskPlayerProps {
  task: Task | null;
  settings: {
    motivationMode: boolean;
    soundEnabled: boolean;
  };
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  onUpdateSubTask: (taskId: string, subTaskId: string, updates: any) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onDeleteSubTask: (taskId: string, subTaskId: string) => void;
  onReorderSubTasks: (taskId: string, subTasks: any[]) => void;
  onSessionComplete: (taskId: string, session: TaskSession) => void;
  className?: string;
}

export function TaskPlayer({
  task,
  settings,
  onComplete,
  onSnooze,
  onUpdateSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onReorderSubTasks,
  onSessionComplete,
  className
}: TaskPlayerProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  useEffect(() => {
    if (settings.motivationMode && task) {
      setMotivationMessage(getRandomMotivationMessage());
    }
  }, [task, settings.motivationMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && task) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, task]);

  const handleStartTask = () => {
    if (!task) return;
    setIsPlaying(true);
    setStartTime(new Date());
  };

  const handlePauseTask = () => {
    setIsPlaying(false);
  };

  const handleComplete = async () => {
    if (!task || !startTime) return;
    
    setIsCompleting(true);
    
    if (settings.soundEnabled) {
      try {
        const audio = new Audio('/success.mp3');
        audio.play().catch(() => {});
      } catch (error) {}
    }

    setTimeout(() => {
      onComplete(task.id);
      setIsCompleting(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setStartTime(null);
    }, 600);
  };

  const handleSessionComplete = (type: 'work' | 'break' | 'longBreak', duration: number) => {
    if (!task) return;
    
    const session: TaskSession = {
      id: Date.now().toString(),
      taskId: task.id,
      startTime: new Date(Date.now() - duration * 60 * 1000),
      endTime: new Date(),
      duration,
      type
    };
    
    onSessionComplete(task.id, session);
  };

  if (!task) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <Card className="w-full max-w-md p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl mb-2">お疲れさまでした！</h2>
            <p className="text-muted-foreground">
              今はやるべきタスクがありません✨
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const completedSubTasks = task.subTasks.filter(st => st.completed).length;
  const totalSubTasks = task.subTasks.length;
  const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;
  const gradientClass = priorityColors[task.priority];
  const totalEstimatedTime = (task.estimatedTime + task.bufferTime) * 60; // 秒

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        {/* やる気スイッチモードの応援メッセージ */}
        {settings.motivationMode && motivationMessage && (
          <div className="mb-6 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <p className="text-sm text-orange-700">{motivationMessage}</p>
          </div>
        )}

        {/* メインタスク表示エリア */}
        <div className={cn(
          "relative mb-8 transition-all duration-600",
          isCompleting ? 'scale-105 opacity-80' : ''
        )}>
          <CircularProgress
            progress={progress}
            size={240}
            strokeWidth={12}
            color={task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#3b82f6' : '#10b981'}
            className="mx-auto"
          >
            <div className="text-center px-4">
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  {priorityLabels[task.priority]}
                </Badge>
              </div>
              <h1 className="text-lg leading-tight break-words">
                {task.title}
              </h1>
              {task.description && (
                <p className="text-sm text-gray-600 mt-2 break-words">
                  {task.description}
                </p>
              )}
              {totalSubTasks > 0 && (
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs">
                    {completedSubTasks}/{totalSubTasks} 完了
                  </Badge>
                </div>
              )}
            </div>
          </CircularProgress>
          
          {/* 完了アニメーション */}
          {isCompleting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-60 h-60 rounded-full border-4 border-green-400 animate-ping" />
            </div>
          )}
        </div>

        {/* 時間経過表示 */}
        {(isPlaying || currentTime > 0) && (
          <div className="mb-6">
            <TimeProgressBar
              currentTime={currentTime}
              totalTime={totalEstimatedTime}
              className="mb-2"
              showBreakIntervals={true}
            />
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 
                {task.estimatedTime + task.bufferTime}分
              </span>
            </div>
          </div>
        )}

        {/* タスクコントロール */}
        <div className="space-y-3 mb-6">
          {!isPlaying && currentTime === 0 ? (
            <Button 
              onClick={handleStartTask}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              タスクを開始
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={isPlaying ? handlePauseTask : handleStartTask}
                size="lg"
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Play className="w-4 h-4 mr-2" />
                {isPlaying ? '一時停止' : '再開'}
              </Button>
              <Button 
                onClick={handleComplete}
                size="lg"
                className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isCompleting ? '完了中...' : '完了！'}
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={() => onSnooze(task.id)}
              variant="outline"
              size="lg"
              className="flex-1 h-12 border-2 border-blue-200 hover:bg-blue-50"
              disabled={isCompleting}
            >
              <Coffee className="w-4 h-4 mr-2" />
              あとでやる
            </Button>
            
            {task.pomodoroSettings.enabled && (
              <Button
                onClick={() => setShowPomodoro(!showPomodoro)}
                variant="outline"
                size="lg"
                className="h-12 px-4 border-2 border-red-200 hover:bg-red-50"
              >
                <Timer className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ポモドーロタイマー */}
        {showPomodoro && task.pomodoroSettings.enabled && (
          <div className="border-t pt-6">
            <PomodoroTimer
              settings={task.pomodoroSettings}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        )}
      </Card>

      {/* 手順リスト */}
      <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
        {task.subTasks.length > 0 ? (
          <SubTaskList
            subTasks={task.subTasks}
            onUpdateSubTask={(id, updates) => onUpdateSubTask(task.id, id, updates)}
            onAddSubTask={(title) => onAddSubTask(task.id, title)}
            onDeleteSubTask={(id) => onDeleteSubTask(task.id, id)}
            onReorderSubTasks={(subTasks) => onReorderSubTasks(task.id, subTasks)}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg mb-2">手順を追加しましょう</h3>
            <p className="text-sm text-gray-600 mb-4">
              このタスクを実行するための手順を追加すると、<br />
              進捗が円グラフに反映されます
            </p>
            <Button
              onClick={() => onAddSubTask(task.id, '手順1')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              最初の手順を追加
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}