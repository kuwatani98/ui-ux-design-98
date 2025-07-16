import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, Clock, Calendar, Star } from 'lucide-react';
import { Task } from '../../types/task';
import { cn } from '../ui/utils';

interface TaskHistoryProps {
  completedTasks: Task[];
  className?: string;
}

export function TaskHistory({ completedTasks, className }: TaskHistoryProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalTime = (task: Task) => {
    return task.completionRecord?.actualTime || task.estimatedTime;
  };

  const groupedTasks = completedTasks.reduce((groups, task) => {
    if (!task.completedAt) return groups;
    
    const date = task.completedAt.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (completedTasks.length === 0) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <Card className="w-full max-w-md p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl mb-2">履歴はまだありません</h2>
            <p className="text-muted-foreground">
              タスクを完了すると、ここに履歴が表示されます
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {sortedDates.map(dateString => {
        const date = new Date(dateString);
        const tasksForDate = groupedTasks[dateString];
        const totalTimeForDate = tasksForDate.reduce((sum, task) => sum + getTotalTime(task), 0);
        
        return (
          <div key={dateString}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {date.toLocaleDateString('ja-JP', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </h3>
              <Badge variant="secondary">
                {tasksForDate.length}個 · {totalTimeForDate}分
              </Badge>
            </div>
            
            <div className="space-y-3">
              {tasksForDate.map(task => (
                <Card key={task.id} className="p-4 bg-white/80 backdrop-blur-sm shadow-sm border-0">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{task.title}</h4>
                        {task.completedAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(task.completedAt)}
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{getTotalTime(task)}分</span>
                        </div>
                        
                        {task.subTasks.length > 0 && (
                          <div>
                            手順: {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                          </div>
                        )}
                        
                        {task.completionRecord?.satisfaction && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            <span>{task.completionRecord.satisfaction}/5</span>
                          </div>
                        )}
                      </div>
                      
                      {task.labels.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {task.labels.map(label => (
                            <Badge 
                              key={label.id} 
                              variant="outline" 
                              className="text-xs"
                              style={{ backgroundColor: `${label.color}20`, borderColor: label.color }}
                            >
                              {label.emoji && <span className="mr-1">{label.emoji}</span>}
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}