/**
 * 시그니처과외 상담 접수 → Google Sheets 저장 (Google Apps Script)
 *
 * 사용 방법: docs/상담접수_구글시트_연결방법.txt 를 순서대로 따라 하세요.
 * 1) 아래 SPREADSHEET_ID 의 'YOUR_SPREADSHEET_ID' 를 실제 스프레드시트 ID로 바꿉니다.
 * 2) 배포 → 새 배포 → 웹 앱 으로 배포하고, 받은 웹 앱 URL(.../exec)을
 *    사이트의 js/script.js 맨 위 CONSULT_API_URL 에 붙여 넣습니다.
 *
 * 저장 컬럼 순서:
 * 접수시간 | 이름 | 연락처 | 학년 | 희망과목 | 수업방식 | 거주지역/상세주소 | 기타요청 | 개인정보동의 | 접수페이지 | 브라우저정보
 * (IP 주소는 수집하지 않습니다.)
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = '상담접수';
const TIME_ZONE = 'Asia/Seoul';

const HEADERS = [
  '접수시간', '이름', '연락처', '학년', '희망과목', '수업방식',
  '거주지역/상세주소', '기타요청', '개인정보동의', '접수페이지', '브라우저정보'
];

// 허용 필드와 최대 글자 수 (여기에 없는 필드는 무시합니다)
const LIMITS = {
  submittedAt: 40,
  name: 50,
  phone: 30,
  grade: 30,
  subject: 100,
  lessonType: 10,
  region: 300,
  message: 1500,
  page: 500,
  userAgent: 500
};

// 필수 입력 항목 (개인정보 동의는 별도로 확인)
const REQUIRED = {
  name: '이름',
  phone: '연락처',
  grade: '학년',
  subject: '희망과목',
  lessonType: '수업방식',
  region: '거주지역'
};

const LESSON_TYPES = ['방문', '화상'];

// 관리자 이메일 알림 기능을 추가하려면 이메일 주소 입력
// (현재 비활성 상태입니다. 사용하려면 아래 줄과 doPost 안의 알림 코드 주석을 함께 해제하세요.)
// const ADMIN_EMAIL = '';


/** 상담 접수 처리 */
function doPost(e) {
  let lock = null;
  try {
    const data = parseRequest_(e);

    // 스팸 방지: 사이트의 숨김 칸(honeypot)에 값이 들어온 요청은 저장하지 않음
    if (data.website) return json_({ success: false, error: 'rejected' });

    const checked = validate_(data);
    if (!checked.ok) return json_({ success: false, error: checked.error });

    if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
      return json_({ success: false, error: 'spreadsheet_not_configured' });
    }

    // 동시에 여러 건이 들어와도 행이 섞이지 않도록 잠금
    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const sheet = getSheet_();
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS); // 시트가 비어 있으면 헤더 자동 생성

    const v = checked.value;
    const row = [
      Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm:ss'), // 접수시간(서버 기준)
      v.name,
      v.phone,
      v.grade,
      v.subject,
      v.lessonType,
      v.region,
      v.message,
      '동의',
      v.page,
      v.userAgent
    ].map(safeCell_);
    sheet.appendRow(row);

    // 관리자 이메일 알림 (비활성): 사용하려면 위 ADMIN_EMAIL 과 아래 코드 주석을 해제
    // if (ADMIN_EMAIL) {
    //   MailApp.sendEmail(ADMIN_EMAIL, '[시그니처과외] 새 상담 접수', '상담접수 시트에 새 접수가 있습니다. 시트에서 내용을 확인해 주세요.');
    // }

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, error: 'server_error' });
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}

/** 웹 앱 URL을 브라우저로 열었을 때 동작 확인용 (데이터는 저장하지 않음) */
function doGet() {
  return json_({ success: true, message: '시그니처과외 상담 접수 API가 동작 중입니다.' });
}

/** JSON(text/plain 포함) 또는 form 데이터 읽기 */
function parseRequest_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      const parsed = JSON.parse(e.postData.contents);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (ignore) {
      // JSON이 아니면 form 데이터로 처리
    }
  }
  return (e && e.parameter) ? e.parameter : {};
}

/** 허용 필드만 꺼내 정리하고 서버측 검증 */
function validate_(data) {
  const v = {};
  for (const key in LIMITS) {
    const raw = data[key] === undefined || data[key] === null ? '' : String(data[key]);
    const text = raw.replace(/\s+/g, ' ').trim();
    if (text.length > LIMITS[key]) {
      // 시스템 정보는 잘라서 저장, 사용자가 입력한 값은 거부
      if (key === 'page' || key === 'userAgent' || key === 'submittedAt') {
        v[key] = text.slice(0, LIMITS[key]);
        continue;
      }
      return { ok: false, error: 'too_long:' + key };
    }
    v[key] = text;
  }
  // 기타요청은 줄바꿈을 유지
  if (data.message) {
    const msg = String(data.message).trim();
    if (msg.length > LIMITS.message) return { ok: false, error: 'too_long:message' };
    v.message = msg;
  }

  for (const key in REQUIRED) {
    if (!v[key]) return { ok: false, error: 'required:' + key };
  }
  if (LESSON_TYPES.indexOf(v.lessonType) === -1) return { ok: false, error: 'invalid:lessonType' };

  const digits = v.phone.replace(/[^0-9]/g, '');
  if (digits.length < 9 || digits.length > 11) return { ok: false, error: 'invalid:phone' };

  const agreed = data.privacyAgreed === true || data.privacyAgreed === 'true' || data.privacyAgreed === '동의';
  if (!agreed) return { ok: false, error: 'required:privacyAgreed' };

  return { ok: true, value: v };
}

/** 상담접수 시트 가져오기 (없으면 생성) */
function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

/** 스프레드시트 수식으로 해석되지 않도록 =, +, -, @ 로 시작하는 값 앞에 ' 를 붙임 */
function safeCell_(value) {
  const s = String(value === undefined || value === null ? '' : value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** JSON 응답 */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
