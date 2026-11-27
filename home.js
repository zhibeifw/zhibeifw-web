const gallery = document.querySelector('.cover-gallery');
const coverRows = [...gallery.querySelectorAll('.cover-row')];
const coverTracks = [...gallery.querySelectorAll('[data-cover-row]')];
const touchLayout = window.matchMedia('(hover: none)');
const coverOrigin = 'https://zbfw.org';
const webPlayerUrl = `https://web.${siteDomain}/`;
const coursePage = webPlayerUrl + '#series/';
let galleryVisible = !('IntersectionObserver' in window);
let selectedCover = null;
let pendingCovers = null;

for (const link of document.querySelectorAll('[data-web-player]')) {
  link.href = webPlayerUrl;
}

function coverUrl(path) {
  return coverOrigin + '/' + path.split('/').map(encodeURIComponent).join('/');
}

function createCoverSet(covers, duplicate = false) {
  const set = document.createElement('div');
  set.className = 'cover-set';
  if (duplicate) set.setAttribute('aria-hidden', 'true');

  for (const [title, path, id] of covers) {
    const tile = document.createElement('a');
    tile.className = 'cover-tile';
    tile.href = coursePage + encodeURIComponent(id);
    tile.setAttribute('aria-label', '立即收听《' + title + '》');
    if (duplicate) tile.tabIndex = -1;

    const image = document.createElement('img');
    image.alt = '';
    image.width = 320;
    image.height = 180;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => { image.src = coverUrl(path); }, { once: true });
    image.src = coverUrl(path.replace(/(\.[^./]+)$/, '-320$1'));

    const action = document.createElement('span');
    action.className = 'cover-action';
    action.setAttribute('aria-hidden', 'true');
    action.textContent = '立即收听';
    tile.append(image, action);
    set.append(tile);
  }

  return set;
}

function renderCoverRows(covers) {
  const split = Math.ceil(covers.length / coverTracks.length);
  coverTracks.forEach((track, index) => {
    const rowCovers = covers.slice(index * split, (index + 1) * split);
    track.replaceChildren(createCoverSet(rowCovers), createCoverSet(rowCovers, true));
  });
}

function applyPendingCovers() {
  if (!pendingCovers || selectedCover || gallery.contains(document.activeElement) ||
      (!touchLayout.matches && gallery.matches(':hover'))) return;
  renderCoverRows(pendingCovers);
  pendingCovers = null;
}

renderCoverRows(homepageCovers);

loadHomepageCovers(coverOrigin).then(covers => {
  if (!covers.length) return;
  pendingCovers = covers;
  applyPendingCovers();
}).catch(() => {
  // Keep the initial covers when the catalog is unavailable.
});

function selectCover(tile) {
  selectedCover?.removeAttribute('data-selected');
  selectedCover = tile;
  selectedCover?.setAttribute('data-selected', '');
  gallery.toggleAttribute('data-selected', selectedCover !== null);
}

gallery.addEventListener('click', event => {
  const tile = event.target.closest('.cover-tile');
  const isTouch = ['touch', 'pen'].includes(event.pointerType) || (event.detail > 0 && touchLayout.matches);
  if (!tile || !isTouch || selectedCover === tile) return;
  event.preventDefault();
  selectCover(tile);
});

document.addEventListener('pointerdown', event => {
  if (selectedCover && !gallery.contains(event.target)) {
    selectCover(null);
    applyPendingCovers();
  }
});

gallery.addEventListener('pointerleave', applyPendingCovers);

gallery.addEventListener('focusin', event => {
  const tile = event.target.closest('.cover-tile');
  if (!tile || !tile.matches(':focus-visible')) return;
  selectCover(null);
  gallery.setAttribute('data-keyboard', '');
  const row = tile.closest('.cover-row');
  const item = tile.getBoundingClientRect();
  const viewport = row.getBoundingClientRect();
  row.scrollLeft += Math.min(0, item.left - viewport.left) + Math.max(0, item.right - viewport.right);
});

gallery.addEventListener('focusout', event => {
  if (gallery.contains(event.relatedTarget)) return;
  if (gallery.hasAttribute('data-keyboard')) {
    coverRows.forEach(row => { row.scrollLeft = 0; });
    gallery.removeAttribute('data-keyboard');
  }
  queueMicrotask(applyPendingCovers);
});

function updateGalleryMotion() {
  gallery.toggleAttribute('data-moving', galleryVisible && !document.hidden);
}

document.addEventListener('visibilitychange', updateGalleryMotion);

if ('IntersectionObserver' in window) {
  const coverObserver = new IntersectionObserver(([entry]) => {
    galleryVisible = entry.isIntersecting;
    updateGalleryMotion();
  });
  coverObserver.observe(gallery);
} else {
  updateGalleryMotion();
}
