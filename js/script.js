/* [97차] 상담 접수 → Make Webhook → Discord 상담문의 채널
   Make 시나리오의 Custom webhook 주소(https://hook.○○○.make.com/...)를 아래 따옴표 안에 붙여 넣으세요.
   주소 형식이 맞지 않으면 네트워크 요청 없이 '연결되지 않았습니다' 안내만 표시합니다.
   [224차] 구 Google Sheets(Apps Script) 접수 경로·CONSULT_API_URL 삭제 — 상담 접수는 Make 단일 경로 (되돌리기: backup/224차수정전/script.js)
   ※ Discord Webhook 주소는 홈페이지에 넣지 말고 Make 시나리오 안에서만 사용하세요. */
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/pmov2v7wclcd95n8esvydrp6c16tadel";

/* [221차] GA4 상담 전환 추적 설정
   · ANALYTICS_ENABLED = false 이면 Google 태그를 불러오지 않고 아무것도 전송하지 않습니다(추적 모듈 전체 비활성).
     개인정보처리방침·동의 문구 확정과 운영 승인 후에만 true 로 바꾸세요.
   · ATTRIBUTION_TO_MAKE = false 이면 Make 전송 데이터는 기존 11개 필드 그대로입니다.
     Make 테스트 시나리오에서 신규 필드(landing_page 등) 수신을 확인한 뒤에만 true 로 바꾸세요.
   · 되돌리기: 두 값을 false 로 두면 [221차] 이전과 같은 동작입니다. */
const GA4_ID = "G-JQ98E36W6G";
const ANALYTICS_ENABLED = false;
const ATTRIBUTION_TO_MAKE = false;

/* [221차] 상담 전환 추적 모듈 (window.sigTrack)
   · 클릭 추적: 문서 전체 이벤트 위임 — 상담(consult.html)·전화(tel:)·카카오(open/pf.kakao.com) 링크의 기존 목적지·동작은 바꾸지 않음
   · 유입 기록: sessionStorage(탭 단위) — 최초 랜딩 경로·유입 도메인·utm 3종 / 마지막 상담 클릭 페이지·CTA 유형. URL 쿼리·해시 제거, 민감 경로 제외
   · GA4 전송값은 허용 목록 키만, 개인정보(이름·전화·학교·입력값·전체 URL·웹훅 주소) 없음
   · 모든 처리는 try/catch — 추적 오류·저장소 차단이 상담폼·전화·카카오 기능을 막지 않음 */
(function () {
  var noop = function () {};
  window.sigTrack = { event: noop, lead: noop, attribution: function () { return null; } };
  var ACTIVE = (typeof ANALYTICS_ENABLED !== 'undefined' && ANALYTICS_ENABLED === true) || (typeof ATTRIBUTION_TO_MAKE !== 'undefined' && ATTRIBUTION_TO_MAKE === true);
  if (!ACTIVE || window.__sigTrackInit) return;
  window.__sigTrackInit = true;
  try {
    var GA_ON = ANALYTICS_ENABLED === true && /^G-[A-Z0-9]{4,}$/.test(String(GA4_ID));
    var KEY_LP = 'sig_lp', KEY_CTA = 'sig_cta';
    var ssGet = function (k) { try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
    var ssSet = function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    /* 경로만 (쿼리·해시 제거) · 민감 경로 제외 · 100자 */
    var cleanPath = function (p) {
      p = String(p || '/').split(/[?#]/)[0];
      try { p = decodeURI(p); } catch (e) {}
      if (/(^|\/)(backup|tools|docs)(\/|$)/i.test(p) || /@/.test(p) || /\d{7,}/.test(p)) return '(excluded)';
      return p.slice(0, 100);
    };
    var cleanRef = function () {
      try {
        if (!document.referrer) return 'direct';
        var h = new URL(document.referrer).hostname;
        return h === location.hostname ? 'internal' : h.slice(0, 60);
      } catch (e) { return 'unknown'; }
    };
    var cleanText = function (v) {
      v = String(v == null ? '' : v).slice(0, 100);
      if (/@/.test(v) || /\d{7,}/.test(v.replace(/[\s.-]/g, ''))) return '(excluded)';
      return v;
    };
    var utm = function () {
      var o = {};
      try {
        var q = new URLSearchParams(location.search);
        ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
          var v = q.get(k);
          if (v) { v = v.replace(/[^A-Za-z0-9_.\-가-힣]/g, '').slice(0, 50); if (v && !/\d{7,}/.test(v)) o[k] = v; }
        });
      } catch (e) {}
      return o;
    };
    var PAGE = cleanPath(location.pathname);
    /* 최초 랜딩 (탭에서 한 번만) */
    if (!ssGet(KEY_LP)) {
      var lp = { path: PAGE, ref: cleanRef(), t: Date.now() }, u = utm();
      for (var k in u) lp[k] = u[k];
      ssSet(KEY_LP, lp);
    }
    /* GA4 (허용 키만 전송) */
    var ALLOW = { cta_type: 1, page_path: 1, form_id: 1, landing_page: 1, landing_ref: 1, cta_page: 1, field: 1, transport_type: 1 };
    var send = noop;
    if (GA_ON) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
      document.head.appendChild(s);
      window.gtag('js', new Date());
      /* 자동 page_view 끔(send_page_view:false) → 아래에서 정리된 위치로 한 번만 수동 전송 */
      window.gtag('config', GA4_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: location.origin + PAGE,
        page_referrer: ''
      });
      send = function (name, params) {
        var p = {};
        for (var key in params) if (ALLOW[key] && params[key] != null) p[key] = cleanText(params[key]);
        p.send_to = GA4_ID;
        window.gtag('event', name, p);
      };
      if (!window.__sigPageViewSent) {
        window.__sigPageViewSent = true;
        send('page_view', { page_path: PAGE });
      }
    }
    var attribution = function () {
      var lp2 = ssGet(KEY_LP) || {}, c = ssGet(KEY_CTA) || {};
      return {
        landing_page: lp2.path || 'unknown', landing_ref: lp2.ref || 'unknown',
        cta_page: c.page || 'unknown', cta_type: c.type || 'unknown',
        utm_source: lp2.utm_source || '', utm_medium: lp2.utm_medium || '', utm_campaign: lp2.utm_campaign || ''
      };
    };
    /* 클릭 위임 (기존 목적지·기본 동작 유지 · 같은 링크 1초 안 반복 무시) */
    var last = { el: null, t: 0 };
    var ctaType = function (a) {
      if (a.closest('.sig-header')) return 'header';
      if (a.closest('.sig-float')) return a.closest('.rg-float') ? 'float' : 'auto_float';
      if (a.closest('.ar-hero, .rg-hero, .hero, .tu-hero, .page-hero')) return 'hero';
      if (a.closest('.ar-cta, .mt-midcta')) return 'cta_section';
      if (a.closest('.consult-quick, .consult-guide')) return 'consult_page';
      return 'body';
    };
    document.addEventListener('click', function (e) {
      try {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var href = a.getAttribute('href') || '', name = null;
        if (/^tel:/i.test(href)) name = 'click_call';
        else if (/^https?:\/\/(open|pf)\.kakao\.com\//i.test(href)) name = 'click_kakao';
        else { var url = new URL(a.href, location.href); if (url.origin === location.origin && /\/consult\.html$/.test(url.pathname)) name = 'click_consult'; }
        if (!name) return;
        var now = Date.now();
        if (last.el === a && now - last.t < 1000) return;
        last = { el: a, t: now };
        var type = ctaType(a);
        ssSet(KEY_CTA, { page: PAGE, type: type, channel: name.replace('click_', ''), t: now });
        send(name, { cta_type: type, page_path: PAGE, transport_type: 'beacon' });
      } catch (err) {}
    }, true);
    /* 상담 접수 성공(서버 2xx 확인 후)에만 호출 · 같은 제출 ID는 한 번만 */
    var leadSent = {};
    window.sigTrack = {
      event: function (name, params) { try { if (/^[a-z_]{3,40}$/.test(name)) send(name, params || {}); } catch (e) {} },
      lead: function (submitId) {
        try {
          if (!submitId || leadSent[submitId]) return;
          leadSent[submitId] = true;
          var at = attribution();
          send('generate_lead', { form_id: 'consult', landing_page: at.landing_page, landing_ref: at.landing_ref, cta_page: at.cta_page, cta_type: at.cta_type });
        } catch (e) {}
      },
      attribution: function () { try { return attribution(); } catch (e) { return null; } }
    };
  } catch (err) {
    window.sigTrack = { event: noop, lead: noop, attribution: function () { return null; } };
  }
})();

window.addEventListener("load",function(){
  if(!location.hash){window.scrollTo(0,0);}
});

window.addEventListener("load", function(){
  const slider = document.getElementById("hero-slider");
  if(!slider) return;

  const slides = Array.from(slider.querySelectorAll(".hero-slide"));
  const dots = Array.from(slider.querySelectorAll(".signature-slider-dot"));
  if(!slides.length) return;

  let current = 0;
  let timer = null;
  const interval = 3000;

  function show(index){
    current = (index + slides.length) % slides.length;

    slides.forEach(function(slide, i){
      slide.classList.toggle("is-active", i === current);
    });

    dots.forEach(function(dot, i){
      dot.classList.toggle("is-active", i === current);
      dot.setAttribute("aria-pressed", i === current ? "true" : "false");
    });
  }

  function queueNext(){
    stop();
    timer = setTimeout(function(){
      show(current + 1);
      queueNext();
    }, interval);
  }

  function start(){
    queueNext();
  }

  function stop(){
    if(timer){
      clearTimeout(timer);
      timer = null;
    }
  }

  dots.forEach(function(dot, i){
    dot.addEventListener("click", function(){
      show(i);
      start();
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("touchstart", stop, {passive:true});
  slider.addEventListener("touchend", start, {passive:true});

  document.addEventListener("visibilitychange", function(){
    if(document.hidden) stop();
    else start();
  });

  show(0);
  start();
});

/* 시그니처과외 공통 스크립트: 상단 드롭다운, 모바일 메뉴, 상담 신청 폼 */

/* 상단 '과외' 드롭다운 */
(function () {
  var dd = document.querySelector('.sig-nav-dropdown');
  if (!dd) return;
  var btn = dd.querySelector('.sig-nav-dropdown-toggle');
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var open = dd.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  /* [1차 수정] 같은 페이지 섹션으로 이동하는 메뉴를 누르면 드롭다운 닫기 */
  dd.querySelectorAll('.sig-nav-dropdown-menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      dd.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', function (e) {
    if (!dd.contains(e.target)) {
      dd.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* 모바일 메뉴 */
(function () {
  var header = document.querySelector('.sig-header');
  var toggle = document.querySelector('.sig-mobile-toggle');
  var menu = document.getElementById('sigMobileMenu');
  if (!header || !toggle || !menu) return;
  function setOpen(open) {
    header.classList.toggle('is-menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!header.classList.contains('is-menu-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', function (e) {
    if (!header.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) setOpen(false);
  });
})();

/* 상담 신청 폼(consult.html): 입력 확인 → Make Webhook 접수 ([224차] 구 Google Sheets 경로 삭제)
   ※ MAKE_WEBHOOK_URL(이 파일 맨 위)이 올바른 Make 주소일 때만 전송합니다.
     형식이 맞지 않으면 네트워크 요청을 보내지 않고 '연결되지 않았습니다' 안내만 표시합니다.
     Make가 2xx를 돌려준 경우에만 '접수되었습니다' 문구를 표시합니다.
     민감정보 보호를 위해 입력값을 console에 출력하지 않습니다. */
(function () {
  var form = document.getElementById('consultForm');
  if (!form) return;
  var f = form.elements;
  var msg = form.querySelector('.form-message');
  var submitBtn = form.querySelector('[type="submit"]');
  var submitLabel = submitBtn ? submitBtn.textContent : '';
  var loadedAt = Date.now();
  var submitting = false;
  var MIN_FILL_MS = 3000; /* 페이지를 연 뒤 3초 안의 제출은 자동 입력(스팸)으로 보고 막음 */
  var TIMEOUT_MS = 15000;
  var MSG_NOT_CONNECTED = '상담 접수 주소가 아직 연결되지 않았습니다. 입력하신 내용은 전송되거나 저장되지 않았습니다.';
  var MSG_FAIL = '상담 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  var MSG_MAKE_SUCCESS = '상담 신청이 접수되었습니다.'; /* [97차] */
  var MSG_MAKE_FAIL = '접수 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 전화·카카오톡 상담으로 연락해 주세요.'; /* [269차] 실패 시 다른 상담 경로 안내 */
  var MSG_REPEAT = '방금 상담 신청이 접수되었습니다. 추가 문의는 잠시 후 다시 신청하시거나 전화로 연락해 주세요.';
  var REPEAT_MS = 60000; /* [97차] 접수 성공 후 1분 안의 반복 제출 차단 */
  var REPEAT_KEY = 'sigConsultLastSent';
  var lastSentAt = 0;
  var makeUrl = typeof MAKE_WEBHOOK_URL === 'string' ? MAKE_WEBHOOK_URL.trim() : '';
  var useMake = /^https:\/\/hook\.[a-z0-9.-]*make\.com\/[A-Za-z0-9_-]+$/.test(makeUrl);
  var apiReady = useMake; /* [224차] Make 단일 경로 */
  function getLastSent() {
    var t = lastSentAt;
    try { t = Math.max(t, Number(localStorage.getItem(REPEAT_KEY)) || 0); } catch (e) {}
    return t;
  }
  function setLastSent() {
    lastSentAt = Date.now();
    try { localStorage.setItem(REPEAT_KEY, String(lastSentAt)); } catch (e) {}
  }

  form.noValidate = true; /* JS가 동작하면 브라우저 기본 말풍선 대신 아래 안내 문구로 확인 */
  function show(type, text) {
    msg.className = 'form-message is-' + type;
    msg.textContent = text;
    msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function fail(field, text) {
    var el = field.length && !field.tagName ? field[0] : field;
    if (el.setAttribute && el.type !== 'radio' && el.type !== 'checkbox') el.setAttribute('aria-invalid', 'true');
    try { window.sigTrack.event('form_error', { field: el.name || 'unknown' }); } catch (err) {} /* [221차] 틀린 칸 이름만 (입력값 없음) */
    show('error', text);
    el.focus();
  }
  form.addEventListener('input', function (e) {
    if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid');
  });

  /* 접수 주소가 연결되면 사이드 안내의 '준비 중' 문구를 자동으로 바꿈 */
  var statusNote = document.getElementById('consultStatusNote');
  if (statusNote && apiReady) statusNote.textContent = '상담 신청서를 남겨주시면 내용을 확인한 뒤 연락드립니다.';

  /* [99차] 거주 지역 입력 기준: 수업 방식과 관계없이 시·도 + 시·구(군) + 동(읍·면)까지, 아파트명은 선택
     (기존 [14차] 방문=상세 주소 필수 / 화상=동까지 자동 전환은 사용하지 않음. 안내 문구·placeholder는 consult.html 기본값) */
  var regionHint = document.getElementById('cfRegionHint');
  var REGION_DEFAULT = {
    hint: regionHint ? regionHint.textContent : '',
    placeholder: f.region.placeholder
  };
  function applyRegionGuide(rule) {
    if (!rule || !regionHint) return;
    regionHint.textContent = rule.hint;
    f.region.placeholder = rule.placeholder;
  }

  /* [99차] 거주 지역 형식 확인: 주소 API·도로명 검증 없이 띄어쓰기 단위로만 확인
     첫 단어 = 시·도(부산광역시·서울·경기도 등) → 시/구/군으로 끝나는 단어(세종은 생략 가능) → 동/읍/면/가/리로 끝나는 단어.
     그 뒤(아파트명 등)는 자유. 도로명·번지·동호수·우편번호는 요구하지 않음 */
  var SIDO = /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|충청|전북|전남|전라|경북|경남|경상|제주)/;
  function looksRegion(v) {
    var t = v.split(/\s+/), i = 1, sigu = false;
    if (v.replace(/\s/g, '').length < 7 || t.length < 2 || !SIDO.test(t[0])) return false;
    while (i < t.length && /^[가-힣0-9]+[시구군]$/.test(t[i])) { sigu = true; i++; }
    if (!sigu && !/^세종/.test(t[0])) return false;
    return i < t.length && /^[가-힣0-9·.]+[동읍면가리]$/.test(t[i]);
  }

  /* [269차] 신청자 확인: 학생 본인 → 만 14세 이상 여부(age14) / 학부모 → 법정대리인 확인(guardian) 칸만 보이기 · 학년으로 나이를 추정하지 않음 */
  var ageBox = document.getElementById('cfAgeBox'), guardianBox = document.getElementById('cfGuardianBox');
  function syncApplicant() {
    var who = f.applicant.value;
    if (ageBox) ageBox.hidden = who !== '학생';
    if (guardianBox) guardianBox.hidden = who !== '학부모';
  }
  form.addEventListener('change', function (e) { if (e.target && e.target.name === 'applicant') syncApplicant(); });
  syncApplicant();

  /* [271차] 관심 과목 버튼(.cf-chip): 누르면 subject 칸에 과목을 넣고 빼기("수학, 영어") · 직접 입력과 함께 사용 · 버튼이 없으면 아무 일도 하지 않음 */
  var chips = form.querySelectorAll('.cf-chip[data-subject]');
  function subjTokens() { return f.subject.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function syncChips() {
    var t = subjTokens();
    for (var i = 0; i < chips.length; i++) chips[i].setAttribute('aria-pressed', t.indexOf(chips[i].getAttribute('data-subject')) >= 0 ? 'true' : 'false');
  }
  for (var ci = 0; ci < chips.length; ci++) chips[ci].addEventListener('click', function () {
    var s = this.getAttribute('data-subject'), t = subjTokens(), k = t.indexOf(s);
    if (k >= 0) t.splice(k, 1); else t.push(s);
    f.subject.value = t.join(', ').slice(0, 50);
    f.subject.removeAttribute('aria-invalid');
    syncChips();
  });
  f.subject.addEventListener('input', syncChips);

  /* [102차] 간소화한 폼에는 문의내용 칸이 없으므로 message = "학교: ○○ / 신청자: 학부모" (학교 미입력 시 '미입력')
     [269차] 신청자 뒤에 확인 내용을 붙임: "신청자: 학부모(법정대리인 확인)" / "신청자: 학생(만 14세 이상 확인)" — applicant_type 값(학부모·학생)은 그대로 */
  /* [269·270 마무리] 동의 기록: 기존 Make 전송 필드 11개는 그대로 두고 message 끝에 "동의: 수집·이용, 국외 이전(고지 2026-10-25판)"을 붙임
     · 동의 시각 = 같은 전송의 submitted_at(제출 때 두 동의를 모두 확인한 뒤에만 전송) · 고지문(consult.html·privacy.html 5번)을 바꾸면 CONSENT_VERSION도 바꿀 것 */
  var CONSENT_VERSION = '2026-10-25';
  function buildMessage() {
    var who = f.applicant.value, note = who === '학부모' ? '(법정대리인 확인)' : who === '학생' ? '(만 14세 이상 확인)' : '';
    return '학교: ' + (f.school.value.trim() || '미입력') + ' / 신청자: ' + who + note + ' / 동의: 수집·이용, 국외 이전(고지 ' + CONSENT_VERSION + '판)';
  }

  /* [97차] Make Webhook 전송 데이터: 기본 6개(name·phone·grade·subject·region·message) + 접수 페이지·제출 시간 ([102차] 수업방식 lesson_type 삭제) */
  function kstNow() {
    var d = new Date(Date.now() + 9 * 3600000);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' +
      p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + ' (KST)';
  }
  function buildMakePayload() {
    var base = {
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      grade: f.grade.value,
      subject: f.subject.value.trim(),
      region: f.region.value.trim(),
      school: f.school.value.trim() || '미입력', /* [116차] 학교·신청자 구분을 별도 필드로도 전송 (message는 그대로 유지) */
      applicant_type: f.applicant.value,
      message: buildMessage(),
      page_url: location.origin + location.pathname, /* [269차] 주소 뒤 광고·검색 매개변수(?utm_… 등)와 #는 보내지 않음 */
      page_title: document.title,
      submitted_at: kstNow()
    };
    /* [221차] 유입 필드(landing_page 등)는 ATTRIBUTION_TO_MAKE = true 일 때만 기존 11개 필드 뒤에 추가 (기존 필드 이름·값 변경 없음) */
    try {
      if (typeof ATTRIBUTION_TO_MAKE !== 'undefined' && ATTRIBUTION_TO_MAKE === true) {
        var at = window.sigTrack.attribution();
        if (at) for (var k in at) if (!(k in base)) base[k] = at[k];
      }
    } catch (err) {}
    return base;
  }

  function setSubmitting(on) {
    submitting = on;
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? '접수 중...' : submitLabel;
    submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function resetAfterSuccess() {
    form.reset(); /* 입력값·신청자 선택·개인정보 동의 초기화 */
    applyRegionGuide(REGION_DEFAULT); /* 주소 안내를 기본 상태로 */
    var invalid = form.querySelectorAll('[aria-invalid]');
    for (var k = 0; k < invalid.length; k++) invalid[k].removeAttribute('aria-invalid');
    syncApplicant(); /* [269차] 신청자 선택이 초기화되면 확인 칸도 숨김 */
    syncChips(); /* [271차] 과목 버튼 선택 표시도 초기화 */
    loadedAt = Date.now();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return; /* 중복 제출 방지 */

    /* 스팸 방지(honeypot): 사람에게 보이지 않는 칸에 값이 있으면 전송하지 않음 */
    if (f.website && f.website.value) return show('error', MSG_FAIL);

    var phone = f.phone.value.replace(/[^0-9]/g, '');
    var region = f.region.value.trim();
    /* [102차] 화면 순서대로 확인: 학생이름 → 지역 → 학년 → 문의과목 → 휴대폰번호 → 신청자 → 개인정보 동의 (학교는 선택) */
    if (!f.name.value.trim()) return fail(f.name, '학생 이름을 입력해 주세요.');
    if (!region) return fail(f.region, '지역을 입력해 주세요.');
    if (!looksRegion(region)) return fail(f.region, '지역은 시·도, 시·구, 동까지 입력해 주세요. (예: 부산광역시 부산진구 부암동)');
    if (!f.grade.value) return fail(f.grade, '학년을 선택해 주세요.');
    if (!f.subject.value.trim()) return fail(f.subject, '관심 과목을 고르거나 입력해 주세요.');
    if (!/^01[0-9]{8,9}$/.test(phone)) return fail(f.phone, '휴대폰번호를 정확히 입력해 주세요. (예: 010-1234-5678)');
    if (!f.applicant.value) return fail(f.applicant, '신청자(학부모 · 학생)를 선택해 주세요.');
    /* [269차] 만 14세 미만 학생 본인 신청 차단 · 학부모 신청은 법정대리인 확인 필수 */
    if (f.applicant.value === '학생') {
      if (!f.age14.value) return fail(f.age14, '학생 나이(만 14세 이상 · 미만)를 선택해 주세요.');
      if (f.age14.value !== 'over') return fail(f.age14, '만 14세 미만 학생은 법정대리인(부모 등)의 동의가 필요합니다. 학부모님이 신청자를 \'학부모\'로 선택해 신청해 주세요.');
    }
    if (f.applicant.value === '학부모' && !f.guardian.checked) return fail(f.guardian, '학생의 법정대리인(부모 등)인지 확인해 주세요. 법정대리인이 아니시면 전화로 문의해 주세요.');
    if (!f.agree.checked) return fail(f.agree, '개인정보 수집·이용에 동의하셔야 상담을 신청할 수 있습니다.');
    /* [269·270 마무리] 국외 이전 별도 동의가 없으면 Make로 보내지 않음(전화 상담 안내) */
    if (!f.agree_transfer || !f.agree_transfer.checked) return fail(f.agree_transfer || f.agree, '개인정보 국외 이전에 동의하지 않으시면 온라인 신청서를 보낼 수 없습니다. 전화 상담으로 신청해 주세요.');

    /* 스팸 방지: 너무 빠른 제출 차단 */
    if (Date.now() - loadedAt < MIN_FILL_MS) return show('error', '입력 내용을 확인하고 있습니다. 잠시 후 다시 신청해 주세요.');

    /* 접수 주소(placeholder) 미연결: 네트워크 요청을 보내지 않음 */
    if (!apiReady) return show('info', MSG_NOT_CONNECTED);

    /* [97차] 스팸 방지: 접수 성공 직후 반복 제출 차단 */
    if (Date.now() - getLastSent() < REPEAT_MS) return show('info', MSG_REPEAT);

    setSubmitting(true);
    var submitId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); /* [221차] generate_lead 중복 방지용 제출 ID (개인정보 아님) */
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;

    /* [97차] Make Webhook: JSON(UTF-8)으로 Make에만 전송. Make는 정상 수신 시 200 "Accepted"를 돌려줌 */
    if (useMake) {
      fetch(makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(buildMakePayload()),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          if (!res.ok) throw new Error('http');
          setLastSent();
          resetAfterSuccess();
          show('success', MSG_MAKE_SUCCESS);
          try { window.sigTrack.lead(submitId); } catch (err) {} /* [221차] Make 2xx 확인 후에만 generate_lead */
        })
        .catch(function () {
          show('error', MSG_MAKE_FAIL); /* 입력 내용 유지 */
        })
        .then(function () {
          if (timer) clearTimeout(timer);
          setSubmitting(false);
        });
    }
  });
  /* 연락처 자동 하이픈 */
  f.phone.addEventListener('input', function () {
    var v = this.value.replace(/[^0-9]/g, '').slice(0, 11);
    if (v.length > 7) v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1-$2');
    this.value = v;
  });
})();

(function(){var t=document.getElementById('tpTrack');if(!t)return;
var cards=t.querySelectorAll('.tp-card');
function pos(k){return cards[k].offsetLeft-cards[0].offsetLeft;}
function cur(){var x=t.scrollLeft,b=0,d=1e9;for(var k=0;k<cards.length;k++){var e=Math.abs(pos(k)-x);if(e<d){d=e;b=k;}}return b;}
function go(dir){var max=t.scrollWidth-t.clientWidth,k=cur()+dir;
if(dir>0&&t.scrollLeft>=max-4)k=0;else if(dir<0&&t.scrollLeft<=4)k=-1;
var x=k<0?max:Math.min(pos(k),max);t.scrollTo({left:x,behavior:'smooth'});}
var timer=null,paused=false;
function start(){stop();timer=setInterval(function(){if(!paused&&!document.hidden)go(1);},2000);}
function stop(){if(timer)clearInterval(timer);timer=null;}
document.getElementById('tpNext').addEventListener('click',function(){go(1);start();});
document.getElementById('tpPrev').addEventListener('click',function(){go(-1);start();});
var sec=document.getElementById('teacher-preview');
sec.addEventListener('mouseenter',function(){paused=true;});
sec.addEventListener('mouseleave',function(){paused=false;});
t.addEventListener('touchstart',function(){paused=true;},{passive:true});
t.addEventListener('touchend',function(){setTimeout(function(){paused=false;},4000);},{passive:true});
if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))start();})();

/* [48차] 메인: 학생 후기 순차 등장 + 신뢰 수치 카운트업 (한 번만 실행, IntersectionObserver)
   · 후기: #rvxPanel 안 .rvx-item 이 위→아래로 0.35초 간격 등장 (기존 [20차] 후기 가로 슬라이드 코드는 제거)
   · 숫자: .count-up[data-count] 를 0부터 목표값까지 1.2초 증가 (data-decimals 로 소수 자릿수 지정) */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;
  function once(el, cb, threshold) {
    if (!canObserve) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); cb(); } });
    }, { threshold: threshold || 0.2 });
    io.observe(el);
  }

  var panel = document.getElementById('rvxPanel');
  if (panel && canObserve && !reduce) {
    var items = panel.querySelectorAll('.rvx-item');
    panel.classList.add('rvx-ready');
    once(panel, function () {
      items.forEach(function (it, i) { setTimeout(function () { it.classList.add('is-in'); }, i * 350); });
    }, 0.15);
  }

  var nums = document.querySelectorAll('.count-up[data-count]');
  if (!nums.length || reduce || !canObserve) return;
  function fmt(v, d) { return v.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  nums.forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (isNaN(target)) return;
    el.textContent = fmt(0, dec);
    once(el, function () {
      /* [90차] data-duration(ms)으로 시간 지정 가능(기본 1200 · 메인 그대로) · data-ease="quart"면 끝부분이 더 부드럽게 감속 · 끝나면 .is-done (마무리 효과용) */
      var start = null, DUR = parseInt(el.getAttribute('data-duration') || '1200', 10);
      var pw = el.getAttribute('data-ease') === 'quart' ? 4 : 3;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / DUR, 1);
        var eased = 1 - Math.pow(1 - p, pw);
        el.textContent = fmt(p < 1 ? target * eased : target, dec);
        if (p < 1) requestAnimationFrame(tick); else el.classList.add('is-done');
      }
      requestAnimationFrame(tick);
    }, 0.4);
  });
})();
/* [25차] 과목과외 추천 학생 슬라이드 제거 (4개 카드 동시 노출로 변경, CSS만 사용) */

/* [59차] 과목과외: 선생님 안내 카드 가로 슬라이드 (#tchTrack · 3초 자동 넘김, 마지막 → 처음 순환, 마우스·터치·포커스 시 일시정지) */
(function(){var t=document.getElementById('tchTrack');if(!t)return;
var cards=t.querySelectorAll('.tch-card');if(cards.length<2)return;
function pos(k){return cards[k].offsetLeft-cards[0].offsetLeft;}
function cur(){var x=t.scrollLeft,b=0,d=1e9;for(var k=0;k<cards.length;k++){var e=Math.abs(pos(k)-x);if(e<d){d=e;b=k;}}return b;}
function go(dir){var max=t.scrollWidth-t.clientWidth,k=cur()+dir;
if(dir>0&&t.scrollLeft>=max-4)k=0;else if(dir<0&&t.scrollLeft<=4)k=-1;
var x=k<0?max:Math.min(pos(k),max);t.scrollTo({left:x,behavior:'smooth'});}
var timer=null,paused=false;
function start(){stop();timer=setInterval(function(){if(!paused&&!document.hidden)go(1);},3000);}
function stop(){if(timer)clearInterval(timer);timer=null;}
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var prev=document.getElementById('tchPrev'),next=document.getElementById('tchNext');
if(next)next.addEventListener('click',function(){go(1);if(!reduce)start();});
if(prev)prev.addEventListener('click',function(){go(-1);if(!reduce)start();});
var sec=document.getElementById('teachers')||t;
sec.addEventListener('mouseenter',function(){paused=true;});
sec.addEventListener('mouseleave',function(){paused=false;});
sec.addEventListener('focusin',function(){paused=true;});
sec.addEventListener('focusout',function(){paused=false;});
t.addEventListener('touchstart',function(){paused=true;},{passive:true});
t.addEventListener('touchend',function(){setTimeout(function(){paused=false;},4000);},{passive:true});
if(!reduce)start();})();

/* [68차] 사이트 전체: 떠 있는 상담 버튼 3개 자동 삽입 (스타일은 css/style.css [68차] 블록)
   · 상담신청 주소는 이 스크립트 위치 기준으로 계산해 하위 폴더 페이지에서도 정상 연결 */
(function(){if(document.querySelector('.sig-float'))return;
var me=document.currentScript||document.querySelector('script[src*="js/script.js"]');
var consult='consult.html';try{consult=new URL('../consult.html',me.src).href;}catch(e){}
var nav=document.createElement('nav');nav.className='sig-float';nav.setAttribute('aria-label','빠른 상담');
nav.innerHTML=
'<a class="sf-kakao" href="https://open.kakao.com/o/gL2WvLQi" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3z"/></svg>카카오톡 상담</a>'+
'<a class="sf-trial" href="'+consult+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z"/><path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z"/></svg>시범수업 신청</a>'+
'<a class="sf-phone" href="tel:01058701109" title="전화 상담 연결" aria-label="전화 상담 연결"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>전화상담</a>';
document.body.appendChild(nav);document.body.classList.add('has-sig-float');})();

/* [77차] 방문과외: 주요 과목 아이콘 카드 자동 슬라이드 (#vsSubjTrack · 3.5초마다 한 칸, 끝이면 처음으로 · 마우스·포커스·터치 중 정지 · 좌우 화살표) */
(function(){var t=document.getElementById('vsSubjTrack');if(!t)return;
var cards=t.querySelectorAll('.vs-subj-card');if(cards.length<2)return;
function pos(k){return cards[k].offsetLeft-cards[0].offsetLeft;}
function cur(){var x=t.scrollLeft,b=0,d=1e9;for(var k=0;k<cards.length;k++){var e=Math.abs(pos(k)-x);if(e<d){d=e;b=k;}}return b;}
function go(dir){var max=t.scrollWidth-t.clientWidth,k=cur()+dir;
if(dir>0&&t.scrollLeft>=max-4)k=0;else if(dir<0&&t.scrollLeft<=4)k=-1;
var x=k<0?max:Math.min(pos(k),max);t.scrollTo({left:x,behavior:'smooth'});}
var timer=null,paused=false;
function start(){stop();timer=setInterval(function(){if(!paused&&!document.hidden)go(1);},3500);}
function stop(){if(timer)clearInterval(timer);timer=null;}
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var prev=document.getElementById('vsSubjPrev'),next=document.getElementById('vsSubjNext');
if(next)next.addEventListener('click',function(){go(1);if(!reduce)start();});
if(prev)prev.addEventListener('click',function(){go(-1);if(!reduce)start();});
var box=t.parentNode;
box.addEventListener('mouseenter',function(){paused=true;});
box.addEventListener('mouseleave',function(){paused=false;});
box.addEventListener('focusin',function(){paused=true;});
box.addEventListener('focusout',function(){paused=false;});
t.addEventListener('touchstart',function(){paused=true;},{passive:true});
t.addEventListener('touchend',function(){setTimeout(function(){paused=false;},4000);},{passive:true});
if(!reduce)start();})();

/* [90차] 통합 1:1수업(body.page-tutoring): REAL RESULTS 성과 카드 순차 등장 + 점수 변화 + 상승 문구 지연 / 시범수업 CTA fade-up
   · 한 번만 실행(IntersectionObserver 해제) · 동작 줄이기 설정이거나 IntersectionObserver가 없으면 아무것도 하지 않음(처음부터 최종 상태 그대로 보임) */
(function () {
  if (!document.body.classList.contains('page-tutoring')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  function once(el, cb, th) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(); } }); }, { threshold: th || 0.2 });
    io.observe(el);
  }
  var grid = document.querySelector('#results .rs-grid');
  if (grid) {
    var cards = grid.querySelectorAll('.rs-card');
    var plans = [];
    cards.forEach(function (card) {
      var after = card.querySelector('.rs-after'), before = card.querySelector('.rs-before'), gain = card.querySelector('.rs-gain');
      var unit = after && after.querySelector('small') ? after.querySelector('small').textContent : '';
      var node = after && after.firstChild && after.firstChild.nodeType === 3 ? after.firstChild : null;
      var to = node ? parseInt(node.nodeValue, 10) : NaN, from = before ? parseInt(before.textContent, 10) : NaN;
      var isScore = unit === '점' && !isNaN(to) && !isNaN(from) && from < to;
      if (isScore) node.nodeValue = String(from);
      plans.push({ card: card, after: after, gain: gain, node: node, from: from, to: to, isScore: isScore });
    });
    grid.classList.add('rs-anim');
    once(grid, function () {
      plans.forEach(function (p, i) {
        setTimeout(function () {
          p.card.classList.add('is-in');
          setTimeout(function () { p.card.classList.add('is-settled'); }, 650);
          var t0 = 220, DUR = p.isScore ? 900 : 450;
          setTimeout(function () {
            p.card.classList.add('show-after');
            if (p.isScore) {
              var s = null;
              var tick = function (ts) {
                if (s === null) s = ts;
                var k = Math.min((ts - s) / DUR, 1), e = 1 - Math.pow(1 - k, 3);
                p.node.nodeValue = String(k < 1 ? Math.round(p.from + (p.to - p.from) * e) : p.to);
                if (k < 1) requestAnimationFrame(tick);
              };
              requestAnimationFrame(tick);
            }
          }, t0);
          setTimeout(function () { p.card.classList.add('show-gain'); }, t0 + DUR + 300);
        }, i * 150);
      });
    }, 0.25);
  }
  var cta = document.querySelector('.tu-trial');
  if (cta) {
    cta.classList.add('tu-reveal');
    once(cta, function () { cta.classList.add('is-in'); }, 0.25);
  }
})();