/* ============================================================
   ศรัณยา & ปภัสพล — main.js
   แก้ข้อมูลงานได้ที่ตัวแปร WEDDING ด้านล่างนี้ที่เดียว
   ============================================================ */

/* ── ปลายทางของฟอร์มตอบรับ (Google Form) ─────────────────
   วิธีหาค่าทั้งหมด อ่านที่ README.md หัวข้อ "ต่อฟอร์มตอบรับเข้า Google Form"
   ถ้ายังไม่ได้ใส่ formId ปุ่มส่งจะขึ้นข้อความบอกว่ายังไม่ได้ตั้งค่า            */
const RSVP_FORM = {
  formId: '1FAIpQLSetYGSDfmg6BrwlSr8H2CgF-Ft3iAwOL1lW_FCiOrhn_JgT5Q',
  fields: {                            // ตรงกับคำถามในฟอร์ม "Wedding 22/11/2026"
    firstName: 'entry.1498135098',     // ชื่อ
    lastName:  'entry.790492963',      // นาสกุล
    tel:       'entry.1193603007',     // เบอร์ติดต่อ
    guests:    'entry.946975723',      // จำนวนผู้ร่วมงาน
    wish:      'entry.1771533139',     // คำอวยพร
  },
};

const WEDDING = {
  bride: 'ศรัณยา สุวรรณศรี',
  groom: 'ปภัสพล วิรัตน์เกษม',
  titleTH: 'พิธีมงคลสมรส ศรัณยา & ปภัสพล',
  venue: 'คลองหลวงบูทีค รีสอร์ท',
  start: '2026-11-22T07:09:00+07:00',   // พิธีสงฆ์ — พิธีแรกตามการ์ด
  end:   '2026-11-22T13:00:00+07:00',   // เผื่อหลังร่วมรับประทานอาหาร 11.00 น. (ประมาณการ)
};

document.documentElement.classList.add('js');

/* ── เพลงประกอบ ───────────────────────────────────────────
   เบราว์เซอร์ทุกตัวบล็อกการเล่นเสียงอัตโนมัติที่ผู้ใช้ไม่ได้สั่ง
   จึงเริ่มเล่นตอนกด "เปิดการ์ด" ซึ่งนับเป็นการกดของผู้ใช้ และมีปุ่มปิดให้เสมอ */
const music = (function(){
  const audio = document.getElementById('bgm');
  const btn = document.getElementById('musicBtn');

  const sync = () => {
    const playing = !audio.paused;
    btn.classList.toggle('is-playing', playing);
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'ปิดเพลง' : 'เปิดเพลง');
  };

  const start = () => {
    audio.volume = 0.45;
    // ถ้าเบราว์เซอร์ยังปฏิเสธ ก็แค่ไม่เล่น ปุ่มยังกดเองได้ ไม่ต้องมี error
    audio.play().then(sync).catch(sync);
  };

  btn.addEventListener('click', () => {
    if (audio.paused) start(); else { audio.pause(); sync(); }
  });
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);

  return { start, show: () => btn.classList.add('is-on') };
})();

/* ── ม่านเปิดการ์ด ─────────────────────────────────────── */
(function curtain(){
  const el = document.getElementById('curtain');
  const btn = document.getElementById('openBtn');
  const dots = document.getElementById('dots');
  const open = () => {
    el.classList.add('is-open');
    document.body.style.overflow = '';
    music.start();
    music.show();
    setTimeout(() => dots.classList.add('is-on'), 700);
  };
  document.body.style.overflow = 'hidden';
  btn.addEventListener('click', open);
})();

/* ── เอฟเฟกต์ค่อย ๆ ปรากฏ ─────────────────────────────────
   ใช้การวัดตำแหน่งจริงแทน IntersectionObserver เพราะ IO จะไม่ยิง
   เมื่อแท็บถูกซ่อน (document.hidden) แล้วเนื้อหาจะค้างที่ opacity:0 */
(function reveal(){
  const items = [...document.querySelectorAll('.reveal')];
  items.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 90}ms`; });

  let queued = false;
  const check = () => {
    queued = false;
    for (let i = items.length - 1; i >= 0; i--) {
      const el = items[i];
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.9) {
        el.classList.add('is-in');
        items.splice(i, 1);
      }
    }
  };
  // rAF ไม่ทำงานตอนแท็บถูกซ่อน จึงต้องมีทางลงให้ setTimeout ด้วย
  const schedule = (fn) => (document.hidden ? setTimeout(fn, 0) : requestAnimationFrame(fn));
  const onScroll = () => {
    if (queued) return;
    queued = true;
    schedule(check);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('visibilitychange', onScroll);
  window.addEventListener('load', onScroll);
  check();
})();

/* ── จุดนำทาง: ไฮไลต์ตามส่วนที่กำลังดู ────────────────── */
(function navDots(){
  const links = [...document.querySelectorAll('.dots a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href')));
  let queued = false;
  const mark = () => {
    queued = false;
    let active = 0;
    sections.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top <= window.innerHeight * 0.45) active = i;
    });
    links.forEach((a, i) => a.classList.toggle('is-active', i === active));
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    (document.hidden ? setTimeout : requestAnimationFrame)(mark, 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  mark();
})();

/* ── นับถอยหลัง ───────────────────────────────────────── */
(function countdown(){
  const target = new Date(WEDDING.start).getTime();
  const set = (id, v) => { document.getElementById(id).textContent = String(v).padStart(2, '0'); };
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      ['cd-d', 'cd-h', 'cd-m', 'cd-s'].forEach((id) => set(id, 0));
      document.querySelector('.count__note').textContent = 'ขอบคุณที่มาร่วมเป็นส่วนหนึ่งในวันสำคัญของเรา';
      clearInterval(timer);
      return;
    }
    const s = Math.floor(diff / 1000);
    set('cd-d', Math.floor(s / 86400));
    set('cd-h', Math.floor(s / 3600) % 24);
    set('cd-m', Math.floor(s / 60) % 60);
    set('cd-s', s % 60);
  };
  tick();
  const timer = setInterval(tick, 1000);
})();

/* ── เพิ่มลง Google Calendar ──────────────────────────── */
(function calendar(){
  const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const s = utc(WEDDING.start);
  const e = utc(WEDDING.end);
  const details = `ร่วมเป็นเกียรติในพิธีมงคลสมรสของ ${WEDDING.bride} & ${WEDDING.groom}`;


  document.getElementById('gcalBtn').href =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(WEDDING.titleTH)}` +
    `&dates=${s}/${e}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(WEDDING.venue)}`;
})();

/* ── แกลเลอรี / ไลท์บ็อกซ์ ────────────────────────────── */
(function lightbox(){
  const lb = document.getElementById('lb');
  const img = document.getElementById('lbImg');
  const close = () => { lb.classList.remove('is-on'); document.body.style.overflow = ''; };

  document.querySelectorAll('.gal__item').forEach((b) => {
    b.addEventListener('click', () => {
      img.src = b.dataset.src;
      img.alt = b.querySelector('img').alt;
      lb.classList.add('is-on');
      document.body.style.overflow = 'hidden';
    });
  });
  document.getElementById('lbClose').addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target !== img) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* ── ตอบรับ (RSVP) → บันทึกลง Google Form ─────────────────
   ยิงตรงจากเบราว์เซอร์ไปที่ /formResponse ของฟอร์ม ไม่ต้องมี backend
   Google ไม่ส่ง CORS header กลับมา จึงต้องใช้ mode:'no-cors' ⇒ อ่านผลลัพธ์ไม่ได้
   (คำตอบถูกบันทึกจริง แต่ JS มองเห็นแค่ opaque response) — จับได้เฉพาะกรณีเน็ตหลุด */
(function rsvp(){
  const toast  = document.getElementById('toast');
  const form   = document.getElementById('rsvpForm');
  const thanks = document.getElementById('thanks');
  const btn    = document.getElementById('sendBtn');

  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    setTimeout(() => toast.classList.remove('is-on'), 4000);
  };

  const collect = () => {
    const firstName = document.getElementById('f-firstname').value.trim();
    if (!firstName) { say('กรุณากรอกชื่อก่อนครับ'); return null; }
    return {
      firstName,
      lastName: document.getElementById('f-lastname').value.trim(),
      tel:      document.getElementById('f-tel').value.trim(),
      guests:   document.getElementById('f-guests').value,
      wish:     document.getElementById('f-wish').value.trim(),
    };
  };

  btn.addEventListener('click', async () => {
    if (!RSVP_FORM.formId) {
      say('ยังไม่ได้ตั้งค่า Google Form — ดูวิธีใน README.md');
      return;
    }
    const data = collect();
    if (!data) return;

    btn.disabled = true;
    btn.textContent = 'กำลังส่ง…';

    const body = new FormData();
    Object.entries(RSVP_FORM.fields).forEach(([key, entry]) => {
      if (entry) body.append(entry, data[key]);
    });

    const showThanks = () => {
      form.hidden = true;
      thanks.hidden = false;
      thanks.classList.add('is-in');
    };
    const showForm = (msg) => {
      form.hidden = false;
      thanks.hidden = true;
      btn.disabled = false;
      btn.textContent = 'ส่งคำตอบรับ';
      say(msg);
    };

    // no-cors อ่านผลลัพธ์ไม่ได้อยู่แล้ว จึงไม่มีเหตุผลให้ผู้ใช้รอจนกว่า Google
    // จะส่ง HTML ทั้งหน้ากลับมา (บนเน็ตมือถือค้างหลายวินาที) — ขึ้นหน้าขอบคุณก่อนที่ 1.2 วิ
    // keepalive ทำให้คำขอเดินต่อแม้ผู้ใช้ปิดแท็บ · ถ้า fetch พังทีหลังค่อยดึงฟอร์มกลับมา
    let settled = false;
    const request = fetch(`https://docs.google.com/forms/d/e/${RSVP_FORM.formId}/formResponse`, {
      method: 'POST', mode: 'no-cors', keepalive: true, body,
    });

    request.then(() => { if (!settled) { settled = true; showThanks(); } })
           .catch(() => {
             settled = true;
             showForm('ส่งไม่สำเร็จ — กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
           });

    setTimeout(() => { if (!settled) { settled = true; showThanks(); } }, 1200);
  });
})();
