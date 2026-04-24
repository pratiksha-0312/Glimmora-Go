"""Generate PWA icons (192, 512, apple-touch 180, maskable 512) for the
Kirana PWA. Produces solid brand-orange background with 'GG' monogram so
the icon matches the logo pill in the app header."""

from PIL import Image, ImageDraw, ImageFont
import os

BRAND = (241, 108, 30)
WHITE = (255, 255, 255)
SIZES = [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-maskable-512.png", 512, True),
    ("apple-touch-icon.png", 180, False),
]

OUT_DIR = "public/icons"
os.makedirs(OUT_DIR, exist_ok=True)


def find_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/Arialbd.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def draw_icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGBA", (size, size), BRAND)
    draw = ImageDraw.Draw(img)

    # Maskable icons should keep content in the inner 80% safe zone
    text = "GG"
    # Use ~48% of the size as base font (tuned for 'GG')
    font_size = int(size * 0.48)
    if maskable:
        font_size = int(size * 0.36)
    font = find_font(font_size)

    # Center the text
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=WHITE)

    # Rounded corners for non-maskable
    if not maskable:
        radius = int(size * 0.22)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [(0, 0), (size, size)], radius=radius, fill=255
        )
        rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        rounded.paste(img, (0, 0), mask)
        return rounded

    return img


for name, size, maskable in SIZES:
    icon = draw_icon(size, maskable)
    out = os.path.join(OUT_DIR, name)
    icon.save(out, "PNG")
    print(f"wrote {out} ({size}x{size}{' maskable' if maskable else ''})")
