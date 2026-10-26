const root = document.documentElement;
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('#main-nav');
const header = document.querySelector<HTMLElement>('[data-header]');
const desktopNav = matchMedia('(min-width: 1101px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// Header: transparent over the hero, solid once the page scrolls.
const setHeaderState = () => header?.classList.toggle('is-solid', scrollY > 24);
setHeaderState();
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
  update();
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

// Contact enquiry → reviewed WhatsApp draft
const form = document.querySelector<HTMLFormElement>('#enquiry-form');
if (form) {
  form
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required], textarea[required]')
    .forEach((field) => {
      field.addEventListener('input', () => {
        const digits = field.value.replace(/\D/g, '');
        field.setCustomValidity(
          !field.value.trim()
            ? 'Please complete this field.'
            : field.name === 'phone' && (digits.length < 7 || digits.length > 15)
              ? 'Enter a mobile number with 7 to 15 digits.'
              : '',
        );
      });
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
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const fields = [
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
      `Hello ${form.dataset.business}, I would like to enquire about a trip.\n\n` +
      fields
        .filter(([key]) => String(data.get(key) || '').trim())
        .map(([key, label]) => `${label}: ${String(data.get(key)).trim()}`)
        .join('\n');
    const href = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
    const preview = document.querySelector<HTMLElement>('#enquiry-preview')!;
    const link = preview.querySelector<HTMLAnchorElement>('a')!;
    link.href = href;
    preview.querySelector('pre')!.textContent = message;
    preview.hidden = false;
    preview.focus();
  });
}
