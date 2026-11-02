#!/usr/bin/env python3
"""Independent validation of PixKitApp Image-to-PDF output.

For every *.pdf in /tmp/pixkit-pdf-tests:
  1. qpdf --check          (structural validation)
  2. pypdf parse           (page count, page sizes, embedded image dims)
  3. manual xref audit     (startxref -> xref table -> each offset must point
                            at the exact "N 0 obj" header)
Prints a JSON summary; exit code 1 if any check fails.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader

PDF_DIR = Path("/tmp/pixkit-pdf-tests")
EXPECT = {
    "pdf-single-portrait.pdf": {"pages": 1},
    "pdf-single-landscape-large.pdf": {"pages": 1},
    "pdf-single-screenshot.pdf": {"pages": 1},
    "pdf-multi-3.pdf": {"pages": 3},
}


def audit_xref(data: bytes) -> dict:
    """Verify startxref and every xref entry points at its object header."""
    out = {"startxref_ok": False, "entries_checked": 0, "entries_ok": 0, "errors": []}
    m = re.search(rb"startxref\s+(\d+)\s+%%EOF\s*$", data)
    if not m:
        out["errors"].append("startxref/%%EOF not found at end")
        return out
    xref_pos = int(m.group(1))
    if data[xref_pos:xref_pos + 4] != b"xref":
        out["errors"].append(f"bytes at startxref {xref_pos} are {data[xref_pos:xref_pos+8]!r}, not 'xref'")
        return out
    out["startxref_ok"] = True
    table = data[xref_pos:]
    header = re.match(rb"xref\n0 (\d+)\n0000000000 65535 f \n", table)
    if not header:
        out["errors"].append("xref header/free-entry not in expected layout")
        return out
    rows = table[header.end():].split(b"\n")
    got = 0
    for i, line in enumerate(rows):
        mm2 = re.match(rb"^(\d{10}) 00000 n ", line)
        if not mm2:
            continue
        got += 1
        obj_num = i + 1  # first 'n' row after the free row is object 1
        off = int(mm2.group(1))
        expect = f"{obj_num} 0 obj".encode()
        if data[off:off + len(expect)] != expect:
            out["errors"].append(f"xref row for obj {obj_num}: offset {off} -> {data[off:off+12]!r}, expected {expect!r}")
        else:
            out["entries_ok"] += 1
    out["entries_checked"] = got
    return out


def main() -> int:
    results = []
    ok = True
    for pdf in sorted(PDF_DIR.glob("*.pdf")):
        data = pdf.read_bytes()
        entry = {"file": pdf.name, "bytes": len(data)}
        # 1) qpdf structural check
        try:
            r = subprocess.run(["qpdf", "--check", str(pdf)], capture_output=True, text=True, timeout=60)
            entry["qpdf_ok"] = r.returncode == 0
            if r.returncode != 0:
                entry["qpdf_output"] = (r.stdout + r.stderr).strip()[:400]
        except FileNotFoundError:
            entry["qpdf_ok"] = None
        # 2) pypdf
        try:
            reader = PdfReader(str(pdf))
            entry["pypdf_pages"] = len(reader.pages)
            sizes = []
            imgdims = []
            for p in reader.pages:
                mb = p.mediabox
                sizes.append([float(mb.width), float(mb.height)])
                try:
                    for img in p.images:
                        imgdims.append([img.image.size[0], img.image.size[1]])
                except Exception as e:  # noqa: BLE001
                    entry.setdefault("image_errors", []).append(str(e)[:120])
            entry["page_sizes_pt"] = sizes
            entry["image_dims"] = imgdims
            entry["pypdf_ok"] = True
        except Exception as e:  # noqa: BLE001
            entry["pypdf_ok"] = False
            entry["pypdf_error"] = str(e)[:200]
        # 3) manual xref audit
        entry["xref_audit"] = audit_xref(data)
        # expectations
        exp = EXPECT.get(pdf.name)
        if exp:
            entry["expected_pages"] = exp["pages"]
            entry["pages_match"] = entry.get("pypdf_pages") == exp["pages"]
        valid = (
            entry.get("qpdf_ok") is not False
            and entry.get("pypdf_ok") is True
            and entry["xref_audit"]["startxref_ok"]
            and not entry["xref_audit"]["errors"]
            and (exp is None or entry["pages_match"])
        )
        entry["valid"] = valid
        ok = ok and valid
        results.append(entry)
    print(json.dumps(results, indent=1))
    return 0 if ok and results else 1


if __name__ == "__main__":
    sys.exit(main())
