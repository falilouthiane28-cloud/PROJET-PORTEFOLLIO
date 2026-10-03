# Images de la section « Saturn Agents » : mascottes, avatars et affiches, en AVIF puis WebP.
# Sources : les détourages du film (brag-output/work/assets) et la première image de la boucle encodée
# (l'affiche doit être exactement cette image, sinon on voit un saut quand la vidéo démarre).
# Usage : python tools/agents-medias.py   (après l'encodage de src/assets/video/boucle-av1.mp4)
import subprocess, tempfile, os
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, 'brag-output', 'work', 'assets')
OUT = os.path.join(RACINE, 'src', 'assets', 'img', 'agents')
AGENTS = ['lead', 'analyst', 'marketing', 'content', 'prospect']
os.makedirs(OUT, exist_ok=True)

def ecrire(im, nom, w):
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, f'{nom}-{w}.avif'), quality=58, speed=4)
    im.save(os.path.join(OUT, f'{nom}-{w}.webp'), quality=80, method=6)
    return im.size

for a in AGENTS:
    m = Image.open(os.path.join(SRC, f'mascot-{a}.png')).convert('RGBA')
    m = m.crop(m.getbbox())                         # pas de marge transparente : la mise en page se cale sur le sujet
    print(a, 'mascotte', [ecrire(m, a, w) for w in (440, 760)])
    v = Image.open(os.path.join(SRC, f'avatar-{a}.png')).convert('RGBA')
    print(a, 'avatar', ecrire(v, f'avatar-{a}', 192))

# affiche de la boucle = sa première image décodée
with tempfile.TemporaryDirectory() as d:
    png = os.path.join(d, 'p.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(RACINE, 'src', 'assets', 'video', 'boucle-av1.mp4'),
                    '-frames:v', '1', png], check=True)
    p = Image.open(png).convert('RGB')
    print('affiche boucle', [ecrire(p, 'boucle', w) for w in (480, 720)])

# affiche du film (plan d'équipe), affichée dans la modale avant la lecture
f = Image.open(os.path.join(RACINE, 'brag-output', 'brag.jpg')).convert('RGB')
print('affiche film', ecrire(f, 'film', 720))
