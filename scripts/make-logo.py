"""Rebuild every logo asset from scripts/logo-source.jpg.

    python3 scripts/make-logo.py

The source is a JPEG of the purple seal on white, and two things about it need
handling before it can go on a cream page:

  * The white has to become alpha, or the mark sits in a white box. Edge pixels
    are also un-blended from the white they were composited on, otherwise every
    outline turns to washed-out lilac once it lands on the canvas colour.
  * The seal is drawn as an ELLIPSE, 5.3% taller than it is wide, and the frame
    clipped the bottom of the ring. Cropping alone gives a lopsided oval with a
    flat spot at the bottom, so the ellipse is fitted, stretched to a true
    circle, and the clipped arc filled from a drawn annulus underneath.

The tab icons deliberately use the bare swan monogram rather than the circular
seal: at 16px a ring plus the SUGANDHA CANDLES lettering is an unreadable
smudge, and the ring alone costs the swan about a third of its width.
"""

import os
import pathlib

import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "logo-source.jpg"

# Fitted from the outer ring of the source by least squares. Re-measure these if
# the artwork is ever redrawn.
CX, CY, RX, RY = 623.2, 632.4, 591.7, 622.9
RING_RGB = (83, 21, 135)          # median colour of the outer stroke
RING_PX = 16                      # its thickness, in source pixels
MONOGRAM = (275, 92, 997, 833)    # crowned swan + SC, ring and wordmark excluded
CREAM = (250, 246, 239, 255)      # --color-canvas


def artwork():
    """The source with its white lifted to alpha."""
    rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
    # Distance from white. The background sits at 2-4, real ink well above 50,
    # so the ramp between clears JPEG halo without eating the faintest strokes.
    alpha = np.clip((255.0 - rgb.min(axis=2) - 12.0) / 38.0, 0.0, 1.0)
    a = alpha[..., None]
    with np.errstate(invalid="ignore", divide="ignore"):
        unblended = np.where(a > 0.02, (rgb - 255.0 * (1.0 - a)) / np.maximum(a, 1e-6), rgb)
    stacked = np.dstack([np.clip(unblended, 0, 255), alpha * 255.0])
    return Image.fromarray(stacked.astype(np.uint8), "RGBA")


def circle_mask(size, supersample=4):
    mask = Image.new("L", (size * supersample,) * 2, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * supersample - 1, size * supersample - 1], fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def seal(art):
    """The full seal, stretched to a true circle and cropped to its own edge."""
    scale = RY / RX
    art = art.resize((round(art.width * scale), art.height), Image.LANCZOS)
    cx, size = CX * scale, round(2 * RY)

    # Drawn first so it shows only where the source frame clipped the ring away.
    ss = 4
    ring = Image.new("RGBA", (size * ss,) * 2, (0, 0, 0, 0))
    draw = ImageDraw.Draw(ring)
    draw.ellipse([0, 0, size * ss - 1, size * ss - 1], fill=RING_RGB + (255,))
    inset = RING_PX * ss
    draw.ellipse([inset, inset, size * ss - 1 - inset, size * ss - 1 - inset], fill=(0, 0, 0, 0))
    out = ring.resize((size, size), Image.LANCZOS)

    left, top = round(cx - RY), round(CY - RY)
    out.alpha_composite(art.crop((left, top, left + size, top + size)))
    both = np.minimum(np.asarray(out.getchannel("A")), np.asarray(circle_mask(size)))
    out.putalpha(Image.fromarray(both))
    return out


def monogram(art):
    """The swan alone, padded to a square."""
    mark = art.crop(MONOGRAM)
    side = max(mark.size) + 2 * int(max(mark.size) * 0.06)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.alpha_composite(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    return out


def write(img, rel, box, flatten=None):
    img = img.copy()
    img.thumbnail(box, Image.LANCZOS)
    if flatten:
        ground = Image.new("RGBA", img.size, flatten)
        ground.alpha_composite(img)
        img = ground.convert("RGB")
    else:
        img = img.quantize(colors=224, method=Image.FASTOCTREE, dither=Image.NONE)
    img.save(ROOT / rel, optimize=True)
    print(f"{rel:26} {img.size[0]}x{img.size[1]}  {os.path.getsize(ROOT / rel):,} bytes")


def main():
    art = artwork()
    write(seal(art), "public/logo.png", (400, 400))

    mark = monogram(art)
    write(mark, "src/app/icon.png", (192, 192))
    # Apple composites transparency onto black, so bake the page colour in.
    write(mark, "src/app/apple-icon.png", (180, 180), flatten=CREAM)

    ico = ROOT / "src/app/favicon.ico"
    mark.resize((64, 64), Image.LANCZOS).save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"{'src/app/favicon.ico':26} 16/32/48    {os.path.getsize(ico):,} bytes")


if __name__ == "__main__":
    main()
