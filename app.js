/**
 * CLAIR — PRIVATE DATING COMPANION & SAFETY NET
 * Telemetry Scroll Bar Animated Asset · Single Lead Gen Engine · Interactive Pre-Date Dossier
 */

(function () {
  'use strict';

  // Configurable production endpoint (can be overridden via window.CLAIR_CONFIG)
  const CONFIG = Object.assign(
    {
      webhookUrl: null, // e.g., 'https://api.yourcrm.com/v1/dating-leads'
      batchName: 'Batch 04',
      storageKey: 'clair_dating_reservation'
    },
    window.CLAIR_CONFIG || {}
  );

  /* --------------------------------------------------------------------------
     1. DOM UTILITIES & HELPERS
     -------------------------------------------------------------------------- */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
  };

  /**
   * Validates LinkedIn or Public Social Profile
   * Accepts full profile URLs (linkedin.com/in/*, instagram.com/*, x.com/*, etc.)
   * or valid social handles starting with @ (e.g. @username)
   */
  const validateSocialProfile = (input) => {
    const raw = String(input || '').trim();
    if (!raw) {
      return {
        valid: false,
        message: 'LinkedIn or public social profile is required for applicant screening.'
      };
    }

    // Handle @username format
    if (/^@[\w.]{2,30}$/.test(raw)) {
      return { valid: true, value: raw };
    }

    // Handle standard URLs or domain-relative links
    const urlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
    if (urlPattern.test(raw)) {
      if (raw.length < 5) {
        return {
          valid: false,
          message: 'Please enter a complete profile link (e.g., linkedin.com/in/yourname).'
        };
      }
      return { valid: true, value: raw };
    }

    // Require either a recognizable social domain or handle
    return {
      valid: false,
      message: 'Please enter a valid LinkedIn URL or public social link (e.g. linkedin.com/in/yourname or @handle).'
    };
  };

  const generateCohortId = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#CLR-DATE-B04-${code}`;
  };

  /* --------------------------------------------------------------------------
     2. DATING APP SELECTION & SINGLE REGISTRATION FORM MANAGEMENT
     -------------------------------------------------------------------------- */
  let selectedApp = 'All Apps';

  // Initialize Dating App Selector Pills
  $$('.role-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      $$('.role-pill').forEach((p) => p.classList.remove('selected'));
      pill.classList.add('selected');
      selectedApp = pill.dataset.role || pill.textContent.trim();
    });
  });

  // Check for existing reservation in localStorage
  const checkStoredReservation = () => {
    try {
      const stored = localStorage.getItem(CONFIG.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        displayReservationTicket(data);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  };

  const displayReservationTicket = (data) => {
    const formView = $('#lead-form-view');
    const ticketView = $('#lead-success-view');

    if (formView) formView.style.display = 'none';
    if (ticketView) {
      ticketView.classList.add('active');
      const idElem = ticketView.querySelector('.ticket-id');
      const emailElem = ticketView.querySelector('.ticket-user-email');
      const socialElem = ticketView.querySelector('.ticket-user-social');
      const codeElem = ticketView.querySelector('.ticket-referral code');

      if (idElem) idElem.textContent = data.cohortId;
      if (emailElem) emailElem.textContent = data.email;
      if (socialElem && data.socialProfile) socialElem.textContent = data.socialProfile;
      if (codeElem) codeElem.textContent = `https://clair.me/invite?ref=${data.referralCode}`;
    }
  };

  const clearFieldError = (inputElem, errorElem) => {
    if (inputElem) {
      inputElem.classList.remove('has-error');
      inputElem.removeAttribute('aria-invalid');
    }
    if (errorElem) {
      errorElem.textContent = '';
      errorElem.classList.remove('active');
    }
  };

  const setFieldError = (inputElem, errorElem, message) => {
    if (inputElem) {
      inputElem.classList.add('has-error');
      inputElem.setAttribute('aria-invalid', 'true');
      inputElem.focus();
    }
    if (errorElem) {
      errorElem.textContent = message;
      errorElem.classList.add('active');
    }
  };

  // Wire up real-time error clearing when user types
  const emailInput = $('#lead-email');
  const emailError = $('#lead-email-error');
  if (emailInput && emailError) {
    emailInput.addEventListener('input', () => clearFieldError(emailInput, emailError));
  }

  const socialInput = $('#lead-social');
  const socialError = $('#lead-social-error');
  if (socialInput && socialError) {
    socialInput.addEventListener('input', () => clearFieldError(socialInput, socialError));
  }

  // Handle Single Form Submission
  const leadForm = $('#single-registration-form');
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput ? emailInput.value.trim() : '';
      const social = socialInput ? socialInput.value.trim() : '';
      const submitBtn = $('#lead-submit-btn');

      // 1. Validate Email
      let hasError = false;
      if (!email || !validateEmail(email)) {
        setFieldError(emailInput, emailError, 'Please enter a valid email address.');
        hasError = true;
      } else {
        clearFieldError(emailInput, emailError);
      }

      // 2. Validate Social/LinkedIn Profile (Required)
      const socialValidation = validateSocialProfile(social);
      if (!socialValidation.valid) {
        setFieldError(socialInput, socialError, socialValidation.message);
        if (!hasError && socialInput) socialInput.focus();
        hasError = true;
      } else {
        clearFieldError(socialInput, socialError);
      }

      if (hasError) return;

      // Button loading state with micro-animation
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg style="width:16px;height:16px;animation:spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="12"></circle>
        </svg>
        <span>Requesting Access...</span>
      `;

      const cohortData = {
        email: email,
        socialProfile: socialValidation.value,
        datingApp: selectedApp,
        cohortId: generateCohortId(),
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        timestamp: new Date().toISOString()
      };

      // If production webhook URL is configured, dispatch the payload
      if (CONFIG.webhookUrl) {
        try {
          await fetch(CONFIG.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cohortData)
          });
        } catch (err) {
          console.warn('Webhook dispatch failed, continuing locally:', err);
        }
      } else {
        // Calibrated screening delay
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(cohortData));
      } catch (e) {
        console.warn('LocalStorage write failed:', e);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      displayReservationTicket(cohortData);
    });
  }

  // Clipboard copy for referral links
  document.addEventListener('click', (e) => {
    if (e.target.matches('.ticket-copy-btn')) {
      const codeBlock = e.target.closest('.ticket-referral')?.querySelector('code');
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.textContent).then(() => {
          const original = e.target.textContent;
          e.target.textContent = 'Copied ✓';
          setTimeout(() => (e.target.textContent = original), 1800);
        });
      }
    }
  });

  /* --------------------------------------------------------------------------
     3. TELEMETRY SCROLL BAR ANIMATED ASSET (SCROLLS TO PERCENTAGE IN THE 90s)
     -------------------------------------------------------------------------- */
  let animationFrameId = null;
  let isUserInteracting = false;
  let hasAnimatedOnFirstView = false;

  const updateSignatureVisual = (percentage) => {
    const val = Math.max(5, Math.min(100, Math.round(percentage)));
    const clipper = $('#sig-clipper');
    const fill = $('#sig-fill');
    const readout = $('#sig-readout-num');
    const label = $('#sig-readout-label');
    const slider = $('#sig-slider');

    if (clipper) clipper.style.height = `${val}%`;
    if (readout) readout.textContent = `${val}%`;
    if (slider) slider.value = val;

    let color = 'var(--matcha)';
    let tierText = 'High Corroboration · Verified Match & Safe Profile';

    if (val < 45) {
      color = 'var(--peach)';
      tierText = 'Low Corroboration · Unverified Profile / Red Flag Alert';
    } else if (val < 80) {
      color = 'var(--cyan-strong)';
      tierText = 'Cross-Referenced Telemetry · Partial Details';
    }

    if (fill) fill.style.color = color;
    if (label) {
      label.textContent = tierText;
      label.style.color = color;
    }
  };

  /**
   * Smoothly scrolls the scroll bar / slider to a target percentage in the 90's (94%)
   * as a live animated asset on first view.
   */
  const animateScrollBarTo90s = (startVal = 24, targetVal = 94, durationMs = 1500) => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    const startTime = performance.now();

    const frame = (now) => {
      if (isUserInteracting) return;

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth cubic ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = startVal + (targetVal - startVal) * easeOut;

      updateSignatureVisual(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(frame);
      } else {
        updateSignatureVisual(targetVal);
        animationFrameId = null;
      }
    };

    animationFrameId = requestAnimationFrame(frame);
  };

  // IntersectionObserver to trigger scroll bar animation to 94% on first view
  const initFirstViewScrollbarAnimation = () => {
    const targetSection = $('#confidence-system');
    if (!targetSection) {
      setTimeout(() => animateScrollBarTo90s(24, 94, 1500), 500);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedOnFirstView) {
            hasAnimatedOnFirstView = true;
            animateScrollBarTo90s(24, 94, 1600);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(targetSection);
  };

  // Manual Slider Input
  const slider = $('#sig-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      isUserInteracting = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      updateSignatureVisual(Number(e.target.value));
    });

    slider.addEventListener('change', () => {
      isUserInteracting = false;
    });
  }

  // Preset Buttons
  $$('.sig-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      isUserInteracting = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      const targetVal = Number(btn.dataset.val || 75);
      updateSignatureVisual(targetVal);
    });
  });

  // Replay Telemetry Animation Button
  const replayBtn = $('#sig-replay-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      isUserInteracting = false;
      animateScrollBarTo90s(18, 94, 1500);
    });
  }

  /* --------------------------------------------------------------------------
     4. INTERACTIVE DATING COACH & PRE-DATE DOSSIER
     -------------------------------------------------------------------------- */
  const replyOptions = $$('.reply-option');
  const quoteDisplay = $('#obs-quote-text');

  const DATING_COACH_INSIGHTS = {
    witty:
      '“Julian teased your music taste to see if you get defensive. Do not over-explain yourself—tease his coffee order back. Matches his banter, keeps the energy light, and positions you as high-status.”',
    direct:
      '“He suggested a casual late drink at 10 PM on a Tuesday. Recommending 7:30 PM at a lively venue near your neighborhood sets clear boundaries without killing the excitement. Protects your evening.”',
    chill:
      '“He asked what you did this weekend. Share one vivid, sensory detail (e.g., the spicy mezcal cocktail or an art gallery pop-up) rather than a list of chores. Gives him an immediate hook to ask about.”'
  };

  replyOptions.forEach((option) => {
    option.addEventListener('click', () => {
      replyOptions.forEach((opt) => opt.classList.remove('active'));
      option.classList.add('active');

      const mode = option.dataset.replyMode || 'witty';
      if (quoteDisplay && DATING_COACH_INSIGHTS[mode]) {
        quoteDisplay.style.opacity = '0';
        setTimeout(() => {
          quoteDisplay.textContent = DATING_COACH_INSIGHTS[mode];
          quoteDisplay.style.opacity = '1';
        }, 150);
      }
    });
  });

  /* --------------------------------------------------------------------------
     5. SMOOTH ANCHORS & FOCUS MANAGEMENT
     -------------------------------------------------------------------------- */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = $(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // If navigating to registration form, auto-focus first input
          if (targetId === '#registration-form' || targetId === '#hero-lead') {
            setTimeout(() => {
              const firstInput = $('#lead-email');
              if (firstInput) firstInput.focus();
            }, 400);
          } else {
            const focusable = targetElement.querySelector('input, button, a');
            if (focusable) focusable.focus();
          }
        }
      }
    });
  });

  // Inject spin keyframe rule dynamically
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(styleSheet);

  // Initialize
  checkStoredReservation();
  updateSignatureVisual(30); // Initial pre-scroll state
  initFirstViewScrollbarAnimation(); // Triggers scroll animation to 94% on first view
})();
