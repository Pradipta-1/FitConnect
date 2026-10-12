import numpy as np
from PIL import Image

def generate_exact_layers():
    orig_img = Image.open('public/hero-bg.jpg').convert('RGB')
    orig = np.array(orig_img, dtype=np.float32)
    h, w, _ = orig.shape

    # 1. Glow layers: RGB color with alpha proportional to neon brightness
    glow_pa = np.zeros((h, w, 4), dtype=np.uint8)
    glow_grind = np.zeros((h, w, 4), dtype=np.uint8)
    glow_sc = np.zeros((h, w, 4), dtype=np.uint8)
    glow_ceiling = np.zeros((h, w, 4), dtype=np.uint8)

    # 2. Dim layers: Dark pixels that cover ONLY the glowing tubes to simulate power-off
    dim_pa = np.zeros((h, w, 4), dtype=np.uint8)
    dim_grind = np.zeros((h, w, 4), dtype=np.uint8)
    dim_sc = np.zeros((h, w, 4), dtype=np.uint8)

    # Performance Academy (x: 255..580, y: 22..175)
    for y in range(22, 175):
        for x in range(255, 580):
            r, g, b = orig[y, x]
            if (g > 85 and b > 105 and b > r * 1.02) or (g > 130 and b > 140):
                intensity = min(1.0, max(0.0, (b + g - 180.0) / 220.0))
                if intensity > 0.05:
                    # Glow layer
                    glow_pa[y, x, 0] = int(r)
                    glow_pa[y, x, 1] = int(g)
                    glow_pa[y, x, 2] = int(b)
                    glow_pa[y, x, 3] = int(min(255, intensity * 255))

                    # Dim layer: dark unlit tube color (matches the dark brick wall ~ [20, 28, 32])
                    dim_pa[y, x, 0] = 18
                    dim_pa[y, x, 1] = 26
                    dim_pa[y, x, 2] = 30
                    dim_pa[y, x, 3] = int(min(240, intensity * 220))

    # The Grind (x: 735..865, y: 195..287)
    for y in range(195, 287):
        for x in range(735, 865):
            r, g, b = orig[y, x]
            if g > 95 and g > r * 1.15 and g > b * 1.05:
                intensity = min(1.0, max(0.0, (g - 80.0) / 140.0))
                if intensity > 0.05:
                    glow_grind[y, x, 0] = int(r)
                    glow_grind[y, x, 1] = int(g)
                    glow_grind[y, x, 2] = int(b)
                    glow_grind[y, x, 3] = int(min(255, intensity * 255))

                    dim_grind[y, x, 0] = 14
                    dim_grind[y, x, 1] = 20
                    dim_grind[y, x, 2] = 16
                    dim_grind[y, x, 3] = int(min(240, intensity * 225))

    # Strength & Conditioning (x: 930..1235, y: 215..262)
    for y in range(215, 262):
        for x in range(930, 1235):
            r, g, b = orig[y, x]
            if g > 95 and g > r * 1.15 and g > b * 1.05:
                intensity = min(1.0, max(0.0, (g - 80.0) / 140.0))
                if intensity > 0.05:
                    glow_sc[y, x, 0] = int(r)
                    glow_sc[y, x, 1] = int(g)
                    glow_sc[y, x, 2] = int(b)
                    glow_sc[y, x, 3] = int(min(255, intensity * 255))

                    dim_sc[y, x, 0] = 14
                    dim_sc[y, x, 1] = 20
                    dim_sc[y, x, 2] = 16
                    dim_sc[y, x, 3] = int(min(240, intensity * 225))

    # Ceiling lights
    for y in range(0, 280):
        for x in range(0, w):
            if (250 <= x <= 585 and 20 <= y <= 180):
                continue
            if (730 <= x <= 870 and 190 <= y <= 300):
                continue
            if (925 <= x <= 1240 and 210 <= y <= 265):
                continue
            r, g, b = orig[y, x]
            if r > 160 and g > 195 and b > 205:
                intensity = min(1.0, max(0.0, (r + g + b - 540.0) / 225.0))
                if intensity > 0.05:
                    glow_ceiling[y, x, 0] = int(r)
                    glow_ceiling[y, x, 1] = int(g)
                    glow_ceiling[y, x, 2] = int(b)
                    glow_ceiling[y, x, 3] = int(min(255, intensity * 200))

    # Save layers
    Image.fromarray(glow_pa).save('public/neon-pa-glow.png')
    Image.fromarray(dim_pa).save('public/neon-pa-dim.png')

    Image.fromarray(glow_grind).save('public/neon-grind-glow.png')
    Image.fromarray(dim_grind).save('public/neon-grind-dim.png')

    Image.fromarray(glow_sc).save('public/neon-sc-glow.png')
    Image.fromarray(dim_sc).save('public/neon-sc-dim.png')

    Image.fromarray(glow_ceiling).save('public/neon-ceiling-glow.png')

    print('Exact glow and dim layers generated!')

if __name__ == '__main__':
    generate_exact_layers()
