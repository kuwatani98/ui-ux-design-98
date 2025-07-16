import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Home, Settings, History, Plus, Clock } from 'lucide-react';
import { cn } from '../ui/utils';

interface BottomNavigationProps {
  currentTab: 'home' | 'history' | 'settings' | 'snoozed';
  onTabChange: (tab: 'home' | 'history' | 'settings' | 'snoozed') => void;
  onAddTask: () => void;
  snoozedCount?: number;
  className?: string;
}

export function BottomNavigation({ 
  currentTab, 
  onTabChange, 
  onAddTask, 
  snoozedCount = 0,
  className 
}: BottomNavigationProps) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50",
      className
    )}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <Button
          variant={currentTab === 'home' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">ホーム</span>
        </Button>
        
        <Button
          variant={currentTab === 'snoozed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('snoozed')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 relative"
        >
          <Clock className="w-5 h-5" />
          <span className="text-xs">後回し</span>
          {snoozedCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center bg-orange-500">
              {snoozedCount}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={currentTab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('history')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <History className="w-5 h-5" />
          <span className="text-xs">履歴</span>
        </Button>
        
        {/* 中央のプラスボタン */}
        <Button
          onClick={onAddTask}
          size="lg"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
        
        <Button
          variant={currentTab === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('settings')}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">設定</span>
        </Button>
      </div>
    </nav>
  );
}