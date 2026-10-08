/* LP行動計測（Microsoft Clarity）spi-sales-lp / track.js
   - assets/track-config.js の LP_CLARITY_ID が空なら何もしない（無害）
   - URL の ?uid=xxx で人を識別（LINE配信のURL末尾に付ける）。一度来た端末は次回以降も同じ uid で記録
   - ?src=xxx で流入元を記録（例: step3, rich, story）
   - 購入ボタン・CTA・LINE相談・追従バーのクリック、各章への到達をイベントとして送る */
(function(){
  var id = window.LP_CLARITY_ID;
  if(!id) return;
  (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",id);
  var C=function(){ try{ window.clarity.apply(null, arguments); }catch(e){} };

  var q = new URLSearchParams(location.search);
  var page = document.body.getAttribute('data-deadline-key') || location.pathname.replace(/\W+/g,'_');
  C('set','lp',page);
  var src = q.get('src'); if(src) C('set','src',src);
  var uid = q.get('uid');
  try{ if(uid) localStorage.setItem('lp_uid',uid); else uid = localStorage.getItem('lp_uid'); }catch(e){}
  if(uid){ C('identify', uid, null, page); C('set','uid',uid); }

  // クリック
  function kind(a){
    if(a.classList.contains('pbtn')) return 'buy';
    if(a.closest('.sticky')) return 'sticky';
    if(a.classList.contains('cta')) return 'cta';
    if(a.classList.contains('minicta')) return 'minicta';
    if(/line\.me|lin\.ee/.test(a.href)) return 'line';
    return null;
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a'); if(!a) return;
    var k = kind(a); if(!k) return;
    var label = (a.querySelector('.btn')||a).textContent.replace(/\s+/g,' ').trim().slice(0,24);
    C('event', 'click_'+k);
    if(k==='buy'){ C('event','buy_click'); C('set','buy_item',label); C('upgrade','buy_click'); }
  }, true);

  // 章への到達（ヒーロー=00、以降 section の順番）
  if(!('IntersectionObserver' in window)) return;
  var secs = [].slice.call(document.querySelectorAll('header.hero, section'));
  var seen = {};
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(!en.isIntersecting) return;
      var i = secs.indexOf(en.target), n = ('0'+i).slice(-2);
      if(seen[n]) return; seen[n]=1;
      C('event','reach_'+n);
      if(en.target.hasAttribute('data-sticky-hide')) C('event','reach_products');
      io.unobserve(en.target);
    });
  }, {threshold:.35});
  secs.forEach(function(s){ io.observe(s); });
  var foot = document.querySelector('footer');
  if(foot){ new IntersectionObserver(function(es){ if(es[0].isIntersecting){ C('event','reach_end'); } }, {threshold:.5}).observe(foot); }
})();
