const downloadLinks = [...document.querySelectorAll('[data-download-platform]')];
const downloadStatus = document.querySelector('[data-download-status]');
const siteDomain = /^(?:www\.)?(zhibeifw\.(?:com|org|app))$/.exec(window.location.hostname)?.[1] ?? 'zhibeifw.com';
const downloadOrigin = 'https://download.' + siteDomain;

async function loadDownloadLinks() {
  const response = await fetch('/version.json', { cache: 'no-cache' });
  if (!response.ok) return;
  const release = await response.json();
  const version = release?.version;
  if (typeof version !== 'string' || !/^\d{4}\.\d{2}\.\d{2}$/.test(version)) return;

  const fileName = 'zhibeifw-' + version;
  const expectedPaths = {
    mac: '/mac/' + fileName + '.dmg',
    windows: '/windows/' + fileName + '-win-setup.exe',
    android: '/android/' + fileName + '.apk',
  };

  for (const link of downloadLinks) {
    const platform = link.dataset.downloadPlatform;
    const path = release.downloads?.[platform];
    if (typeof path !== 'string' || path !== expectedPaths[platform]) continue;
    link.href = downloadOrigin + path;
    link.removeAttribute('aria-disabled');
  }
}

loadDownloadLinks().catch(() => {
  // An unavailable version file leaves the links disabled.
}).finally(() => {
  downloadStatus.hidden = downloadLinks.every(link => link.hasAttribute('href'));
});
