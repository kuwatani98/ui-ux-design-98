document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    // ナビゲーションとスクリーン
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    const homeScreen = document.getElementById('home-screen');
    const createTaskScreen = document.getElementById('create-task-screen');
    const snoozedScreen = document.getElementById('snoozed-screen');
    const historyScreen = document.getElementById('history-screen');
    const settingsScreen = document.getElementById('settings-screen');

    // ホーム画面要素
    const taskCircleContainer = document.querySelector('.task-circle-container');
    const circleProgress = document.querySelector('.task-progress-circle .circle-progress');
    const currentTaskTitle = document.getElementById('current-task-title');
    const currentTaskLabel = document.getElementById('current-task-label');
    const currentSubtaskDisplay = document.getElementById('current-subtask-display');
    const hasTaskContent = document.getElementById('has-task-content');
    const addFirstTaskBtn = document.getElementById('add-first-task-btn'); // ★重要: タスクがない場合の追加ボタン

    // ポモドーロ関連要素
    const pomodoroTimerBar = document.getElementById('pomodoro-timer-bar');
    const pomodoroCountdown = document.getElementById('pomodoro-countdown');
    const pomodoroStartBtn = document.getElementById('pomodoro-start-btn');
    const nextSubtaskBtn = document.getElementById('next-subtask-btn');
    const snoozeTaskBtn = document.getElementById('snooze-task-btn');

    // 次のタスクカウントダウンオーバーレイ
    const nextTaskCountdownOverlay = document.getElementById('next-task-countdown-overlay');
    const nextTaskMessage = document.getElementById('next-task-message');
    const countdownTimerDisplay = document.getElementById('countdown-timer');

    // タスク作成画面要素
    const createTaskForm = document.getElementById('create-task-form');
    const newSubtasksList = document.getElementById('new-subtasks-list');
    const addSubtaskBtn = document.getElementById('add-subtask-btn');
    const labelSelectionArea = document.getElementById('label-selection-area');
    const newLabelNameInput = document.getElementById('new-label-name');
    const newLabelIconInput = document.getElementById('new-label-icon');
    const addNewLabelBtn = document.getElementById('add-new-label-btn');

    // あとでやる/履歴画面要素
    const snoozedTaskList = document.getElementById('snoozed-task-list');
    const noSnoozedTasksMessage = document.getElementById('no-snoozed-tasks');
    const historyTaskList = document.getElementById('history-task-list');
    const noHistoryTasksMessage = document.getElementById('no-history-tasks');

    // 設定画面要素
    const pomodoroEnabledCheckbox = document.getElementById('pomodoro-enabled');
    const autoStartNextTaskCheckbox = document.getElementById('auto-start-next-task');
    const motivationalModeEnabledCheckbox = document.getElementById('motivational-mode-enabled');
    const soundEffectsEnabledCheckbox = document.getElementById('sound-effects-enabled');
    const bgmEnabledCheckbox = document.getElementById('bgm-enabled');
    const pomodoroWorkDurationInput = document.getElementById('pomodoro-work-duration');
    const pomodoroBreakDurationInput = document.getElementById('pomodoro-break-duration');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // 効果音要素
    const completeSound = document.getElementById('complete-sound');
    const snoozeSound = document.getElementById('snooze-sound');
    const countdownSound = document.getElementById('countdown-sound');
    const pomodoroBreakSound = document.getElementById('pomodoro-break-sound');
    const pomodoroWorkStartSound = document.getElementById('pomodoro-work-start-sound');
    const bgm = document.getElementById('bgm');

    // --- アプリケーションデータ ---
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
    let snoozedTasks = JSON.parse(localStorage.getItem('snoozedTasks')) || [];
    let labels = JSON.parse(localStorage.getItem('labels')) || [{ name: '仕事', icon: 'fas fa-briefcase' }, { name: 'プライベート', icon: 'fas fa-home' }];
    let settings = JSON.parse(localStorage.getItem('settings')) || {
        pomodoroEnabled: true,
        autoStartNextTask: true,
        motivationalModeEnabled: false,
        soundEffectsEnabled: true,
        bgmEnabled: false,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5
    };

    // --- タイマーとタスク関連の状態変数 ---
    let currentTaskIndex = 0;
    let currentSubtaskIndex = 0;
    let pomodoroInterval;
    let pomodoroTimeLeft;
    let pomodoroIsWorking = true;
    let pomodoroActive = false;
    let pomodoroCurrentSegment = 1;
    let nextTaskCountdownInterval;

    // CSSのroot変数から色を取得
    function getCssVariable(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    const var_primary_color = getCssVariable('--primary-color');
    const var_accent_color = getCssVariable('--accent-color');
    const var_empty_circle_color = getCssVariable('--empty-circle-color');
    const var_secondary_color = getCssVariable('--secondary-color');

    // --- データ保存関数 ---
    function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
    function saveCompletedTasks() { localStorage.setItem('completedTasks', JSON.stringify(completedTasks)); }
    function saveSnoozedTasks() { localStorage.setItem('snoozedTasks', JSON.stringify(snoozedTasks)); }
    function saveLabels() { localStorage.setItem('labels', JSON.stringify(labels)); }
    function saveSettings() {
        localStorage.setItem('settings', JSON.stringify(settings));
        loadSettings(); // 設定を即座に反映
    }

    // --- 音声再生関数 ---
    function playSound(soundElement) {
        if (settings.soundEffectsEnabled) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => console.warn("サウンド再生失敗:", e));
        }
    }

    function toggleBGM(enable) {
        if (enable) {
            bgm.volume = 0.3;
            bgm.play().catch(e => console.error("BGM再生失敗:", e));
        } else {
            bgm.pause();
            bgm.currentTime = 0;
        }
    }

    // --- 画面表示制御関数 ---
    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        navItems.forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`#nav-${screenId.replace('-screen', '')}`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        } else if (screenId === 'create-task-screen') {
            document.getElementById('nav-create').classList.add('active');
        }

        // 画面切り替え時にポモドーロタイマーを停止 (ホーム画面以外)
        if (screenId !== 'home-screen') {
            stopPomodoroTimer();
            pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
            pomodoroActive = false;
            // ポモドーロバーとカウントダウンをリセット
            pomodoroTimerBar.innerHTML = '<div class="timer-segments"></div><div id="pomodoro-countdown" class="pomodoro-countdown"></div>'; // HTML構造を維持
            pomodoroCountdown.textContent = ''; // DOM要素を再取得する
            // 円の進捗をリセット
            taskCircleContainer.classList.remove('has-task');
            circleProgress.style.stroke = var_empty_circle_color;
            updateProgressBar(0);
        } else {
            // ホーム画面に戻った際にタスク表示を更新
            renderCurrentTask();
        }
    }

    // --- ホーム画面タスク表示関連関数 ---
    function renderCurrentTask() {
        // タスクがない場合の表示
        if (tasks.length === 0) {
            taskCircleContainer.classList.remove('has-task'); // 円を空の色にするクラスを削除
            circleProgress.style.stroke = var_empty_circle_color; // 円を空の色にする
            updateProgressBar(0); // 進捗バーを0に

            hasTaskContent.style.display = 'none'; // 通常のタスク表示を非表示
            addFirstTaskBtn.style.display = 'flex'; // 「新しいタスクを追加」ボタンを表示
            snoozeTaskBtn.disabled = true;
            pomodoroStartBtn.disabled = true;
            nextSubtaskBtn.disabled = true;

            currentTaskTitle.textContent = 'タスクがありません';
            currentTaskLabel.textContent = '';
            currentSubtaskDisplay.textContent = '';

            stopPomodoroTimer(); // タイマーを停止
            pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
            pomodoroActive = false; // タイマー非アクティブに
            pomodoroTimerBar.innerHTML = '<div class="timer-segments"></div><div id="pomodoro-countdown" class="pomodoro-countdown"></div>'; // バーの内部を初期化
            pomodoroCountdown.textContent = '';
            return;
        }

        // タスクがある場合の表示
        taskCircleContainer.classList.add('has-task'); // 円の色を付けるクラスを追加
        hasTaskContent.style.display = 'block'; // 通常のタスク表示を表示
        addFirstTaskBtn.style.display = 'none'; // 「新しいタスクを追加」ボタンを非表示

        const task = tasks[currentTaskIndex];
        currentTaskTitle.textContent = task.title;
        currentTaskLabel.innerHTML = task.label ? `<span class="task-label-display"><i class="${task.label.icon}"></i> ${task.label.name}</span>` : '';

        // サブタスクの表示と進捗
        renderCurrentSubtask();
        updateProgressBarBasedOnSubtasks(task);

        snoozeTaskBtn.disabled = false;
        if (settings.pomodoroEnabled) {
            pomodoroStartBtn.disabled = false;
            // ポモドーロタイマーの初期化（既に動いている場合は何もしない）
            if (!pomodoroActive) {
                stopPomodoroTimer(); //念のため停止
                renderPomodoroBar(task.duration + (task.bufferTime || 0)); // バーを描画
                pomodoroCountdown.textContent = '00:00'; //初期表示
                pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
            }
        } else {
            stopPomodoroTimer(); // ポモドーロが無効なら停止
            pomodoroStartBtn.disabled = true; // 開始ボタンを無効に
            pomodoroTimerBar.innerHTML = '<div class="timer-segments"></div><div id="pomodoro-countdown" class="pomodoro-countdown"></div>'; // バーを非表示
            pomodoroCountdown.textContent = ''; // カウントダウンを非表示
        }

        if (settings.motivationalModeEnabled) {
            console.log("やる気スイッチモード: 頑張って！");
        }
    }

    function renderCurrentSubtask() {
        const task = tasks[currentTaskIndex];
        if (task && task.subtasks && task.subtasks.length > 0) {
            const currentSub = task.subtasks[currentSubtaskIndex];
            if (currentSub) {
                currentSubtaskDisplay.textContent = currentSub.name;
                // サブタスクが完了している場合は「次へ」ボタンを無効化
                if (currentSub.completed) {
                    nextSubtaskBtn.disabled = true;
                } else {
                    nextSubtaskBtn.disabled = false;
                }
            } else {
                // すべてのサブタスクが完了しているが、タスク自体はまだ完了していない場合
                currentSubtaskDisplay.textContent = 'すべての手順が完了しました！';
                nextSubtaskBtn.disabled = true; // 全て完了したらボタン無効化
            }
        } else {
            currentSubtaskDisplay.textContent = '手順がありません';
            nextSubtaskBtn.disabled = true;
        }
    }

    function completeCurrentSubtask() {
        const task = tasks[currentTaskIndex];
        if (task && task.subtasks && task.subtasks[currentSubtaskIndex]) {
            task.subtasks[currentSubtaskIndex].completed = true;
            playSound(completeSound);
            saveTasks();
            updateProgressBarBasedOnSubtasks(task);

            // 次のサブタスクへ、またはタスクを完了
            currentSubtaskIndex++;
            if (currentSubtaskIndex < task.subtasks.length) {
                renderCurrentSubtask();
            } else {
                // すべてのサブタスクが完了した
                completeCurrentTask(); // タスク全体を完了
            }
        }
    }

    function completeCurrentTask() {
        if (tasks.length === 0) return;

        const completedTask = tasks.splice(currentTaskIndex, 1)[0];
        completedTask.completedAt = new Date().toISOString();
        completedTask.snoozeCount = completedTask.snoozeCount || 0;
        completedTasks.unshift(completedTask);
        saveTasks();
        saveCompletedTasks();

        stopPomodoroTimer();
        pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
        pomodoroActive = false;

        if (tasks.length > 0 && settings.autoStartNextTask) {
            currentTaskIndex = 0;
            currentSubtaskIndex = 0;
            showNextTaskCountdown(tasks[currentTaskIndex].title);
        } else {
            currentTaskIndex = 0;
            currentSubtaskIndex = 0;
            renderCurrentTask();
        }
    }

    function updateProgressBarBasedOnSubtasks(task) {
        if (!task || !task.subtasks || task.subtasks.length === 0) {
            updateProgressBar(0);
            return;
        }
        const completedCount = task.subtasks.filter(sub => sub.completed).length;
        const progress = (completedCount / task.subtasks.length) * 100;
        updateProgressBar(progress);
    }

    function updateProgressBar(progress) {
        const circle = document.querySelector('.task-progress-circle .circle-progress');
        if (!circle) return;
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;

        // 進捗に応じて円の色を設定 (0%の時は空の色、それ以外はprimary)
        if (progress === 0 && tasks.length > 0) {
            circle.style.stroke = var_empty_circle_color;
        } else if (tasks.length > 0) {
            circle.style.stroke = var_primary_color;
        } else {
            circle.style.stroke = var_empty_circle_color; // タスクがない場合
        }
    }

    // --- ポモドーロタイマー関連関数 ---
    function startPomodoroTimer(totalDurationMinutes, bufferMinutes) {
        stopPomodoroTimer(); // 既存のタイマーをクリア

        const task = tasks[currentTaskIndex];
        if (!task || !settings.pomodoroEnabled) {
            pomodoroActive = false;
            return;
        }

        const workDurationSeconds = settings.pomodoroWorkDuration * 60;
        const breakDurationSeconds = settings.pomodoroBreakDuration * 60;
        const estimatedTotalDurationSeconds = (task.duration + (task.bufferTime || 0)) * 60;

        if (!pomodoroActive) {
            if (pomodoroTimeLeft === undefined || pomodoroTimeLeft <= 0) {
                 pomodoroTimeLeft = workDurationSeconds;
                 pomodoroIsWorking = true;
                 pomodoroCurrentSegment = 1;
            }
            pomodoroActive = true;
            playSound(pomodoroWorkStartSound);
            pomodoroStartBtn.innerHTML = '<i class="fas fa-pause"></i> 一時停止';
        } else {
            return;
        }

        renderPomodoroBar(task.duration + (task.bufferTime || 0));

        const updateTimer = () => {
            if (!pomodoroActive) return;

            pomodoroTimeLeft--;

            if (pomodoroTimeLeft < 0) {
                if (pomodoroIsWorking) {
                    pomodoroIsWorking = false;
                    pomodoroTimeLeft = breakDurationSeconds;
                    playSound(pomodoroBreakSound);
                } else {
                    pomodoroCurrentSegment++;
                    const accumulatedTimeSeconds = (pomodoroCurrentSegment - 1) * (workDurationSeconds + breakDurationSeconds);
                    if (accumulatedTimeSeconds + workDurationSeconds <= estimatedTotalDurationSeconds) {
                        pomodoroIsWorking = true;
                        pomodoroTimeLeft = workDurationSeconds;
                        playSound(pomodoroWorkStartSound);
                    } else {
                        stopPomodoroTimer();
                        pomodoroCountdown.textContent = '完了！';
                        pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
                        pomodoroActive = false;
                        return;
                    }
                }
            }
            updatePomodoroDisplay();
            updatePomodoroBarProgress(task.duration + (task.bufferTime || 0));
        };

        pomodoroInterval = setInterval(updateTimer, 1000);
        updatePomodoroDisplay();
        updatePomodoroBarProgress(task.duration + (task.bufferTime || 0));
    }

    function stopPomodoroTimer() {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }

    function updatePomodoroDisplay() {
        const minutes = Math.floor(pomodoroTimeLeft / 60);
        const seconds = pomodoroTimeLeft % 60;
        pomodoroCountdown.textContent = `${pomodoroIsWorking ? '作業中: ' : '休憩中: '}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function renderPomodoroBar(totalEstimatedDurationMinutes) {
        let segmentsContainer = pomodoroTimerBar.querySelector('.timer-segments');
        if (!segmentsContainer) {
            segmentsContainer = document.createElement('div');
            segmentsContainer.classList.add('timer-segments');
            pomodoroTimerBar.prepend(segmentsContainer);
        }
        segmentsContainer.innerHTML = '';

        const totalEstimatedDurationSeconds = totalEstimatedDurationMinutes * 60;
        const workDurationSeconds = settings.pomodoroWorkDuration * 60;
        const breakDurationSeconds = settings.pomodoroBreakDuration * 60;

        let currentPassedSecondsInLoop = 0;

        while (currentPassedSecondsInLoop < totalEstimatedDurationSeconds) {
            if (currentPassedSecondsInLoop < totalEstimatedDurationSeconds) {
                const workSegment = document.createElement('div');
                workSegment.classList.add('timer-segment');
                const duration = Math.min(workDurationSeconds, totalEstimatedDurationSeconds - currentPassedSecondsInLoop);
                workSegment.style.width = `${(duration / totalEstimatedDurationSeconds) * 100}%`;
                workSegment.style.backgroundColor = var_primary_color;
                segmentsContainer.appendChild(workSegment);
                currentPassedSecondsInLoop += duration;
            }

            if (currentPassedSecondsInLoop < totalEstimatedDurationSeconds) {
                const breakSegment = document.createElement('div');
                breakSegment.classList.add('timer-segment', 'break');
                const duration = Math.min(breakDurationSeconds, totalEstimatedDurationSeconds - currentPassedSecondsInLoop);
                breakSegment.style.width = `${(duration / totalEstimatedDurationSeconds) * 100}%`;
                breakSegment.style.backgroundColor = var_accent_color;
                segmentsContainer.appendChild(breakSegment);
                currentPassedSecondsInLoop += duration;
            }
        }

        let progressMarker = pomodoroTimerBar.querySelector('.timer-progress-marker');
        if (!progressMarker) {
            progressMarker = document.createElement('div');
            progressMarker.classList.add('timer-progress-marker');
            pomodoroTimerBar.appendChild(progressMarker);
        }
        progressMarker.style.left = '0%';
        pomodoroTimerBar.style.display = 'flex';
    }

    function updatePomodoroBarProgress(totalEstimatedDurationMinutes) {
        const task = tasks[currentTaskIndex];
        if (!task || !settings.pomodoroEnabled) return;

        const totalEstimatedDurationSeconds = totalEstimatedDurationMinutes * 60;
        const workDurationSeconds = settings.pomodoroWorkDuration * 60;
        const breakDurationSeconds = settings.pomodoroBreakDuration * 60;
        const segmentTotalSeconds = workDurationSeconds + breakDurationSeconds;

        let elapsedInCurrentPomodoroCycle;
        if (pomodoroIsWorking) {
            elapsedInCurrentPomodoroCycle = workDurationSeconds - pomodoroTimeLeft;
        } else {
            elapsedInCurrentPomodoroCycle = workDurationSeconds + (breakDurationSeconds - pomodoroTimeLeft);
        }

        const elapsedTotalSeconds = (pomodoroCurrentSegment - 1) * segmentTotalSeconds + elapsedInCurrentPomodoroCycle;

        const progressPercentage = (elapsedTotalSeconds / totalEstimatedDurationSeconds) * 100;

        const progressMarker = pomodoroTimerBar.querySelector('.timer-progress-marker');
        if (progressMarker) {
            progressMarker.style.left = `${progressPercentage}%`;
        }

        const segments = pomodoroTimerBar.querySelectorAll('.timer-segment');
        let accumulatedDurationForColor = 0;

        segments.forEach(segment => {
            const segmentWidthPercentage = parseFloat(segment.style.width.replace('%', ''));
            const segmentAbsoluteDuration = totalEstimatedDurationSeconds * (segmentWidthPercentage / 100);

            if (elapsedTotalSeconds >= accumulatedDurationForColor + segmentAbsoluteDuration) {
                segment.style.background = segment.classList.contains('break') ? var_accent_color : var_primary_color;
            }
            else if (elapsedTotalSeconds > accumulatedDurationForColor) {
                const progressInSegment = elapsedTotalSeconds - accumulatedDurationForColor;
                const progressPercentageInSegment = (progressInSegment / segmentAbsoluteDuration) * 100;

                const unprogressColor = segment.classList.contains('break') ? var_secondary_color : var_primary_color;
                const progressColor = segment.classList.contains('break') ? var_accent_color : var_primary_color;

                segment.style.background = `linear-gradient(to right, ${progressColor} ${progressPercentageInSegment}%, ${unprogressColor} ${progressPercentageInSegment}%)`;
            }
            else {
                segment.style.background = segment.classList.contains('break') ? var_secondary_color : var_primary_color;
            }
            accumulatedDurationForColor += segmentAbsoluteDuration;
        });
    }

    function nextTask() {
        if (tasks.length === 0) {
            renderCurrentTask();
            return;
        }
        currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
        currentSubtaskIndex = 0;
        renderCurrentTask();
    }

    function showNextTaskCountdown(taskTitle) {
        nextTaskMessage.textContent = `次のタスク: "${taskTitle}" を開始します`;
        let countdown = 5;
        countdownTimerDisplay.textContent = countdown;
        nextTaskCountdownOverlay.classList.add('show');
        playSound(countdownSound);

        nextTaskCountdownInterval = setInterval(() => {
            countdown--;
            countdownTimerDisplay.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(nextTaskCountdownInterval);
                nextTaskCountdownOverlay.classList.remove('show');
                renderCurrentTask();
                if (settings.pomodoroEnabled) {
                    startPomodoroTimer(tasks[currentTaskIndex].duration, tasks[currentTaskIndex].bufferTime || 0);
                    pomodoroStartBtn.innerHTML = '<i class="fas fa-pause"></i> 一時停止';
                }
            }
        }, 1000);
    }

    // --- イベントリスナー ---

    // ナビゲーションボタン
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenId = item.id.replace('nav-', '') + '-screen';
            if (item.id === 'nav-create') {
                showScreen('create-task-screen');
                renderLabelsForCreation();
                newSubtasksList.innerHTML = '';
            } else {
                showScreen(screenId);
            }
            if (screenId === 'snoozed-screen') {
                renderSnoozedTasks();
            }
            if (screenId === 'history-screen') {
                renderHistory();
            }
            if (screenId === 'settings-screen') {
                loadSettingsToForm();
            }
        });
    });

    // タスクがない場合の追加ボタン
    addFirstTaskBtn.addEventListener('click', () => {
        showScreen('create-task-screen');
        renderLabelsForCreation();
        newSubtasksList.innerHTML = '';
    });

    // ポモドーロ開始/一時停止ボタン
    pomodoroStartBtn.addEventListener('click', () => {
        if (tasks.length === 0) return;

        const task = tasks[currentTaskIndex];

        if (pomodoroActive) {
            stopPomodoroTimer();
            pomodoroActive = false;
            pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 再開';
        } else {
            startPomodoroTimer(task.duration, task.bufferTime || 0);
            pomodoroActive = true;
            pomodoroStartBtn.innerHTML = '<i class="fas fa-pause"></i> 一時停止';
        }
    });

    // 次へボタン (サブタスク完了)
    nextSubtaskBtn.addEventListener('click', completeCurrentSubtask);

    // あとでやるボタン
    snoozeTaskBtn.addEventListener('click', () => {
        if (tasks.length === 0) return;

        playSound(snoozeSound);
        const snoozedTask = tasks.splice(currentTaskIndex, 1)[0];
        snoozedTask.snoozeCount = (snoozedTask.snoozeCount || 0) + 1;
        snoozedTasks.push(snoozedTask);
        saveTasks();
        saveSnoozedTasks();
        currentTaskIndex = 0;
        currentSubtaskIndex = 0;
        renderCurrentTask();
    });

    // タスク作成フォームの送信
    createTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('new-task-title').value;
        const priority = document.getElementById('new-task-priority').value;
        const duration = parseInt(document.getElementById('new-task-duration').value);
        const bufferTime = parseInt(document.getElementById('new-task-buffer-time').value) || 0;
        const deadlineDate = document.getElementById('new-task-deadline-date').value;
        const deadlineTime = document.getElementById('new-task-deadline-time').value;

        const selectedLabelElement = labelSelectionArea.querySelector('.label-item.selected');
        let selectedLabel = null;
        if (selectedLabelElement) {
            const labelName = selectedLabelElement.dataset.name;
            const labelIcon = selectedLabelElement.dataset.icon;
            selectedLabel = { name: labelName, icon: labelIcon };
        }

        const newSubtasks = [];
        let subtaskCount = 0;
        newSubtasksList.querySelectorAll('.subtask-input-item input[type="text"]').forEach(input => {
            if (input.value.trim() !== '') {
                newSubtasks.push({ name: input.value.trim(), completed: false });
                subtaskCount++;
            }
        });

        if (subtaskCount === 0) {
            alert('タスクを実行するための手順（サブタスク）を1つ以上入力してください。');
            return;
        }

        let actualDeadline = null;
        if (deadlineDate && deadlineTime) {
            const inputDateTime = new Date(`${deadlineDate}T${deadlineTime}`);
            inputDateTime.setDate(inputDateTime.getDate() - 1); // アプリ内では1日前に締め切りを設定
            actualDeadline = inputDateTime.toISOString();
        }

        const newTask = {
            id: Date.now(),
            title,
            priority,
            duration,
            bufferTime,
            subtasks: newSubtasks,
            label: selectedLabel,
            deadline: actualDeadline,
            snoozeCount: 0
        };

        tasks.push(newTask);
        tasks.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            if (priorityOrder[b.priority] === priorityOrder[a.priority]) {
                return a.id - b.id;
            }
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        saveTasks();
        createTaskForm.reset();
        newSubtasksList.innerHTML = '';
        renderLabelsForCreation();
        showScreen('home-screen');
        currentTaskIndex = 0;
        currentSubtaskIndex = 0;
        renderCurrentTask();
    });

    // サブタスク追加ボタン
    addSubtaskBtn.addEventListener('click', () => {
        const subtaskInputItem = document.createElement('div');
        subtaskInputItem.classList.add('subtask-input-item');
        subtaskInputItem.innerHTML = `
            <input type="text" placeholder="手順を入力" required>
            <button type="button" class="remove-subtask-btn"><i class="fas fa-times"></i></button>
        `;
        subtaskInputItem.querySelector('.remove-subtask-btn').addEventListener('click', () => {
            subtaskInputItem.remove();
        });
        newSubtasksList.appendChild(subtaskInputItem);
    });

    // 新規ラベル追加
    addNewLabelBtn.addEventListener('click', () => {
        const name = newLabelNameInput.value.trim();
        const icon = newLabelIconInput.value.trim();
        if (name && icon) {
            labels.push({ name, icon });
            saveLabels();
            renderLabelsForCreation();
            newLabelNameInput.value = '';
            newLabelIconInput.value = '';
        } else {
            alert('ラベル名とアイコンの両方を入力してください。');
        }
    });

    // ラベル選択UIのレンダリング
    function renderLabelsForCreation() {
        labelSelectionArea.innerHTML = '';
        labels.forEach(label => {
            const labelItem = document.createElement('div');
            labelItem.classList.add('label-item');
            labelItem.dataset.name = label.name;
            labelItem.dataset.icon = label.icon;
            labelItem.innerHTML = `<i class="${label.icon}"></i> ${label.name}`;
            labelItem.addEventListener('click', () => {
                labelSelectionArea.querySelectorAll('.label-item').forEach(item => item.classList.remove('selected'));
                labelItem.classList.add('selected');
            });
            labelSelectionArea.appendChild(labelItem);
        });
    }

    // 後回しタスクリストのレンダリング
    function renderSnoozedTasks() {
        snoozedTaskList.innerHTML = '';
        if (snoozedTasks.length === 0) {
            noSnoozedTasksMessage.style.display = 'block';
        } else {
            noSnoozedTasksMessage.style.display = 'none';
            snoozedTasks.sort((a, b) => b.snoozeCount - a.snoozeCount);

            snoozedTasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="task-info">
                        <span class="task-title">${task.title}</span>
                        ${task.label ? `<span class="task-label-display"><i class="${task.label.icon}"></i> ${task.label.name}</span>` : ''}
                    </div>
                    <div class="task-meta">
                        優先度: ${task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'} |
                        後回し回数: ${task.snoozeCount}回
                        ${task.deadline ? ` | 締め切り: ${new Date(task.deadline).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="resume-task-btn" data-index="${index}">今すぐやる</button>
                    </div>
                `;
                li.querySelector('.resume-task-btn').addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.index);
                    const taskToResume = snoozedTasks.splice(idx, 1)[0];
                    tasks.push(taskToResume);
                    tasks.sort((a, b) => {
                        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                        if (priorityOrder[b.priority] === priorityOrder[a.priority]) {
                            return a.id - b.id;
                        }
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    });
                    saveSnoozedTasks();
                    saveTasks();
                    showScreen('home-screen');
                    currentTaskIndex = tasks.indexOf(taskToResume);
                    currentSubtaskIndex = 0;
                    renderCurrentTask();
                });
                snoozedTaskList.appendChild(li);
            });
        }
    }

    // 履歴タスクリストのレンダリング
    function renderHistory() {
        historyTaskList.innerHTML = '';
        if (completedTasks.length === 0) {
            noHistoryTasksMessage.style.display = 'block';
        } else {
            noHistoryTasksMessage.style.display = 'none';
            completedTasks.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="task-info">
                        <span class="task-title">${task.title}</span>
                        ${task.label ? `<span class="task-label-display"><i class="${task.label.icon}"></i> ${task.label.name}</span>` : ''}
                    </div>
                    <div class="task-meta">
                        完了日時: ${new Date(task.completedAt).toLocaleString('ja-JP')} |
                        後回し回数: ${task.snoozeCount || 0}回
                    </div>
                `;
                historyTaskList.appendChild(li);
            });
        }
    }

    // 設定のロードとフォームへの反映
    function loadSettings() {
        pomodoroEnabledCheckbox.checked = settings.pomodoroEnabled;
        autoStartNextTaskCheckbox.checked = settings.autoStartNextTask;
        motivationalModeEnabledCheckbox.checked = settings.motivationalModeEnabled;
        soundEffectsEnabledCheckbox.checked = settings.soundEffectsEnabled;
        bgmEnabledCheckbox.checked = settings.bgmEnabled;
        pomodoroWorkDurationInput.value = settings.pomodoroWorkDuration;
        pomodoroBreakDurationInput.value = settings.pomodoroBreakDuration;

        toggleBGM(settings.bgmEnabled);
        renderCurrentTask();
    }

    function loadSettingsToForm() {
        pomodoroEnabledCheckbox.checked = settings.pomodoroEnabled;
        autoStartNextTaskCheckbox.checked = settings.autoStartNextTask;
        motivationalModeEnabledCheckbox.checked = settings.motivationalModeEnabled;
        soundEffectsEnabledCheckbox.checked = settings.soundEffectsEnabled;
        bgmEnabledCheckbox.checked = settings.bgmEnabled;
        pomodoroWorkDurationInput.value = settings.pomodoroWorkDuration;
        pomodoroBreakDurationInput.value = settings.pomodoroBreakDuration;
    }

    // 設定の保存
    saveSettingsBtn.addEventListener('click', () => {
        settings.pomodoroEnabled = pomodoroEnabledCheckbox.checked;
        settings.autoStartNextTask = autoStartNextTaskCheckbox.checked;
        settings.motivationalModeEnabled = motivationalModeEnabledCheckbox.checked;
        settings.soundEffectsEnabled = soundEffectsEnabledCheckbox.checked;
        settings.bgmEnabled = bgmEnabledCheckbox.checked;
        settings.pomodoroWorkDuration = parseInt(pomodoroWorkDurationInput.value);
        settings.pomodoroBreakDuration = parseInt(pomodoroBreakDurationInput.value);
        saveSettings();
        alert('設定が保存されました！');
    });

    // --- アプリケーションの初期化 ---
    // 既存のタスクが優先度順になるようにソート
    tasks.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        if (priorityOrder[b.priority] === priorityOrder[a.priority]) {
            return a.id - b.id;
        }
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    saveTasks(); // ソート結果を保存

    // 設定をロードし、ホーム画面を初期表示
    loadSettings();
    renderCurrentTask(); // タスクの有無に応じたホーム画面の初期表示
    showScreen('home-screen'); // 必ずホーム画面から開始
});