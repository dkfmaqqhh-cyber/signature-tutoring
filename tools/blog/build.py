#!/usr/bin/env python3
"""과외마루 학습정보 자동 발행 도구.

사용법:
  python3 tools/blog/build.py tools/blog/posts/<slug>.json      # 글 생성 + 목록·사이트맵·로드맵 반영
  python3 tools/blog/build.py --rebuild-list                     # 학습정보 목록만 다시 생성

글 내용 JSON 형식은 tools/blog/GUIDE.md 참고.
하는 일:
  1) info/<slug>.html 생성 (post-template.html 사용, 발행일 표시)
  2) tools/cover/covers.json 에 대표 이미지 설정 추가 후 render.mjs 실행
  3) learning/index.html 글 목록 + ItemList 구조화데이터 다시 생성
  4) sitemap.xml 에 주소 추가
  5) roadmap.json 상태 done 처리, published.json 기록
  6) 검사 (빈칸·금지어·FAQ 개수·출처·이미지)
날짜 [514차]: JSON "date"(발행일, 없으면 published.json 기록 → 새 글은 오늘), "date_modified"(선택, 실제 수정일).
"""
import datetime as dt
import html
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "tools" / "blog"
SITE = "https://signaturetutoring.co.kr"
KST = dt.timezone(dt.timedelta(hours=9))

# 광고·과장 표현 (사용자 요청: 광고성·홍보성 제외)
BANNED = ["최고의", "1위", "100%", "보장", "무조건", "최저가", "압도적", "완벽하게 책임", "성적 향상 보장", "합격 보장", "단기간에 급상승"]


def die(msg):
    print("오류:", msg)
    sys.exit(1)


def esc(s):
    return html.escape(s, quote=True)


def load_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def save_json(p, data):
    Path(p).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def post_info(slug):
    """기존 info/<slug>.html 에서 제목·분류를 읽는다 (관련 글 카드용)."""
    f = ROOT / "info" / f"{slug}.html"
    if not f.exists():
        die(f"관련 글 info/{slug}.html 이 없습니다.")
    s = f.read_text(encoding="utf-8")
    title = re.search(r"<h1>(.*?)</h1>", s, re.S).group(1).strip()
    cat = re.search(r'class="post-cat">(.*?)<', s, re.S).group(1).strip()
    return title, cat


def related_card(slug):
    title, cat = post_info(slug)
    main = cat.split("·")[0].strip()
    return (f'        <a class="post-related-card" href="{slug}.html"><span class="post-related-cat">{esc(main)}</span>'
            f'<strong>{title}</strong></a>')


def parse_day(value, label):
    """YYYY-MM-DD 형식만 허용 (잘못된 날짜로 발행하지 않도록 바로 중단)."""
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        die(f"{label} 날짜 형식이 잘못되었습니다: {value!r} (YYYY-MM-DD)")
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        die(f"{label} 날짜가 올바르지 않습니다: {value!r}")


def resolve_dates(spec, today):
    """[514차] 발행일·수정일 결정.
    발행일: JSON date → 없으면 published.json 에 기록된 발행일(이미 발행한 글) → 없으면 오늘(새 글).
    수정일: JSON date_modified → 없으면 발행일. 발행일보다 이르거나 오늘보다 늦으면 중단."""
    prev = next((p for p in load_json(BLOG / "published.json")["posts"] if p["slug"] == spec["slug"]), None)
    if spec.get("date"):
        published = parse_day(spec["date"], "date")
    elif prev and prev.get("date"):
        published = parse_day(prev["date"], "published.json date")
    else:
        published = today
    modified = published
    if spec.get("date_modified"):
        modified = parse_day(spec["date_modified"], "date_modified")
        if modified < published:
            die(f"date_modified({modified}) 가 발행일({published})보다 이릅니다.")
        if modified > today:
            die(f"date_modified({modified}) 가 오늘({today})보다 늦습니다.")
    return published, modified


def build_post(spec, today, modified=None):
    modified = modified or today
    slug = spec["slug"]
    tpl = (BLOG / "post-template.html").read_text(encoding="utf-8")
    cat_main = spec["category"].split("·")[0].strip()
    faq_json = ",\n".join(
        "        " + json.dumps({"@type": "Question", "name": f["q"],
                                 "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}, ensure_ascii=False)
        for f in spec["faq"])
    faq_html = "\n".join(
        f'      <details class="post-faq-item"><summary>{esc(f["q"])}</summary><p>{esc(f["a"])}</p></details>'
        for f in spec["faq"])
    body = []
    for sec in spec["sections"]:
        body.append(f'      <h2 id="{sec["id"]}">{esc(sec["h2"])}</h2>\n{sec["html"].strip()}\n')
    toc = "\n".join(f'        <li><a href="#{s["id"]}">{esc(s["h2"])}</a></li>' for s in spec["sections"])
    summ = "\n".join(f"        <li>{x}</li>" for x in spec["summary"])
    srcs = "\n".join(
        f'        <li>{esc(s["org"])}, 「{esc(s["title"])}」 — <a href="{esc(s["url"])}" target="_blank" rel="noopener nofollow">{esc(s["url"])}</a></li>'
        for s in spec["sources"])
    rel = "\n".join(related_card(r) for r in spec["related"])
    rep = {
        "TITLE": esc(spec["title"]), "DESCRIPTION": esc(spec["description"]), "SLUG": slug,
        "COVER_ALT": esc(spec["cover_alt"]), "NO": str(spec.get("no", "")),
        "CATEGORY": esc(spec["category"]), "CATEGORY_MAIN": esc(cat_main),
        "KEYWORDS": esc(", ".join(spec["keywords"])), "LEAD": spec["lead"],
        "FAQ_JSON": faq_json, "FAQ_HTML": faq_html, "BODY": "\n".join(body), "TOC_LI": toc,
        "SUMMARY_LI": summ, "SOURCES_LI": srcs, "RELATED": rel,
        "DISCLAIMER": esc(spec["disclaimer"]), "CTA_TITLE": esc(spec["cta_title"]), "CTA_TEXT": esc(spec["cta_text"]),
    }
    for k, v in rep.items():
        tpl = tpl.replace("{{" + k + "}}", v)
    # JSON-LD 안의 제목은 html escape 대신 JSON 문자열이어야 하므로 따옴표만 확인
    iso = today.isoformat()
    tpl = tpl.replace('"inLanguage": "ko-KR",\n      "articleSection"',
                      f'"inLanguage": "ko-KR",\n      "datePublished": "{iso}",\n      "dateModified": "{modified.isoformat()}",\n      "articleSection"', 1)
    tpl = tpl.replace('<div class="post-meta"><span>과외마루 학습정보</span></div>',
                      f'<div class="post-meta"><span>과외마루 학습정보</span><span>작성일 {today:%Y.%m.%d}</span></div>', 1)
    (ROOT / "info" / f"{slug}.html").write_text(tpl, encoding="utf-8")
    return tpl


def render_cover(spec):
    covers_p = ROOT / "tools" / "cover" / "covers.json"
    covers = load_json(covers_p)
    covers[spec["slug"]] = spec["cover"]
    save_json(covers_p, covers)
    r = subprocess.run(["node", str(ROOT / "tools" / "cover" / "render.mjs"), spec["slug"]], cwd=ROOT,
                       capture_output=True, text=True, timeout=120)
    print(r.stdout.strip())
    if r.returncode != 0:
        die("대표 이미지 생성 실패: " + r.stderr.strip())


def rebuild_list():
    pub = load_json(BLOG / "published.json")["posts"]
    pub = sorted(pub, key=lambda p: (p.get("date") or "0000"), reverse=True)
    cards = []
    for p in pub:
        s = p["slug"]
        cards.append(f'''      <article class="lp-post">
        <a class="lp-post-img" href="../info/{s}.html" tabindex="-1" aria-hidden="true"><img src="../images/info/{s}.webp" alt="" width="1200" height="630" loading="lazy" decoding="async"></a>
        <span class="lp-post-cat">{esc(p["category"])}</span>
        <h3><a href="../info/{s}.html">{esc(p["title"])}</a></h3>
        <p>{esc(p["summary"])}</p>
        <a class="lp-more" href="../info/{s}.html">자세히 보기 <span aria-hidden="true">→</span></a>
      </article>''')
    idx_p = ROOT / "learning" / "index.html"
    s = idx_p.read_text(encoding="utf-8")
    block = "<!-- AUTO-POSTS:START (tools/blog/build.py 가 자동 생성 · 직접 수정 금지) -->\n" + "\n".join(cards) + "\n      <!-- AUTO-POSTS:END -->"
    if "<!-- AUTO-POSTS:START" in s:
        s = re.sub(r"<!-- AUTO-POSTS:START.*?<!-- AUTO-POSTS:END -->", lambda m: block, s, flags=re.S)
    else:
        s = re.sub(r'(<div class="lp-posts">\n).*?(\n    </div>\n    <p class="lp-note">)',
                   lambda m: m.group(1) + "      " + block + m.group(2), s, count=1, flags=re.S)
        if "AUTO-POSTS:START" not in s:
            die("learning/index.html 글 목록 위치를 찾지 못했습니다.")
    items = ",\n".join(
        "      " + json.dumps({"@type": "ListItem", "position": i + 1, "url": f"{SITE}/info/{p['slug']}.html", "name": p["title"]}, ensure_ascii=False)
        for i, p in enumerate(pub))
    s = re.sub(r'("itemListElement": \[\n).*?(\n    \]\n  \}\n\}\n</script>)',
               lambda m: m.group(1) + items + m.group(2), s, count=1, flags=re.S)
    idx_p.write_text(s, encoding="utf-8")
    print(f"학습정보 목록: {len(pub)}개 글")


def add_sitemap(slug, today):
    """새 글은 주소 추가, 이미 있는 글은 lastmod가 수정일(today 인자)보다 이르면 그 날짜로만 맞춤 [514차]."""
    p = ROOT / "sitemap.xml"
    s = p.read_text(encoding="utf-8")
    loc = f"{SITE}/info/{slug}.html"
    if loc in s:
        pat = re.compile(r"(<loc>" + re.escape(loc) + r"</loc>\s*<lastmod>)(\d{4}-\d{2}-\d{2})(</lastmod>)")
        m = pat.search(s)
        if m and m.group(2) < today.isoformat():
            p.write_text(pat.sub(lambda x: x.group(1) + today.isoformat() + x.group(3), s, count=1), encoding="utf-8")
        return
    entry = f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today.isoformat()}</lastmod>\n  </url>\n"
    anchor = f"  <url>\n    <loc>{SITE}/area/</loc>"
    s = s.replace(anchor, entry + anchor, 1) if anchor in s else s.replace("</urlset>", entry + "</urlset>")
    p.write_text(s, encoding="utf-8")


def check(spec, out_html):
    errs = []
    if "{{" in out_html:
        errs.append("채워지지 않은 빈칸 {{...}} 이 남아 있습니다.")
    text = re.sub(r"<[^>]+>", " ", out_html)
    for w in BANNED:
        if w in text:
            errs.append(f"광고성 금지 표현 사용: '{w}'")
    if not (3 <= len(spec["faq"]) <= 7):
        errs.append("FAQ는 3~7개")
    if len(spec["sections"]) < 4:
        errs.append("본문 소제목(h2) 4개 이상")
    if not spec["sources"] or any(not s["url"].startswith("https://") for s in spec["sources"]):
        errs.append("참고 자료는 1개 이상, https 주소")
    if not (60 <= len(spec["description"]) <= 160):
        errs.append(f"description 길이 60~160자 (현재 {len(spec['description'])})")
    if len(spec["title"]) > 45:
        errs.append(f"제목 45자 이하 (현재 {len(spec['title'])})")
    if len(spec["related"]) != 2:
        errs.append("관련 글은 2개")
    body_chars = len(re.sub(r"\s+", "", re.sub(r"<[^>]+>", "", "".join(x["html"] for x in spec["sections"]))))
    if body_chars < 2500:
        errs.append(f"본문 분량 부족 (공백 제외 {body_chars}자, 2500자 이상)")
    for ext in ("webp", "jpg"):
        if not (ROOT / "images" / "info" / f"{spec['slug']}.{ext}").exists():
            errs.append(f"대표 이미지 없음: images/info/{spec['slug']}.{ext}")
    ids = re.findall(r'id="([^"]+)"', out_html)
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        errs.append(f"중복 id: {dup}")
    # JSON-LD 파싱 확인
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', out_html, re.S)
    try:
        json.loads(m.group(1))
    except Exception as e:  # noqa
        errs.append(f"구조화데이터 JSON 오류: {e}")
    print(f"본문 분량: 공백 제외 약 {body_chars}자")
    return errs


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--rebuild-list":
        rebuild_list()
        return
    if len(sys.argv) < 2:
        die("사용법: python3 tools/blog/build.py tools/blog/posts/<slug>.json")
    spec = load_json(sys.argv[1])
    for k in ["slug", "title", "description", "category", "lead", "cover_alt", "keywords", "summary", "sections",
              "faq", "sources", "disclaimer", "cta_title", "cta_text", "related", "card_summary", "cover"]:
        if k not in spec:
            die(f"JSON에 '{k}' 항목이 없습니다.")
    # [514차] 다시 생성해도 발행일·수정일이 유지되도록, 글을 쓰기 전에 날짜를 확정·검증
    pub_p = BLOG / "published.json"
    pub = load_json(pub_p)
    is_new = not any(p["slug"] == spec["slug"] for p in pub["posts"])
    today, modified = resolve_dates(spec, dt.datetime.now(KST).date())
    out = build_post(spec, today, modified)
    render_cover(spec)
    errs = check(spec, out)
    if errs:
        print("\n".join("검사 실패: " + e for e in errs))
        sys.exit(1)
    entry = {"slug": spec["slug"], "title": spec["title"], "category": spec["category"],
             "summary": spec["card_summary"], "date": today.isoformat()}
    if is_new:
        pub["posts"].append(entry)
    else:  # 다시 생성: 목록 순서가 바뀌지 않게 같은 자리에서 갱신
        pub["posts"] = [entry if p["slug"] == spec["slug"] else p for p in pub["posts"]]
    save_json(pub_p, pub)
    rebuild_list()
    add_sitemap(spec["slug"], modified)
    rm_p = BLOG / "roadmap.json"
    rm = load_json(rm_p)
    for p in rm["posts"]:
        if p["slug"] == spec["slug"]:
            p["status"] = "done"
            p["published"] = today.isoformat()
    # 분야 순환: 새로 발행한 글이 next_track 분야였을 때만 다음 분야로 넘김 (기존 글을 다시 생성하면 넘기지 않음)
    track = next((p.get("track") for p in rm["posts"] if p["slug"] == spec["slug"]), None)
    rot = rm.get("rotation") or []
    if is_new and track in rot and rm.get("next_track") == track:
        rm["next_track"] = rot[(rot.index(track) + 1) % len(rot)]
        print(f"다음 분야: {rm['next_track']}")
    save_json(rm_p, rm)
    print(f"완료: info/{spec['slug']}.html (발행 {today.isoformat()} · 수정 {modified.isoformat()})")


if __name__ == "__main__":
    main()
