import { useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, GripVertical, X } from 'lucide-react';
import { SubTask } from '../../types/task';
import { cn } from '../ui/utils';

interface SubTaskListProps {
  subTasks: SubTask[];
  onUpdateSubTask: (id: string, updates: Partial<SubTask>) => void;
  onAddSubTask: (title: string) => void;
  onDeleteSubTask: (id: string) => void;
  onReorderSubTasks: (subTasks: SubTask[]) => void;
  className?: string;
}

export function SubTaskList({
  subTasks,
  onUpdateSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onReorderSubTasks,
  className
}: SubTaskListProps) {
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const completedCount = subTasks.filter(st => st.completed).length;
  const totalCount = subTasks.length;

  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      onAddSubTask(newSubTaskTitle.trim());
      setNewSubTaskTitle('');
      setIsAddingSubTask(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, subTaskId: string) => {
    setDraggedItem(subTaskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = subTasks.findIndex(st => st.id === draggedItem);
    const targetIndex = subTasks.findIndex(st => st.id === targetId);
    
    const newSubTasks = [...subTasks];
    const [draggedSubTask] = newSubTasks.splice(draggedIndex, 1);
    newSubTasks.splice(targetIndex, 0, draggedSubTask);
    
    // 順序を更新
    const updatedSubTasks = newSubTasks.map((st, index) => ({
      ...st,
      order: index
    }));
    
    onReorderSubTasks(updatedSubTasks);
    setDraggedItem(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* 進捗表示 */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">実行手順</span>
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalCount} 完了
          </Badge>
        </div>
      )}

      {/* サブタスクリスト */}
      <div className="space-y-2">
        {subTasks
          .sort((a, b) => a.order - b.order)
          .map((subTask) => (
            <div
              key={subTask.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-white transition-all duration-200",
                subTask.completed ? "opacity-60" : "",
                draggedItem === subTask.id ? "opacity-50 scale-95" : ""
              )}
              draggable
              onDragStart={(e) => handleDragStart(e, subTask.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, subTask.id)}
            >
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              <Checkbox
                checked={subTask.completed}
                onCheckedChange={(checked) => 
                  onUpdateSubTask(subTask.id, { completed: !!checked })
                }
              />
              <span className={cn(
                "flex-1 text-sm",
                subTask.completed ? "line-through text-gray-500" : ""
              )}>
                {subTask.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteSubTask(subTask.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
      </div>

      {/* 新しいサブタスクを追加 */}
      {isAddingSubTask ? (
        <div className="flex gap-2">
          <Input
            value={newSubTaskTitle}
            onChange={(e) => setNewSubTaskTitle(e.target.value)}
            placeholder="手順の内容..."
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddSubTask();
              } else if (e.key === 'Escape') {
                setIsAddingSubTask(false);
                setNewSubTaskTitle('');
              }
            }}
          />
          <Button size="sm" onClick={handleAddSubTask}>
            追加
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setIsAddingSubTask(false);
              setNewSubTaskTitle('');
            }}
          >
            キャンセル
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingSubTask(true)}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          手順を追加
        </Button>
      )}
    </div>
  );
}