document.addEventListener('DOMContentLoaded', () => {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');

    const homeScreen = document.getElementById('home-screen');
    const createTaskScreen = document.getElementById('create-task-screen'); // IDを明確に
    const snoozedScreen = document.getElementById('snoozed-screen');
    const historyScreen = document.getElementById('history-screen');
    const settingsScreen = document.getElementById('settings-screen');

    const taskCircleContainer = document.querySelector('.task-circle-container');
    const circleProgress = document.querySelector('.task-progress-circle .circle-progress');
    const currentTaskTitle = document.getElementById('current-task-title');
    const currentTaskLabel = document.getElementById('current-task-label');
    const currentSubtaskDisplay = document.getElementById('current-subtask-display'); // サブタスク個別表示用
    const hasTaskContent = document.getElementById('has-task-content'); // タスクがある場合の表示エリア
    const addFirstTaskBtn = document.getElementById('add-first-task-btn'); // タスクがない場合のボタン

    const pomodoroTimerBar = document.getElementById('pomodoro-timer-bar');
    const pomodoroCountdown = document.getElementById('pomodoro-countdown');
    const pomodoroStartBtn = document.getElementById('pomodoro-start-btn'); // 新設
    const nextSubtaskBtn = document.getElementById('next-subtask-btn'); // 新設
    const snoozeTaskBtn = document.getElementById('snooze-task-btn'); // 残存

    const nextTaskCountdownOverlay = document.getElementById('next-task-countdown-overlay');
    const nextTaskMessage = document.getElementById('next-task-message');
    const countdownTimerDisplay = document.getElementById('countdown-timer');

    const createTaskForm = document.getElementById('create-task-form');
    const newSubtasksList = document.getElementById('new-subtasks-list');
    const addSubtaskBtn = document.getElementById('add-subtask-btn');
    const labelSelectionArea = document.getElementById('label-selection-area');
    const newLabelNameInput = document.getElementById('new-label-name');
    const newLabelIconInput = document.getElementById('new-label-icon');
    const addNewLabelBtn = document.getElementById('add-new-label-btn');

    const snoozedTaskList = document.getElementById('snoozed-task-list');
    const noSnoozedTasksMessage = document.getElementById('no-snoozed-tasks');
    const historyTaskList = document.getElementById('history-task-list');
    const noHistoryTasksMessage = document.getElementById('no-history-tasks');

    const pomodoroEnabledCheckbox = document.getElementById('pomodoro-enabled');
    const autoStartNextTaskCheckbox = document.getElementById('auto-start-next-task');
    const motivationalModeEnabledCheckbox = document.getElementById('motivational-mode-enabled');
    const soundEffectsEnabledCheckbox = document.getElementById('sound-effects-enabled');
    const bgmEnabledCheckbox = document.getElementById('bgm-enabled');
    const pomodoroWorkDurationInput = document.getElementById('pomodoro-work-duration');
    const pomodoroBreakDurationInput = document.getElementById('pomodoro-break-duration');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    const completeSound = document.getElementById('complete-sound');
    const snoozeSound = document.getElementById('snooze-sound');
    const countdownSound = document.getElementById('countdown-sound');
    const pomodoroBreakSound = document.getElementById('pomodoro-break-sound');
    const pomodoroWorkStartSound = document.getElementById('pomodoro-work-start-sound'); // 新設
    const bgm = document.getElementById('bgm');

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

    let currentTaskIndex = 0;
    let currentSubtaskIndex = 0; // 現在表示中のサブタスクのインデックス
    let pomodoroInterval;
    let pomodoroTimeLeft; // 現在のポモドーロセグメントの残り時間（秒）
    let pomodoroIsWorking = true; // true: 作業時間, false: 休憩時間
    let pomodoroActive = false; // ポモドーロタイマーが現在動いているか
    let nextTaskCountdownInterval;

    // CSSのroot変数から色を取得するためのヘルパー関数
    function getCssVariable(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    const var_primary_color = getCssVariable('--primary-color');
    const var_accent_color = getCssVariable('--accent-color');
    const var_empty_circle_color = getCssVariable('--empty-circle-color');


    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function saveCompletedTasks() {
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }

    function saveSnoozedTasks() {
        localStorage.setItem('snoozedTasks', JSON.stringify(snoozedTasks));
    }

    function saveLabels() {
        localStorage.setItem('labels', JSON.stringify(labels));
    }

    function saveSettings() {
        localStorage.setItem('settings', JSON.stringify(settings));
        loadSettings(); // 設定を即座に反映
    }

    function playSound(soundElement) {
        if (settings.soundEffectsEnabled) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => console.warn("サウンド再生失敗:", e)); // エラー回避
        }
    }

    function toggleBGM(enable) {
        if (enable) {
            bgm.volume = 0.3; // BGM音量調整
            bgm.play().catch(e => console.error("BGM再生失敗:", e));
        } else {
            bgm.pause();
            bgm.currentTime = 0;
        }
    }

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
            // 'nav-create' をアクティブにする
            document.getElementById('nav-create').classList.add('active');
        }

        // 画面切り替え時にポモドーロタイマーを停止 (ホーム画面以外)
        if (screenId !== 'home-screen') {
            stopPomodoroTimer();
            pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
            pomodoroTimerBar.innerHTML = ''; // バーをクリア
            pomodoroCountdown.textContent = ''; // カウントダウンをクリア
            pomodoroActive = false; // タイマー非アクティブに
        } else {
            // ホーム画面に戻った際にタスク表示を更新
            renderCurrentTask();
        }
    }

    function renderCurrentTask() {
        // タスクがない場合の表示
        if (tasks.length === 0) {
            taskCircleContainer.classList.remove('has-task');
            circleProgress.style.stroke = var_empty_circle_color; // 円を空の色にする
            updateProgressBar(0); // 進捗バーを0に

            hasTaskContent.style.display = 'none';
            addFirstTaskBtn.style.display = 'flex'; // ボタンを表示
            snoozeTaskBtn.disabled = true;
            pomodoroStartBtn.disabled = true;
            nextSubtaskBtn.disabled = true;

            currentTaskTitle.textContent = 'タスクがありません';
            currentTaskLabel.textContent = '';
            currentSubtaskDisplay.textContent = '';

            stopPomodoroTimer(); // タイマーを停止
            pomodoroTimerBar.innerHTML = '';
            pomodoroCountdown.textContent = '';
            pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
            pomodoroActive = false;
            return;
        }

        // タスクがある場合の表示
        taskCircleContainer.classList.add('has-task'); // 円の色を付けるクラス
        snoozeTaskBtn.disabled = false;
        pomodoroStartBtn.disabled = false;
        nextSubtaskBtn.disabled = false;
        hasTaskContent.style.display = 'block';
        addFirstTaskBtn.style.display = 'none'; // ボタンを非表示

        const task = tasks[currentTaskIndex];
        currentTaskTitle.textContent = task.title;
        currentTaskLabel.innerHTML = task.label ? `<span class="task-label-display"><i class="${task.label.icon}"></i> ${task.label.name}</span>` : '';

        // サブタスクの表示と進捗
        renderCurrentSubtask();
        updateProgressBarBasedOnSubtasks(task);

        // ポモドーロタイマーの初期化（既に動いている場合は何もしない）
        if (!pomodoroActive && settings.pomodoroEnabled) {
            // タイマーが止まっている場合のみ初期化し、開始ボタンを有効に
            pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
            stopPomodoroTimer(); //念のため停止
            renderPomodoroBar(task.duration + (task.bufferTime || 0)); // バーを描画
            pomodoroCountdown.textContent = '00:00'; //初期表示
        } else if (!settings.pomodoroEnabled) {
             stopPomodoroTimer(); // ポモドーロが無効なら停止
             pomodoroStartBtn.disabled = true; // 開始ボタンを無効に
             pomodoroTimerBar.innerHTML = ''; // バーを非表示
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
                currentSubtaskDisplay.textContent = 'すべての手順が完了しました！';
                nextSubtaskBtn.disabled = true; // 全て完了したらボタン無効化
            }
        } else {
            currentSubtaskDisplay.textContent = '手順がありません';
            nextSubtaskBtn.disabled = true;
        }
    }

    // サブタスク完了時の処理
    function completeCurrentSubtask() {
        const task = tasks[currentTaskIndex];
        if (task && task.subtasks && task.subtasks[currentSubtaskIndex]) {
            task.subtasks[currentSubtaskIndex].completed = true;
            playSound(completeSound);
            saveTasks();
            updateProgressBarBasedOnSubtasks(task);

            // すべてのサブタスクが完了したかチェック
            const allSubtasksCompleted = task.subtasks.every(sub => sub.completed);
            if (allSubtasksCompleted) {
                completeCurrentTask();
            } else {
                // 次のサブタスクへ
                currentSubtaskIndex++;
                if (currentSubtaskIndex < task.subtasks.length) {
                    renderCurrentSubtask();
                } else {
                    // 全てのサブタスクが完了したが、まだタスク自体は完了していない場合（本来はallSubtasksCompletedで処理されるはず）
                    currentSubtaskDisplay.textContent = '全てのサブタスクが完了しました。';
                    nextSubtaskBtn.disabled = true;
                }
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

        stopPomodoroTimer(); // ポモドーロタイマーを停止
        pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始'; // ボタンを再生状態に戻す
        pomodoroActive = false; // タイマー非アクティブに

        // 次のタスクがあれば自動開始、なければホーム画面更新
        if (tasks.length > 0 && settings.autoStartNextTask) {
            currentTaskIndex = 0; // 新しいタスクリストの先頭へ
            currentSubtaskIndex = 0; // サブタスクも初期化
            showNextTaskCountdown(tasks[currentTaskIndex].title);
        } else {
            // タスクが全て完了したか、自動開始がオフの場合
            currentTaskIndex = 0; // 次のタスクがない場合はインデックスをリセット
            currentSubtaskIndex = 0; // サブタスクインデックスもリセット
            renderCurrentTask(); // ホーム画面を更新（「タスクがありません」など）
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

        // タイマーが停止している状態からの開始
        if (!pomodoroActive) {
            pomodoroTimeLeft = workDurationSeconds; // 作業時間から開始
            pomodoroIsWorking = true;
            pomodoroCurrentSegment = 1;
            pomodoroActive = true;
            playSound(pomodoroWorkStartSound); // 作業開始音
            pomodoroStartBtn.innerHTML = '<i class="fas fa-pause"></i> 一時停止';
        } else {
            // 既に動いている場合は何もしないか、一時停止ロジックをここに
            return;
        }

        renderPomodoroBar(task.duration + (task.bufferTime || 0)); // バーをレンダリング

        const updateTimer = () => {
            if (!pomodoroActive) return; // タイマーが非アクティブなら更新しない

            pomodoroTimeLeft--;

            if (pomodoroTimeLeft < 0) {
                if (pomodoroIsWorking) {
                    // 作業時間終了 -> 休憩時間開始
                    pomodoroIsWorking = false;
                    pomodoroTimeLeft = breakDurationSeconds;
                    playSound(pomodoroBreakSound); // 休憩開始音
                    console.log("休憩時間開始！");
                } else {
                    // 休憩時間終了 -> 次のポモドーロセグメント、またはタスク終了
                    pomodoroCurrentSegment++;
                    const accumulatedTimeSeconds = (pomodoroCurrentSegment - 1) * (workDurationSeconds + breakDurationSeconds);
                    if (accumulatedTimeSeconds + workDurationSeconds <= estimatedTotalDurationSeconds) {
                        // 次の作業時間開始
                        pomodoroIsWorking = true;
                        pomodoroTimeLeft = workDurationSeconds;
                        playSound(pomodoroWorkStartSound); // 作業開始音
                        console.log(`ポモドーロ ${pomodoroCurrentSegment} 開始！`);
                    } else {
                        // 予定時間を超えた、または最後の休憩が終了した場合
                        stopPomodoroTimer();
                        pomodoroCountdown.textContent = '完了！';
                        console.log("タスクの予定時間終了！");
                        // ここでタイマーを停止状態に戻し、ボタンを再生に戻す
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
        updatePomodoroDisplay(); // 初回表示
        updatePomodoroBarProgress(task.duration + (task.bufferTime || 0)); // 初回バー表示
    }


    function stopPomodoroTimer() {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        // pomodoroTimerBar.innerHTML = ''; // バーをクリア
        // pomodoroCountdown.textContent = ''; // カウントダウンをクリア
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
            pomodoroTimerBar.prepend(segmentsContainer); // バーの内部の先頭に追加
        }
        segmentsContainer.innerHTML = ''; // Clear existing segments

        const totalEstimatedDurationSeconds = totalEstimatedDurationMinutes * 60;
        const workDurationSeconds = settings.pomodoroWorkDuration * 60;
        const breakDurationSeconds = settings.pomodoroBreakDuration * 60;
        const segmentTotalSeconds = workDurationSeconds + breakDurationSeconds;

        let currentPassedSeconds = 0;

        while (currentPassedSeconds < totalEstimatedDurationSeconds) {
            // Work segment
            if (currentPassedSeconds < totalEstimatedDurationSeconds) {
                const workSegment = document.createElement('div');
                workSegment.classList.add('timer-segment');
                const duration = Math.min(workDurationSeconds, totalEstimatedDurationSeconds - currentPassedSeconds);
                workSegment.style.width = `${(duration / totalEstimatedDurationSeconds) * 100}%`;
                workSegment.style.backgroundColor = var_primary_color; // 初期色を設定
                segmentsContainer.appendChild(workSegment);
                currentPassedSeconds += duration;
            }

            // Break segment
            if (currentPassedSeconds < totalEstimatedDurationSeconds) {
                const breakSegment = document.createElement('div');
                breakSegment.classList.add('timer-segment', 'break');
                const duration = Math.min(breakDurationSeconds, totalEstimatedDurationSeconds - currentPassedSeconds);
                breakSegment.style.width = `${(duration / totalEstimatedDurationSeconds) * 100}%`;
                breakSegment.style.backgroundColor = var_accent_color; // 初期色を設定
                segmentsContainer.appendChild(breakSegment);
                currentPassedSeconds += duration;
            }
        }

        // プログレスマーカーを追加（既存なら移動、なければ作成）
        let progressMarker = pomodoroTimerBar.querySelector('.timer-progress-marker');
        if (!progressMarker) {
            progressMarker = document.createElement('div');
            progressMarker.classList.add('timer-progress-marker');
            pomodoroTimerBar.appendChild(progressMarker);
        }
        progressMarker.style.left = '0%'; // 初期位置をリセット
        pomodoroTimerBar.style.display = 'flex'; // バーを表示
    }

    function updatePomodoroBarProgress(totalEstimatedDurationMinutes) {
        const task = tasks[currentTaskIndex];
        if (!task || !settings.pomodoroEnabled) return;

        const totalEstimatedDurationSeconds = totalEstimatedDurationMinutes * 60;
        const workDurationSeconds = settings.pomodoroWorkDuration * 60;
        const breakDurationSeconds = settings.pomodoroBreakDuration * 60;
        const segmentTotalSeconds = workDurationSeconds + breakDurationSeconds;

        let elapsedInCurrentSegment;
        if (pomodoroIsWorking) {
            elapsedInCurrentSegment = workDurationSeconds - pomodoroTimeLeft;
        } else {
            elapsedInCurrentSegment = workDurationSeconds + (breakDurationSeconds - pomodoroTimeLeft);
        }

        const elapsedTotalSeconds = (pomodoroCurrentSegment - 1) * segmentTotalSeconds + elapsedInCurrentSegment;

        const progressPercentage = (elapsedTotalSeconds / totalEstimatedDurationSeconds) * 100;

        const progressMarker = pomodoroTimerBar.querySelector('.timer-progress-marker');
        if (progressMarker) {
            progressMarker.style.left = `${progressPercentage}%`;
        }

        const segments = pomodoroTimerBar.querySelectorAll('.timer-segment');
        let accumulatedDurationForColor = 0;

        segments.forEach(segment => {
            const segmentDurationRatio = parseFloat(segment.style.width) / 100;
            const segmentAbsoluteDuration = totalEstimatedDurationSeconds * segmentDurationRatio;

            if (elapsedTotalSeconds >= accumulatedDurationForColor + segmentAbsoluteDuration) {
                // Segment is fully completed
                segment.style.backgroundColor = segment.classList.contains('break') ? var_accent_color : var_primary_color;
            } else if (elapsedTotalSeconds > accumulatedDurationForColor) {
                // Segment is partially completed
                const progressInSegment = elapsedTotalSeconds - accumulatedDurationForColor;
                const progressPercentageInSegment = (progressInSegment / segmentAbsoluteDuration) * 100;

                const unprogressColor = segment.classList.contains('break') ? '#ffdddd' : '#ddffee';
                const progressColor = segment.classList.contains('break') ? var_accent_color : var_primary_color;

                segment.style.background = `linear-gradient(to right, ${progressColor} ${progressPercentageInSegment}%, ${unprogressColor} ${progressPercentageInSegment}%)`;
            } else {
                // Segment is not yet started (reset to original background or lighter color)
                segment.style.background = segment.classList.contains('break') ? '#ffdddd' : '#ddffee';
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
        currentSubtaskIndex = 0; // 次のタスクに移る際はサブタスクインデックスをリセット
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
                renderCurrentTask(); // 次のタスクをレンダリング
                // もしポモドーロが有効なら自動開始
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
                newSubtasksList.innerHTML = ''; // サブタスク入力を初期化
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
        newSubtasksList.innerHTML = ''; // サブタスク入力を初期化
    });

    // ポモドーロ開始/一時停止ボタン
    pomodoroStartBtn.addEventListener('click', () => {
        if (tasks.length === 0) return; // タスクがない場合は何もしない

        const task = tasks[currentTaskIndex];

        if (pomodoroActive) {
            // タイマーが動いている場合 -> 一時停止
            stopPomodoroTimer();
            pomodoroActive = false;
            pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 再開';
        } else {
            // タイマーが停止している場合 -> 開始
            startPomodoroTimer(task.duration, task.bufferTime || 0);
            pomodoroActive = true;
            pomodoroStartBtn.innerHTML = '<i class="fas fa-pause"></i> 一時停止';
        }
    });

    // 次へボタン (サブタスク完了)
    nextSubtaskBtn.addEventListener('click', completeCurrentSubtask);


    snoozeTaskBtn.addEventListener('click', () => {
        if (tasks.length === 0) return;

        playSound(snoozeSound);
        const snoozedTask = tasks.splice(currentTaskIndex, 1)[0];
        snoozedTask.snoozeCount = (snoozedTask.snoozeCount || 0) + 1;
        snoozedTasks.push(snoozedTask); // 後回しリストに追加
        saveTasks();
        saveSnoozedTasks();
        nextTask(); // 次のタスクへ
    });

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
        let subtaskCount = 0; // サブタスクの数をカウント
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
            // アプリ内では1日前に締め切りを設定
            inputDateTime.setDate(inputDateTime.getDate() - 1);
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
            // 優先度が同じ場合は作成順
            if (priorityOrder[b.priority] === priorityOrder[a.priority]) {
                return a.id - b.id;
            }
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        saveTasks();
        createTaskForm.reset();
        newSubtasksList.innerHTML = ''; // サブタスク入力をクリア
        renderLabelsForCreation(); // ラベル選択をリセット
        showScreen('home-screen');
        // 新しいタスクを追加した場合は、最初のタスクから表示し直す
        currentTaskIndex = 0;
        currentSubtaskIndex = 0;
        renderCurrentTask();
    });

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

    function renderSnoozedTasks() {
        snoozedTaskList.innerHTML = '';
        if (snoozedTasks.length === 0) {
            noSnoozedTasksMessage.style.display = 'block';
        } else {
            noSnoozedTasksMessage.style.display = 'none';
            // 後回し回数が多い順にソート
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
                        // 優先度が同じ場合は作成順
                        if (priorityOrder[b.priority] === priorityOrder[a.priority]) {
                            return a.id - b.id;
                        }
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    });
                    saveSnoozedTasks();
                    saveTasks();
                    showScreen('home-screen');
                    currentTaskIndex = tasks.indexOf(taskToResume); // 再開したタスクを現在のタスクに設定
                    currentSubtaskIndex = 0; // サブタスクインデックスをリセット
                    renderCurrentTask();
                });
                snoozedTaskList.appendChild(li);
            });
        }
    }

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

    function loadSettings() {
        pomodoroEnabledCheckbox.checked = settings.pomodoroEnabled;
        autoStartNextTaskCheckbox.checked = settings.autoStartNextTask;
        motivationalModeEnabledCheckbox.checked = settings.motivationalModeEnabled;
        soundEffectsEnabledCheckbox.checked = settings.soundEffectsEnabled;
        bgmEnabledCheckbox.checked = settings.bgmEnabled;
        pomodoroWorkDurationInput.value = settings.pomodoroWorkDuration;
        pomodoroBreakDurationInput.value = settings.pomodoroBreakDuration;

        toggleBGM(settings.bgmEnabled); // BGM設定を反映
        renderCurrentTask(); // ポモドーロ設定を反映するため再レンダリング
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

    // 初期化
    loadSettings();
    // 最初のタスクを表示
    if (tasks.length > 0) {
        currentTaskIndex = 0;
        currentSubtaskIndex = 0;
        renderCurrentTask();
    } else {
        renderCurrentTask(); // 「タスクがありません」と追加ボタンを表示
    }
    showScreen('home-screen');

    // 既存のタスクが優先度順になるようにソート
    tasks.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        if (priorityOrder[b.priority] === priorityOrder[a.priority]) {
            return a.id - b.id; // 同じ優先度の場合は作成順
        }
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    saveTasks(); // ソート結果を保存
});