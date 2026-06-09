document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'pomodoro.state.v2';
  const DEFAULT_SETTINGS = {
    workMinutes: 25,
    breakMinutes: 5,
    themeMode: 'light',
    sounds: {
      start: true,
      end: true,
      tick: true,
    },
  };
  const WORK_MINUTE_OPTIONS = [15, 25, 35, 45];
  const BREAK_MINUTE_OPTIONS = [5, 10, 15];
  const THEME_OPTIONS = ['light', 'dark', 'focus'];
  const SOUND_FREQUENCIES = {
    start: 660,
    end: 440,
    tick: 880,
  };

  const display = document.getElementById('timerDisplay');
  const timerHeading = document.getElementById('timer-heading');
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
  const breakMinutesInput = document.getElementById('breakMinutesInput');
  const themeModeInput = document.getElementById('themeModeInput');
  const startSoundInput = document.getElementById('startSoundInput');
  const endSoundInput = document.getElementById('endSoundInput');
  const tickSoundInput = document.getElementById('tickSoundInput');
  const saveSettingsButton = document.getElementById('saveSettingsButton');
  const settingsStatus = document.getElementById('settingsStatus');

  if (!display || !startButton || !stopButton || !resumeButton || !resetButton) {
    return;
  }

  if (
    !timerHeading ||
    !workMinutesInput ||
    !breakMinutesInput ||
    !themeModeInput ||
    !startSoundInput ||
    !endSoundInput ||
    !tickSoundInput ||
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
  let audioContext = null;

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
        durationSeconds: settings.breakMinutes * 60,
      };
    }
    return {
      badge: 'Long Break',
      heading: 'Long Break',
      subtitle: 'Long recovery after focus rounds',
      durationSeconds: settings.breakMinutes * 60,
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

  const applyTheme = () => {
    document.body.dataset.theme = settings.themeMode;
  };

  const ensureAudioContext = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    if (!audioContext) {
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  };

  const playSound = (soundName) => {
    if (!settings.sounds[soundName]) {
      return;
    }

    const context = ensureAudioContext();
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const targetGain = soundName === 'tick' ? 0.015 : 0.03;

    oscillator.type = soundName === 'tick' ? 'square' : 'sine';
    oscillator.frequency.setValueAtTime(SOUND_FREQUENCIES[soundName], now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(targetGain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
  };

  const readSettingsFromInputs = () => {
    const candidate = {
      workMinutes: Number.parseInt(workMinutesInput.value, 10),
      breakMinutes: Number.parseInt(breakMinutesInput.value, 10),
      themeMode: themeModeInput.value,
      sounds: {
        start: startSoundInput.checked,
        end: endSoundInput.checked,
        tick: tickSoundInput.checked,
      },
    };

    if (!WORK_MINUTE_OPTIONS.includes(candidate.workMinutes)) {
      return {
        ok: false,
        message: `workMinutes must be one of ${WORK_MINUTE_OPTIONS.join(', ')}.`,
      };
    }

    if (!BREAK_MINUTE_OPTIONS.includes(candidate.breakMinutes)) {
      return {
        ok: false,
        message: `breakMinutes must be one of ${BREAK_MINUTE_OPTIONS.join(', ')}.`,
      };
    }

    if (!THEME_OPTIONS.includes(candidate.themeMode)) {
      return {
        ok: false,
        message: `themeMode must be one of ${THEME_OPTIONS.join(', ')}.`,
      };
    }

    return { ok: true, value: candidate };
  };

  const writeSettingsToInputs = () => {
    workMinutesInput.value = String(settings.workMinutes);
    breakMinutesInput.value = String(settings.breakMinutes);
    themeModeInput.value = settings.themeMode;
    startSoundInput.checked = settings.sounds.start;
    endSoundInput.checked = settings.sounds.end;
    tickSoundInput.checked = settings.sounds.tick;
  };

  const secondsForMode = (targetMode) => {
    if (targetMode === 'work') {
      return settings.workMinutes * 60;
    }
    return settings.breakMinutes * 60;
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

    applyTheme();
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
        playSound('tick');
        updateView();
        return;
      }

      playSound('end');
      moveToNextMode();
      updateView();
    }, 1000);
  };

  const startTimer = () => {
    if (status !== 'stopped') {
      return;
    }
    playSound('start');
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
    playSound('start');
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
          breakMinutes: Number.parseInt(
            restoredSettings.breakMinutes ?? restoredSettings.shortBreakMinutes,
            10,
          ),
          themeMode: restoredSettings.themeMode,
          sounds: {
            start: Boolean(restoredSettings.sounds?.start ?? true),
            end: Boolean(restoredSettings.sounds?.end ?? true),
            tick: Boolean(restoredSettings.sounds?.tick ?? true),
          },
        };
        const valid =
          WORK_MINUTE_OPTIONS.includes(candidate.workMinutes) &&
          BREAK_MINUTE_OPTIONS.includes(candidate.breakMinutes) &&
          THEME_OPTIONS.includes(candidate.themeMode);
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
  updateView();
});
