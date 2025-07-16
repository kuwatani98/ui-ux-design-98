import { cn } from '../ui/utils';

interface TimeProgressBarProps {
  currentTime: number; // 秒
  totalTime: number; // 秒
  className?: string;
  showTime?: boolean;
  showBreakIntervals?: boolean; // 25分ごとの休憩表示
}

export function TimeProgressBar({ 
  currentTime, 
  totalTime, 
  className,
  showTime = true,
  showBreakIntervals = false
}: TimeProgressBarProps) {
  const progress = Math.min((currentTime / totalTime) * 100, 100);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 25分 = 1500秒ごとの休憩ポイントを計算
  const breakInterval = 25 * 60; // 25分
  const breakPoints = [];
  
  if (showBreakIntervals) {
    for (let i = breakInterval; i < totalTime; i += breakInterval) {
      const percentage = (i / totalTime) * 100;
      breakPoints.push(percentage);
    }
  }

  // 次の休憩までの残り時間を計算
  const getTimeToNextBreak = () => {
    if (!showBreakIntervals) return null;
    const nextBreakTime = Math.ceil(currentTime / breakInterval) * breakInterval;
    const timeToBreak = nextBreakTime - currentTime;
    
    if (timeToBreak <= 0 || timeToBreak > breakInterval) return null;
    return timeToBreak;
  };

  const timeToNextBreak = getTimeToNextBreak();

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* 進捗バー */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        
        {/* 休憩ポイントのマーカー */}
        {showBreakIntervals && breakPoints.map((point, index) => (
          <div
            key={index}
            className="absolute top-0 w-0.5 h-full bg-orange-400 opacity-80"
            style={{ left: `${point}%` }}
          >
            {/* 休憩アイコン */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="text-xs text-orange-600">☕</div>
            </div>
          </div>
        ))}
        
        {/* 再生ヘッド */}
        <div 
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transform -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out"
          style={{ left: `${progress}%` }}
        />
      </div>
      
      {showTime && (
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <span>{formatTime(currentTime)}</span>
          {timeToNextBreak && (
            <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              休憩まで {formatTime(timeToNextBreak)}
            </span>
          )}
          <span>{formatTime(totalTime)}</span>
        </div>
      )}
    </div>
  );
}