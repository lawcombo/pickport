
  (function($){
    function toArray($anchors){
      var arr = [];
      $anchors.each(function(){
        var $a = $(this);
        var href = $a.attr('href') || '';
        var refp = $a.attr('referrerpolicy') || 'unsafe-url';
        var $img = $a.find('img');
        if(!$img.length){ return; }
        var src = $img.attr('src') || '';
        var alt = $img.attr('alt') || '상품 정보';
        arr.push({ href: href, referrerpolicy: refp, img: src, alt: alt });
      });
      return arr;
    }
    function shuffle(arr){
      for(var i=arr.length-1; i>0; i--){
        var j = Math.floor(Math.random()*(i+1));
        var t = arr[i]; arr[i]=arr[j]; arr[j]=t;
      }
      return arr;
    }
    function takeRandom(arr, n){
      if(arr.length<=n) return arr.slice();
      return shuffle(arr.slice()).slice(0, n);
    }

    /* ✅ 카드 마크업: 모바일 설명은 상품 설명만 */
    function buildCard(p){
      // 제목은 alt를 그대로 사용(너무 길면 사용자가 알아보기 좋음)
      var title = p.alt;
      // 설명은 상품 설명만(안내문 제거)
      var desc = p.alt;

      var h = '';
      h += '<a class="card" href="'+ p.href +'" target="_blank" referrerpolicy="'+ p.referrerpolicy +'" rel="noopener sponsored nofollow" title="새 창으로 이동">';
      h +=   '<div class="thumb"><img loading="lazy" src="'+ p.img +'" alt="'+ p.alt.replace(/"/g, '&quot;') +'"></div>';
      h +=   '<div class="info">';
      h +=     '<h3 class="title">'+ title +'</h3>';
      h +=     '<div class="meta">쿠팡 파트너스</div>';
      //h +=     '<p class="desc">'+ desc +'</p>';
      h +=   '</div>';
      //h +=   '<button class="go" type="button" aria-hidden="true">바로가기</button>';
      h += '</a>';
      return h;
    }



	// -----------------------------------------------------------------------------------------------------
	// 상품 12개씩 랜덤 노출
    function renderSection(sectionKey, srcId, dstId){
      var $src = $(srcId);
      var list = toArray($src.find('a'));
      var picks = takeRandom(list, 12);
      var out = '';
      for(var i=0;i<picks.length;i++){ out += buildCard(picks[i]); }
      $(dstId).html(out);
    }
	// -----------------------------------------------------------------------------------------------------

	  
    // 엔진 실제 높이를 CSS 변수로 반영
    function setEngineHeightVar(){
      var el = document.getElementById('engineWrap');
      if(!el) return;
      var h = el.offsetHeight;
      document.documentElement.style.setProperty('--engineH', h + 'px');
    }

    // ✅ 유틸: 트랙 내 활성 칩을 살짝 중앙으로 스크롤
    function centerActiveChip($chip){
      var track = document.getElementById('chipTrack');
      if(!track || !$chip || !$chip.length) return;
      var chipEl = $chip[0];
      var left = chipEl.offsetLeft - (track.clientWidth - chipEl.clientWidth)/2;
      track.scrollTo({ left: Math.max(left,0), behavior: 'smooth' });
    }

    // 초기 렌더
    $(function(){
		setEngineHeightVar();
		window.addEventListener('resize', setEngineHeightVar);

		renderSection('deals',   '#src-deals',   '#cards-deals'); 				// 오늘의 특가
		renderSection('best',    '#src-best',    '#cards-best'); 				// 최근 많이 팔린
		renderSection('oneplus', '#src-oneplus', '#cards-oneplus'); 			// 1+1
		renderSection('pcvalue', '#src-pcvalue', '#cards-pcvalue'); 			// 컴퓨터
		renderSection('keyboard', '#src-keyboard', '#cards-keyboard'); 			// 키보드
		renderSection('petproduct', '#src-petproduct', '#cards-petproduct'); 	// 애완용품 


		
		// 필터 클릭 동작
		var autoChipByScroll = true; // "전체"일 때만 자동 하이라이트

      $('.chip').on('click', function(){
        var $btn = $(this);
        $('.chip').removeClass('active');
        $btn.addClass('active');

        var target = $btn.data('target');
        autoChipByScroll = (target === 'all');

        if(target === 'all'){
          $('.section').removeClass('hidden');
        }else{
          $('.section').each(function(){
            var sec = $(this).data('section');
            if(sec === target){ $(this).removeClass('hidden'); }
            else{ $(this).addClass('hidden'); }
          });
          var $first = $('.section[data-section="'+target+'"]');
          if($first.length){
            var offset = document.getElementById('engineWrap').offsetHeight + document.getElementById('filtersBar').offsetHeight + 10;
            var top = $first.offset().top - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }
      });

      // ✅ 스크롤 시, 각 섹션 진입에 따라 칩 자동 하이라이트 (보여지는 효과만)
      var $sections = $('.section');
      var $chips = $('.chip');

      function currentStickyOffset(){
        var eng = document.getElementById('engineWrap')?.offsetHeight || 0;
        var filt = document.getElementById('filtersBar')?.offsetHeight || 0;
        return eng + filt + 12; // 약간의 버퍼
      }

      var ticking = false;
      function onScroll(){
        if(ticking) return;
        ticking = true;
        requestAnimationFrame(function(){
          var offset = currentStickyOffset();
          var focusLine = window.scrollY + offset; // 상단 고정바 바로 아래 기준선

          // 가장 가까운 섹션 찾기
          var bestKey = null;
          var bestDist = Infinity;
          $sections.each(function(){
            var $sec = $(this);
            var top = $sec.offset().top;
            var dist = Math.abs(top - focusLine);
            if(dist < bestDist){
              bestDist = dist;
              bestKey = $sec.data('section');
            }
          });

          if(autoChipByScroll && bestKey){
            var $targetChip = $chips.filter('[data-target="'+bestKey+'"]');
            if($targetChip.length && !$targetChip.is('.active')){
              $chips.removeClass('active');
              $targetChip.addClass('active');
              centerActiveChip($targetChip);
            }
          }
          ticking = false;
        });
      }

      // 페이지 최초 로드/리사이즈/스크롤에 반응
      window.addEventListener('scroll', onScroll, { passive:true });
      window.addEventListener('resize', onScroll);
      // 첫 진입에서도 올바른 칩이 표시되도록 호출
      onScroll();

      // 필터 트랙 가로 스크롤(트랙패드/가로휠만 개입)
      var $track = $('#chipTrack');
      $track.on('wheel', function(e){
        if(Math.abs(e.originalEvent.deltaX) > Math.abs(e.originalEvent.deltaY)){
          e.preventDefault();
          this.scrollLeft += e.originalEvent.deltaX;
        }
      });
    });

	// 공개 API: 섹션 재렌더
	window.RebuildSections = function(){
		renderSection('deals',   '#src-deals',   '#cards-deals'); 				// 오늘의 특가
		renderSection('best',    '#src-best',    '#cards-best'); 				// 최근 많이 팔린
		renderSection('oneplus', '#src-oneplus', '#cards-oneplus'); 			// 1+1
		renderSection('pcvalue', '#src-pcvalue', '#cards-pcvalue'); 			// 컴퓨터
		renderSection('keyboard', '#src-keyboard', '#cards-keyboard'); 			// 키보드
		renderSection('petproduct', '#src-petproduct', '#cards-petproduct'); 	// 애완용품
    
		renderPromoBanners(); // ★ 추가: 배너 3개 랜덤 구성
	};
	  
})(jQuery);







/* ================== 프로모션 배너: 소스/렌더 (간소화 + 공통필터와 동일 동작) ================== */
const PROMO_BANNERS = [
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=932226&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`,
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=931780&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`,
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=932230&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`,
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=931601&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`,
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=932233&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`,
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=932235&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`,
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=932236&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`,
  `<iframe src="https://ads-partners.coupang.com/widgets.html?id=932238&template=banner&trackingCode=AF5315280&subId=&width=320&height=480" width="320" height="480" frameborder="0" scrolling="no" referrerpolicy="unsafe-url" browsingtopics></iframe>`
];

/* 유틸: 셔플 후 상위 n개 선택 */
function pickRandomN(arr, n){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

function renderPromoBanners(){
  const host = document.getElementById('promo-banners');
  if(!host) return;
  const picks = pickRandomN(PROMO_BANNERS, 3);
  host.innerHTML = picks.map(html => `<div class="promo-iframe">${html}</div>`).join('');
}

// 초기 로드시 구성 (표시/숨김은 공통 필터 로직이 담당)
document.addEventListener('DOMContentLoaded', renderPromoBanners);




// 섹션(제목 + 카드/그리드)을 하나의 박스로 자동 래핑
function wrapSections(){
  document.querySelectorAll('.section').forEach(sec=>{
    // 이미 래핑되어 있으면 패스
    if (sec.querySelector(':scope > .section-box')) return;

    const head = sec.querySelector(':scope > .section-head');
    // cards 또는 promo-grid 중 있는 쪽을 찾는다
    const grid = sec.querySelector(':scope > .cards, :scope > .promo-grid');
    if(!head || !grid) return;

    const box = document.createElement('div');
    box.className = 'section-box';
    sec.insertBefore(box, head);
    box.appendChild(head);
    box.appendChild(grid);
  });
}

// 최초 적용
document.addEventListener('DOMContentLoaded', wrapSections);

// RebuildSections가 있으면 이후에도 유지
if (window.RebuildSections){
  const _orig = window.RebuildSections;
  window.RebuildSections = function(){
    _orig?.();
    wrapSections();
  };
}





/* ===== HoonPick's Reviews (KR masked names + HoonPick 경험 중심) ===== */
const HP_REVIEWS = [
  { q: "훈픽스에서 카테고리만 눌렀는데 딱 필요한 상품만 모여 있어서 고민 시간이 확 줄었어요. 쿠팡 ‘더보기’로 이어지는 흐름도 깔끔!", who: "김*현", stars: 5 },
  { q: "랜덤 큐레이션이 재밌네요. 접속할 때마다 새로운 추천이 떠서 비교가 쉬웠고 결국 최저가로 주문했습니다.", who: "박*민", stars: 5 },
  { q: "모바일에서도 한 손으로 스르륵 넘기며 보니 편했어요. 필요한 것만 모여 있어 장바구니 채우기가 빠릅니다.", who: "이*아", stars: 4 },
  { q: "필터로 ‘최근 많이 팔린’만 보니까 실패 없는 구매가 가능했어요. 리뷰 읽을 시간도 절약됐습니다.", who: "최*우", stars: 5 },
  { q: "훈픽스 덕분에 선물 고를 때 방향이 잡혔어요. 쓸데없는 검색 줄고 쿠팡 결제까지 자연스럽게 이어지네요.", who: "정*훈", stars: 5 },
  { q: "추천 배너로 알게 된 제품이 의외의 찐템이었어요. 클릭 몇 번에 구매 완료, 배송도 바로 떠서 만족!", who: "오*진", stars: 4 },
  { q: "페이지가 심플해서 눈에 잘 들어옵니다. 카드만 쭉 훑어보고 바로 ‘더보기’로 상세 확인 → 구매까지 원스텝.", who: "류*영", stars: 5 },
  { q: "1+1 모아둔 섹션이 특히 유용했어요. 필요한 생필품을 묶음으로 저렴하게 채웠습니다.", who: "한*주", stars: 5 },
  { q: "훈픽스 들어가면 고민이 줄어요. 이미 추려준 것만 보니 충동구매가 아니라 합리적 구매가 되더군요.", who: "서*민", stars: 5 },
  { q: "검색보다 큐레이션이 훨씬 편합니다. 출근길 5분 동안 보고 바로 주문 끝!", who: "문*경", stars: 4 },
  { q: "부모님 선물 고를 때 카테고리 넘기며 골랐습니다. 카드식 정보가 깔끔해서 비교가 쉬웠어요.", who: "배*현", stars: 5 },
  { q: "가성비 PC 섹션으로 본체 골랐는데 만족합니다. 옵션 과부하 없이 후보만 보여줘서 부담이 없었어요.", who: "노*섭", stars: 4 },
  { q: "훈픽스에서 본 제품을 쿠팡에서 바로 결제했어요. 동선이 짧아 체감 시간이 확 줄었습니다.", who: "장*연", stars: 5 },
  { q: "랜덤으로 바뀌는 추천이 유용하네요. 놓쳤던 아이템을 자연스럽게 발견했습니다.", who: "유*성", stars: 5 },
  { q: "필요한 것만 ‘카드 6개’로 추려주는 구성이 딱 좋습니다. 복잡하지 않아 선택 피로가 없어요.", who: "임*선", stars: 4 },
  { q: "‘최근 많이 팔린’은 믿고 고릅니다. 훈픽스 덕분에 찾는 시간이 줄어 장바구니 효율 ↑", who: "신*혁", stars: 5 },
  { q: "배너/카드/더보기 흐름이 자연스러워서 초보자도 금방 익숙해질 듯. 부모님도 사용할 수 있겠어요.", who: "안*지", stars: 5 },
  { q: "특가만 모아봐도 득템이 많네요. 훈픽스→쿠팡 이동이 매끄러워 결제까지 빠릅니다.", who: "양*호", stars: 5 },
  { q: "상품 썸네일/타이틀만 간단히 보고도 충분히 고를 수 있었습니다. 필요한 정보만 남겨둔 점이 좋아요.", who: "권*빈", stars: 4 },
  { q: "새벽에 급히 필요한 상품이 있었는데 훈픽스에서 금방 찾아 바로 로켓배송으로 해결했어요.", who: "하*원", stars: 5 }
];

// 유틸: 셔플 + 상위 n개
function hpShuffle(arr){
  const a = arr.slice();
  for (let i=a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function hpPick(arr, n){ return hpShuffle(arr).slice(0, Math.min(n, arr.length)); }

function hpStars(n){ return '★★★★★'.slice(0,n) + '☆☆☆☆☆'.slice(0, 5-n); }

function renderHpReviews(){
  const host = document.getElementById('hpReviews');
  if(!host) return;

  const isPC = window.matchMedia('(min-width: 900px)').matches;
  const COUNT = isPC ? 8 : 4; // PC: 8개(4열 느낌), 모바일: 슬라이드 4개

  const picks = hpPick(HP_REVIEWS, COUNT);
  host.innerHTML = picks.map(item => `
    <article class="hp-card" aria-label="이용후기">
      <p class="hp-card-quote">${item.q}</p>
      <div class="hp-card-meta">
        <span>${item.who}</span>
        <span class="hp-stars" aria-hidden="true">${hpStars(item.stars)}</span>
      </div>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', renderHpReviews);
window.addEventListener('resize', (()=> {
  let t; 
  return function(){ clearTimeout(t); t = setTimeout(renderHpReviews, 180); };
})());




  // FAQ: 한 항목만 펼치기
  document.addEventListener('click', function(e){
    const sum = e.target.closest('.hp-faq-list summary');
    if(!sum) return;
    const cur = sum.parentElement; // details
    if(!cur.open){ // 열리기 전 상태일 때만 나머지 닫기
      document.querySelectorAll('.hp-faq-list details[open]').forEach(d=>{
        if(d !== cur) d.removeAttribute('open');
      });
    }
  });




<!-- 틱톡 영상 script -->
<!-- 

(function(){
  /* ▶ TikTok 링크 (현재는 동일한 영상 4개) */
  var tiktokLinks = [
    "https://www.tiktok.com/@ppeccom02/video/7522456198982094098",
    "https://www.tiktok.com/@ppeccom02/video/7522456198982094098",
    "https://www.tiktok.com/@ppeccom02/video/7522456198982094098",
    "https://www.tiktok.com/@ppeccom02/video/7522456198982094098"
  ];

  /* ▶ 쿠팡 링크 (없으면 기본 공통 링크 사용) */
  var coupangLinkDefault = "https://link.coupang.com/a/cWL1HW";
  var coupangLinks = [null, null, null, null];

  function getTikTokId(u){
    try{
      var m = u.match(/\/video\/(\d+)/);
      return m && m[1] ? m[1] : null;
    }catch(e){ return null; }
  }

  function buildCard(url, cpUrl){
    var vid = getTikTokId(url);
    if(!vid){ return ""; }
    /* 영상만 보이게 (controls=0, description=0) */
    var embed = "https://www.tiktok.com/embed/v2/" + vid + "?lang=ko-KR&controls=0&description=0";
    var h = "";
    h += "<div class=\"video-card\">";
    h +=   "<div class=\"video-frame\">";
    h +=     "<iframe src=\"" + embed + "\" allow=\"encrypted-media; fullscreen; picture-in-picture\" referrerpolicy=\"no-referrer-when-downgrade\" loading=\"lazy\"></iframe>";
    h +=   "</div>";
    h +=   "<a class=\"cp-btn\" href=\"" + (cpUrl || coupangLinkDefault) + "\" target=\"_blank\" rel=\"noopener\" referrerpolicy=\"unsafe-url\">쿠팡 상품 보러가기</a>";
    h += "</div>";
    return h;
  }

  function renderTikToks(){
    var host = document.getElementById("videoGrid");
    if(!host){ return; }

    var out = "";
    for(var i=0;i<Math.min(4, tiktokLinks.length);i++){
      out += buildCard(tiktokLinks[i], coupangLinks[i] || null);
    }
    host.innerHTML = out;
  }

  if(document.readyState === "complete" || document.readyState === "interactive"){
    renderTikToks();
  }else{
    document.addEventListener("DOMContentLoaded", renderTikToks);
  }
})();

-->


<!-- 유투브 쇼츠 script -->

(function(){
  /* ▶ 유튜브 쇼츠 주소들 (네가 올린 그대로) */
  var ytLinks = [
	"https://youtube.com/shorts/5Tvcff5GO5Y?si=KneKbSvLiXlU2Ewm", // 닝닝 쫀득쿠키
	"https://youtube.com/shorts/IyPFNgu2qHk?si=QTqsQh95EhmkMMWr",
	"https://youtube.com/shorts/wZup8BlQtew?si=_1sJQAh3ua2PjT-N",
	"https://youtube.com/shorts/-nMyPLMLBIo?si=umt38VKCHTFhVWcR",
	"https://youtube.com/shorts/tPQpOYvPPDM?si=VTYfgcE656pYdtm3", 	// 브리사 욕실 휴대폰 방수 거치대
	"https://youtube.com/shorts/41mFEFfzTKQ?si=z-9IVBIa1FX7wXaG",
	"https://youtube.com/shorts/4-W3RZ_BVFA?si=_ID3_bxIAaNge225",
	"https://youtube.com/shorts/s9hYBB5uZ5s?si=kOgS-9glXrE8-Hgb",
	"https://youtube.com/shorts/OZiv3ueEKW0?si=abzQbl2g05DkoRJJ", 	// 4구 정리 지퍼백
	"https://youtube.com/shorts/uR0jkItnEDc?si=GeDBQcvgSB0yh2Zw", 	// 낙상방지 아기침대 침대가드
	"https://youtube.com/shorts/CLkn4G32jCY?si=j9vwlwwUcBaLsXp-", 	// 송혜교가 입은 니트 가디건
  	"https://youtube.com/shorts/AdCYD7tPmaU?si=Gt5L97xcZyZ57Dn0",	// 스마트필름(커튼)
  	"https://youtube.com/shorts/jw3q06ZoVvk?si=hQtkh3l3Hx6Ly1r_",	// 미니세척기
  	"https://youtube.com/shorts/I7FwJq40LTg?si=cX9rbO01D5gNTaCk",	// 박보영 메이크업 전에 30초 버블팩
	"https://youtube.com/shorts/YlSlckClIuE?si=DQeMA0RwmucvND3f",	// 최화정 곧은다리
	"https://youtube.com/shorts/NK3dhvdNLv8?si=VhS_Zyh-mbz7oBBS",	// 이영자표 파김치
	"https://youtube.com/shorts/iskyNy6EGd4?si=XY3V6ljnIrknMt6k",	// 애완용품 세이프 지퍼
	"https://youtube.com/shorts/EQYcFQlqStI?si=9aP1co1fOAJnOz33", 	// 장원영 녹차가루
	"https://youtube.com/shorts/BL_sn_UooCY?si=lLrNBdwWoy3Rup5z", 	// 연예인 립밤
	"https://youtube.com/shorts/ia1silfO0cQ?si=gXdn_1fk3b-tuG4w", 	// 수지 패딩
	"https://youtube.com/shorts/cFlqkxtUkPc?si=p5UUfk0ee6e8q2cb", 	// 이청아 향수
	"https://youtube.com/shorts/mT97G9kBJjc?si=KNDVSxdNonQt0AHz", 	// 차예련 가디건
	"https://youtube.com/shorts/cswuUrOpd5M?si=F4IdWVVOgoyldvgs", 	// 권나라 화이트닝
	"https://youtube.com/shorts/uGPcjkD35QQ?si=NyPGbd-_8Ai1iYNg", 	// 차예련 향수 (톰포드 타바코 바닐라 오드퍼퓸)
    "https://youtube.com/shorts/cB0erbdES4s?si=jdeSR27i-8UabyRP",  	// 비누거치대
    "https://youtube.com/shorts/uS9EGnShj0s?si=Vb5JOQwZb3Q-jDPv", 	// 원스채칼 무 당근 쏨땀 야채슬라이서
    "https://youtube.com/shorts/8G3FHyKdIdg?si=8oDbu2d1NyVhaBdD", 	// 실리콘 채소 과일 보관용기
    "https://youtube.com/shorts/KOzPtqZJJzY?si=jyKq1VLswB6DPsWp",	// 샤오비 보조배터리
    "https://youtube.com/shorts/8-1YuPzJLHA?si=YXfw8O9aKX-uvQvC",	// 미니 빨래 건조대
    "https://youtube.com/shorts/wN1tRDnO1fE?si=5x61qSlsODXfwGmI",	// 아가짱 샤워덕 조이 목욕핸들
    "https://youtube.com/shorts/e4JobP8rqH0?si=e8T6Jk2AQK6rRGVc",	// 하이라이터 밑줄 스티커 펜
    "https://youtube.com/shorts/lL05TQy27Ig?si=NBsyT6doLf6WSaiW"	// 방풍비닐
  ];

  /* ▶ 각 영상별 쿠팡 링크 (인덱스 1:1 매핑) */
  var coupangLinks = [
	"https://link.coupang.com/a/cZhlZ5", //닝닝 쪽득 쿠키
	"https://link.coupang.com/a/cZg8SQ",
	"https://link.coupang.com/a/cZg42z",
	"https://link.coupang.com/a/cYZHQx",
	"https://link.coupang.com/a/cYY887", 	// 브리사 욕실 휴대폰 방수 거치대
	"https://link.coupang.com/a/cYY1Z2",
	"https://link.coupang.com/a/cYYU0R",
	"https://link.coupang.com/a/cYYOgW",
	"https://link.coupang.com/a/cYS8ZW", 	// 4구 정리 지퍼백
	"https://link.coupang.com/a/cYSX2K", 	// 낙상방지 아기침대 침대가드
	"https://link.coupang.com/a/cYSRRx", 	// 송혜교가 입은 니트 가디건
  	"https://link.coupang.com/a/cYAP0B",	// 스마트필름(커튼)
  	"https://link.coupang.com/a/cYANHc",	// 미니세척기
  	"https://link.coupang.com/a/cYyLfs",	// 박보영 메이크업 전에 30초 버블팩
  	"https://link.coupang.com/a/cYyHxJ",	// 최화정 곧은다리
	"https://link.coupang.com/a/cYmH59",	// 이영자표 파김치
    "https://link.coupang.com/a/cXZexN",	// 애완용품 세이프 지퍼
	"https://link.coupang.com/a/cYcdJX", 	// 장원영 녹차
	"https://link.coupang.com/a/cYccGm", 	// 연예인 립밤
	"https://link.coupang.com/a/cYcaHU", 	// 수지 패딩
	"https://link.coupang.com/a/cYb628", 	// 이청아 향수
	"https://link.coupang.com/a/cYb5Ux", 	// 차예련 가디건
	"https://link.coupang.com/a/cYb4n8", 	// 권나라 화이트닝
	"https://link.coupang.com/a/cYb1zP", 	// 차예련향수(톰포드 타바코 바닐라 오드퍼퓸)
    "https://link.coupang.com/a/cYbqpN", 	// 비누거치대
    "https://link.coupang.com/a/cYbmOW", 	// 원스채칼 무 당근 쏨땀 야채슬라이서
    "https://link.coupang.com/a/cYaTWq", 	// 실리콘 채소 과일 보관용기
    "https://link.coupang.com/a/cXZwtK",	// 샤오비 보조배터리
    "https://link.coupang.com/a/cXZFI2",	// 미니 빨래 건조대
    "https://link.coupang.com/a/cXZNOd",	// 아가짱 샤워덕 조이 목욕핸들
    "https://link.coupang.com/a/cX46Ru",	// 하이라이터 밑줄 스티커 펜
    "https://link.coupang.com/a/cX310L"		// 방풍비닐
  ];

  var productCaptions = [
	"먹으면 멈출 수 없다는 에스파 닝닝 쫀득쿠키!",
	"산다라박이 사용하는 겨울 미스트! 대박!",
	"정재형&주우재 추천 반팔티!!",
	"무선 온열 담요! 이번 겨울 필수템!!!!",
	"브리사 욕실 휴대폰 방수 거치대, 하루종일 샤워 가능 ㅎㅎ",
	"곰곰 THE 신선한 한돈 목살 구이용 (냉장), 1kg, 1팩",
	"인테리어 소품, 옷걸이! 집에 오는 사람들마다 어디서 샀냐고 물아봐요✨",
	"감성 인테리어 & 조명 벽장식 소품 화분(배터리 내장 +리모컨)",
	"정리의 신! 4구 비닐봉지 지퍼백 정리 케이스",
	"육아는 템빨ㅎㅎ 낙상방지 아기침대 침대가드!",
	"송혜교가 입은 니트 가디건 스웨터 ✨",
  	"요즘 누가 커튼사? 이제는 스마트필름이 대세🌤️",
  	"휴대용 미니세탁기(세척기)! 남편들 필수템!",
  	"화장 전에 꼭하세요. 더현대 1위 · 올영 품절템",
	"꼬지 말고, 다리 모아! 오늘부터 습관 교정.",
	"이영자표 파김치! 다이어트 ㅃㅇ! 침질질~",
	"애완용품 세이프 지퍼로 깔끔끝 ✨",
	"말차 한 스푼, 장원영 녹차가루 🍵",
	"입술꿀광! 연예인 립밤 💄",
	"가볍게 툭! 수지 패딩로 보온력 업 ⛄",
	"이청아가 홀딱반한 향수! ✨",
	"꾸안꾸 차예련 무드, 가디건 🧶",
	"권나라 화이트닝 이거면 끝! ✨",
	"닐라닐라 바닐라~ 차예련이 추천한 향수! ✨",
	"미끌미끌 노프라블럼 비누거치대 🫧",
	"썰·채·다짐 3초 컷 👩‍🍳",
	"실리콘 채소 과일 보관용기 🥬",
	"샤오미 미쳤음! 샤오미 보조배터리 🔋",
	"빨래는 미니 빨래 건조대로 뽀송하게 🧺",
	"목욕시간 목욕핸들로 즐겁게 🛁",
	"밑줄 쫙— 하이라이터 밑줄 스티커 펜 ✍️",
	"이번 겨울 필수템! 바람 그만! 🌬️"
	];


  /* ▶ 방어: 개수 불일치 시 더 짧은 쪽 기준으로 자름 (매핑 보전) */
  if (ytLinks.length !== coupangLinks.length) {
    var n = Math.min(ytLinks.length, coupangLinks.length);
    ytLinks = ytLinks.slice(0, n);
    coupangLinks = coupangLinks.slice(0, n);
  }

  /* ▶ id 추출 */
  function getYouTubeId(u){
    var m;
    if((m = u.match(/\/shorts\/([A-Za-z0-9_-]{5,})/))) return m[1];
    if((m = u.match(/[?&]v=([A-Za-z0-9_-]{5,})/)))     return m[1];
    if((m = u.match(/youtu\.be\/([A-Za-z0-9_-]{5,})/)))return m[1];
    return null;
  }

  /* ▶ util: 섞기 */
  function shuffle(arr){
    for(var i=arr.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var t=arr[i]; arr[i]=arr[j]; arr[j]=t;
    }
    return arr;
  }

  /* ▶ index→카드 빌드 (매핑 보장) */
  function buildCardByIndex(idx){
    var url = ytLinks[idx], cpUrl = coupangLinks[idx];
    var vid = getYouTubeId(url);
    if(!vid){ return ""; }
    var embed = "https://www.youtube.com/embed/" + vid +
      "?modestbranding=1&rel=0&controls=0&playsinline=1&iv_load_policy=3&autoplay=1&mute=1&loop=1&playlist=" + vid;

    var h = "";
    h += '<div class="video-card">';
	h +=   '<div class="video-frame">';
	h +=     '<iframe src="'+ embed +'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; screen-wake-lock; gamepad *; gamepadpose *; compute-pressure *" allowfullscreen loading="lazy"></iframe>';
	h +=     '<div class="video-caption overlay">'+ (productCaptions[idx] || '') +'</div>';
	h +=   '</div>';
	h +=   '<div class="video-caption below">'+ (productCaptions[idx] || '') +'</div>';
	h +=   '<a class="cp-btn" href="'+ cpUrl +'" target="_blank" rel="noopener sponsored nofollow" referrerpolicy="unsafe-url">👆 쿠팡 상품 보러가기</a>';
	h += '</div>';
	return h;
	}





  /* ▶ 한 번에 보여줄 영상 개수 — 여기 숫자만 바꾸면 됩니다 */
  const VIDEO_BATCH = 3; // 6으로 바꾸면 6개씩 노출

  /* ▶ N개 인덱스 뽑기: 직전 배치 제외 */
  function pickNExcluding(excludeSet, n = VIDEO_BATCH){
    var N = ytLinks.length;
    var pool = [];
    for (var i=0;i<N;i++) { if (!excludeSet.has(i)) pool.push(i); }
    // 남은 게 n 미만이면 완화(항상 n개 보장)
    var base = (pool.length >= n) ? pool : Array.from({length:N}, (_,k)=>k);
    return shuffle(base.slice()).slice(0, n);
  }

  /* ▶ 렌더 */
  var lastBatch = []; // 직전 렌더링 인덱스 n개
  function renderByIndexes(indexes){
    var host = document.getElementById("videoGrid");
    if(!host) return;
    var out = "";
    for (var i=0;i<indexes.length;i++){
      out += buildCardByIndex(indexes[i]);
    }
    host.innerHTML = out;
    lastBatch = indexes.slice(); // 저장
  }

  /* ▶ 초기 렌더: 무작위 n개 */
  function initialRender(){
    var idxs = Array.from({length: ytLinks.length}, (_,k)=>k);
    shuffle(idxs);
    renderByIndexes(idxs.slice(0, VIDEO_BATCH));
  }

  /* ▶ 새로고침: 직전 n개 제외한 풀에서 무작위 n개 */
  function refreshRender(){
    var exclude = new Set(lastBatch);
    var next = pickNExcluding(exclude, VIDEO_BATCH);
    renderByIndexes(next);
  }

  /* ▶ 바인딩 */
  function bind(){
    var btn = document.getElementById("videoRefreshBtn");
    if (btn) btn.addEventListener("click", refreshRender);
  }

  // 시작
  if (document.readyState === "complete" || document.readyState === "interactive") {
    initialRender(); bind();
  } else {
    document.addEventListener("DOMContentLoaded", function(){ initialRender(); bind(); });
  }


})();









document.addEventListener('DOMContentLoaded', () => {
  // 1) 배너 풀 정의
  const BANNERS = [
    { href: "https://link.coupang.com/a/cYhoqZ", img: "https://ads-partners.coupang.com/banners/932234?subId=&traceId=V0-301-5f4982b43e2b4522-I932234&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhoIN", img: "https://ads-partners.coupang.com/banners/932223?subId=&traceId=V0-301-2f679fc6bd8f2e58-I932223&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYho5G", img: "https://ads-partners.coupang.com/banners/934677?subId=&traceId=V0-301-5079b8362432a905-I934677&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhpkR", img: "https://ads-partners.coupang.com/banners/931574?subId=&traceId=V0-301-12cd6d67384e2afb-I931574&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhpt3", img: "https://ads-partners.coupang.com/banners/934196?subId=&traceId=V0-301-5a8c79a76485eb21-I934196&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhpD4", img: "https://ads-partners.coupang.com/banners/934678?subId=&traceId=V0-301-371ae01f4226dec2-I934678&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhpP4", img: "https://ads-partners.coupang.com/banners/932237?subId=&traceId=V0-301-8be2627c04ed5569-I932237&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhpZU", img: "https://ads-partners.coupang.com/banners/931504?subId=&traceId=V0-301-c1744fa69c93f626-I931504&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhp6v", img: "https://ads-partners.coupang.com/banners/931556?subId=&traceId=V0-301-5f9bd61900e673c0-I931556&w=728&h=90", alt: "" },
    { href: "https://link.coupang.com/a/cYhqqO", img: "https://ads-partners.coupang.com/banners/934682?subId=&traceId=V0-301-2b8ef06377ec8f50-I934682&w=728&h=90", alt: "" },
  ];

  // 2) 추천 섹션 여부 판별 (부모에 특정 셀렉터가 있으면 제외)
  const isInRecommendSection = (el) =>
    !!el.closest('.recommend, .recommend-section, #recommend-banners, [data-section="recommend"]');

  // 3) 대상 .banner 수집 (data-skip-random이 있으면 제외)
  const all = Array.from(document.querySelectorAll('.banner'));
  const targets = all.filter(el => !isInRecommendSection(el) && !el.hasAttribute('data-skip-random'));

  if (targets.length === 0 || BANNERS.length === 0) return;

  // 4) 셔플 함수
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // 5) 중복 없이 채우기: 필요 시 계속 셔플해서 채움
  let pool = shuffle(BANNERS);
  let idx = 0;

  const buildBannerNode = ({ href, img, alt }) => {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.referrerPolicy = 'unsafe-url';

    const image = document.createElement('img');
    image.src = img;
    image.alt = alt || '';
    image.width = 728;
    image.height = 90;
    image.loading = 'lazy';
    image.decoding = 'async';

    a.appendChild(image);
    return a;
  };

  targets.forEach(container => {
    // 컨테이너 비우고 새 배너 삽입
    container.textContent = '';

    // 풀을 다 썼으면 다시 셔플
    if (idx >= pool.length) {
      pool = shuffle(BANNERS);
      idx = 0;
    }
    const banner = pool[idx++];
    container.appendChild(buildBannerNode(banner));
  });
});







// 쇼츠 영상 더보기 버튼 클릭시 
// jQuery 사용 중이라면:
$(function(){
  $('#moreBtnOfShorts').on('click', function(){ window.location.href = './coupang_shorts.html'; });
  $('#moreBtnOfShorts').on('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = './coupang_shorts.html'; }
  });
});




	

//서비스워커 등록 스크립트
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 프로젝트 페이지 기준 경로 주의!
    navigator.serviceWorker.register('/pickport/sw.js').catch(console.warn);
  });
}


	

(function(){
  const btnWrap = document.querySelector('.a2hs-wrap');
  const btn = document.getElementById('a2hsBtn');
  let deferred; // beforeinstallprompt 이벤트 캐시

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /^((?!chrome|crios|fxios|edgios|naver|whale|samsung).)*safari/.test(ua);
  const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isMobile = /android|iphone|ipad|ipod/.test(ua);

	
  // 기본은 숨김
  if (btn) btn.hidden = true;

  // 1) 설치 가능 상태가 되면 브라우저가 이벤트를 보냄 → 그때만 버튼 표시
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (!isStandalone && isMobile && btn) btn.hidden = false;   // 모바일에서만 노출
	if (isMobile && btnWrap) btnWrap.style.display = 'block';   // 래퍼도 모바일에서만

  });

  // 2) 설치 완료되면 버튼/영역 숨김
  window.addEventListener('appinstalled', () => {
    if (btn) btn.hidden = true;
    if (btnWrap) btnWrap.style.display = 'none';
    deferred = null;
  });

  // 3) 클릭 시 설치 프롬프트
  btn?.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice; // accepted/dismissed
      // outcome이 dismissed여도, 나중에 브라우저가 다시 프롬프트 조건이 되면
      // beforeinstallprompt가 다시 와서 버튼이 다시 보입니다.
      deferred = null;
      return;
    }
    // iOS Safari 가이드(설치 이벤트가 존재하지 않음)
    if (isIOS && isSafari) {
      alert('iOS Safari: 공유 버튼(⬆️) → "홈 화면에 추가"로 설치하세요.');
      return;
    }
    // 그 외: 아직 설치 조건이 미충족(버튼이 안 보여야 정상인데 혹시 눌린 경우)
    alert('이미 설치되어 있거나, 현재 브라우저에서는 설치가 제한됩니다.\n삼성 인터넷 또는 크롬으로 열어 다시 시도해 주세요.');
  });
})();





<!-- ✅ 인앱브라우저 감지 + 외부 브라우저로 열기 -->

(function(){
  const ua = navigator.userAgent;
  const uaL = ua.toLowerCase();
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  // 카톡/인스타/페북/네이버 등 인앱 감지
  const isInApp = /(kakaotalk|line|instagram|fb_iab|fbav|twitter|naver(inapp)?|daumapps)/i.test(ua);

  const $banner  = document.getElementById('openOutBanner');
  const $msg     = document.getElementById('openOutMsg');
  const $samsung = document.getElementById('openSamsung');
  const $chrome  = document.getElementById('openChrome');
  const $whale   = document.getElementById('openWhale');

  if (!$banner || !$msg) return;

  if (isInApp) {
    // 기본 문구(안드로이드용 버튼 안내)
    $msg.innerHTML = '설치하려면 외부 브라우저로 여세요. 아래 버튼 중 하나를 누르면 이동합니다.';

    if (isAndroid) {
      // 안드로이드: intent 링크로 외부 브라우저 열기
      const current  = location.href;
      const hostPath = location.host + location.pathname + location.search + location.hash;
      const fallback = encodeURIComponent(current);
      if ($samsung) $samsung.href = `intent://${hostPath}#Intent;scheme=https;package=com.sec.android.app.sbrowser;S.browser_fallback_url=${fallback};end`;
      if ($chrome)  $chrome.href  = `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
      if ($whale)   $whale.href   = `intent://${hostPath}#Intent;scheme=https;package=com.naver.whale;S.browser_fallback_url=${fallback};end`;
    } else if (isIOS) {
      // iOS: 외부 브라우저 자동 실행 제한 → 버튼 숨기고 안내로 교체
      if ($samsung) $samsung.style.display = 'none';
      if ($chrome)  $chrome.style.display  = 'none';
      if ($whale)   $whale.style.display   = 'none';
      $msg.innerHTML = 'iOS에선 인앱 브라우저에서 외부 브라우저 자동 이동이 제한돼요. 우측 상단의 <b>⋯</b> 메뉴에서 <b>Safari로 열기</b>를 눌러주세요.';
    }

    // 마지막에 배너 표시
    $banner.style.display = 'block';
  }
})();


	

(function(){
  const isInApp = /(kakaotalk|line|instagram|fb_iab|fbav|twitter|naver(inapp)?|daumapps)/i.test(navigator.userAgent);
  if (isInApp) { const b=document.getElementById('a2hsBtn'); if(b) b.style.display='none'; }
})();




(function () {
  // 같은 브라우저/탭 세션에서는 1회만 카운트되도록 sessionStorage 사용
  var KEY = "pickport_session_counted";
  if (sessionStorage.getItem(KEY)) return;

  // 사이트 전역 카운터 ID (전체 사이트를 하나로 셈)
  var COUNTER_ID = "lawcombo.github.io/pickport";

  // hits.sh에 '보이지 않는' 이미지 요청을 보내 카운트를 +1
  var ping = new Image();
  ping.referrerPolicy = "no-referrer-when-downgrade"; // 선택 사항
  ping.src = "https://hits.sh/" + encodeURIComponent(COUNTER_ID) + ".svg?view=total";

  // 이 세션에서는 더 이상 증가하지 않도록 플래그
  sessionStorage.setItem(KEY, "1");
})();
