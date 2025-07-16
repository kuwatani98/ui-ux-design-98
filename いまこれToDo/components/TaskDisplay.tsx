import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Clock, Coffee, RotateCcw } from 'lucide-react';
import { Task } from '../types/task';
import { getRandomMotivationMessage, priorityColors, priorityLabels } from '../utils/motivation';

interface TaskDisplayProps {
  task: Task | null;
  settings: {
    motivationMode: boolean;
    soundEnabled: boolean;
  };
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
}

export function TaskDisplay({ task, settings, onComplete, onSnooze }: TaskDisplayProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');

  useEffect(() => {
    if (settings.motivationMode && task) {
      setMotivationMessage(getRandomMotivationMessage());
    }
  }, [task, settings.motivationMode]);

  const handleComplete = async () => {
    if (!task) return;
    
    setIsCompleting(true);
    
    // 効果音を再生（実際の音声ファイルが必要）
    if (settings.soundEnabled) {
      try {
        const audio = new Audio('/success.mp3');
        audio.play().catch(() => {
          // 音声再生に失敗した場合は無視
        });
      } catch (error) {
        // 音声ファイルがない場合は無視
      }
    }

    // アニメーション効果のための短い遅延
    setTimeout(() => {
      onComplete(task.id);
      setIsCompleting(false);
    }, 600);
  };

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
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

  const gradientClass = priorityColors[task.priority];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg border-0">
        {/* やる気スイッチモードの応援メッセージ */}
        {settings.motivationMode && motivationMessage && (
          <div className="mb-6 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <p className="text-sm text-orange-700">{motivationMessage}</p>
          </div>
        )}

        {/* メインタスク表示エリア */}
        <div className={`relative mb-8 transition-all duration-600 ${isCompleting ? 'scale-105 opacity-80' : ''}`}>
          {/* 円形背景 */}
          <div className={`w-48 h-48 mx-auto bg-gradient-to-br ${gradientClass} rounded-full flex items-center justify-center p-6 shadow-lg`}>
            <div className="text-center">
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  {priorityLabels[task.priority]}
                </Badge>
              </div>
              <h1 className="text-lg leading-tight break-words px-2">
                {task.title}
              </h1>
              {task.description && (
                <p className="text-sm text-gray-600 mt-2 break-words px-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          {/* 完了アニメーション */}
          {isCompleting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-green-400 animate-ping" />
            </div>
          )}
        </div>

        {/* 時間表示 */}
        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>目安: {task.estimatedTime}分</span>
        </div>

        {/* アクションボタン */}
        <div className="space-y-3">
          <Button 
            onClick={handleComplete}
            size="lg"
            className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
            disabled={isCompleting}
          >
            {isCompleting ? (
              <RotateCcw className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {isCompleting ? '完了中...' : '完了！'}
          </Button>
          
          <Button 
            onClick={() => onSnooze(task.id)}
            variant="outline"
            size="lg"
            className="w-full h-12 text-base border-2 border-blue-200 hover:bg-blue-50"
            disabled={isCompleting}
          >
            <Coffee className="w-4 h-4 mr-2" />
            あとでやる (30分後)
          </Button>
        </div>
      </Card>
    </div>
  );
}