import { useState } from 'react';
import { TaskPlayer } from './components/organisms/TaskPlayer';
import { TaskHistory } from './components/organisms/TaskHistory';
import { BottomNavigation } from './components/molecules/BottomNavigation';
import { AddTaskForm } from './components/AddTaskForm';
import { SettingsPanel } from './components/SettingsPanel';
import { useTasks } from './hooks/useTasks';

type TabType = 'home' | 'history' | 'settings';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const {
    settings,
    getCurrentTask,
    getCompletedTasks,
    addTask,
    completeTask,
    snoozeTask,
    addSubTask,
    updateSubTask,
    deleteSubTask,
    reorderSubTasks,
    addSession,
    updateSettings,
  } = useTasks();

  const currentTask = getCurrentTask();
  const completedTasks = getCompletedTasks();

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  const handleAddTask = () => {
    setShowAddForm(true);
  };

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'home':
        return (
          <TaskPlayer
            task={currentTask}
            settings={settings}
            onComplete={completeTask}
            onSnooze={snoozeTask}
            onUpdateSubTask={updateSubTask}
            onAddSubTask={addSubTask}
            onDeleteSubTask={deleteSubTask}
            onReorderSubTasks={reorderSubTasks}
            onSessionComplete={(taskId, session) => addSession(session)}
            className="pb-20"
          />
        );
      case 'history':
        return (
          <TaskHistory
            completedTasks={completedTasks}
            className="pb-20"
          />
        );
      case 'settings':
        return (
          <div className="pb-20">
            <SettingsPanel
              settings={settings}
              onUpdateSettings={updateSettings}
              onClose={() => setCurrentTab('home')}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* ヘッダー */}
      <header className="px-4 py-6 text-center">
        <h1 className="text-3xl font-medium text-gray-800 mb-1">いまこれToDo</h1>
        <p className="text-sm text-gray-600">
          {currentTab === 'home' && '今に集中して取り組もう'}
          {currentTab === 'history' && 'あなたの成果を振り返ろう'}
          {currentTab === 'settings' && '設定をカスタマイズ'}
        </p>
      </header>

      {/* メインコンテンツ */}
      <main className="px-4">
        {renderCurrentTab()}
      </main>

      {/* 下部ナビゲーション */}
      <BottomNavigation
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onAddTask={handleAddTask}
      />

      {/* モーダル */}
      {showAddForm && (
        <AddTaskForm
          onAddTask={addTask}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}