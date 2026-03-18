from __future__ import annotations

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parent
GALLERY_DIR = ROOT / "assets" / "img" / "gallery"
HTML_FILE = ROOT / "gallery.html"

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def collect_gallery_images(folder: Path) -> list[str]:
    if not folder.exists():
        return []

    files = [
        path.name
        for path in folder.iterdir()
        if path.is_file() and path.suffix.lower() in VALID_EXTENSIONS
    ]
    return sorted(files, key=lambda name: name.lower())


def build_js_array_lines(filenames: list[str]) -> str:
    if not filenames:
        return '      "__GALLERY_IMAGES__"'

    return ",\n".join(f"      {json.dumps(name)}" for name in filenames)


def update_gallery_html(html_path: Path, filenames: list[str]) -> None:
    if not html_path.exists():
        raise FileNotFoundError(f"Could not find {html_path.name} in repo root.")

    html = html_path.read_text(encoding="utf-8")

    pattern = re.compile(
        r'(const galleryImages = \[\s*)(.*?)(\s*\];)',
        re.DOTALL
    )

    replacement_body = build_js_array_lines(filenames)

    if not pattern.search(html):
        raise ValueError(
            "Could not find 'const galleryImages = [...]' block in gallery.html."
        )

    updated_html = pattern.sub(
        rf"\1{replacement_body}\3",
        html,
        count=1
    )

    html_path.write_text(updated_html, encoding="utf-8")


def main() -> int:
    try:
        images = collect_gallery_images(GALLERY_DIR)
        update_gallery_html(HTML_FILE, images)

        print(f"Updated gallery.html with {len(images)} image(s).")
        if images:
            print("Included:")
            for name in images:
                print(f"  - {name}")
        else:
            print("No supported images found in assets/img/gallery/")
        return 0

    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())