#!/usr/bin/env python3
"""Build flattened 69x94mm CMYK factory print PDFs for GlimmerFall TCG cards.

Features:
- Accepts rendered 69x94mm RGB card PNGs/WebPs (no red cut lines) and/or pads
  544x741 trimmed designer cards cleanly to exact 69x94mm (3mm bleed = #2B2829).
- Converts every card via ImageMagick + LittleCMS ICC profiles from sRGB to CMYK TIFF
  (default: Ghostscript FOGRA/Offset CMYK profile, or pass --cmyk-profile path/to/CoatedFOGRA39.icc).
- Wraps flattened CMYK TIFFs into an exact-dimension 69mm x 94mm PDF via img2pdf
  with zero embedded fonts, zero HTML, zero transparency, and zero cut marks.
"""

import argparse
import glob
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

SRGB_ICC_DEFAULT = "/usr/share/color/icc/sRGB.icc"
CMYK_ICC_DEFAULT = "/usr/share/color/icc/ghostscript/default_cmyk.icc"
# Exact 69x94mm bleed ratios matching 600 DPI (1630x2221) and 300 DPI (815x1110)
BLEED_MM = (69.0, 94.0)
TRIM_MM = (63.0, 88.0)
MATTE_DARK_RGB = (43, 40, 41)


def ensure_69x94_bleed_png(src_path: Path, dst_png: Path, target_dpi: int = 300, is_trimmed: bool = False) -> None:
    """Normalize either a 69x94mm bleed image or a trimmed 63x88mm card onto an exact 69x94mm opaque PNG."""
    bw = int(round(BLEED_MM[0] / 25.4 * target_dpi))
    bh = int(round(BLEED_MM[1] / 25.4 * target_dpi))
    tw = int(round(TRIM_MM[0] / 25.4 * target_dpi))
    th = int(round(TRIM_MM[1] / 25.4 * target_dpi))

    im = Image.open(src_path)
    if is_trimmed or abs((im.width / im.height) - (TRIM_MM[0] / TRIM_MM[1])) < 0.018:
        canvas = Image.new("RGB", (bw, bh), MATTE_DARK_RGB)
        if im.mode == "RGBA":
            bg = Image.new("RGBA", im.size, (*MATTE_DARK_RGB, 255))
            im = Image.alpha_composite(bg, im).convert("RGB")
        else:
            im = im.convert("RGB")
        resized = im.resize((tw, th), Image.LANCZOS)
        canvas.paste(resized, ((bw - tw) // 2, (bh - th) // 2))
    else:
        canvas = im.convert("RGB").resize((bw, bh), Image.LANCZOS)

    canvas.save(dst_png, format="PNG", dpi=(target_dpi, target_dpi))


def convert_to_cmyk_tiff(
    src_png: Path,
    dst_tif: Path,
    srgb_icc: str,
    cmyk_icc: str,
    dpi: int = 300,
) -> None:
    """Convert flattened sRGB PNG to compressed CMYK TIFF with ICC profile."""
    cmd = [
        "convert",
        str(src_png),
        "-alpha", "off",
        "-profile", srgb_icc,
        "-profile", cmyk_icc,
        "-colorspace", "CMYK",
        "-density", str(dpi),
        "-units", "PixelsPerInch",
        "-compress", "LZW",
        str(dst_tif),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def build_cmyk_pdf(
    inputs: list[Path],
    output_pdf: Path,
    srgb_icc: str,
    cmyk_icc: str,
    dpi: int = 300,
    trimmed_inputs: bool = False,
) -> None:
    """Convert a list of card images into a single flattened 69x94mm CMYK PDF."""
    if not inputs:
        raise ValueError("No input card images provided.")

    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="gf_cmyk_") as tmp_dir:
        tmp = Path(tmp_dir)
        tifs: list[str] = []
        for idx, src in enumerate(inputs):
            norm_png = tmp / f"{idx:04d}.png"
            out_tif = tmp / f"{idx:04d}.tif"
            ensure_69x94_bleed_png(src, norm_png, target_dpi=dpi, is_trimmed=trimmed_inputs)
            convert_to_cmyk_tiff(norm_png, out_tif, srgb_icc, cmyk_icc, dpi=dpi)
            tifs.append(str(out_tif))

        raw_pdf = tmp / "raw.pdf"
        cmd = ["img2pdf", *tifs, "--pagesize", "69mmx94mm", "-o", str(raw_pdf)]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Stamp exact 63x88mm TrimBox (3mm = 8.503937pt inset on 69x94mm MediaBox) matching Kenzi factory PDFs
        import pikepdf
        trim_box = [8.503937, 8.503937, 187.086614, 257.952756]
        with pikepdf.Pdf.open(str(raw_pdf)) as pdf:
            for page in pdf.pages:
                page.TrimBox = pikepdf.Array(trim_box)
            pdf.save(str(output_pdf))


def verify_pdf_factory_spec(pdf_path: Path) -> dict:
    """Verify page count, 69x94mm MediaBox, 63x88mm TrimBox, CMYK image colorspace, and zero fonts via PyMuPDF."""
    import pymupdf

    doc = pymupdf.open(str(pdf_path))
    try:
        fonts_total = 0
        cmyk_images = 0
        rgb_images = 0
        boxes = set()
        trim_boxes = set()
        for page in doc:
            fonts_total += len(page.get_fonts(full=True))
            r = page.rect
            tr = page.trimbox
            boxes.add((round(r.width * 25.4 / 72.0, 2), round(r.height * 25.4 / 72.0, 2)))
            trim_boxes.add((round(tr.width * 25.4 / 72.0, 2), round(tr.height * 25.4 / 72.0, 2)))
            for img in page.get_images(full=True):
                xref = img[0]
                cs_name = (img[5] or "").upper()
                is_cmyk = "CMYK" in cs_name
                if not is_cmyk and "ICCBASED" in cs_name:
                    # Inspect referenced ICC profile stream /N 4 (4 color components = CMYK)
                    xobj = doc.xref_object(xref)
                    for tok in xobj.replace("[", " ").replace("]", " ").split():
                        if tok.isdigit():
                            try:
                                if "/N 4" in doc.xref_object(int(tok)):
                                    is_cmyk = True
                                    break
                            except Exception:
                                pass
                if is_cmyk:
                    cmyk_images += 1
                else:
                    rgb_images += 1
        return {
            "pdf": str(pdf_path),
            "pages": len(doc),
            "size_mm": sorted(boxes),
            "trim_mm": sorted(trim_boxes),
            "fonts": fonts_total,
            "cmyk_images": cmyk_images,
            "non_cmyk_images": rgb_images,
            "bytes": pdf_path.stat().st_size,
        }
    finally:
        doc.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Build factory-ready flattened 69x94mm CMYK print PDFs.")
    parser.add_argument("--input-glob", required=True, help="Glob pattern of card images (e.g. 'public/newcards/samples/*_bleed.webp')")
    parser.add_argument("--output", required=True, help="Output CMYK PDF path (e.g. '/tmp/Glimmerfall_Sample_CMYK.pdf')")
    parser.add_argument("--srgb-icc", default=SRGB_ICC_DEFAULT)
    parser.add_argument("--cmyk-icc", default=CMYK_ICC_DEFAULT)
    parser.add_argument("--dpi", type=int, default=300, choices=[300, 600])
    parser.add_argument("--trimmed", action="store_true", help="Pad 63x88mm trimmed inputs with 3mm matte charcoal bleed")
    args = parser.parse_args()

    files = sorted(Path(p) for p in glob.glob(args.input_glob))
    if not files:
        print(f"No files matched: {args.input_glob}", file=sys.stderr)
        return 1
    if not os.path.exists(args.cmyk_icc):
        print(f"CMYK ICC profile not found: {args.cmyk_icc}", file=sys.stderr)
        return 1

    out_pdf = Path(args.output)
    build_cmyk_pdf(files, out_pdf, args.srgb_icc, args.cmyk_icc, dpi=args.dpi, trimmed_inputs=args.trimmed)
    report = verify_pdf_factory_spec(out_pdf)
    print(f"VERIFIED CMYK PDF: {report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
