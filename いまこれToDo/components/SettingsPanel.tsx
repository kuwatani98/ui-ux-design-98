import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { X } from 'lucide-react';
import { AppSettings } from '../types/task';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onUpdateSettings, onClose }: SettingsPanelProps) {
  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl">設定</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* やる気スイッチモード */}
        <div className="space-y-3">
          <h3 className="text-lg">表示設定</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="motivation">やる気スイッチモード</Label>
              <p className="text-sm text-gray-600">応援メッセージとBGMを表示</p>
            </div>
            <Switch
              id="motivation"
              checked={settings.motivationMode}
              onCheckedChange={(checked) => onUpdateSettings({ motivationMode: checked })}
            />
          </div>
        </div>

        {/* サウンド設定 */}
        <div className="space-y-3">
          <h3 className="text-lg">サウンド設定</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound">効果音を有効にする</Label>
              <p className="text-sm text-gray-600">タスク完了時に音を再生</p>
            </div>
            <Switch
              id="sound"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ soundEnabled: checked })}
            />
          </div>
        </div>

        {/* ポモドーロ設定 */}
        <div className="space-y-3">
          <h3 className="text-lg">ポモドーロ設定</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workTime">作業時間 (分)</Label>
              <Input
                id="workTime"
                type="number"
                value={settings.defaultPomodoroWork}
                onChange={(e) => onUpdateSettings({ 
                  defaultPomodoroWork: parseInt(e.target.value) || 25 
                })}
                min={5}
                max={60}
              />
            </div>
            <div>
              <Label htmlFor="breakTime">休憩時間 (分)</Label>
              <Input
                id="breakTime"
                type="number"
                value={settings.defaultPomodoroBreak}
                onChange={(e) => onUpdateSettings({ 
                  defaultPomodoroBreak: parseInt(e.target.value) || 5 
                })}
                min={1}
                max={30}
              />
            </div>
          </div>
        </div>

        {/* その他の設定 */}
        <div className="space-y-3">
          <h3 className="text-lg">その他</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoStart">タスク完了後に次のタスクを自動開始</Label>
              <p className="text-sm text-gray-600">効率的にタスクを進める</p>
            </div>
            <Switch
              id="autoStart"
              checked={settings.autoStartNextTask}
              onCheckedChange={(checked) => onUpdateSettings({ autoStartNextTask: checked })}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t">
        <Button onClick={onClose} className="w-full">
          設定を保存
        </Button>
      </div>
    </Card>
  );
}