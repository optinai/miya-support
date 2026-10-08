/* スピ系セールスLP 共通スクリプト v2 (spi-sales-lp)
   - 依存なし・IntersectionObserver ベース・reduced-motion 対応
   - 追従CTAは「ヒーローを過ぎたら出す／商品セクション(#item, #plan)が画面内にある間は隠す」 */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsIO = 'IntersectionObserver' in window;

  /* ---- 1. リビール（.rv .rv-s .rv-b .stag .lines .eyebrow h2 .moonwrap .growline .item.rec .plan.rec） ---- */
  var targets = document.querySelectorAll('.rv,.rv-s,.rv-b,.stag,.lines,.eyebrow,h2,.moonwrap,.growline,.item.rec,.plan.rec,.wipe,.depthbar');
  if(reduce || !supportsIO){
    targets.forEach(function(el){ el.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } });
    },{threshold:.12, rootMargin:'0px 0px -8% 0px'});
    targets.forEach(function(el){ io.observe(el); });
  }

  /* ---- 2. 粒子（ヒーロー） ---- */
  if(!reduce){
    var pc = document.getElementById('particles');
    if(pc){
      var n = window.innerWidth < 768 ? 16 : 34;
      for(var i=0;i<n;i++){
        var p = document.createElement('div');
        p.className='particle';
        p.style.left=(Math.random()*100)+'%';
        p.style.setProperty('--duration',(9+Math.random()*11)+'s');
        p.style.setProperty('--delay',(Math.random()*10)+'s');
        p.style.setProperty('--size',(2+Math.random()*3).toFixed(1)+'px');
        pc.appendChild(p);
      }
    }
  }

  /* ---- 3. 共感チェックの順次チェック（.chk） ---- */
  document.querySelectorAll('.chk').forEach(function(chk){
    var items = chk.querySelectorAll('li');
    if(reduce || !supportsIO){ items.forEach(function(li){ li.classList.add('on'); }); return; }
    var kio = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        items.forEach(function(li,i){ setTimeout(function(){ li.classList.add('on'); }, 200 + i*300); });
        kio.unobserve(e.target);
      });
    },{threshold:.3});
    kio.observe(chk);
  });

  /* ---- 4. 波動リングの順次点灯（.wave .rings i.f） ---- */
  document.querySelectorAll('.wave').forEach(function(w){
    var fs = w.querySelectorAll('.rings i.f');
    if(!fs.length) return;
    fs.forEach(function(i){ i.classList.remove('f'); i.setAttribute('data-f','1'); });
    function light(){ fs.forEach(function(i,k){ setTimeout(function(){ i.classList.add('f'); }, 120 + k*110); }); }
    if(reduce || !supportsIO){ light(); return; }
    var wio = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ light(); wio.unobserve(e.target); } });
    },{threshold:.5});
    wio.observe(w);
  });

  /* ---- 5. カウントアップ（[data-count]） ---- */
  document.querySelectorAll('[data-count]').forEach(function(el){
    var goal = parseInt(el.getAttribute('data-count'),10);
    if(reduce || !supportsIO){ el.textContent = goal.toLocaleString(); return; }
    var done=false;
    var cio = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting || done) return;
        done=true;
        var t0=null, dur=1900;
        function step(ts){
          if(!t0) t0=ts;
          var pr=Math.min((ts-t0)/dur,1);
          var eased=1-Math.pow(1-pr,3);
          el.textContent=Math.floor(goal*eased).toLocaleString();
          if(pr<1) requestAnimationFrame(step); else el.textContent=goal.toLocaleString();
        }
        requestAnimationFrame(step);
        cio.unobserve(e.target);
      });
    },{threshold:.5});
    cio.observe(el);
  });

  /* ---- 6. パララックス（.px img：画面内の位置に応じて -6%〜+6%） ---- */
  var pxs = Array.prototype.slice.call(document.querySelectorAll('.px'));
  function parallax(){
    if(reduce || !pxs.length) return;
    var vh = window.innerHeight;
    pxs.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.bottom < 0 || r.top > vh) return;
      var c = (r.top + r.height/2 - vh/2) / vh;   // -0.5〜0.5
      el.style.setProperty('--py', (c * -6).toFixed(2) + '%');
    });
  }

  /* ---- 6.5 3日間限定カウントダウン ----
     <body data-deadline-key="mizuki_kantei" data-deadline-hours="72">
     初回閲覧時刻を localStorage に保存し、そこから N 時間を締切にする（無料鑑定受取→LP初見を起点とみなす）。
     表示先: .cd 内の [data-d] [data-h] [data-m] ／ 期限後は .cd を隠し .cd-expired を出す ／ .cdmini に「2日13時間」 */
  (function(){
    var key = document.body.getAttribute('data-deadline-key');
    if(!key) return;
    var hours = parseFloat(document.body.getAttribute('data-deadline-hours')||'72');
    var sk = 'lp_deadline_'+key, dl = 0;
    try{ dl = parseInt(localStorage.getItem(sk)||'0',10); }catch(e){}
    if(!dl || isNaN(dl)){ dl = Date.now() + hours*3600*1000; try{ localStorage.setItem(sk, String(dl)); }catch(e){} }
    var cds = document.querySelectorAll('.cd'), exs = document.querySelectorAll('.cd-expired'), minis = document.querySelectorAll('.cdmini');
    function pad(n){ return (n<10?'0':'')+n; }
    function tick(){
      var left = dl - Date.now();
      if(left <= 0){
        cds.forEach(function(c){ c.classList.add('expired'); });
        exs.forEach(function(x){ x.classList.add('on'); });
        minis.forEach(function(m){ m.textContent=''; });
        return;
      }
      var d = Math.floor(left/86400000), h = Math.floor(left%86400000/3600000), m = Math.floor(left%3600000/60000), sec = Math.floor(left%60000/1000);
      cds.forEach(function(c){
        var ed=c.querySelector('[data-d]'), eh=c.querySelector('[data-h]'), em=c.querySelector('[data-m]'), es=c.querySelector('[data-s]');
        if(ed) ed.textContent = d; if(eh) eh.textContent = pad(h); if(em) em.textContent = pad(m); if(es) es.textContent = pad(sec);
      });
      minis.forEach(function(mm){ mm.textContent = '残り'+(d>0? d+'日':'')+pad(h)+':'+pad(m)+':'+pad(sec); });
      setTimeout(tick, 1000 - (Date.now()%1000));
    }
    tick();
  })();

  /* ---- 7. 進捗バー＋追従CTA ---- */
  var bar=document.getElementById('progbar'), sticky=document.getElementById('sticky');
  var hideZones = Array.prototype.slice.call(document.querySelectorAll('[data-sticky-hide]'));
  var ticking=false;
  function onScroll(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      var h=document.documentElement.scrollHeight-window.innerHeight, y=window.scrollY, vh=window.innerHeight;
      if(bar) bar.style.width = h>0 ? Math.min(100,(y/h)*100)+'%' : '0%';
      if(sticky){
        var show = y > vh*0.9;
        if(show){
          for(var i=0;i<hideZones.length;i++){
            var r = hideZones[i].getBoundingClientRect();
            if(r.top < vh*0.75 && r.bottom > vh*0.35){ show=false; break; }
          }
        }
        sticky.classList.toggle('on', show);
      }
      parallax();
      ticking=false;
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  onScroll();
})();
