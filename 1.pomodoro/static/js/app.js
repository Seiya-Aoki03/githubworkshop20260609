document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'pomodoro.state.v1';
  const DEFAULT_SETTINGS = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    roundsBeforeLongBreak: 4,
  };
  const SETTINGS_LIMITS = {
    workMinutes: { min: 1, max: 180 },
    shortBreakMinutes: { min: 1, max: 60 },
    longBreakMinutes: { min: 1, max: 120 },
    roundsBeforeLongBreak: { min: 1, max: 12 },
  };

  const display = document.getElementById('timerDisplay');
  const progressCircle = document.getElementById('progressCircle');
  const timerHeading = document.getElementById('timer-heading');
  const timerCard = document.querySelector('.timer-card');
  const modeBadge = document.getElementById('modeBadge');
  const sessionBadge = document.getElementById('sessionBadge');
  const subtitle = document.getElementById('timerSubtitle');
  const remainingSummary = document.getElementById('remainingSummary');
  const statusSummary = document.getElementById('statusSummary');
  const phaseDurationSummary = document.getElementById('workSummary');

  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const resumeButton = document.getElementById('resumeButton');
  const resetButton = document.getElementById('resetButton');

  const workMinutesInput = document.getElementById('workMinutesInput');
  const shortBreakMinutesInput = document.getElementById('shortBreakMinutesInput');
  const longBreakMinutesInput = document.getElementById('longBreakMinutesInput');
  const roundsBeforeLongBreakInput = document.getElementById('roundsBeforeLongBreakInput');
  const saveSettingsButton = document.getElementById('saveSettingsButton');
  const settingsStatus = document.getElementById('settingsStatus');
  const xpSummary = document.getElementById('xpSummary');
  const levelSummary = document.getElementById('levelSummary');
  const streakSummary = document.getElementById('streakSummary');
  const badgeList = document.getElementById('badgeList');
  const weeklyCompletionRate = document.getElementById('weeklyCompletionRate');
  const monthlyCompletionRate = document.getElementById('monthlyCompletionRate');
  const weeklyAverageFocus = document.getElementById('weeklyAverageFocus');
  const monthlyAverageFocus = document.getElementById('monthlyAverageFocus');
  const weeklyCompletionBar = document.getElementById('weeklyCompletionBar');
  const monthlyCompletionBar = document.getElementById('monthlyCompletionBar');
  const weeklyAverageFocusBar = document.getElementById('weeklyAverageFocusBar');
  const monthlyAverageFocusBar = document.getElementById('monthlyAverageFocusBar');

  if (!display || !startButton || !stopButton || !resumeButton || !resetButton) {
    return;
  }

  if (
    !timerHeading ||
    !workMinutesInput ||
    !shortBreakMinutesInput ||
    !longBreakMinutesInput ||
    !roundsBeforeLongBreakInput ||
    !saveSettingsButton ||
    !settingsStatus ||
    !xpSummary ||
    !levelSummary ||
    !streakSummary ||
    !badgeList
  ) {
    return;
  }

  let settings = { ...DEFAULT_SETTINGS };
  let mode = 'work';
  let remainingSeconds = settings.workMinutes * 60;
  let intervalId = null;
  let status = 'stopped';
  let completedWorkSessions = 0;
  let gamification = {
    xp: 0,
    streakDays: 0,
    lastCompletionDate: null,
    history: [],
    unlockedBadges: [],
  };

  const XP_PER_WORK_SESSION = 10;
  const LEVEL_XP_STEP = 100;
  const WEEKLY_COMPLETION_GOAL = 10;
  const MONTHLY_COMPLETION_GOAL = 40;
  const MAX_HISTORY_DAYS = 120;
  const progressCircumference = progressCircle ? 2 * Math.PI * Number.parseFloat(progressCircle.getAttribute('r')) : 0;

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const shiftDate = (targetDate, days) => {
    const shifted = new Date(targetDate);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
  };

  const levelForXp = (xp) => {
    return Math.floor(xp / LEVEL_XP_STEP) + 1;
  };

  const findHistoryEntry = (day) => {
    return gamification.history.find((entry) => entry.date === day) || null;
  };

  const completionsInLastDays = (days) => {
    const today = new Date();
    let total = 0;
    for (let offset = 0; offset < days; offset += 1) {
      const day = dateKey(shiftDate(today, -offset));
      const entry = findHistoryEntry(day);
      if (entry) {
        total += entry.completed;
      }
    }
    return total;
  };

  const averageFocusInLastDays = (days) => {
    const today = new Date();
    let totalMinutes = 0;
    let totalCompleted = 0;
    for (let offset = 0; offset < days; offset += 1) {
      const day = dateKey(shiftDate(today, -offset));
      const entry = findHistoryEntry(day);
      if (entry) {
        totalMinutes += entry.focusMinutes;
        totalCompleted += entry.completed;
      }
    }
    if (totalCompleted === 0) {
      return 0;
    }
    return totalMinutes / totalCompleted;
  };

  const unlockBadge = (badge) => {
    if (!gamification.unlockedBadges.includes(badge)) {
      gamification.unlockedBadges.push(badge);
    }
  };

  const evaluateBadges = () => {
    if (gamification.streakDays >= 3) {
      unlockBadge('3日連続ストリーク');
    }
    if (completionsInLastDays(7) >= WEEKLY_COMPLETION_GOAL) {
      unlockBadge('今週10回達成');
    }
  };

  const registerWorkCompletion = () => {
    const today = new Date();
    const todayKey = dateKey(today);
    const yesterdayKey = dateKey(shiftDate(today, -1));
    const lastDate = gamification.lastCompletionDate;

    gamification.xp += XP_PER_WORK_SESSION;

    if (lastDate !== todayKey) {
      if (lastDate === yesterdayKey) {
        gamification.streakDays += 1;
      } else {
        gamification.streakDays = 1;
      }
      gamification.lastCompletionDate = todayKey;
    }

    const todayEntry = findHistoryEntry(todayKey);
    if (todayEntry) {
      todayEntry.completed += 1;
      todayEntry.focusMinutes += settings.workMinutes;
    } else {
      gamification.history.push({
        date: todayKey,
        completed: 1,
        focusMinutes: settings.workMinutes,
      });
      gamification.history.sort((a, b) => a.date.localeCompare(b.date));
      if (gamification.history.length > MAX_HISTORY_DAYS) {
        gamification.history = gamification.history.slice(gamification.history.length - MAX_HISTORY_DAYS);
      }
    }

    evaluateBadges();
  };

  const modeMeta = () => {
    if (mode === 'work') {
      return {
        badge: 'Work',
        heading: 'Work Session',
        subtitle: 'Focus in progress',
        durationSeconds: settings.workMinutes * 60,
      };
    }
    if (mode === 'short_break') {
      return {
        badge: 'Short Break',
        heading: 'Short Break',
        subtitle: 'Take a short recovery',
        durationSeconds: settings.shortBreakMinutes * 60,
      };
    }
    return {
      badge: 'Long Break',
      heading: 'Long Break',
      subtitle: 'Long recovery after focus rounds',
      durationSeconds: settings.longBreakMinutes * 60,
    };
  };

  const statusLabel = () => {
    if (status === 'running') {
      return 'Running';
    }
    if (status === 'paused') {
      return 'Paused';
    }
    return 'Stopped';
  };

  const lerp = (start, end, t) => start + (end - start) * t;

  const progressColor = (remainingRatio) => {
    const elapsedRatio = 1 - remainingRatio;
    let fromHue = 210;
    let toHue = 50;
    let interpolationFactor = elapsedRatio * 2;

    if (elapsedRatio > 0.5) {
      fromHue = 50;
      toHue = 0;
      interpolationFactor = (elapsedRatio - 0.5) * 2;
    }

    const hue = Math.round(lerp(fromHue, toHue, Math.min(Math.max(interpolationFactor, 0), 1)));
    return `hsl(${hue} 86% 54%)`;
  };

  const currentSessionNumber = () => {
    return completedWorkSessions + (mode === 'work' ? 1 : 0);
  };

  const setSettingsMessage = (message, type = 'info') => {
    settingsStatus.textContent = message;
    settingsStatus.classList.remove('settings-message--error', 'settings-message--success');
    if (type === 'error') {
      settingsStatus.classList.add('settings-message--error');
    }
    if (type === 'success') {
      settingsStatus.classList.add('settings-message--success');
    }
  };

  const readSettingsFromInputs = () => {
    const candidate = {
      workMinutes: Number.parseInt(workMinutesInput.value, 10),
      shortBreakMinutes: Number.parseInt(shortBreakMinutesInput.value, 10),
      longBreakMinutes: Number.parseInt(longBreakMinutesInput.value, 10),
      roundsBeforeLongBreak: Number.parseInt(roundsBeforeLongBreakInput.value, 10),
    };

    const keys = Object.keys(SETTINGS_LIMITS);
    for (const key of keys) {
      const value = candidate[key];
      const limit = SETTINGS_LIMITS[key];
      if (!Number.isInteger(value) || value < limit.min || value > limit.max) {
        return {
          ok: false,
          message: `${key} must be between ${limit.min} and ${limit.max}.`,
        };
      }
    }

    return { ok: true, value: candidate };
  };

  const writeSettingsToInputs = () => {
    workMinutesInput.value = String(settings.workMinutes);
    shortBreakMinutesInput.value = String(settings.shortBreakMinutes);
    longBreakMinutesInput.value = String(settings.longBreakMinutes);
    roundsBeforeLongBreakInput.value = String(settings.roundsBeforeLongBreak);
  };

  const secondsForMode = (targetMode) => {
    if (targetMode === 'work') {
      return settings.workMinutes * 60;
    }
    if (targetMode === 'short_break') {
      return settings.shortBreakMinutes * 60;
    }
    return settings.longBreakMinutes * 60;
  };

  const persistState = () => {
    try {
      const payload = {
        settings,
        mode,
        status,
        remainingSeconds,
        completedWorkSessions,
        gamification,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage errors and keep timer functional.
    }
  };

  const moveToNextMode = () => {
    if (mode === 'work') {
      completedWorkSessions += 1;
      registerWorkCompletion();
      if (completedWorkSessions % settings.roundsBeforeLongBreak === 0) {
        mode = 'long_break';
      } else {
        mode = 'short_break';
      }
      remainingSeconds = secondsForMode(mode);
      return;
    }

    mode = 'work';
    remainingSeconds = secondsForMode(mode);
  };

  const applyElapsed = (elapsedSeconds) => {
    let remainingElapsed = elapsedSeconds;
    while (remainingElapsed > 0) {
      if (remainingElapsed >= remainingSeconds) {
        remainingElapsed -= remainingSeconds;
        moveToNextMode();
      } else {
        remainingSeconds -= remainingElapsed;
        remainingElapsed = 0;
      }
    }
  };

  const setMetric = (element, valueText) => {
    if (element) {
      element.textContent = valueText;
    }
  };

  const setBarWidth = (element, percent) => {
    if (element) {
      element.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }
  };

  const renderGamification = () => {
    const level = levelForXp(gamification.xp);
    setMetric(xpSummary, `${gamification.xp} XP`);
    setMetric(levelSummary, `Level ${level}`);
    setMetric(streakSummary, `${gamification.streakDays} days`);

    if (badgeList) {
      const badges = gamification.unlockedBadges;
      if (badges.length === 0) {
        badgeList.innerHTML = '<li>バッジは獲得後にここに表示されます</li>';
      } else {
        badgeList.innerHTML = badges.map((badge) => `<li>${badge}</li>`).join('');
      }
    }

    const weeklyCompletions = completionsInLastDays(7);
    const monthlyCompletions = completionsInLastDays(30);
    const weeklyCompletionPercent = (weeklyCompletions / WEEKLY_COMPLETION_GOAL) * 100;
    const monthlyCompletionPercent = (monthlyCompletions / MONTHLY_COMPLETION_GOAL) * 100;

    const weeklyAvgFocus = averageFocusInLastDays(7);
    const monthlyAvgFocus = averageFocusInLastDays(30);
    const weeklyFocusPercent = (weeklyAvgFocus / SETTINGS_LIMITS.workMinutes.max) * 100;
    const monthlyFocusPercent = (monthlyAvgFocus / SETTINGS_LIMITS.workMinutes.max) * 100;

    setMetric(weeklyCompletionRate, `${Math.round(Math.min(100, weeklyCompletionPercent))}%`);
    setMetric(monthlyCompletionRate, `${Math.round(Math.min(100, monthlyCompletionPercent))}%`);
    setMetric(weeklyAverageFocus, `${Math.round(weeklyAvgFocus)} min`);
    setMetric(monthlyAverageFocus, `${Math.round(monthlyAvgFocus)} min`);

    setBarWidth(weeklyCompletionBar, weeklyCompletionPercent);
    setBarWidth(monthlyCompletionBar, monthlyCompletionPercent);
    setBarWidth(weeklyAverageFocusBar, weeklyFocusPercent);
    setBarWidth(monthlyAverageFocusBar, monthlyFocusPercent);
  };

  const updateView = () => {
    const meta = modeMeta();
    const safeRemainingRatio = Math.min(Math.max(remainingSeconds / meta.durationSeconds, 0), 1);

    display.textContent = formatTime(remainingSeconds);

    timerHeading.textContent = meta.heading;

    if (modeBadge) {
      modeBadge.textContent = meta.badge;
    }
    if (sessionBadge) {
      sessionBadge.textContent = `Session ${currentSessionNumber()}`;
    }
    if (remainingSummary) {
      remainingSummary.textContent = `${Math.ceil(remainingSeconds / 60)} min`;
    }
    if (statusSummary) {
      statusSummary.textContent = statusLabel();
    }
    if (subtitle) {
      if (status === 'running') {
        subtitle.textContent = meta.subtitle;
      } else if (status === 'paused') {
        subtitle.textContent = 'Timer paused';
      } else {
        subtitle.textContent = `Ready: ${meta.badge}`;
      }
    }
    if (phaseDurationSummary) {
      phaseDurationSummary.textContent = `${Math.floor(meta.durationSeconds / 60)} min`;
    }
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = `${progressCircumference * (1 - safeRemainingRatio)}`;
      progressCircle.style.stroke = progressColor(safeRemainingRatio);
    }
    if (timerCard) {
      timerCard.style.setProperty('--progress-color', progressColor(safeRemainingRatio));
      timerCard.classList.toggle('timer-card--focus', mode === 'work' && status === 'running');
    }

    renderGamification();

    startButton.disabled = status !== 'stopped';
    stopButton.disabled = status !== 'running';
    resumeButton.disabled = status !== 'paused';

    persistState();
  };

  const stopInterval = () => {
    if (!intervalId) {
      return;
    }
    window.clearInterval(intervalId);
    intervalId = null;
  };

  const runInterval = () => {
    stopInterval();
    intervalId = window.setInterval(() => {
      if (remainingSeconds > 1) {
        remainingSeconds -= 1;
        updateView();
        return;
      }

      moveToNextMode();
      updateView();
    }, 1000);
  };

  const startTimer = () => {
    if (status !== 'stopped') {
      return;
    }
    status = 'running';
    runInterval();
    updateView();
  };

  const stopTimer = () => {
    if (status !== 'running') {
      return;
    }
    stopInterval();
    status = 'paused';
    updateView();
  };

  const resumeTimer = () => {
    if (status !== 'paused') {
      return;
    }
    status = 'running';
    runInterval();
    updateView();
  };

  const resetTimer = () => {
    stopInterval();
    status = 'stopped';
    mode = 'work';
    remainingSeconds = secondsForMode('work');
    completedWorkSessions = 0;
    updateView();
  };

  const restoreState = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        writeSettingsToInputs();
        setSettingsMessage('Settings are ready.');
        return;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        writeSettingsToInputs();
        setSettingsMessage('Settings are ready.');
        return;
      }

      const restoredSettings = parsed.settings;
      if (restoredSettings && typeof restoredSettings === 'object') {
        const candidate = {
          workMinutes: Number.parseInt(restoredSettings.workMinutes, 10),
          shortBreakMinutes: Number.parseInt(restoredSettings.shortBreakMinutes, 10),
          longBreakMinutes: Number.parseInt(restoredSettings.longBreakMinutes, 10),
          roundsBeforeLongBreak: Number.parseInt(restoredSettings.roundsBeforeLongBreak, 10),
        };
        const valid = Object.keys(SETTINGS_LIMITS).every((key) => {
          const value = candidate[key];
          const limit = SETTINGS_LIMITS[key];
          return Number.isInteger(value) && value >= limit.min && value <= limit.max;
        });
        if (valid) {
          settings = candidate;
        }
      }

      const restoredMode = parsed.mode;
      if (restoredMode === 'work' || restoredMode === 'short_break' || restoredMode === 'long_break') {
        mode = restoredMode;
      }

      const restoredStatus = parsed.status;
      if (restoredStatus === 'running' || restoredStatus === 'paused' || restoredStatus === 'stopped') {
        status = restoredStatus;
      }

      const restoredCompleted = Number.parseInt(parsed.completedWorkSessions, 10);
      if (Number.isInteger(restoredCompleted) && restoredCompleted >= 0) {
        completedWorkSessions = restoredCompleted;
      }

      const restoredGamification = parsed.gamification;
      if (restoredGamification && typeof restoredGamification === 'object') {
        const restoredXp = Number.parseInt(restoredGamification.xp, 10);
        const restoredStreak = Number.parseInt(restoredGamification.streakDays, 10);
        const restoredLastDate =
          typeof restoredGamification.lastCompletionDate === 'string'
            ? restoredGamification.lastCompletionDate
            : null;
        const restoredHistory = Array.isArray(restoredGamification.history)
          ? restoredGamification.history
              .map((entry) => ({
                date: typeof entry.date === 'string' ? entry.date : null,
                completed: Number.parseInt(entry.completed, 10),
                focusMinutes: Number.parseInt(entry.focusMinutes, 10),
              }))
              .filter(
                (entry) =>
                  entry.date &&
                  Number.isInteger(entry.completed) &&
                  entry.completed >= 0 &&
                  Number.isInteger(entry.focusMinutes) &&
                  entry.focusMinutes >= 0
              )
          : [];
        const restoredBadges = Array.isArray(restoredGamification.unlockedBadges)
          ? restoredGamification.unlockedBadges.filter((badge) => typeof badge === 'string')
          : [];

        gamification = {
          xp: Number.isInteger(restoredXp) && restoredXp >= 0 ? restoredXp : 0,
          streakDays: Number.isInteger(restoredStreak) && restoredStreak >= 0 ? restoredStreak : 0,
          lastCompletionDate: restoredLastDate,
          history: restoredHistory.slice(-MAX_HISTORY_DAYS),
          unlockedBadges: restoredBadges,
        };
      }

      evaluateBadges();

      const maxSeconds = secondsForMode(mode);
      const restoredRemaining = Number.parseInt(parsed.remainingSeconds, 10);
      if (Number.isInteger(restoredRemaining) && restoredRemaining >= 1 && restoredRemaining <= maxSeconds) {
        remainingSeconds = restoredRemaining;
      } else {
        remainingSeconds = maxSeconds;
      }

      if (status === 'running') {
        const updatedAt = Number.parseInt(parsed.updatedAt, 10);
        if (Number.isInteger(updatedAt) && updatedAt > 0) {
          const elapsed = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
          if (elapsed > 0) {
            applyElapsed(elapsed);
          }
        }
        runInterval();
      }

      writeSettingsToInputs();
      setSettingsMessage('Restored from previous session.');
    } catch (error) {
      settings = { ...DEFAULT_SETTINGS };
      mode = 'work';
      status = 'stopped';
      remainingSeconds = settings.workMinutes * 60;
      completedWorkSessions = 0;
      gamification = {
        xp: 0,
        streakDays: 0,
        lastCompletionDate: null,
        history: [],
        unlockedBadges: [],
      };
      writeSettingsToInputs();
      setSettingsMessage('Could not restore saved state.', 'error');
    }
  };

  const saveSettings = () => {
    const validation = readSettingsFromInputs();
    if (!validation.ok) {
      setSettingsMessage(validation.message, 'error');
      return;
    }

    settings = validation.value;
    resetTimer();
    setSettingsMessage('Settings saved. Timer reset to Work mode.', 'success');
  };

  startButton.addEventListener('click', startTimer);
  stopButton.addEventListener('click', stopTimer);
  resumeButton.addEventListener('click', resumeTimer);
  resetButton.addEventListener('click', resetTimer);
  saveSettingsButton.addEventListener('click', saveSettings);

  restoreState();
  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${progressCircumference}`;
    progressCircle.style.strokeDashoffset = `${progressCircumference}`;
  }
  updateView();
});
