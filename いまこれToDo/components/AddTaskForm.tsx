import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Plus, X, GripVertical, Calendar, Tag } from 'lucide-react';
import { Task, Label as TaskLabel } from '../types/task';
import { priorityLabels } from '../utils/motivation';

interface AddTaskFormProps {
  onAddTask: (
    title: string, 
    description?: string, 
    estimatedTime?: number,
    bufferTime?: number,
    priority?: Task['priority'],
    dueDate?: Date,
    labels?: TaskLabel[],
    pomodoroEnabled?: boolean,
    steps?: string[]
  ) => void;
  onClose: () => void;
  savedLabels?: TaskLabel[];
}

export function AddTaskForm({ onAddTask, onClose, savedLabels = [] }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [bufferTime, setBufferTime] = useState(5);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [steps, setSteps] = useState<string[]>(['']);
  const [newStep, setNewStep] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<TaskLabel[]>([]);
  const [newLabel, setNewLabel] = useState({ name: '', emoji: '📝' });
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  const addStep = () => {
    if (newStep.trim()) {
      setSteps([...steps.filter(s => s.trim()), newStep.trim()]);
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addLabel = () => {
    if (newLabel.name.trim()) {
      const label: TaskLabel = {
        id: Date.now().toString(),
        name: newLabel.name.trim(),
        emoji: newLabel.emoji,
        color: '#3b82f6'
      };
      setSelectedLabels([...selectedLabels, label]);
      setNewLabel({ name: '', emoji: '📝' });
      setShowLabelForm(false);
    }
  };

  const removeLabel = (labelId: string) => {
    setSelectedLabels(selectedLabels.filter(l => l.id !== labelId));
  };

  const selectSavedLabel = (label: TaskLabel) => {
    if (!selectedLabels.find(l => l.id === label.id)) {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSteps = steps.filter(s => s.trim());
    
    if (title.trim() && validSteps.length > 0) {
      // 締切日時を組み合わせて作成
      let dueDateObj: Date | undefined;
      if (dueDate) {
        const dateStr = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59`;
        dueDateObj = new Date(dateStr);
      }

      onAddTask(
        title.trim(), 
        description.trim() || undefined, 
        estimatedTime,
        bufferTime,
        priority,
        dueDateObj,
        selectedLabels,
        pomodoroEnabled,
        validSteps
      );
      setTitle('');
      setDescription('');
      setEstimatedTime(30);
      setBufferTime(5);
      setPriority('medium');
      setPomodoroEnabled(false);
      setSteps(['']);
      setNewStep('');
      setSelectedLabels([]);
      setDueDate('');
      setDueTime('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">新しいタスク</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">タスク名</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="やることを入力..."
              required
              autoFocus
            />
          </div>
          
          <div>
            <Label htmlFor="description">詳細 (オプション)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="詳しい説明があれば..."
              rows={3}
            />
          </div>

          {/* ラベル設定 */}
          <div>
            <Label>ラベル</Label>
            <div className="space-y-3 mt-2">
              {/* 選択中のラベル */}
              {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedLabels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span>{label.emoji}</span>
                      <span>{label.name}</span>
                      <button
                        type="button"
                        onClick={() => removeLabel(label.id)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* 保存されたラベル */}
              {savedLabels.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">保存されたラベル:</p>
                  <div className="flex flex-wrap gap-2">
                    {savedLabels.map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => selectSavedLabel(label)}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                      >
                        <span>{label.emoji}</span>
                        <span>{label.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 新しいラベル作成 */}
              {showLabelForm ? (
                <div className="flex gap-2">
                  <Input
                    value={newLabel.emoji}
                    onChange={(e) => setNewLabel({...newLabel, emoji: e.target.value})}
                    placeholder="🏷️"
                    className="w-16"
                  />
                  <Input
                    value={newLabel.name}
                    onChange={(e) => setNewLabel({...newLabel, name: e.target.value})}
                    placeholder="ラベル名"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addLabel} size="sm">
                    追加
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowLabelForm(false)}
                    size="sm"
                  >
                    キャンセル
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLabelForm(true)}
                  size="sm"
                  className="border-dashed"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  新しいラベルを追加
                </Button>
              )}
            </div>
          </div>

          {/* 締切日時設定 */}
          <div>
            <Label>締切日時 (オプション)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              アプリ内では1日前に締切として設定されます
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">目安時間 (分)</Label>
              <Input
                id="time"
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 30)}
                min={5}
                max={480}
              />
            </div>
            
            <div>
              <Label htmlFor="buffer">予備時間 (分)</Label>
              <Input
                id="buffer"
                type="number"
                value={bufferTime}
                onChange={(e) => setBufferTime(parseInt(e.target.value) || 5)}
                min={0}
                max={60}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="priority">優先度</Label>
            <Select value={priority} onValueChange={(value: Task['priority']) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">{priorityLabels.high}</SelectItem>
                <SelectItem value="medium">{priorityLabels.medium}</SelectItem>
                <SelectItem value="low">{priorityLabels.low}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>必要な手順 *</Label>
            <div className="space-y-2 mt-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex items-center text-gray-400">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <Input
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`手順 ${index + 1}`}
                    className="flex-1"
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="新しい手順を追加..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStep();
                    }
                  }}
                />
                <Button type="button" onClick={addStep} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="pomodoro">ポモドーロタイマーを使用</Label>
            <Switch
              id="pomodoro"
              checked={pomodoroEnabled}
              onCheckedChange={setPomodoroEnabled}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              追加
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}