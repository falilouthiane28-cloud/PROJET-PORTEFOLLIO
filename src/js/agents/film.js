// Le film de 40 s, avec le son, dans un <dialog> natif.
// showModal() fournit le piège du focus, Échap, l'arrière-plan inerte et le retour du focus au bouton.
// On ajoute : la page figée (Lenis arrêté, défilement natif bloqué), la pause à la fermeture, la fermeture au clic
// sur le fond. Les sources ne sont posées qu'à la première ouverture : aucun octet du film avant le clic.
import av1Large from '../../assets/video/film-4x5-av1.mp4?url';
import h264Large from '../../assets/video/film-4x5-h264.mp4?url';
import av1Haut from '../../assets/video/film-9x16-av1.mp4?url';
import h264Haut from '../../assets/video/film-9x16-h264.mp4?url';
import affiche from '../../assets/img/agents/film-720.webp?url';
import vtt from '../../assets/video/film.fr.vtt?raw';

// écran en hauteur (téléphone tenu droit) : version 9:16, sinon 4:5
const SOURCES = {
  haut: [[av1Haut, 'video/mp4; codecs="av01.0.05M.08, opus"'], [h264Haut, 'video/mp4; codecs="avc1.64001F, mp4a.40.2"']],
  large: [[av1Large, 'video/mp4; codecs="av01.0.08M.08, opus"'], [h264Large, 'video/mp4; codecs="avc1.640028, mp4a.40.2"']]
};

export function initFilm() {
  const dialog = document.getElementById('film'), open = document.getElementById('filmOpen');
  if (!dialog || !open) return;
  const video = dialog.querySelector('video'), close = document.getElementById('filmClose');
  let ready = false;

  function prepare() {
    if (ready) return;
    ready = true;
    const set = matchMedia('(max-aspect-ratio: 3/4)').matches ? SOURCES.haut : SOURCES.large;
    if (set === SOURCES.haut) { video.width = 720; video.height = 1280; dialog.classList.add('film--haut'); }
    for (const [src, type] of set) video.append(Object.assign(document.createElement('source'), { src, type }));
    // sous-titres en Blob : fonctionne aussi en file:// (npm run build:file), où un .vtt externe serait refusé
    const track = Object.assign(document.createElement('track'), {
      kind: 'captions', srclang: 'fr', label: 'Français', default: true,
      src: URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }))
    });
    video.append(track);
    video.poster = affiche;
  }

  open.addEventListener('click', () => {
    prepare();
    dialog.showModal();
    document.documentElement.classList.add('has-modal');
    window.__hero?.scroll?.stop();
    dispatchEvent(new Event('film:open'));
    // appelé dans le geste de l'utilisateur : la lecture avec le son est autorisée
    video.play().catch(() => {});
  });
  close.addEventListener('click', () => dialog.close());
  // un clic sur le fond (hors de la boîte) ferme la modale
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    video.pause();
    document.documentElement.classList.remove('has-modal');
    window.__hero?.scroll?.start();
    dispatchEvent(new Event('film:close'));
  });
  // la piste est « default » ; certains navigateurs la laissent cachée tant qu'elle n'a pas été chargée
  video.addEventListener('loadedmetadata', () => { const t = video.textTracks[0]; if (t && t.mode === 'disabled') t.mode = 'showing'; });
}
