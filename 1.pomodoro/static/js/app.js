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
    !settingsStatus
  ) {
    return;
  }

  let settings = { ...DEFAULT_SETTINGS };
  let mode = 'work';
  let remainingSeconds = settings.workMinutes * 60;
  let intervalId = null;
  let status = 'stopped';
  let completedWorkSessions = 0;
  const progressCircumference = progressCircle ? 2 * Math.PI * Number.parseFloat(progressCircle.getAttribute('r')) : 0;

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
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
    let localT = elapsedRatio * 2;

    if (elapsedRatio > 0.5) {
      fromHue = 50;
      toHue = 0;
      localT = (elapsedRatio - 0.5) * 2;
    }

    const hue = Math.round(lerp(fromHue, toHue, Math.min(Math.max(localT, 0), 1)));
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
      progressCircle.style.strokeDasharray = `${progressCircumference}`;
      progressCircle.style.strokeDashoffset = `${progressCircumference * (1 - safeRemainingRatio)}`;
      progressCircle.style.stroke = progressColor(safeRemainingRatio);
    }
    if (timerCard) {
      timerCard.style.setProperty('--progress-color', progressColor(safeRemainingRatio));
      timerCard.classList.toggle('timer-card--focus', mode === 'work' && status === 'running');
    }

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
