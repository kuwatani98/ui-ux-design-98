import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Task } from '../../types/task';
import { priorityLabels } from '../../utils/motivation';
import { Clock, Play, X } from 'lucide-react';

interface TaskRecommendationsProps {
  recommendedTasks: Task[];
  onSelectTask: (taskId: string) => void;
  onCancel: () => void;
  className?: string;
}

export function TaskRecommendations({ 
  recommendedTasks, 
  onSelectTask, 
  onCancel,
  className 
}: TaskRecommendationsProps) {
  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(true);

  useEffect(() => {
    if (!isCountingDown || recommendedTasks.length === 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsCountingDown(false);
          // 最初のタスクを自動選択
          if (recommendedTasks.length > 0) {
            onSelectTask(recommendedTasks[0].id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountingDown, recommendedTasks, onSelectTask]);

  const handleTaskSelect = (taskId: string) => {
    setIsCountingDown(false);
    onSelectTask(taskId);
  };

  const handleCancel = () => {
    setIsCountingDown(false);
    onCancel();
  };

  if (recommendedTasks.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl mb-2">すべてのタスクが完了しました！</h2>
        <p className="text-gray-600">
          お疲れさまでした。新しいタスクを追加してみませんか？
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 自動開始カウントダウン */}
      {isCountingDown && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="text-center">
            <div className="text-4xl mb-4">⏱️</div>
            <h2 className="text-xl mb-2">次のタスクを自動で開始します</h2>
            <div className="text-3xl font-bold text-blue-600 mb-4">{countdown}</div>
            <p className="text-sm text-gray-600 mb-4">
              他のタスクを選択するか、キャンセルしてください
            </p>
            <Button 
              onClick={handleCancel}
              variant="outline"
              className="mx-auto"
            >
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </Button>
          </div>
        </Card>
      )}

      {/* 推奨タスク一覧 */}
      <div className="space-y-4">
        <h2 className="text-2xl">おすすめのタスク</h2>
        
        {recommendedTasks.map((task, index) => (
          <Card 
            key={task.id} 
            className={`p-4 transition-all duration-300 ${
              index === 0 && isCountingDown
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 shadow-lg'
                : 'bg-white/80 backdrop-blur-sm shadow-lg border-0'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {priorityLabels[task.priority]}
                  </Badge>
                  {index === 0 && isCountingDown && (
                    <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                      次のタスク
                    </Badge>
                  )}
                  {task.snoozeCount > 0 && (
                    <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200">
                      後回し {task.snoozeCount}回
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg mb-1">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{task.estimatedTime}分</span>
                  </div>
                  {task.dueDate && (
                    <div className="text-orange-600">
                      締切: {task.dueDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {task.subTasks.length > 0 && (
                  <span>
                    手順: {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length} 完了
                  </span>
                )}
              </div>
              <Button
                onClick={() => handleTaskSelect(task.id)}
                size="sm"
                className={`${
                  index === 0 && isCountingDown
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                }`}
              >
                <Play className="w-4 h-4 mr-2" />
                開始
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}