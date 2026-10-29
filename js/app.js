/**
 * Classroom Tool Detection - VisionAI
 * Hardcoded & Embedded Teachable Machine Image Model Host
 * Powered by @teachablemachine/image & TensorFlow.js
 * Model: Classroom Tool AI (Pen, Book, Duster)
 */

(() => {
  'use strict';

  // Hardcoded Model Endpoints (Hidden from user input)
  const CLOUD_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/VgIGan3bx/';
  const LOCAL_MODEL_URL = './model/';

  // Classroom Tool Metadata & Aesthetics
  const CLASSROOM_TOOLS = {
    'Pen': {
      icon: '🖊️',
      category: 'Writing Instrument',
      accentColor: '#818cf8',
      spokenName: 'Pen'
    },
    'Book': {
      icon: '📖',
      category: 'Textbook / Notebook',
      accentColor: '#34d399',
      spokenName: 'Book'
    },
    'Duster': {
      icon: '🧹',
      category: 'Board Cleaner',
      accentColor: '#fbbf24',
      spokenName: 'Duster'
    }
  };

  // Application State
  const state = {
    model: null,
    maxPredictions: 0,
    classLabels: [],
    metadata: null,
    isModelLoading: false,

    // Webcam State
    webcam: null,
    isWebcamRunning: false,
    isWebcamPaused: false,
    webcamFlip: true,
    animFrameId: null,
    lastFrameTime: performance.now(),
    frameCount: 0,
    currentFps: 0,

    // Inference & Detection Options
    confidenceThreshold: 0, // 0.0 to 1.0
    voiceEnabled: false,
    lastSpokenTool: '',
    lastSpokenTime: 0,

    // Active Mode: 'webcam' | 'image'
    activeMode: 'webcam'
  };

  // DOM Elements Cache
  const el = {
    // Badges & Notification
    statusBadge: document.getElementById('model-status-badge'),
    statusText: document.getElementById('model-status-text'),
    notificationBar: document.getElementById('notification-bar'),
    btnReloadModel: document.getElementById('btn-reload-model'),

    // Target Tool Cards
    toolCardPen: document.getElementById('tool-card-Pen'),
    toolCardBook: document.getElementById('tool-card-Book'),
    toolCardDuster: document.getElementById('tool-card-Duster'),
    toolBadgePen: document.getElementById('tool-badge-Pen'),
    toolBadgeBook: document.getElementById('tool-badge-Book'),
    toolBadgeDuster: document.getElementById('tool-badge-Duster'),

    // Mode Buttons
    modeWebcamBtn: document.getElementById('mode-webcam-btn'),
    modeImageBtn: document.getElementById('mode-image-btn'),
    webcamPanel: document.getElementById('webcam-view-panel'),
    imagePanel: document.getElementById('image-view-panel'),

    // Webcam Controls
    webcamContainer: document.getElementById('webcam-container'),
    webcamPlaceholder: document.getElementById('webcam-placeholder'),
    webcamHud: document.getElementById('webcam-hud'),
    hudFps: document.getElementById('hud-fps'),
    hudLatency: document.getElementById('hud-latency'),
    btnStartWebcam: document.getElementById('btn-start-webcam'),
    btnPauseWebcam: document.getElementById('btn-pause-webcam'),
    btnStopWebcam: document.getElementById('btn-stop-webcam'),
    checkFlipWebcam: document.getElementById('check-flip-webcam'),
    btnSnapshot: document.getElementById('btn-snapshot'),

    // Image Upload Controls
    imageDropzone: document.getElementById('image-dropzone'),
    imageFileInput: document.getElementById('image-file-input'),
    dropzoneContent: document.getElementById('dropzone-content'),
    imagePreviewWrapper: document.getElementById('image-preview-wrapper'),
    imagePreview: document.getElementById('image-preview'),
    btnRemoveImage: document.getElementById('btn-remove-image'),
    btnClassifyImage: document.getElementById('btn-classify-image'),
    checkAutoClassify: document.getElementById('check-auto-classify'),

    // Prediction Outputs
    topToolIcon: document.getElementById('top-tool-icon'),
    topClassName: document.getElementById('top-class-name'),
    topConfidenceBadge: document.getElementById('top-confidence-badge'),
    topConfidenceFill: document.getElementById('top-confidence-fill'),
    predictionsContainer: document.getElementById('predictions-container'),
    rangeThreshold: document.getElementById('range-threshold'),
    valThreshold: document.getElementById('val-threshold'),
    btnVoiceToggle: document.getElementById('btn-voice-toggle'),
    iconVoiceOff: document.getElementById('icon-voice-off'),
    iconVoiceOn: document.getElementById('icon-voice-on'),

    // Snapshots
    historyContainer: document.getElementById('history-container'),
    btnClearHistory: document.getElementById('btn-clear-history')
  };

  // =========================================================================
  // Initialize Application
  // =========================================================================
  function init() {
    setupEventListeners();
    // Automatically load the hardcoded model on startup!
    loadEmbeddedModel();
  }

  function setupEventListeners() {
    // Reload button
    el.btnReloadModel.addEventListener('click', loadEmbeddedModel);

    // Mode Toggle (Webcam vs Image)
    el.modeWebcamBtn.addEventListener('click', () => setInputMode('webcam'));
    el.modeImageBtn.addEventListener('click', () => setInputMode('image'));

    // Webcam Controls
    el.btnStartWebcam.addEventListener('click', startWebcam);
    el.btnPauseWebcam.addEventListener('click', togglePauseWebcam);
    el.btnStopWebcam.addEventListener('click', stopWebcam);
    el.checkFlipWebcam.addEventListener('change', handleFlipToggle);
    el.btnSnapshot.addEventListener('click', captureSnapshot);

    // Image Upload Controls
    setupImageDropzone();
    el.btnRemoveImage.addEventListener('click', (e) => {
      e.stopPropagation();
      clearUploadedImage();
    });
    el.btnClassifyImage.addEventListener('click', classifyLoadedImage);

    // Confidence Threshold Filter Slider
    el.rangeThreshold.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.confidenceThreshold = val / 100;
      el.valThreshold.textContent = `${val}%`;
    });

    // Voice announcement toggle
    el.btnVoiceToggle.addEventListener('click', toggleVoiceReadout);
    el.btnClearHistory.addEventListener('click', clearHistoryGallery);
  }

  // =========================================================================
  // Model Loading (Hardcoded & Hidden)
  // =========================================================================
  async function loadEmbeddedModel() {
    if (state.isModelLoading) return;
    state.isModelLoading = true;

    updateModelStatus('loading', 'Loading Classroom Tool AI...');
    showNotification('', 'none');

    let loadedModel = null;
    let meta = null;

    // 1. Try loading from Cloud Model endpoint
    try {
      const modelURL = CLOUD_MODEL_URL + 'model.json';
      const metadataURL = CLOUD_MODEL_URL + 'metadata.json';
      loadedModel = await tmImage.load(modelURL, metadataURL);

      try {
        const res = await fetch(metadataURL);
        if (res.ok) meta = await res.json();
      } catch (e) {
        console.warn('Could not parse remote metadata JSON:', e);
      }
    } catch (cloudErr) {
      console.warn('Cloud model load error, attempting local fallback:', cloudErr);
      
      // 2. Offline fallback to ./model/
      try {
        loadedModel = await tmImage.load(LOCAL_MODEL_URL + 'model.json', LOCAL_MODEL_URL + 'metadata.json');
        try {
          const res = await fetch(LOCAL_MODEL_URL + 'metadata.json');
          if (res.ok) meta = await res.json();
        } catch (e) {
          console.warn('Could not parse local metadata JSON:', e);
        }
      } catch (localErr) {
        console.error('All model load attempts failed:', localErr);
        updateModelStatus('idle', 'Model Load Error');
        showNotification(
          'Could not connect to the classroom AI model. Please check your internet connection or verify the local server.',
          'error'
        );
        state.isModelLoading = false;
        return;
      }
    }

    // Configure loaded model
    state.model = loadedModel;
    state.maxPredictions = loadedModel.getTotalClasses();
    state.classLabels = loadedModel.getClassLabels();
    state.metadata = meta;
    state.isModelLoading = false;

    updateModelStatus('ready', `Classroom Model Active (${state.maxPredictions} Tools)`);
    showNotification('Classroom Tool AI is active and ready for detection!', 'success');

    // Enable action buttons
    el.btnStartWebcam.disabled = false;
    el.btnClassifyImage.disabled = false;

    // Initialize prediction slots
    initializePredictionRows();

    // Auto-classify if an image is already in preview
    if (state.activeMode === 'image' && el.imagePreview.src && el.checkAutoClassify.checked) {
      classifyLoadedImage();
    }
  }

  function initializePredictionRows() {
    el.predictionsContainer.innerHTML = '';
    state.classLabels.forEach((label, idx) => {
      const tool = CLASSROOM_TOOLS[label] || { icon: '📦', category: 'Classroom Tool' };
      const row = document.createElement('div');
      row.className = 'prediction-row';
      row.id = `pred-row-${idx}`;
      row.innerHTML = `
        <div class="prediction-info">
          <div class="class-title-group">
            <span class="class-icon">${tool.icon}</span>
            <span class="class-name">${escapeHtml(label)}</span>
          </div>
          <span class="class-prob" id="pred-val-${idx}">0.0%</span>
        </div>
        <div class="prediction-track">
          <div class="prediction-bar" id="pred-bar-${idx}" style="width: 0%;"></div>
        </div>
      `;
      el.predictionsContainer.appendChild(row);
    });

    el.topToolIcon.textContent = '🔍';
    el.topClassName.textContent = 'Awaiting Classroom Feed...';
    el.topConfidenceBadge.textContent = '0%';
    el.topConfidenceFill.style.width = '0%';
  }

  // =========================================================================
  // Input Modes
  // =========================================================================
  function setInputMode(mode) {
    if (state.activeMode === mode) return;

    if (mode === 'image' && state.isWebcamRunning) {
      stopWebcam();
    }

    state.activeMode = mode;
    el.modeWebcamBtn.classList.toggle('active', mode === 'webcam');
    el.modeImageBtn.classList.toggle('active', mode === 'image');
    el.webcamPanel.classList.toggle('active', mode === 'webcam');
    el.imagePanel.classList.toggle('active', mode === 'image');

    if (mode === 'image' && state.model && el.imagePreview.src && el.checkAutoClassify.checked) {
      classifyLoadedImage();
    }
  }

  // =========================================================================
  // Webcam Pipeline
  // =========================================================================
  async function startWebcam() {
    if (!state.model) {
      showNotification('Classroom model is still loading. Please wait...', 'error');
      return;
    }

    try {
      el.btnStartWebcam.disabled = true;
      updateModelStatus('loading', 'Starting camera...');

      const width = 480;
      const height = 360;
      state.webcamFlip = el.checkFlipWebcam.checked;

      state.webcam = new tmImage.Webcam(width, height, state.webcamFlip);

      await state.webcam.setup();

      // Patch the internal video element for browser compatibility
      // The library doesn't set these, causing play() to hang on Safari/modern browsers
      const videoEl = state.webcam.webcam;
      if (videoEl) {
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('autoplay', '');
        videoEl.setAttribute('muted', '');
        videoEl.muted = true;
      }

      // Wait for video to be ready before playing
      if (videoEl && videoEl.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Camera timed out waiting for video data')), 10000);
          videoEl.addEventListener('loadeddata', () => { clearTimeout(timeout); resolve(); }, { once: true });
        });
      }

      await state.webcam.play();

      el.webcamPlaceholder.style.display = 'none';

      // Remove existing canvases
      const oldCanvases = el.webcamContainer.querySelectorAll('canvas');
      oldCanvases.forEach(c => c.remove());

      el.webcamContainer.appendChild(state.webcam.canvas);

      // Show HUD and controls
      el.webcamHud.style.display = 'flex';
      el.btnStartWebcam.style.display = 'none';
      el.btnPauseWebcam.style.display = 'inline-flex';
      el.btnStopWebcam.style.display = 'inline-flex';
      el.btnSnapshot.disabled = false;

      state.isWebcamRunning = true;
      state.isWebcamPaused = false;
      state.lastFrameTime = performance.now();
      state.frameCount = 0;

      updateModelStatus('ready', 'Classroom Camera Active');

      // Start inference loop
      state.animFrameId = window.requestAnimationFrame(webcamInferenceLoop);
    } catch (err) {
      console.error('Error starting webcam:', err);
      el.btnStartWebcam.disabled = false;
      updateModelStatus('ready', 'Classroom Model Ready');
      showNotification(
        `Camera Access Error: ${err.message || 'Ensure permissions are granted and you are visiting http://localhost:3000.'}`,
        'error'
      );
    }
  }

  async function webcamInferenceLoop(timestamp) {
    if (!state.isWebcamRunning) return;

    if (!state.isWebcamPaused && state.webcam) {
      try {
        const t0 = performance.now();

        state.webcam.update();

        if (state.model) {
          const predictions = await state.model.predict(state.webcam.canvas);
          const t1 = performance.now();
          const latency = Math.round(t1 - t0);

          handlePredictionResults(predictions);
          el.hudLatency.textContent = `${latency} ms`;
        }

        state.frameCount++;
        if (timestamp - state.lastFrameTime >= 1000) {
          state.currentFps = Math.round((state.frameCount * 1000) / (timestamp - state.lastFrameTime));
          el.hudFps.textContent = `${state.currentFps} FPS`;
          state.frameCount = 0;
          state.lastFrameTime = timestamp;
        }
      } catch (err) {
        console.error('Inference loop error (recovering):', err);
      }
    }

    state.animFrameId = window.requestAnimationFrame(webcamInferenceLoop);
  }

  function togglePauseWebcam() {
    if (!state.isWebcamRunning || !state.webcam) return;

    if (state.isWebcamPaused) {
      state.webcam.play();
      state.isWebcamPaused = false;
      el.btnPauseWebcam.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
        <span>Pause</span>
      `;
    } else {
      state.webcam.pause();
      state.isWebcamPaused = true;
      el.btnPauseWebcam.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Resume</span>
      `;
    }
  }

  function stopWebcam() {
    if (state.animFrameId) {
      window.cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    if (state.webcam) {
      try {
        state.webcam.stop();
      } catch (e) {
        console.warn('Error calling webcam.stop():', e);
      }
      state.webcam = null;
    }

    state.isWebcamRunning = false;
    state.isWebcamPaused = false;

    const canvases = el.webcamContainer.querySelectorAll('canvas');
    canvases.forEach(c => c.remove());

    el.webcamPlaceholder.style.display = 'flex';
    el.webcamHud.style.display = 'none';
    el.btnStartWebcam.style.display = 'inline-flex';
    el.btnStartWebcam.disabled = !state.model;
    el.btnPauseWebcam.style.display = 'none';
    el.btnStopWebcam.style.display = 'none';
    el.btnSnapshot.disabled = true;

    // Reset top detection card
    el.topToolIcon.textContent = '🔍';
    el.topClassName.textContent = 'Awaiting Classroom Feed...';
    el.topConfidenceBadge.textContent = '0%';
    el.topConfidenceFill.style.width = '0%';

    // Reset showcase tool badges
    resetToolCardsHighlight();

    if (state.model) {
      updateModelStatus('ready', `Classroom Model Ready (${state.maxPredictions} Tools)`);
    }
  }

  function handleFlipToggle() {
    state.webcamFlip = el.checkFlipWebcam.checked;
    if (state.isWebcamRunning) {
      stopWebcam();
      startWebcam();
    }
  }

  // =========================================================================
  // Image Upload Pipeline
  // =========================================================================
  function setupImageDropzone() {
    const dropzone = el.imageDropzone;

    dropzone.addEventListener('click', (e) => {
      if (e.target !== el.btnRemoveImage && !el.imagePreview.src) {
        el.imageFileInput.click();
      }
    });

    el.imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleImageFile(file);
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
      } else {
        showNotification('Please drop a valid image file of a classroom tool.', 'error');
      }
    });

    window.addEventListener('paste', (e) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          handleImageFile(blob);
          setInputMode('image');
          break;
        }
      }
    });
  }

  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      el.imagePreview.src = e.target.result;
      el.dropzoneContent.style.display = 'none';
      el.imagePreviewWrapper.style.display = 'block';

      el.imagePreview.onload = () => {
        if (state.model && el.checkAutoClassify.checked) {
          classifyLoadedImage();
        }
      };
    };
    reader.readAsDataURL(file);
  }

  function clearUploadedImage() {
    el.imagePreview.src = '';
    el.imageFileInput.value = '';
    el.imagePreviewWrapper.style.display = 'none';
    el.dropzoneContent.style.display = 'flex';
    resetToolCardsHighlight();
  }

  async function classifyLoadedImage() {
    if (!state.model) {
      showNotification('Classroom model is loading...', 'error');
      return;
    }

    if (!el.imagePreview.src) {
      showNotification('Please upload an image of a pen, book, or duster.', 'error');
      return;
    }

    try {
      setButtonLoading(el.btnClassifyImage, true);
      const t0 = performance.now();

      const predictions = await state.model.predict(el.imagePreview);
      const latency = Math.round(performance.now() - t0);

      handlePredictionResults(predictions);
      showNotification(`Tool analyzed in ${latency} ms`, 'success');
    } catch (err) {
      console.error('Classification error:', err);
      showNotification(`Classification failed: ${err.message}`, 'error');
    } finally {
      setButtonLoading(el.btnClassifyImage, false);
    }
  }

  // =========================================================================
  // Predictions Display & Classroom Tool Feedback
  // =========================================================================
  function handlePredictionResults(predictions) {
    if (!predictions || predictions.length === 0) return;

    // Identify top tool
    let topPred = predictions[0];
    for (let i = 1; i < predictions.length; i++) {
      if (predictions[i].probability > topPred.probability) {
        topPred = predictions[i];
      }
    }

    const topProbPercent = (topPred.probability * 100).toFixed(1);
    const toolMeta = CLASSROOM_TOOLS[topPred.className] || { icon: '📦', accentColor: '#818cf8', spokenName: topPred.className };

    // Update Top Detection Hero Card
    el.topToolIcon.textContent = toolMeta.icon;
    el.topClassName.textContent = topPred.className;
    el.topConfidenceBadge.textContent = `${topProbPercent}%`;
    el.topConfidenceFill.style.width = `${topProbPercent}%`;

    // Dynamic color tuning
    if (topPred.probability >= 0.8) {
      el.topConfidenceFill.style.background = `linear-gradient(90deg, #6366f1, ${toolMeta.accentColor})`;
      el.topConfidenceBadge.style.color = toolMeta.accentColor;
    } else if (topPred.probability >= 0.5) {
      el.topConfidenceFill.style.background = 'linear-gradient(90deg, #6366f1, #f59e0b)';
      el.topConfidenceBadge.style.color = '#f59e0b';
    } else {
      el.topConfidenceFill.style.background = 'linear-gradient(90deg, #6366f1, #ef4444)';
      el.topConfidenceBadge.style.color = '#ef4444';
    }

    // Update Probability Bars in list
    predictions.forEach((pred, i) => {
      const probPercent = (pred.probability * 100).toFixed(1);
      const valEl = document.getElementById(`pred-val-${i}`);
      const barEl = document.getElementById(`pred-bar-${i}`);
      const rowEl = document.getElementById(`pred-row-${i}`);

      if (valEl) valEl.textContent = `${probPercent}%`;
      if (barEl) barEl.style.width = `${probPercent}%`;

      if (rowEl) {
        const isTop = pred.className === topPred.className;
        const passesThreshold = pred.probability >= state.confidenceThreshold;

        rowEl.classList.toggle('top-class', isTop);
        rowEl.style.opacity = passesThreshold ? '1' : '0.25';
      }

      // Update Showcase tool card badges
      const toolBadge = document.getElementById(`tool-badge-${pred.className}`);
      const toolCard = document.getElementById(`tool-card-${pred.className}`);
      if (toolBadge) toolBadge.textContent = `${probPercent}%`;
      if (toolCard) {
        const isActivelyDetected = isTop && pred.probability >= 0.65;
        toolCard.classList.toggle('active-detected', isActivelyDetected);
      }
    });

    // Voice announcement (debounced)
    if (state.voiceEnabled && topPred.probability >= 0.75) {
      announceVoice(`${topPred.className} detected`);
    }
  }

  function resetToolCardsHighlight() {
    ['Pen', 'Book', 'Duster'].forEach(name => {
      const card = document.getElementById(`tool-card-${name}`);
      const badge = document.getElementById(`tool-badge-${name}`);
      if (card) card.classList.remove('active-detected');
      if (badge) badge.textContent = '0%';
    });
  }

  // =========================================================================
  // Voice Synthesis & Snapshots
  // =========================================================================
  function toggleVoiceReadout() {
    state.voiceEnabled = !state.voiceEnabled;
    el.btnVoiceToggle.classList.toggle('active', state.voiceEnabled);
    el.iconVoiceOff.style.display = state.voiceEnabled ? 'none' : 'block';
    el.iconVoiceOn.style.display = state.voiceEnabled ? 'block' : 'none';

    if (state.voiceEnabled) {
      showNotification('Voice announcement enabled. High-confidence tool detections will be spoken.', 'success');
      announceVoice('Classroom detection voice enabled');
    }
  }

  function announceVoice(text) {
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    if (text === state.lastSpokenTool && now - state.lastSpokenTime < 3500) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);

    state.lastSpokenTool = text;
    state.lastSpokenTime = now;
  }

  function captureSnapshot() {
    let dataUrl = null;
    let label = el.topClassName.textContent || 'Classroom Tool';

    if (state.isWebcamRunning && state.webcam) {
      dataUrl = state.webcam.canvas.toDataURL('image/jpeg', 0.85);
    } else if (el.imagePreview.src) {
      dataUrl = el.imagePreview.src;
    }

    if (!dataUrl) return;

    const emptyNotice = el.historyContainer.querySelector('.history-empty');
    if (emptyNotice) emptyNotice.remove();
    el.btnClearHistory.style.display = 'inline-flex';

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <img src="${dataUrl}" alt="Snapshot" />
      <div class="history-meta" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
    `;
    el.historyContainer.prepend(item);
  }

  function clearHistoryGallery() {
    el.historyContainer.innerHTML = '<p class="history-empty">Snapshots of classroom tools will appear here.</p>';
    el.btnClearHistory.style.display = 'none';
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function updateModelStatus(type, message) {
    el.statusBadge.className = `status-badge badge-${type}`;
    el.statusText.textContent = message;
  }

  function showNotification(message, type = 'none') {
    if (!message || type === 'none') {
      el.notificationBar.style.display = 'none';
      return;
    }

    el.notificationBar.className = `notification-bar ${type}`;
    el.notificationBar.textContent = message;
    el.notificationBar.style.display = 'flex';
  }

  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    const textEl = btn.querySelector('.btn-text');
    const spinEl = btn.querySelector('.btn-spinner');

    if (textEl) textEl.style.display = isLoading ? 'none' : 'inline';
    if (spinEl) spinEl.style.display = isLoading ? 'inline-block' : 'none';
    btn.disabled = isLoading;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
