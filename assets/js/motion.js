/**
 * 演出
 * 1) 見出しがスクロールでふわっと現れる（.js-reveal）
 * 2) （メッセージの波線は廃止）
 * 3) 写真帯のパララックス（.js-parallax）
 * 4) 最後の写真：画面の中ほどまで来たら色が戻る（.js-reveal-photo）
 * 5) 流れ星の線（コメット）：ページの進み具合に合わせて左の余白を下りていく
 * 「動きを減らす」設定では 1〜3・5 を行わない（4 は色だけ切り替える）
 */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) 見出しのリビール ---------- */
  var reveals = document.querySelectorAll('.js-reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-shown'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(reveals, function (el) { ro.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-shown'); });
  }


  /* ---------- 3〜5) スクロール連動 ---------- */
  var plx = Array.prototype.slice.call(document.querySelectorAll('.js-parallax'));
  var photo = document.querySelector('.js-reveal-photo');
  var comet = reduce ? null : buildComet();
  var raf = 0;

  function onScroll() {
    if (raf) { return; }
    raf = requestAnimationFrame(function () {
      raf = 0;
      var vh = window.innerHeight;
      if (!reduce) {
        plx.forEach(function (el) {
          var sec = el.parentElement, r = sec.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) { return; }
          var shift = -(r.top + r.height / 2 - vh / 2) * 0.16;
          var buffer = (el.offsetHeight - sec.offsetHeight) / 2;
          shift = buffer > 0 ? Math.max(-buffer, Math.min(buffer, shift)) : 0;
          el.style.transform = 'translateY(' + shift + 'px)';
        });
      }
      // 速いスクロールで見出しの出現を取りこぼさないよう、通り過ぎたものは表示する
      Array.prototype.forEach.call(reveals, function (el) {
        if (!el.classList.contains('is-shown') && el.getBoundingClientRect().top < vh * 0.92) { el.classList.add('is-shown'); }
      });
      if (photo) { photo.classList.toggle('is-revealed', photo.getBoundingClientRect().top < vh * 0.55); }
      if (comet) { comet(); }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('dw:opened', onScroll);
  window.addEventListener('load', onScroll);
  onScroll();

  /* ---------- 5) コメット ---------- */
  function buildComet() {
    var host = document.body;
    var NS = 'http://www.w3.org/2000/svg';
    // 通り道：本文の左の余白（ページ幅の約1〜4%）を、ゆるやかに蛇行しながら下りる
    var D = 'M18 0 C22.8 900 13.2 1500 21.2 2100 C29.2 2700 36.4 3100 22.8 3700 C11.6 4300 16.4 4800 26 5400 C35.6 6000 32.4 6500 19.6 7100 C10 7700 18 8200 27.6 8800 C36.4 9300 24.4 9700 18.8 10000';
    var layer = document.createElement('div');
    layer.className = 'p-comet';
    layer.setAttribute('aria-hidden', 'true');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 10000');
    svg.setAttribute('preserveAspectRatio', 'none');
    function path(cls, w) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', D); p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#386A76'); p.setAttribute('stroke-width', w);
      p.setAttribute('vector-effect', 'non-scaling-stroke'); p.setAttribute('stroke-linecap', 'round');
      if (cls) { p.setAttribute('class', cls); }
      return p;
    }
    var ghost = path('p-comet__ghost', '1');
    var drawn = path('p-comet__drawn', '1.2'); drawn.setAttribute('pathLength', '1');
    var guide = path('', '0'); guide.style.opacity = '0';
    svg.appendChild(ghost); svg.appendChild(drawn); svg.appendChild(guide);
    layer.appendChild(svg);
    var head = document.createElement('div'); head.className = 'p-comet__head'; layer.appendChild(head);
    var trail = [1, 2, 3].map(function (n) {
      var d = document.createElement('div'); d.className = 'p-comet__trail';
      var sz = Math.max(3, 7 - n * 1.4); d.style.width = d.style.height = sz + 'px';
      d._lag = n * 0.018; d._op = Math.max(0.06, 0.24 - n * 0.06);
      layer.appendChild(d); return d;
    });
    if (getComputedStyle(host).position === 'static') { host.style.position = 'relative'; }
    host.appendChild(layer);
    var total = guide.getTotalLength();
    var cta = document.querySelector('.js-hero-cta');
    function at(prog) {
      var pt = guide.getPointAtLength(Math.max(0, Math.min(1, prog)) * total);
      return { l: pt.x / 10, t: pt.y / 100 };
    }
    return function () {
      if (getComputedStyle(layer).display === 'none') { return; }
      var rect = host.getBoundingClientRect(), vh = window.innerHeight;
      var sc = rect.height - vh;
      var p = Math.max(0, Math.min(1, sc > 0 ? (-rect.top) / sc : 0));
      drawn.style.strokeDashoffset = String(1 - p);
      var scrolled = window.scrollY || Math.max(0, -rect.top);
      var bl = 8, bt = 8;
      if (cta) {
        var cr = cta.getBoundingClientRect();
        bl = (cr.left - rect.left) / rect.width * 100;
        bt = (cr.top - rect.top) / rect.height * 100;
      }
      if (scrolled < 6) {
        // ページ最上部：「探してみる」の左肩で点滅（スタート地点）
        head.style.left = bl + '%'; head.style.top = bt + '%'; head.style.opacity = '1';
        head.classList.add('is-pulse');
        trail.forEach(function (t) { t.style.opacity = '0'; });
      } else {
        head.classList.remove('is-pulse');
        var tt = Math.min(1, scrolled / (vh * 0.9));
        var ease = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
        var pp = at(p);
        var cl = bl + (pp.l - bl) * ease, ct = bt + (pp.t - bt) * ease;
        head.style.left = cl + '%'; head.style.top = ct + '%';
        head.style.opacity = p < 0.997 ? '0.92' : '0';
        trail.forEach(function (t) {
          var tp = at(p - t._lag);
          t.style.left = (cl + (tp.l - cl) * ease) + '%';
          t.style.top = (ct + (tp.t - ct) * ease) + '%';
          t.style.opacity = p < 0.997 ? String(t._op * ease) : '0';
        });
      }
    };
  }
})();
