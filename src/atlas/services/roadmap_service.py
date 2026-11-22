"""Roadmap design, curriculum assembly, scheduling, and infographic rendering service."""

import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from atlas.infrastructure.llm.groq_client import llm_json
from atlas.infrastructure.search.downloader import safe_filename

STAGE_ORDER = ["foundation", "core", "advanced", "practice"]
DIFF_RANK = {"beginner": 0, "intermediate": 1, "advanced": 2}
DIFF_TO_STAGE = {"beginner": "foundation", "intermediate": "core", "advanced": "advanced"}
DEFAULT_MIN = {"video": 25, "web": 20, "pdf": 60, "paper": 60, "ppt": 30, "doc": 30, "book": 120}

IMG_W, MARGIN, FS = 1200, 40, 2
BG, INK, MUTED = "#F7F6F2", "#1F1F1D", "#5F5E5A"
STAGE_COL = {
    "foundation": ("#0F6E56", "#E1F5EE"),
    "core": ("#185FA5", "#E6F1FB"),
    "advanced": ("#534AB7", "#EEEDFE"),
    "practice": ("#854F0B", "#FAEEDA"),
    None: ("#5F5E5A", "#F1EFE8"),
}
TYPE_COL = {
    "video": "#A32D2D",
    "paper": "#534AB7",
    "pdf": "#185FA5",
    "ppt": "#854F0B",
    "doc": "#0F6E56",
    "book": "#3B6D11",
    "web": "#5F5E5A",
}
_REG = [
    "arial.ttf",
    "Arial.ttf",
    "DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "LiberationSans-Regular.ttf",
]
_BOLD = [
    "arialbd.ttf",
    "Arial Bold.ttf",
    "DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "LiberationSans-Bold.ttf",
]
_fonts: dict[tuple[int, bool], Any] = {}


def _load_data(data: Any) -> tuple[dict, Path | None]:
    if isinstance(data, dict):
        return data, (Path(data["output_dir"]) if data.get("output_dir") else None)
    if isinstance(data, str) and data.lstrip().startswith("{"):
        d = json.loads(data)
        return d, (Path(d["output_dir"]) if d.get("output_dir") else None)
    p = Path(data)
    if p.is_dir():
        p = p / "resources.json"
    return json.loads(p.read_text(encoding="utf-8")), p.parent


def _minutes(r: dict) -> int:
    return r.get("estimated_minutes") or DEFAULT_MIN.get(r["type"], 30)


def _card(r: dict, why: str | None = None) -> dict[str, Any]:
    return {
        "id": r["id"],
        "title": r["title"],
        "url": r["url"],
        "type": r["type"],
        "difficulty": r.get("difficulty"),
        "estimated_minutes": _minutes(r),
        "downloaded": r.get("downloaded", False),
        "local_path": r.get("local_path"),
        **({"why": why} if why else {}),
    }


def _ids(raw: Any, by_id: dict) -> list[int]:
    out = []
    if not isinstance(raw, (list, tuple)):
        return out
    for x in raw or []:
        try:
            i = int(x)
        except (TypeError, ValueError):
            continue
        if i in by_id and i not in out:
            out.append(i)
    return out


def _num(x: Any) -> float | None:
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def _font(size: int, bold: bool = False):
    from PIL import ImageFont
    key = (size, bold)
    if key not in _fonts:
        f = None
        for name in (_BOLD if bold else _REG):
            try:
                f = ImageFont.truetype(name, size * FS)
                break
            except OSError:
                continue
        if f is None:
            try:
                f = ImageFont.load_default(size=size * FS)
            except TypeError:
                f = ImageFont.load_default()
        _fonts[key] = f
    return _fonts[key]


def _tw(s: str, size: int, bold: bool = False) -> float:
    return _font(size, bold).getlength(s) / FS


def _clean(s: Any) -> str:
    s = re.sub(r"[\x00-\x1f]+", " ", str(s or ""))
    return "".join(c for c in s if ord(c) < 0x10000).strip()


def _trunc(s: str, size: int, maxw: float, bold: bool = False) -> str:
    if _tw(s, size, bold) <= maxw:
        return s
    while s and _tw(s + "...", size, bold) > maxw:
        s = s[:-1]
    return s.rstrip() + "..."


def _wrap(s: str, size: int, maxw: float, bold: bool = False, maxlines: int | None = None) -> list[str]:
    lines, cur = [], ""
    for w in s.split():
        t = (cur + " " + w).strip()
        if _tw(t, size, bold) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = _trunc(w, size, maxw, bold)
    if cur:
        lines.append(cur)
    if maxlines and len(lines) > maxlines:
        lines = lines[:maxlines]
        lines[-1] = _trunc(lines[-1] + " ...", size, maxw, bold)
    return lines


class _Pen:
    def __init__(self, w: float):
        self.w, self.y, self.ops = w, 0.0, []

    def gap(self, n: float) -> None:
        self.y += n

    def text(self, s: str, size: int = 14, bold: bool = False, fill: str = INK, x: float = 0, right: bool = False, advance: bool = True) -> None:
        self.ops.append(("t", x, self.y, _clean(s), size, bold, fill, right))
        if advance:
            self.y += round(size * 1.4)

    def para(self, s: str, size: int = 14, fill: str = INK, bold: bool = False, x: float = 0, bullet: bool = False, maxlines: int | None = None) -> None:
        indent = 14 if bullet else 0
        for i, ln in enumerate(_wrap(_clean(s), size, self.w - x - indent, bold, maxlines)):
            if bullet and i == 0:
                self.ops.append(("dot", x + 4, self.y + size * 0.65, fill))
            self.ops.append(("t", x + indent, self.y, ln, size, bold, fill, False))
            self.y += round(size * 1.4)

    def chips(self, labels: list[str], size: int = 12, bg: str = "#EEE", fg: str = INK) -> None:
        cx, h = 0.0, size + 10
        for lab in labels:
            lab = _trunc(_clean(lab), size, 240)
            w = _tw(lab, size) + 18
            if cx + w > self.w and cx > 0:
                cx, self.y = 0.0, self.y + h + 6
            self.ops.append(("chip", cx, self.y, w, h, lab, size, bg, fg, False))
            cx += w + 6
        self.y += h + 8

    def resource(self, r: dict) -> None:
        label = (r.get("type") or "web").upper()[:5]
        pw = _tw(label, 11, True) + 16
        meta = " | ".join(
            x
            for x in [
                f"{r['estimated_minutes']} min" if r.get("estimated_minutes") else "",
                urlparse(r.get("url", "")).netloc.replace("www.", "")[:28],
                "saved" if r.get("downloaded") else "",
            ]
            if x
        )
        mw = _tw(meta, 12)
        self.ops.append(("chip", 0, self.y, pw, 20, label, 11, TYPE_COL.get(r.get("type"), MUTED), "#FFFFFF", True))
        self.ops.append(("t", pw + 10, self.y + 1, _trunc(_clean(r.get("title")), 14, self.w - pw - mw - 36), 14, False, INK, False))
        self.ops.append(("t", self.w, self.y + 3, meta, 12, False, MUTED, True))
        self.y += 28


def _replay(d: Any, pen: _Pen, X: float, Y: float) -> None:
    for op in pen.ops:
        if op[0] == "t":
            _, x, y, s, size, bold, fill, right = op
            px = X + x - (_tw(s, size, bold) if right else 0)
            d.text((px * FS, (Y + y) * FS), s, font=_font(size, bold), fill=fill)
        elif op[0] == "chip":
            _, x, y, w, h, lab, size, bg, fg, bold = op
            d.rounded_rectangle([(X + x) * FS, (Y + y) * FS, (X + x + w) * FS, (Y + y + h) * FS], radius=h * FS // 2, fill=bg)
            d.text(((X + x + 9) * FS, (Y + y + (h - size * 1.25) / 2) * FS), lab, font=_font(size, bold), fill=fg)
        elif op[0] == "dot":
            _, x, y, fill = op
            d.ellipse([(X + x - 3) * FS, (Y + y - 3) * FS, (X + x + 3) * FS, (Y + y + 3) * FS], fill=fill)


def _add_box(items: list, y: float, x: float, w: float, pen: _Pen, pad: float, fill: str, stripe: str | None = None, outline: str | None = "#D3D1C7") -> float:
    h = pen.y + 2 * pad
    items.append({"k": "box", "x": x, "y": y, "w": w, "h": h, "pen": pen, "pad": pad, "fill": fill, "stripe": stripe, "outline": outline})
    return h


class RoadmapService:
    """Designs phased learning roadmaps, calculates schedule projections, and renders infographics."""

    def design_with_llm(self, data: dict, rs: list[dict]) -> dict[str, Any] | None:
        """Prompts LLM to design a pedagogically-sequenced, goal-targeted phased roadmap."""
        lines = []
        for r in rs:
            # Clean title to prevent concatenated run-on titles
            clean_title = re.sub(r"\s+", " ", r.get("title", "")).strip()[:80]
            lines.append(
                f"{r['id']}|{r['type']}|{r.get('difficulty')}|{r.get('stage')}|{_minutes(r)}m|{clean_title}|"
                f"{','.join(r.get('topics') or [])}|{(r.get('summary') or '')[:110]}"
            )
        ctx = data.get("roadmap_context", {})
        learner = data.get("learner", {})
        target_topic = data.get("topic", "")
        known_bg = learner.get("known") or "nothing specified"
        target_goal = learner.get("goal") or f"mastery of {target_topic}"
        level = learner.get("level") or "intermediate"
        nl = chr(10)
        prompt = f"""You are a world-class principal educator and curriculum architect.
Your task is to design a high-relevance, progressive learning roadmap tailored for this learner:

Topic: {target_topic}
Target Goal / Specialization: {target_goal}
Current Learner Level: {level}
What the learner ALREADY knows (SKIP basic 101s on this; do NOT repeat them): {known_bg}

Collection Context:
Brief: {ctx.get('brief', '')}
Known coverage gaps: {ctx.get('coverage_gaps', [])}

Available Resources (id|type|difficulty|stage|est_time|title|topics|summary):
{nl.join(lines)}

CRITICAL RELEVANCE RULES:
1. Target the Learner's Specific Goal: The roadmap MUST directly focus on achieving "{target_goal}" within "{target_topic}". Every phase and module must clearly advance the learner toward this specific target goal.
2. Do Not Repeat Already-Known Material: The learner already knows "{known_bg}". Do NOT spend modules on basic syntax or introductory setup unless directly building towards "{target_goal}".
3. Pedagogical Progression: Structure 3 to 5 clear, sequential phases (e.g. Core Foundations -> In-Depth Primitives & Mechanics -> Advanced Patterns & Concurrency/Architecture -> Real-World Applied Projects & Capstone).
4. Module Requirements: Each phase must have 2 to 4 focused modules. Each module must specify:
   - "title": Action-oriented, descriptive title
   - "objectives": 2-3 specific, measurable learning objectives
   - "concepts": 3-5 concrete technical concepts/APIs taught in this module
   - "primary_ids": 1-3 best-matching resource IDs from the provided list
   - "supplementary_ids": 0-3 supplementary resource IDs from the list
   - "why": Clear rationale explaining why these resources fit this module
   - "practice": 2-3 practical exercises/coding tasks the learner should build
   - "checkpoint": A clear mastery test criteria
   - "est_hours": Realistic study + practice hours (e.g. 2-5 hours)
5. Capstone: A comprehensive capstone project that proves end-to-end mastery of "{target_goal}".
6. Strict Resource ID Integrity: Only use resource IDs from the list provided above. Do NOT invent IDs or external URLs.

Return JSON exactly in this shape:
{{"overview": "3-4 sentences detailing how this path guides the learner from '{known_bg}' to mastering '{target_goal}' in '{target_topic}'.",
"phases": [{{"title": "Phase Title", "objective": "Phase Goal", "stage": "foundation|core|advanced|practice",
  "modules": [{{"title": "Module Title", "objectives": ["..."], "concepts": ["..."],
    "primary_ids": [0], "supplementary_ids": [1], "why": "...",
    "practice": ["..."], "checkpoint": "...", "est_hours": 3}}]}}],
"capstone": {{"title": "Capstone Title", "description": "Project description", "skills_used": ["..."]}},
"gaps": [{{"topic": "...", "why": "...", "search_queries": ["..."]}}]}}"""
        return llm_json(prompt)

    def design_fallback(self, data: dict, rs: list[dict]) -> dict[str, Any]:
        """Deterministic roadmap grouping by difficulty and stage."""
        groups = {s: [] for s in STAGE_ORDER}
        for r in rs:
            st = r.get("stage") if r.get("stage") in STAGE_ORDER else DIFF_TO_STAGE.get(r.get("difficulty"), "core")
            groups[st].append(r)
        phases = []
        for st in STAGE_ORDER:
            grp = sorted(groups[st], key=lambda r: (DIFF_RANK.get(r.get("difficulty"), 1), -(r.get("relevance_score") or 0)))
            mods = []
            for n in range(0, len(grp), 3):
                chunk = grp[n:n + 3]
                topics = []
                for r in chunk:
                    topics += [t for t in (r.get("topics") or []) if t not in topics]
                mods.append({
                    "title": f"{st.title()} {n // 3 + 1}: " + (", ".join(topics[:2]) or chunk[0]["title"][:50]),
                    "objectives": [],
                    "concepts": topics[:5],
                    "primary_ids": [r["id"] for r in chunk[:2]],
                    "supplementary_ids": [r["id"] for r in chunk[2:]],
                    "why": "Highest-ranked resources for this stage.",
                    "practice": [],
                    "checkpoint": "",
                })
            if mods:
                phases.append({"title": st.title(), "objective": f"Work through the {st} material.", "stage": st, "modules": mods})
        return {
            "overview": data.get("roadmap_context", {}).get("brief", ""),
            "phases": phases,
            "capstone": None,
            "gaps": [
                {"topic": g, "why": "Listed as a coverage gap by the resource finder.", "search_queries": [g]}
                for g in data.get("roadmap_context", {}).get("coverage_gaps", [])
            ],
        }

    def assemble(self, raw: Any, data: dict, by_id: dict, hours_per_week: float = 7) -> dict[str, Any] | None:
        """Validates structure, attaches resource cards, and builds weekly calendar schedule."""
        if not isinstance(raw, dict):
            return None

        used_primary, used_any, phases_out = set(), set(), []
        phases = raw.get("phases")
        if not isinstance(phases, list):
            phases = []
        for pi, ph in enumerate(phases, 1):
            if not isinstance(ph, dict):
                continue

            mods_out = []
            modules = ph.get("modules")
            if not isinstance(modules, list):
                continue
            for mi, m in enumerate(modules, 1):
                if not isinstance(m, dict):
                    continue

                prim = [i for i in _ids(m.get("primary_ids"), by_id) if i not in used_primary]
                supp = [i for i in _ids(m.get("supplementary_ids"), by_id) if i not in prim]
                used_primary.update(prim)
                used_any.update(prim + supp)
                hrs = _num(m.get("est_hours"))
                if not hrs or hrs <= 0:
                    hrs = round(sum(_minutes(by_id[i]) for i in prim) / 60 * 1.5, 1) or 1.0
                mods_out.append({
                    "module_id": f"{pi}.{mi}",
                    "title": m.get("title") or f"Module {pi}.{mi}",
                    "objectives": m.get("objectives") or [],
                    "concepts": m.get("concepts") or [],
                    "resources": {
                        "primary": [_card(by_id[i], m.get("why")) for i in prim],
                        "supplementary": [_card(by_id[i]) for i in supp],
                    },
                    "practice": m.get("practice") or [],
                    "checkpoint": m.get("checkpoint") or "",
                    "estimated_hours": round(hrs, 1),
                    "needs_external_resources": not prim,
                })
            if mods_out:
                phases_out.append({
                    "phase": pi,
                    "title": ph.get("title") or f"Phase {pi}",
                    "objective": ph.get("objective") or "",
                    "stage": ph.get("stage") if ph.get("stage") in STAGE_ORDER else None,
                    "estimated_hours": round(sum(m["estimated_hours"] for m in mods_out), 1),
                    "modules": mods_out,
                })
        total = round(sum(p["estimated_hours"] for p in phases_out), 1)
        schedule, done = [], 0.0
        for p in phases_out:
            first = int(done // hours_per_week) + 1
            done += p["estimated_hours"]
            last = max(first, math.ceil(done / hours_per_week))
            schedule.append({"phase": p["phase"], "title": p["title"], "weeks": str(first) if first == last else f"{first}-{last}"})
        cap = raw.get("capstone") if isinstance(raw.get("capstone"), dict) else None
        gaps = [g for g in (raw.get("gaps") or []) if isinstance(g, dict) and g.get("topic")]
        return {
            "overview": raw.get("overview") or "",
            "total_estimated_hours": total,
            "assumed_hours_per_week": hours_per_week,
            "estimated_weeks": max(1, math.ceil(total / hours_per_week)) if total else 0,
            "schedule": schedule,
            "phases": phases_out,
            "capstone_project": cap,
            "gaps_to_fill": gaps,
            "unused_resource_ids": [i for i in by_id if i not in used_any],
        }

    def render_image(self, rm: dict, out_path: str | Path) -> str:
        """Renders high-resolution infographic poster of the roadmap."""
        from PIL import Image, ImageDraw
        W, M = IMG_W, MARGIN
        cw = W - 2 * M
        items, y = [], float(M)
        phases = rm.get("phases") or []
        weeks = {s["phase"]: s["weeks"] for s in rm.get("schedule", [])}
        n_mod = sum(len(p["modules"]) for p in phases)
        n_res = sum(len(m["resources"]["primary"]) for p in phases for m in p["modules"])

        L = rm.get("learner") or {}
        pen = _Pen(cw - 56)
        pen.text(f"Learning roadmap: {rm.get('topic')}", 34, True, "#FFFFFF")
        pen.gap(4)
        pen.para(f"Goal: {L.get('goal') or 'full understanding'}", 17, "#E6E4FA")
        pen.para(f"Already knows: {L.get('known') or 'nothing specified'}   |   Level: {L.get('level')}", 17, "#E6E4FA")
        pen.gap(8)
        pen.chips(
            [
                f"{rm.get('total_estimated_hours')} h total",
                f"about {rm.get('estimated_weeks')} weeks at {rm.get('assumed_hours_per_week')} h/week",
                f"{len(phases)} phases",
                f"{n_mod} modules",
                f"{n_res} core resources",
            ],
            14,
            "#3C3489",
            "#FFFFFF",
        )
        if rm.get("overview"):
            pen.gap(2)
            pen.para(rm["overview"], 15, "#CECBF6")
        y += _add_box(items, y, M, cw, pen, 28, "#26215C", outline=None) + 30

        for p in phases:
            dark, light = STAGE_COL.get(p.get("stage"), STAGE_COL[None])
            pen = _Pen(cw - 48)
            pen.text(f"Phase {p['phase']}: {p['title']}", 24, True, "#FFFFFF", advance=False)
            pen.text(f"{p['estimated_hours']} h  |  weeks {weeks.get(p['phase'], '-')}", 16, False, "#FFFFFF", x=pen.w, right=True, advance=False)
            pen.y += 34
            if p.get("objective"):
                pen.para(p["objective"], 15, light)
            ph_items = []
            bh = _add_box(ph_items, y, M, cw, pen, 22, dark, outline=None)
            y0 = y + bh
            y += bh + 18
            nodes = []
            for m in p["modules"]:
                mx, mw = M + 60, cw - 60
                pen = _Pen(mw - 48 - 6)
                pen.text(f"{m['module_id']}   {m['title']}", 20, True, INK, advance=False)
                pen.text(f"{m['estimated_hours']} h", 16, True, dark, x=pen.w, right=True, advance=False)
                pen.y += 30
                if m.get("concepts"):
                    pen.chips(m["concepts"][:6], 12, light, dark)
                for o in (m.get("objectives") or [])[:3]:
                    pen.para(o, 14, INK, bullet=True, maxlines=2)
                pen.gap(6)
                pen.text("RESOURCES", 12, True, MUTED)
                for r in m["resources"]["primary"]:
                    pen.resource(r)
                if m.get("needs_external_resources"):
                    pen.para("No suitable resource found in the collection. Search externally for this topic.", 14, "#A32D2D")
                sup = [r["title"] for r in m["resources"]["supplementary"]]
                if sup:
                    pen.para("Also useful: " + "; ".join(sup), 13, MUTED, maxlines=2)
                if m.get("practice"):
                    pen.gap(6)
                    pen.text("PRACTICE", 12, True, MUTED)
                    for t in m["practice"][:3]:
                        pen.para(t, 14, INK, bullet=True, maxlines=2)
                if m.get("checkpoint"):
                    pen.gap(6)
                    pen.para("Checkpoint: " + m["checkpoint"], 14, dark, bold=False, maxlines=3)
                nodes.append(y + 30)
                y += _add_box(ph_items, y, mx, mw, pen, 24, "#FFFFFF", stripe=dark) + 18
            items.append({"k": "tl", "x": M + 28, "y0": y0, "y1": nodes[-1], "nodes": nodes, "dark": dark, "light": light})
            items += ph_items
            y += 14

        cap = rm.get("capstone_project")
        if isinstance(cap, dict) and cap.get("title"):
            dark, light = STAGE_COL["practice"]
            pen = _Pen(cw - 48 - 6)
            pen.text(f"Capstone project: {cap['title']}", 20, True, INK)
            pen.para(cap.get("description"), 14, INK)
            if cap.get("skills_used"):
                pen.gap(4)
                pen.chips(cap["skills_used"][:8], 12, light, dark)
            y += _add_box(items, y, M, cw, pen, 24, "#FFFFFF", stripe=dark) + 18

        gaps = rm.get("gaps_to_fill") or []
        if gaps:
            pen = _Pen(cw - 48 - 6)
            pen.text("Gaps to fill: no good resource was found for these, search externally", 18, True, "#633806")
            for g in gaps[:8]:
                pen.gap(4)
                pen.para(g.get("topic"), 15, "#412402", bold=True)
                if g.get("why"):
                    pen.para(g["why"], 13, "#633806", maxlines=2)
                if g.get("search_queries"):
                    pen.para("Search: " + "  |  ".join(g["search_queries"][:3]), 13, "#854F0B", maxlines=2)
            y += _add_box(items, y, M, cw, pen, 24, "#FAEEDA", stripe="#BA7517", outline="#EF9F27") + 18

        pen = _Pen(cw)
        unused = len(rm.get("unused_resource_ids") or [])
        pen.text(
            f"Generated {rm.get('generated_at', '')[:16].replace('T', ' ')} UTC  |  mode: {rm.get('mode')}  |  "
            f"{unused} extra resources not placed (see JSON)",
            12,
            False,
            MUTED,
        )
        y += _add_box(items, y, M, cw, pen, 4, BG, outline=None)

        H = y + M
        img = Image.new("RGB", (int(W * FS), int(H * FS)), BG)
        d = ImageDraw.Draw(img)
        for it in items:
            if it["k"] == "tl":
                mid = tuple((int(it["dark"][i:i + 2], 16) + int(it["light"][i:i + 2], 16)) // 2 for i in (1, 3, 5))
                d.rectangle([(it["x"] - 2) * FS, it["y0"] * FS, (it["x"] + 2) * FS, it["y1"] * FS], fill=mid)
                for ny in it["nodes"]:
                    d.ellipse([(it["x"] - 9) * FS, (ny - 9) * FS, (it["x"] + 9) * FS, (ny + 9) * FS], fill=it["dark"], outline=BG, width=3 * FS)
                continue
            x, yy, w, h = it["x"], it["y"], it["w"], it["h"]
            r = 14 * FS
            off = 0
            if it["stripe"]:
                d.rounded_rectangle([x * FS, yy * FS, (x + w) * FS, (yy + h) * FS], r, fill=it["stripe"])
                off = 6
            d.rounded_rectangle([(x + off) * FS, yy * FS, (x + w) * FS, (yy + h) * FS], r, fill=it["fill"], outline=it["outline"], width=FS if it["outline"] else 0)
            _replay(d, it["pen"], x + it["pad"] + off, yy + it["pad"])
        if img.height > 24000:
            img = img.resize((int(img.width * 24000 / img.height), 24000), Image.LANCZOS)
        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(out_path, optimize=True)
        return str(out_path)

    def generate_roadmap(self, resources_data: Any, hours_per_week: float = 7, save: bool = True) -> dict[str, Any]:
        """Designs end-to-end curriculum roadmap from discovered materials."""
        data, folder = _load_data(resources_data)
        rs = data.get("resources") or []
        by_id = {r["id"]: r for r in rs}
        if not rs:
            raise ValueError("No resources in input JSON.")

        print("Designing roadmap...")
        raw, mode = self.design_with_llm(data, rs), "llm"
        result = self.assemble(raw, data, by_id, hours_per_week) if raw else None
        if not result or not any(m["resources"]["primary"] for p in result["phases"] for m in p["modules"]):
            print("    (LLM unavailable or invalid output -> deterministic fallback roadmap)")
            mode = "fallback"
            result = self.assemble(self.design_fallback(data, rs), data, by_id, hours_per_week)

        roadmap = {
            "topic": data.get("topic"),
            "learner": data.get("learner"),
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "mode": mode,
            **result,
        }
        if save:
            out_dir = Path("roadmaps")
            out_dir.mkdir(exist_ok=True)
            base = safe_filename(str(roadmap["topic"]), 50)
            try:
                roadmap["image_path"] = self.render_image(roadmap, out_dir / f"{base}_roadmap.png")
                print(f"Roadmap image: {roadmap['image_path']}")
            except ImportError:
                roadmap["image_path"] = None
                print("Roadmap image skipped: run  pip install pillow")
            (out_dir / f"{base}_roadmap.json").write_text(json.dumps(roadmap, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"Roadmap JSON : {out_dir / (base + '_roadmap.json')}")
        return roadmap
