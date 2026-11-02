const root = document.documentElement;
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('#main-nav');
const header = document.querySelector<HTMLElement>('[data-header]');
const desktopNav = matchMedia('(min-width: 1101px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// Runs after the next frame has rendered, so layout reads never force a synchronous reflow during startup.
const afterPaint = (callback: () => void) => requestAnimationFrame(() => setTimeout(callback, 0));

// Header: transparent over the hero, solid once the page scrolls.
const setHeaderState = () => header?.classList.toggle('is-solid', scrollY > 24);
afterPaint(setHeaderState);
addEventListener('scroll', setHeaderState, { passive: true });

// Mobile drawer
function closeMenu() {
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', 'Open navigation');
  document.body.classList.remove('menu-open');
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.body.classList.toggle('menu-open', open);
  // The drawer precedes the toggle in DOM order, so move focus into it explicitly.
  if (open) requestAnimationFrame(() => navFocusables()[0]?.focus());
});
// Keep keyboard focus cycling through drawer → header actions → toggle → drawer while it is open.
const navFocusables = () =>
  [...(nav?.querySelectorAll<HTMLElement>('a[href], button') ?? [])].filter((el) => el.offsetParent !== null);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || menu?.getAttribute('aria-expanded') !== 'true') return;
  const first = navFocusables()[0];
  if (!event.shiftKey && document.activeElement === menu) {
    event.preventDefault();
    first?.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    menu?.focus();
  }
});
desktopNav.addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

// Submenus: hover/focus opens them on desktop; the chevron button toggles them for touch and keyboards.
const toggles = [...document.querySelectorAll<HTMLButtonElement>('.submenu-toggle')];
function setSubmenu(toggle: HTMLButtonElement, open: boolean) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.closest('.nav-item')?.classList.toggle('open', open);
}
toggles.forEach((toggle) =>
  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggles.forEach((other) => other !== toggle && setSubmenu(other, false));
    setSubmenu(toggle, open);
  }),
);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openToggle = toggles.find((t) => t.getAttribute('aria-expanded') === 'true');
  if (openToggle) {
    setSubmenu(openToggle, false);
    openToggle.focus();
  } else if (menu?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Node)) return;
  if (!event.target.parentElement?.closest('.nav-item')) toggles.forEach((t) => setSubmenu(t, false));
  if (nav && !nav.contains(event.target) && !menu?.contains(event.target)) closeMenu();
});

// Scroll reveal. Content is visible by default; only JS + motion-friendly browsers hide it first.
if (!reduced.matches && 'IntersectionObserver' in window) {
  root.classList.add('reveal-ready');
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    (el as HTMLElement).style.setProperty('--reveal-delay', `${(i % 4) * 70}ms`);
    observer.observe(el);
  });
}

// Destination ribbon: user pause control (WCAG 2.2.2) and no off-screen animation work.
document.querySelectorAll<HTMLElement>('[data-ribbon]').forEach((ribbon) => {
  const toggle = ribbon.querySelector<HTMLButtonElement>('.ribbon-toggle');
  toggle?.addEventListener('click', () => {
    const paused = toggle.getAttribute('aria-pressed') !== 'true';
    // A toggle button keeps one name; aria-pressed conveys the paused state.
    toggle.setAttribute('aria-pressed', String(paused));
    ribbon.classList.toggle('is-paused', paused);
  });
  if ('IntersectionObserver' in window)
    new IntersectionObserver(([entry]) =>
      ribbon.classList.toggle('is-offscreen', !entry.isIntersecting),
    ).observe(ribbon);
});

// Video posters load only as the player nears the viewport (a poster attribute is fetched immediately).
const posters = [...document.querySelectorAll<HTMLVideoElement>('video[data-poster]')];
const setPoster = (video: HTMLVideoElement) => (video.poster = video.dataset.poster!);
if ('IntersectionObserver' in window) {
  const posterObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setPoster(entry.target as HTMLVideoElement);
        posterObserver.unobserve(entry.target);
      }),
    { rootMargin: '600px 0px' },
  );
  posters.forEach((video) => posterObserver.observe(video));
} else posters.forEach(setPoster);

// Horizontal carousels
document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector<HTMLElement>('[data-carousel-track]')!;
  const prev = carousel.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const next = carousel.querySelector<HTMLButtonElement>('[data-carousel-next]');
  const step = () => (track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 300;
  const update = () => {
    if (prev) prev.disabled = track.scrollLeft <= 4;
    if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  const behavior: ScrollBehavior = reduced.matches ? 'auto' : 'smooth';
  prev?.addEventListener('click', () => track.scrollBy({ left: -step() - 20, behavior }));
  next?.addEventListener('click', () => track.scrollBy({ left: step() + 20, behavior }));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  afterPaint(update);
});

// Category filters (vehicles, gallery)
document.querySelectorAll<HTMLElement>('[data-filter-group]').forEach((group) => {
  const target = group.dataset.filterGroup;
  group.querySelectorAll<HTMLButtonElement>('button').forEach((button) =>
    button.addEventListener('click', () => {
      group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      const value = button.dataset.filter;
      let count = 0;
      document
        .querySelectorAll<HTMLElement>(`[data-filter-items="${target}"] > [data-category]`)
        .forEach((item) => {
          const visible = value === 'All' || item.dataset.category === value;
          item.hidden = !visible;
          if (visible) {
            count++;
            item.classList.add('is-visible');
          }
        });
      const status = document.querySelector(`[data-filter-status="${target}"]`);
      if (status) status.textContent = `Showing ${count} ${target === 'gallery' ? 'photos' : 'vehicles'}`;
    }),
  );
});

// Photo preview dialog
const dialog = document.querySelector<HTMLDialogElement>('#photo-dialog');
let photoTrigger: HTMLButtonElement | null = null;
const photoButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-photo]')];
const visiblePhotos = () => photoButtons.filter((button) => !button.closest('[hidden]'));
function showPhoto(button: HTMLButtonElement) {
  if (!dialog) return;
  photoTrigger = button;
  const img = dialog.querySelector('img')!;
  img.src = button.dataset.photo!;
  img.alt = button.dataset.caption!;
  dialog.querySelector('figcaption')!.textContent = button.dataset.caption!;
  const photos = visiblePhotos();
  dialog.querySelector('.photo-counter')!.textContent = `${photos.indexOf(button) + 1} / ${photos.length}`;
  if (!dialog.open) dialog.showModal();
}
function stepPhoto(direction: number) {
  const photos = visiblePhotos();
  if (!photoTrigger || !photos.length) return;
  showPhoto(photos[(photos.indexOf(photoTrigger) + direction + photos.length) % photos.length]);
}
photoButtons.forEach((button) => button.addEventListener('click', () => showPhoto(button)));
dialog?.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
dialog
  ?.querySelectorAll<HTMLButtonElement>('[data-direction]')
  .forEach((button) => button.addEventListener('click', () => stepPhoto(Number(button.dataset.direction))));
dialog?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') stepPhoto(1);
  if (event.key === 'ArrowLeft') stepPhoto(-1);
});
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog?.addEventListener('close', () => photoTrigger?.focus());

// Detail-page main photo follows the selected thumbnail
document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
  const main = gallery.querySelector<HTMLImageElement>('[data-gallery-main] img');
  gallery.querySelectorAll<HTMLButtonElement>('[data-photo]').forEach((thumb) =>
    thumb.addEventListener('pointerenter', () => {
      if (!main || !desktopNav.matches) return;
      main.srcset = '';
      main.src = thumb.dataset.photo!;
    }),
  );
});

// Dates cannot be in the past
const today = new Date();
const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
document
  .querySelectorAll<HTMLInputElement>('input[data-min-today]')
  .forEach((input) => (input.min = todayISO));

// Contact enquiry → WhatsApp handoff; no delivery or booking confirmation.
const form = document.querySelector<HTMLFormElement>('#enquiry-form');
if (form) {
  const fields = [
    ...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    ),
  ];
  const preview = form.querySelector<HTMLElement>('#enquiry-preview')!;
  const status = form.querySelector<HTMLElement>('[data-enquiry-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  let busy = false;
  function validate(field: (typeof fields)[number], show = false) {
    const label =
      field.closest('label')?.querySelector('.field-label')?.textContent?.replace('Optional', '').trim() ||
      field.name;
    const value = field.value.trim();
    const digits = value.replace(/\D/g, '');
    field.setCustomValidity('');
    if (field.required && !value) field.setCustomValidity(`Please enter ${label.toLowerCase()}.`);
    else if (
      field.name === 'phone' &&
      value &&
      (!/^\+?[0-9 ()-]+$/.test(value) || digits.length < 7 || digits.length > 15)
    )
      field.setCustomValidity('Enter a phone number with 7 to 15 digits and an optional leading +.');
    else if (
      (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) &&
      value &&
      field.minLength > 0 &&
      value.length < field.minLength
    )
      field.setCustomValidity(
        `Please enter at least ${field.minLength} characters for ${label.toLowerCase()}.`,
      );
    const valid = field.validity.valid;
    if (show || field.hasAttribute('aria-invalid')) {
      field.setAttribute('aria-invalid', String(!valid));
      const error = document.getElementById(`${field.id}-error`)!;
      error.textContent = valid ? '' : field.validationMessage;
      error.hidden = valid;
    }
    return valid;
  }
  fields.forEach((field) => {
    field.id = `enquiry-${field.name}`;
    const error = document.createElement('span');
    error.id = `${field.id}-error`;
    error.className = 'field-error';
    error.hidden = true;
    field.setAttribute('aria-describedby', error.id);
    field.after(error);
    field.addEventListener('input', () => {
      validate(field);
      preview.hidden = true;
      status.textContent = '';
    });
    field.addEventListener('blur', () => validate(field, true));
  });
  const query = new URLSearchParams(location.search);
  ['service', 'vehicle'].forEach((key) => {
    const el = form.elements.namedItem(key) as HTMLSelectElement;
    const value = query.get(key);
    if (value && [...el.options].some((o) => o.value === value)) el.value = value;
  });
  const date = form.elements.namedItem('date') as HTMLInputElement;
  const queryDate = query.get('date');
  if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate) && queryDate >= todayISO) date.value = queryDate;
  if (query.has('service') || query.has('vehicle') || queryDate) {
    form.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;
    const invalid = fields.filter((field) => !validate(field, true));
    if (invalid.length) {
      status.textContent = 'Please correct the highlighted fields.';
      invalid[0].focus();
      return;
    }
    const data = new FormData(form);
    const messageFields = [
      ['name', 'Name'],
      ['phone', 'Mobile'],
      ['email', 'Email'],
      ['service', 'Interested service'],
      ['vehicle', 'Preferred vehicle'],
      ['pickup', 'Pickup'],
      ['drop', 'Drop'],
      ['date', 'Travel date'],
      ['passengers', 'Passengers'],
      ['message', 'Message'],
    ];
    const message =
      `New Website Enquiry — ${form.dataset.business}\n\n` +
      messageFields
        .filter(([key]) => String(data.get(key) || '').trim())
        .map(([key, label]) => `${label}: ${String(data.get(key)).trim()}`)
        .join('\n') +
      `\nSource Page: ${location.origin}${location.pathname}`;
    const href = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
    const link = preview.querySelector<HTMLAnchorElement>('a')!;
    link.href = href;
    preview.querySelector('pre')!.textContent = message;
    preview.hidden = false;
    preview.focus();
    if (!navigator.onLine) {
      status.textContent =
        'Your device appears to be offline. Your draft is ready to copy; reconnect before opening WhatsApp.';
      return;
    }
    busy = true;
    submit.disabled = true;
    try {
      window.open(href, '_blank', 'noopener,noreferrer');
      status.textContent =
        'Review and send the draft in WhatsApp. If it did not open, use the link or copy the message below.';
    } catch {
      status.textContent =
        'WhatsApp could not be opened by this browser. Use the link below, copy your draft or call us.';
    } finally {
      window.setTimeout(() => {
        busy = false;
        submit.disabled = false;
      }, 1200);
    }
  });
  form.querySelector('[data-copy-enquiry]')?.addEventListener('click', async () => {
    const text = preview.querySelector('pre')!.textContent || '';
    const copyStatus = form.querySelector<HTMLElement>('[data-copy-status]')!;
    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = 'Enquiry message copied. Paste it into your WhatsApp conversation.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(preview.querySelector('pre')!);
      selection?.removeAllRanges();
      selection?.addRange(range);
      copyStatus.textContent =
        'Copy is unavailable. The draft is selected; copy it manually or use the WhatsApp link.';
    }
  });
  // Keep personal fields disabled until the handler exists, including when JS fails to load.
  form.noValidate = true;
  form.querySelector<HTMLFieldSetElement>('[data-enquiry-fields]')!.disabled = false;
}
