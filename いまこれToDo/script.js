document.addEventListener('DOMContentLoaded', () => {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');

    const homeScreen = document.getElementById('home-screen');
    const createScreen = document.getElementById('create-task-screen');
    const snoozedScreen = document.getElementById('snoozed-screen');
    const historyScreen = document.getElementById('history-screen');
    const settingsScreen = document.getElementById('settings-screen');

    const currentTaskTitle = document.getElementById('current-task-title');
    const currentTaskLabel = document.getElementById('current-task-label');
    const subtaskList = document.getElementById('subtask-list');
    const completeTaskBtn = document.getElementById('complete-task-btn');
    const snoozeTaskBtn = document.getElementById('snooze-task-btn');
    const pomodoroTimerBar = document.getElementById('pomodoro-timer-bar');
    const pomodoroCountdown = document.getElementById('pomodoro-countdown');
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
    let pomodoroInterval;
    let pomodoroTimeLeft;
    let pomodoroIsWorking = true; // true: 作業時間, false: 休憩時間
    let pomodoroCurrentSegment = 0; // 現在のポモドーロセグメント（1, 2, 3...）
    let nextTaskCountdownInterval;

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
            soundElement.play();
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
            document.getElementById('nav-add').classList.add('active');
        }

        // 画面切り替え時にタイマーを停止 (ホーム画面以外)
        if (screenId !== 'home-screen') {
            stopPomodoroTimer();
            pomodoroTimerBar.style.width = '0%';
            pomodoroCountdown.textContent = '';
        }
    }

    function renderCurrentTask() {
        if (tasks.length === 0) {
            currentTaskTitle.textContent = 'タスクがありません';
            currentTaskLabel.textContent = '';
            subtaskList.innerHTML = '';
            updateProgressBar(0);
            pomodoroTimerBar.innerHTML = '';
            pomodoroCountdown.textContent = '';
            stopPomodoroTimer();
            completeTaskBtn.disabled = true;
            snoozeTaskBtn.disabled = true;
            return;
        }

        completeTaskBtn.disabled = false;
        snoozeTaskBtn.disabled = false;

        const task = tasks[currentTaskIndex];
        currentTaskTitle.textContent = task.title;
        currentTaskLabel.innerHTML = task.label ? `<i class="${task.label.icon}"></i> ${task.label.name}` : '';

        renderSubtasks(task.subtasks);
        updateProgressBarBasedOnSubtasks(task);
        if (settings.pomodoroEnabled) {
            startPomodoroTimer(task.duration, task.bufferTime || 0);
        } else {
            stopPomodoroTimer();
            pomodoroTimerBar.innerHTML = ''; // バーを非表示
            pomodoroCountdown.textContent = ''; // カウントダウンを非表示
        }

        if (settings.motivationalModeEnabled) {
            // ここに応援メッセージやBGM再生のロジックを追加
            // 現状BGMは設定でON/OFFだが、やる気スイッチモードと連動させる場合はここで行う
            console.log("やる気スイッチモード: 頑張って！");
        }
    }

    function renderSubtasks(subtasks) {
        subtaskList.innerHTML = '';
        if (subtasks && subtasks.length > 0) {
            subtasks.forEach((sub, index) => {
                const li = document.createElement('li');
                li.classList.add('subtask-item');
                if (sub.completed) {
                    li.classList.add('completed');
                }
                li.innerHTML = `
                    <input type="checkbox" id="subtask-${index}" ${sub.completed ? 'checked' : ''}>
                    <label for="subtask-${index}">${sub.name}</label>
                `;
                li.querySelector('input').addEventListener('change', () => toggleSubtaskCompletion(index));
                subtaskList.appendChild(li);
            });
        } else {
            subtaskList.innerHTML = '<p class="empty-message">手順はありません</p>';
        }
    }

    function toggleSubtaskCompletion(subtaskIndex) {
        const task = tasks[currentTaskIndex];
        if (task && task.subtasks) {
            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
            saveTasks();
            renderSubtasks(task.subtasks);
            updateProgressBarBasedOnSubtasks(task);
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
        const circle = document.querySelector('.circle-progress');
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }

    function startPomodoroTimer(totalDurationMinutes, bufferMinutes) {
        stopPomodoroTimer(); // 既存のタイマーをクリア

        pomodoroTimeLeft = (settings.pomodoroWorkDuration + settings.pomodoroBreakDuration) * 60; // 最初のセグメントの合計時間
        pomodoroIsWorking = true; // 最初は作業から開始
        pomodoroCurrentSegment = 1;

        renderPomodoroBar(totalDurationMinutes + bufferMinutes);

        const updateTimer = () => {
            const currentTask = tasks[currentTaskIndex];
            if (!currentTask) {
                stopPomodoroTimer();
                return;
            }

            const totalDurationSeconds = (settings.pomodoroWorkDuration + settings.pomodoroBreakDuration) * 60;

            if (pomodoroIsWorking) {
                if (pomodoroTimeLeft <= settings.pomodoroBreakDuration * 60) {
                    // 作業時間の終わりに近づいたら休憩モードへ移行
                    pomodoroIsWorking = false;
                    pomodoroBreakSound.play(); // 休憩開始音
                    console.log("休憩時間開始！");
                }
            }

            pomodoroTimeLeft--;

            if (pomodoroTimeLeft < 0) {
                pomodoroCurrentSegment++;
                const estimatedTotalDurationSeconds = (currentTask.duration + currentTask.bufferTime) * 60;

                // 次のポモドーロセグメントに進むか、タスク終了
                if ((pomodoroCurrentSegment * totalDurationSeconds) <= estimatedTotalDurationSeconds) {
                    pomodoroTimeLeft = totalDurationSeconds; // 次のセグメントの時間をリセット
                    pomodoroIsWorking = true; // 次の作業時間開始
                } else {
                    stopPomodoroTimer();
                    pomodoroCountdown.textContent = '完了！';
                    // 必要であれば自動完了処理などをトリガー
                    return;
                }
            }

            updatePomodoroDisplay();
            updatePomodoroBarProgress(currentTask.duration + currentTask.bufferTime);
        };

        pomodoroInterval = setInterval(updateTimer, 1000);
        updatePomodoroDisplay(); // 初回表示
        updatePomodoroBarProgress(totalDurationMinutes + bufferMinutes); // 初回バー表示
    }

    function stopPomodoroTimer() {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        pomodoroTimerBar.innerHTML = ''; // バーをリセット
        pomodoroCountdown.textContent = '';
    }

    function updatePomodoroDisplay() {
        const minutes = Math.floor(pomodoroTimeLeft / 60);
        const seconds = pomodoroTimeLeft % 60;
        pomodoroCountdown.textContent = `${pomodoroIsWorking ? '作業中: ' : '休憩中: '}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function renderPomodoroBar(totalEstimatedDurationMinutes) {
        const segmentsContainer = pomodoroTimerBar.querySelector('.timer-segments');
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
                segmentsContainer.appendChild(workSegment);
                currentPassedSeconds += duration;
            }

            // Break segment
            if (currentPassedSeconds < totalEstimatedDurationSeconds) {
                const breakSegment = document.createElement('div');
                breakSegment.classList.add('timer-segment', 'break');
                const duration = Math.min(breakDurationSeconds, totalEstimatedDurationSeconds - currentPassedSeconds);
                breakSegment.style.width = `${(duration / totalEstimatedDurationSeconds) * 100}%`;
                segmentsContainer.appendChild(breakSegment);
                currentPassedSeconds += duration;
            }
        }

        // Add tomato icons
        const totalSegments = Math.ceil(totalEstimatedDurationSeconds / segmentTotalSeconds);
        for (let i = 0; i < totalSegments; i++) {
            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-tomato', 'tomato-icon');
            const position = ((i * segmentTotalSeconds + workDurationSeconds / 2) / totalEstimatedDurationSeconds) * 100;
            if (position < 100) { // Make sure icon is within the bar
                icon.style.left = `${position}%`;
                segmentsContainer.appendChild(icon);
            }
        }
    }

    function updatePomodoroBarProgress(totalEstimatedDurationMinutes) {
        const currentTask = tasks[currentTaskIndex];
        if (!currentTask) return;

        const totalEstimatedDurationSeconds = totalEstimatedDurationMinutes * 60;
        const workDurationSeconds = settings.pomodoroWorkDuration * 60;
        const breakDurationSeconds = settings.pomodoroBreakDuration * 60;
        const segmentTotalSeconds = workDurationSeconds + breakDurationSeconds;

        // 現在のポモドーロセグメントの開始からの経過時間
        const elapsedInCurrentSegment = segmentTotalSeconds - pomodoroTimeLeft;
        const elapsedTotalSeconds = (pomodoroCurrentSegment - 1) * segmentTotalSeconds + elapsedInCurrentSegment;

        const segments = pomodoroTimerBar.querySelectorAll('.timer-segment');

        let currentProgressWidth = 0;
        let accumulatedDuration = 0;

        segments.forEach((segment, index) => {
            const segmentDurationRatio = parseFloat(segment.style.width) / 100; // Get the ratio of total duration
            const segmentAbsoluteDuration = totalEstimatedDurationSeconds * segmentDurationRatio;

            if (elapsedTotalSeconds > accumulatedDuration + segmentAbsoluteDuration) {
                // Segment is fully completed
                segment.style.backgroundColor = (index % 2 === 0) ? var_primary_color : var_accent_color; // Ensure correct color for completed
                currentProgressWidth += segmentAbsoluteDuration;
            } else if (elapsedTotalSeconds > accumulatedDuration) {
                // Segment is partially completed
                const progressInSegment = elapsedTotalSeconds - accumulatedDuration;
                segment.style.background = `linear-gradient(to right, ${segment.classList.contains('break') ? var_accent_color : var_primary_color} ${progressInSegment / segmentAbsoluteDuration * 100}%, ${segment.classList.contains('break') ? '#ffdddd' : '#ddffee'} ${progressInSegment / segmentAbsoluteDuration * 100}%)`;
                currentProgressWidth += progressInSegment;
            } else {
                // Segment is not yet started
                segment.style.background = ''; // Reset background to original if not started
            }
            accumulatedDuration += segmentAbsoluteDuration;
        });

        const progressBarWidth = (elapsedTotalSeconds / totalEstimatedDurationSeconds) * 100;
        // This is where you'd update an overall progress bar if you had one,
        // but since we're updating segments individually, this part might be redundant.
        // For the time being, let's ensure the countdown is visible and accurate.
    }


    function nextTask() {
        if (tasks.length === 0) {
            renderCurrentTask();
            return;
        }
        currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
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
                nextTask();
            }
        }, 1000);
    }

    // イベントリスナー
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenId = item.id.replace('nav-', '') + '-screen';
            if (screenId === 'create-task-screen') { // 'add' button special case
                showScreen(screenId);
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

    completeTaskBtn.addEventListener('click', () => {
        if (tasks.length === 0) return;

        playSound(completeSound);
        const completedTask = tasks.splice(currentTaskIndex, 1)[0];
        completedTask.completedAt = new Date().toISOString();
        // 後回し回数を履歴に記録
        completedTask.snoozeCount = completedTask.snoozeCount || 0;
        completedTasks.unshift(completedTask); // 新しいものから表示
        saveTasks();
        saveCompletedTasks();

        if (tasks.length > 0 && settings.autoStartNextTask) {
            showNextTaskCountdown(tasks[currentTaskIndex].title);
        } else {
            nextTask(); // 次のタスクを即座に表示、または「タスクなし」を表示
        }
    });

    snoozeTaskBtn.addEventListener('click', () => {
        if (tasks.length === 0) return;

        playSound(snoozeSound);
        const snoozedTask = tasks.splice(currentTaskIndex, 1)[0];
        snoozedTask.snoozeCount = (snoozedTask.snoozeCount || 0) + 1;
        snoozedTasks.push(snoozedTask); // 後回しリストに追加
        saveTasks();
        saveSnoozedTasks();
        nextTask();
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
        newSubtasksList.querySelectorAll('.subtask-input-item input[type="text"]').forEach(input => {
            if (input.value.trim() !== '') {
                newSubtasks.push({ name: input.value.trim(), completed: false });
            }
        });

        if (newSubtasks.length === 0) {
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
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        saveTasks();
        createTaskForm.reset();
        newSubtasksList.innerHTML = ''; // サブタスク入力をクリア
        renderLabelsForCreation(); // ラベル選択をリセット
        showScreen('home-screen');
        renderCurrentTask(); // 新しいタスクリストを反映
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
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    });
                    saveSnoozedTasks();
                    saveTasks();
                    showScreen('home-screen');
                    renderCurrentTask(); // ホーム画面でタスクを更新
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
    renderCurrentTask();
    showScreen('home-screen');
});