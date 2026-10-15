"""Grade every still used in the film once (3000px long side) + the slow-mo canopy clip."""
import os, sys, subprocess, glob, cv2, numpy as np
from concurrent.futures import ProcessPoolExecutor
from grade import grade_image, grade_array, normalize
MODES = {
 'day': '1186 1187 1189 1191 1192 1196 1195 1198 1200 1205 1181 1207 1293 1260 1277 1275 1279 1258 1289 1288 1338 1344 1348 1346',
 'warm': '1310 1306 1303 1315 1317 1318 1327 1324 1321',
 'golden': '1424 1421 1414',
 'night': '1343 1352 1354 1355 1361 1372 1227 1236 1238 1387 1390 1360 1365 1223 1363 1371',
 'bw': '1243 1249 1242',
}
EV = {'1243': -0.25, '1421': 0.25, '1424': 0.15, '1227': 0.1, '1363': 0.4, '1223': 0.3, '1390': 0.2, '1279': -0.15, '1289': 0.0}
os.makedirs('cache', exist_ok=True)
def job(a):
    n, m = a; o = f'cache/{n}.jpg'
    if os.path.exists(o): return o
    out = grade_image(f'src/DSCF{n}.jpg', m, EV.get(n, 0.0))
    cv2.imwrite(o, (out[:, :, ::-1] * 255 + .5).clip(0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 96]); return o
def clip():
    os.makedirs('cache/clip1349', exist_ok=True)
    if len(glob.glob('cache/clip1349/*.jpg')) > 30: return
    raw = 'clips/raw1349'; os.makedirs(raw, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '0', '-t', '1.25', '-i', '/mnt/user-data/uploads/Pictures/hyd pics/night out/DSCF1349.MOV',
                    '-vf', 'scale=2400:-2', '-q:v', '2', f'{raw}/f%04d.jpg'], check=True)
    fs = sorted(glob.glob(f'{raw}/*.jpg'))
    mid = cv2.imread(fs[len(fs) // 2])[:, :, ::-1].astype(np.float32) / 255
    normalize(mid, 'night'); g = normalize.last_gain
    for i, f in enumerate(fs):
        im = cv2.imread(f)[:, :, ::-1].astype(np.float32) / 255
        out = grade_array(im, 'night', fixed_gain=g)
        cv2.imwrite(f'cache/clip1349/{i:04d}.jpg', (out[:, :, ::-1] * 255 + .5).clip(0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
if __name__ == '__main__':
    jobs = [(n, m) for m, ids in MODES.items() for n in ids.split()]
    with ProcessPoolExecutor(2) as ex: list(ex.map(job, jobs))
    print('stills', len(jobs)); clip(); print('clip frames', len(glob.glob('cache/clip1349/*.jpg')))
