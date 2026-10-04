/* =====================================================================
   [14.5차] 상담 접수 설정 (Google Sheets 연결)
   Google Apps Script 웹 앱을 배포한 뒤 받은 URL(https://script.google.com/macros/s/.../exec)을
   아래 따옴표 안에 붙여 넣으세요. 기본값(placeholder) 그대로이면 실제 전송하지 않습니다.
   연결 방법: docs/상담접수_구글시트_연결방법.txt
   ===================================================================== */
const CONSULT_API_URL = "https://script.google.com/macros/s/AKfycbxe_OFPl8e0mHqatLVoC_YcDBRul4QJBqozwvtEmB85cFYutmlGTQ2T118611EMh-B5/exec";

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

/* 상담 신청 폼(consult.html): 입력 확인 → Google Sheets 접수
   ※ [14.5차] CONSULT_API_URL(이 파일 맨 위)에 실제 Apps Script 웹 앱 URL이 들어 있을 때만 전송합니다.
     기본값(placeholder) 상태에서는 네트워크 요청을 보내지 않고 '연결되지 않았습니다' 안내만 표시합니다.
     Apps Script가 success: true 를 돌려준 경우에만 '접수되었습니다' 문구를 표시합니다.
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
  var MSG_SUCCESS = '상담 신청이 접수되었습니다. 확인 후 안내드리겠습니다.';
  var MSG_FAIL = '상담 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  var apiUrl = typeof CONSULT_API_URL === 'string' ? CONSULT_API_URL.trim() : '';
  var apiReady = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(apiUrl);

  form.noValidate = true; /* JS가 동작하면 브라우저 기본 말풍선 대신 아래 안내 문구로 확인 */
  function show(type, text) {
    msg.className = 'form-message is-' + type;
    msg.textContent = text;
    msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function fail(field, text) {
    var el = field.length && !field.tagName ? field[0] : field;
    if (el.setAttribute && el.type !== 'radio' && el.type !== 'checkbox') el.setAttribute('aria-invalid', 'true');
    show('error', text);
    el.focus();
  }
  form.addEventListener('input', function (e) {
    if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid');
  });

  /* 접수 주소가 연결되면 사이드 안내의 '준비 중' 문구를 자동으로 바꿈 */
  var statusNote = document.getElementById('consultStatusNote');
  if (statusNote && apiReady) statusNote.textContent = '상담 신청서를 남겨주시면 내용을 확인한 뒤 연락드립니다.';

  /* [14차] 수업 방식에 따라 거주 지역 입력 기준(안내 문구·placeholder) 자동 전환
     방문: 상세 주소 필수 / 화상: 시·도·구·군·동까지(아파트 거주 시 아파트 이름까지) */
  var regionHint = document.getElementById('cfRegionHint');
  var REGION_DEFAULT = {
    hint: regionHint ? regionHint.textContent : '',
    placeholder: f.region.placeholder
  };
  var REGION = {
    '방문': {
      hint: '방문수업 가능 여부 확인을 위해 상세 주소까지 입력해 주세요. (예: 부산광역시 해운대구 ○○로 00, ○○아파트 000동 000호)',
      placeholder: '예: 부산광역시 해운대구 ○○로 00, ○○아파트 000동 000호'
    },
    '화상': {
      hint: '화상수업은 시/도·구/군·동까지 입력해 주세요. 아파트 거주 시 아파트 이름까지만 적어 주세요. (예: 부산광역시 해운대구 우동 ○○아파트)',
      placeholder: '예: 부산광역시 해운대구 우동 ○○아파트'
    }
  };
  function applyRegionGuide(rule) {
    if (!rule || !regionHint) return;
    regionHint.textContent = rule.hint;
    f.region.placeholder = rule.placeholder;
  }
  function updateRegionGuide() { applyRegionGuide(REGION[f.mode.value]); }
  for (var i = 0; i < f.mode.length; i++) f.mode[i].addEventListener('change', updateRegionGuide);
  updateRegionGuide();

  /* 방문수업 상세 주소 형식 확인: 실제 주소 존재 여부는 확인하지 않고,
     너무 짧거나 번지·동호수 등 숫자가 없으면 상세 주소 입력을 안내 */
  function looksDetailed(v) {
    return v.replace(/\s/g, '').length >= 10 && /[0-9]/.test(v);
  }

  /* 전송 데이터 (Google Sheets 컬럼 순서: 접수시간·이름·연락처·학년·희망과목·수업방식·거주지역/상세주소·기타요청·개인정보동의·접수페이지·브라우저정보) */
  function buildPayload() {
    return {
      submittedAt: new Date().toISOString(),
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      grade: f.grade.value,
      subject: f.subject.value.trim(),
      lessonType: f.mode.value,
      region: f.region.value.trim(),
      message: f.message.value.trim(),
      privacyAgreed: f.agree.checked,
      page: location.href,
      userAgent: navigator.userAgent
    };
  }

  function setSubmitting(on) {
    submitting = on;
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? '접수 중...' : submitLabel;
    submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function resetAfterSuccess() {
    form.reset(); /* 입력값·방문/화상 선택·개인정보 동의 초기화 */
    applyRegionGuide(REGION_DEFAULT); /* 주소 안내를 기본 상태로 */
    var invalid = form.querySelectorAll('[aria-invalid]');
    for (var k = 0; k < invalid.length; k++) invalid[k].removeAttribute('aria-invalid');
    loadedAt = Date.now();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return; /* 중복 제출 방지 */

    /* 스팸 방지(honeypot): 사람에게 보이지 않는 칸에 값이 있으면 전송하지 않음 */
    if (f.website && f.website.value) return show('error', MSG_FAIL);

    var phone = f.phone.value.replace(/[^0-9]/g, '');
    var region = f.region.value.trim();
    if (!f.name.value.trim()) return fail(f.name, '이름(학생 또는 학부모)을 입력해 주세요.');
    if (!/^01[0-9]{8,9}$/.test(phone)) return fail(f.phone, '연락처를 정확히 입력해 주세요. (예: 010-1234-5678)');
    if (!f.grade.value) return fail(f.grade, '학년을 선택해 주세요.');
    if (!f.subject.value.trim()) return fail(f.subject, '희망 과목을 입력해 주세요.');
    if (!f.mode.value) return fail(f.mode, '수업 방식(방문수업 · 화상수업)을 선택해 주세요.');
    if (!region) return fail(f.region, f.mode.value === '방문' ? '방문수업은 상세 주소까지 입력해 주세요.' : '거주 지역을 입력해 주세요.');
    if (f.mode.value === '방문' && !looksDetailed(region)) return fail(f.region, '방문수업은 상세 주소까지 입력해 주세요.');
    if (!f.agree.checked) return fail(f.agree, '개인정보 수집·이용에 동의하셔야 상담을 신청할 수 있습니다.');

    /* 스팸 방지: 너무 빠른 제출 차단 */
    if (Date.now() - loadedAt < MIN_FILL_MS) return show('error', '입력 내용을 확인하고 있습니다. 잠시 후 다시 신청해 주세요.');

    /* 접수 주소(placeholder) 미연결: 네트워크 요청을 보내지 않음 */
    if (!apiReady) return show('info', MSG_NOT_CONNECTED);

    setSubmitting(true);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    /* Apps Script 웹 앱은 CORS 사전 요청(OPTIONS)을 처리하지 않으므로 text/plain으로 JSON을 보냄 */
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(buildPayload()),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error('http');
        return res.json();
      })
      .then(function (data) {
        if (data && data.success === true) {
          resetAfterSuccess();
          show('success', MSG_SUCCESS);
        } else {
          show('error', MSG_FAIL); /* 입력 내용 유지 */
        }
      })
      .catch(function () {
        show('error', MSG_FAIL); /* 입력 내용 유지 */
      })
      .then(function () {
        if (timer) clearTimeout(timer);
        setSubmitting(false);
      });
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

/* [20차] 메인 학생 후기 슬라이드 (선생님 슬라이더와 별도: rvTrack / rvPrev / rvNext)
   PC 3장 · 모바일 1장 보기, 4.5초 자동 이동, 마우스 올림·터치·포커스 중 정지, 끝에서 처음으로 */
(function () {
  var track = document.getElementById('rvTrack');
  if (!track) return;
  var cards = track.querySelectorAll('.rv-card');
  var prev = document.getElementById('rvPrev');
  var next = document.getElementById('rvNext');
  var section = document.getElementById('reviews');
  var AUTO_MS = 4500;
  var timer = null, paused = false;

  function step() {
    if (cards.length < 2) return track.clientWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  }
  function go(dir) {
    var max = track.scrollWidth - track.clientWidth;
    var x;
    if (dir > 0) x = track.scrollLeft >= max - 4 ? 0 : Math.min(track.scrollLeft + step(), max);
    else x = track.scrollLeft <= 4 ? max : Math.max(track.scrollLeft - step(), 0);
    track.scrollTo({ left: x, behavior: 'smooth' });
  }
  function start() {
    stop();
    timer = setInterval(function () { if (!paused && !document.hidden) go(1); }, AUTO_MS);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  next.addEventListener('click', function () { go(1); start(); });
  prev.addEventListener('click', function () { go(-1); start(); });
  section.addEventListener('mouseenter', function () { paused = true; });
  section.addEventListener('mouseleave', function () { paused = false; });
  track.addEventListener('focusin', function () { paused = true; });
  track.addEventListener('focusout', function () { paused = false; });
  track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
  track.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 4000); }, { passive: true });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) start();
})();

/* [24차] 과목과외 '이런 학생에게 추천합니다' 슬라이드 (메인 후기·선생님 슬라이더와 별도: recTrack / recPrev / recNext)
   PC 3장 · 모바일 1장 보기, 4.5초 자동 이동, 마우스 올림·터치·포커스 중 정지, 끝에서 처음으로 */
(function () {
  var track = document.getElementById('recTrack');
  if (!track) return;
  var cards = track.querySelectorAll('.rec-card');
  var section = document.getElementById('recommend');
  var AUTO_MS = 4500;
  var timer = null, paused = false;

  function step() {
    if (cards.length < 2) return track.clientWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  }
  function go(dir) {
    var max = track.scrollWidth - track.clientWidth;
    if (max <= 4) return;
    var x;
    if (dir > 0) x = track.scrollLeft >= max - 4 ? 0 : Math.min(track.scrollLeft + step(), max);
    else x = track.scrollLeft <= 4 ? max : Math.max(track.scrollLeft - step(), 0);
    track.scrollTo({ left: x, behavior: 'smooth' });
  }
  function start() {
    stop();
    timer = setInterval(function () { if (!paused && !document.hidden) go(1); }, AUTO_MS);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  document.getElementById('recNext').addEventListener('click', function () { go(1); start(); });
  document.getElementById('recPrev').addEventListener('click', function () { go(-1); start(); });
  section.addEventListener('mouseenter', function () { paused = true; });
  section.addEventListener('mouseleave', function () { paused = false; });
  track.addEventListener('focusin', function () { paused = true; });
  track.addEventListener('focusout', function () { paused = false; });
  track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
  track.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 4000); }, { passive: true });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) start();
})();
