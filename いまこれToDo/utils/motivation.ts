export const motivationMessages = [
  "がんばって！あなたならできる✨",
  "一歩ずつ進もう🌟",
  "集中の時間です💪",
  "素晴らしいスタートですね🎯",
  "今日も頑張りましょう🌈",
  "やる気満々ですね🔥",
  "順調に進んでいますよ📈",
  "その調子で続けましょう🎵",
];

export const getRandomMotivationMessage = (): string => {
  return motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
};

export const priorityColors = {
  high: 'from-red-100 to-red-200',
  medium: 'from-blue-100 to-blue-200', 
  low: 'from-green-100 to-green-200',
};

export const priorityLabels = {
  high: '🔥 急ぎ',
  medium: '⭐ 普通',
  low: '🌱 ゆっくり',
};