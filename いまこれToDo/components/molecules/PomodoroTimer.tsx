import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Pause, Square, Coffee, Repeat } from 'lucide-react';
import { PomodoroSettings } from '../../types/task';
import { TimeProgressBar } from '../atoms/TimeProgressBar';
import { cn } from '../ui/utils';

interface PomodoroTimerProps {
  settings: PomodoroSettings;
  onSessionComplete: (type: 'work' | 'break' | 'longBreak', duration: number) => void;
  className?: string;
}

type TimerState = 'stopped' | 'running' | 'paused';
type SessionType = 'work' | 'break' | 'longBreak';

export function PomodoroTimer({ settings, onSessionComplete, className }: PomodoroTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('stopped');
  const [currentSession, setCurrentSession] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalTime, setTotalTime] = useState(settings.workDuration * 60);

  const resetTimer = useCallback(() => {
    const duration = currentSession === 'work' 
      ? settings.workDuration
      : currentSession === 'break' 
        ? settings.breakDuration 
        : settings.longBreakDuration;
    
    setTimeLeft(duration * 60);
    setTotalTime(duration * 60);
    setTimerState('stopped');
  }, [currentSession, settings]);

  const startTimer = () => {
    setTimerState('running');
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const stopTimer = () => {
    setTimerState('stopped');
    resetTimer();
  };

  const switchSession = (newSession: SessionType) => {
    setCurrentSession(newSession);
    setTimerState('stopped');
    
    const duration = newSession === 'work' 
      ? settings.workDuration
      : newSession === 'break' 
        ? settings.breakDuration 
        : settings.longBreakDuration;
    
    setTimeLeft(duration * 60);
    setTotalTime(duration * 60);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // セッション完了
            const completedDuration = Math.floor(totalTime / 60);
            onSessionComplete(currentSession, completedDuration);
            
            if (currentSession === 'work') {
              const newSessionCount = sessionCount + 1;
              setSessionCount(newSessionCount);
              
              // 長い休憩かチェック
              if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
                switchSession('longBreak');
              } else {
                switchSession('break');
              }
            } else {
              switchSession('work');
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, timeLeft, currentSession, sessionCount, settings, totalTime, onSessionComplete]);

  const getSessionIcon = (session: SessionType) => {
    switch (session) {
      case 'work':
        return '🍅';
      case 'break':
        return '☕';
      case 'longBreak':
        return '🛋️';
    }
  };

  const getSessionLabel = (session: SessionType) => {
    switch (session) {
      case 'work':
        return '作業時間';
      case 'break':
        return '短い休憩';
      case 'longBreak':
        return '長い休憩';
    }
  };

  const currentTime = totalTime - timeLeft;

  return (
    <div className={cn("space-y-4", className)}>
      {/* セッション表示 */}
      <div className="text-center">
        <div className="text-4xl mb-2">{getSessionIcon(currentSession)}</div>
        <Badge variant="secondary" className="text-sm">
          {getSessionLabel(currentSession)}
        </Badge>
        {sessionCount > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            完了セッション: {sessionCount}
          </div>
        )}
      </div>

      {/* 時間表示 */}
      <div className="text-center">
        <div className="text-3xl font-mono mb-2">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <TimeProgressBar 
          currentTime={currentTime}
          totalTime={totalTime}
          showTime={false}
        />
      </div>

      {/* コントロールボタン */}
      <div className="flex justify-center gap-2">
        {timerState === 'stopped' || timerState === 'paused' ? (
          <Button onClick={startTimer} size="lg" className="min-w-[100px]">
            <Play className="w-4 h-4 mr-2" />
            開始
          </Button>
        ) : (
          <Button onClick={pauseTimer} size="lg" className="min-w-[100px]">
            <Pause className="w-4 h-4 mr-2" />
            一時停止
          </Button>
        )}
        
        <Button onClick={stopTimer} variant="outline" size="lg">
          <Square className="w-4 h-4 mr-2" />
          停止
        </Button>
      </div>

      {/* セッション切り替え */}
      <div className="flex justify-center gap-2">
        <Button
          variant={currentSession === 'work' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchSession('work')}
          disabled={timerState === 'running'}
        >
          🍅 作業
        </Button>
        <Button
          variant={currentSession === 'break' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchSession('break')}
          disabled={timerState === 'running'}
        >
          ☕ 休憩
        </Button>
        <Button
          variant={currentSession === 'longBreak' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchSession('longBreak')}
          disabled={timerState === 'running'}
        >
          🛋️ 長休憩
        </Button>
      </div>
    </div>
  );
}