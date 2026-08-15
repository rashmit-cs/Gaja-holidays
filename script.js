// Gaja Holidays — script.js
// Small progressive-enhancement touches. The site works fully without this file.

document.addEventListener('DOMContentLoaded', () => {
  // Gentle reveal for cards as they enter the viewport
  const revealTargets = document.querySelectorAll('.service-card, .fleet-card, .stat');

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach(el => observer.observe(el));
  }

  // ===== FARE ESTIMATOR =====
  const routeSelect = document.getElementById('route-select');
  const distanceInput = document.getElementById('distance-input');
  const vehicleSelect = document.getElementById('vehicle-select');
  const fareOutput = document.getElementById('fare-output');
  const timeOutput = document.getElementById('time-output');
  const estimatorWhatsapp = document.getElementById('estimator-whatsapp');

  const RATES = {
    hatchback: { perKm: 13, base: 150, label: 'Hatchback / Sedan' },
    suv:       { perKm: 17, base: 200, label: 'SUV' },
    tempo:     { perKm: 22, base: 300, label: 'Tempo Traveller' },
    bus:       { perKm: 28, base: 500, label: 'Mini Bus / Coach' }
  };
  const WHATSAPP_NUMBER = '917499075906';
  const AVG_SPEED_KMPH = 38;

  function calcEstimate() {
    if (!distanceInput || !vehicleSelect || !fareOutput) return;
    const distance = Math.max(1, parseFloat(distanceInput.value) || 0);
    const vehicleKey = vehicleSelect.value;
    const rate = RATES[vehicleKey];
    if (!rate) return;

    const fare = Math.round(rate.base + distance * rate.perKm);
    const hours = distance / AVG_SPEED_KMPH;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const timeLabel = h > 0 ? `${h} hr ${m} min` : `${m} min`;

    fareOutput.textContent = `₹${fare.toLocaleString('en-IN')}`;
    timeOutput.textContent = `~ ${timeLabel}`;

    if (estimatorWhatsapp) {
      const routeLabel = routeSelect && routeSelect.value && routeSelect.selectedOptions[0]
        ? routeSelect.selectedOptions[0].textContent.trim()
        : `${distance} km trip`;
      const msg = `Hi Gaja Holidays, I'd like to book: ${routeLabel}, vehicle: ${rate.label}. Estimated fare shown was ₹${fare}. Please confirm.`;
      estimatorWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    }
  }

  if (routeSelect) {
    routeSelect.addEventListener('change', () => {
      if (routeSelect.value) {
        distanceInput.value = routeSelect.value;
      }
      calcEstimate();
    });
  }
  if (distanceInput) {
    distanceInput.addEventListener('input', () => {
      if (routeSelect) routeSelect.value = '';
      calcEstimate();
    });
  }
  if (vehicleSelect) vehicleSelect.addEventListener('change', calcEstimate);
  calcEstimate();

  // ===== CUSTOMER REVIEWS (stored locally on this browser only) =====
  const REVIEWS_KEY = 'gaja_reviews_v1';
  const starInput = document.getElementById('star-input');
  const ratingField = document.getElementById('review-rating');
  const reviewForm = document.getElementById('review-form');
  const reviewList = document.getElementById('review-list');
  const reviewEmpty = document.getElementById('review-empty');
  const reviewAvg = document.getElementById('review-avg');
  const reviewAvgStars = document.getElementById('review-avg-stars');
  const reviewCount = document.getElementById('review-count');

  function loadReviews() {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveReviews(list) {
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
    } catch (e) { /* storage unavailable — ignore */ }
  }

  function starString(n) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function renderReviews() {
    const reviews = loadReviews();
    if (!reviewList) return;

    reviewList.querySelectorAll('.review-item').forEach(el => el.remove());

    if (reviews.length === 0) {
      if (reviewEmpty) reviewEmpty.style.display = 'block';
      if (reviewAvg) reviewAvg.textContent = '—';
      if (reviewAvgStars) reviewAvgStars.textContent = starString(0);
      if (reviewCount) reviewCount.textContent = 'No reviews yet';
      return;
    }

    if (reviewEmpty) reviewEmpty.style.display = 'none';

    const sorted = [...reviews].sort((a, b) => b.ts - a.ts);
    sorted.forEach(r => {
      const item = document.createElement('div');
      item.className = 'review-item';
      const date = new Date(r.ts);
      item.innerHTML = `
        <div class="review-item-head">
          <span class="review-item-name"></span>
          <span class="review-item-stars">${starString(r.rating)}</span>
        </div>
        <p class="review-item-text"></p>
        <p class="review-item-date">${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      `;
      item.querySelector('.review-item-name').textContent = r.name;
      item.querySelector('.review-item-text').textContent = r.text;
      reviewList.appendChild(item);
    });

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    if (reviewAvg) reviewAvg.textContent = avg.toFixed(1);
    if (reviewAvgStars) reviewAvgStars.textContent = starString(Math.round(avg));
    if (reviewCount) reviewCount.textContent = `${reviews.length} review${reviews.length === 1 ? '' : 's'} on this device`;
  }

  if (starInput) {
    const stars = starInput.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value, 10);
        ratingField.value = value;
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value, 10) <= value));
      });
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('review-name').value.trim();
      const text = document.getElementById('review-text').value.trim();
      const rating = parseInt(ratingField.value, 10);

      if (!name || !text || !rating) {
        alert('Please add your name, a review, and a star rating.');
        return;
      }

      const reviews = loadReviews();
      reviews.push({ name, text, rating, ts: Date.now() });
      saveReviews(reviews);
      renderReviews();
      reviewForm.reset();
      ratingField.value = 0;
      if (starInput) starInput.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    });
  }

  renderReviews();
});
