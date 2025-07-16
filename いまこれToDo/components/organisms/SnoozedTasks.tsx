import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Task } from '../../types/task';
import { priorityLabels } from '../../utils/motivation';
import { Clock, RotateCcw, Play } from 'lucide-react';

interface SnoozedTasksProps {
  snoozedTasks: Task[];
  onResumeTask: (taskId: string) => void;
  className?: string;
}

export function SnoozedTasks({ snoozedTasks, onResumeTask, className }: SnoozedTasksProps) {
  const formatTimeRemaining = (snoozedUntil: Date) => {
    const now = new Date();
    const diff = snoozedUntil.getTime() - now.getTime();
    const minutes = Math.ceil(diff / (1000 * 60));
    
    if (minutes <= 0) return '今すぐ';
    if (minutes < 60) return `${minutes}分後`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分後` : `${hours}時間後`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days}日後`;
  };

  if (snoozedTasks.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">😴</div>
        <h2 className="text-2xl mb-2">後回しタスクはありません</h2>
        <p className="text-gray-600">
          すべてのタスクが整理されています！
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl mb-2">後回しタスク</h2>
        <p className="text-gray-600">
          後回しにした回数が多い順に表示されています
        </p>
      </div>

      {snoozedTasks.map((task) => (
        <Card key={task.id} className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {priorityLabels[task.priority]}
                </Badge>
                <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200">
                  後回し {task.snoozeCount}回
                </Badge>
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
                {task.snoozedUntil && (
                  <div className="flex items-center gap-1">
                    <RotateCcw className="w-4 h-4" />
                    <span>{formatTimeRemaining(task.snoozedUntil)}</span>
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
              onClick={() => onResumeTask(task.id)}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Play className="w-4 h-4 mr-2" />
              再開
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}