(() => {
  const icons = {
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.7 3.5-7 8-7s7.2 2.3 8 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.7 2.9 8 7.5 9.5 4.6-1.5 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C10 4 5 8 5 15c0 2.8 1.8 5 4.5 5C17 20 20 12 20 4Z"/><path d="M4 21c2-5 5.5-8.5 11-11"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>'
  };

  const listings = [
    { title: 'Loungefåtölj i ek', category: 'Möbler', kind: 'Säljes', price: '650 kr', image: 'oak-lounge-chair-4k.png', distance: '2 min bort', area: 'Din fastighet', description: 'Stabil fåtölj i ek med flätad sits. Varsamt använd och redo för ett nytt hem.' },
    { title: 'Stor monstera med kruka', category: 'Växter', kind: 'Skänkes', price: 'Gratis', image: 'monstera-green-pot-4k.png', distance: '4 min bort', area: 'Ditt kvarter', description: 'Frisk planta i glaserad kruka. Behöver mer plats än jag kan erbjuda.' },
    { title: 'Verktygskit för hemmafix', category: 'Verktyg', kind: 'Lånas', price: 'Lånas ut', image: 'tool-kit-burgundy-4k.png', distance: '1 min bort', area: 'Din fastighet', description: 'Grundkit för enklare montering. Lånas gärna ut till en granne i upp till tre dagar.' },
    { title: 'Soffbord med hylla', category: 'Möbler', kind: 'Säljes', price: '300 kr', image: 'oak-coffee-table-4k.png', distance: '6 min bort', area: 'Ditt område', description: 'Ljust soffbord i ek med praktisk förvaring. Några små bruksspår.' },
    { title: 'Picknickkorg och ullpläd', category: 'Fritid', kind: 'Säljes', price: '180 kr', image: 'picnic-basket-burgundy-4k.png', distance: '5 min bort', area: 'Ditt kvarter', description: 'Klassisk korg och varm vinröd pläd i fint skick.' },
    { title: 'Grön vardagscykel', category: 'Fritid', kind: 'Skänkes', price: 'Gratis', image: 'green-city-bike-4k.png', distance: '8 min bort', area: 'Ditt område', description: 'Pålitlig äldre cykel i bruksskick. Passar någon som kan ge den lite omtanke.' },
    { title: 'Ekstol med flätad sits', category: 'Möbler', kind: 'Säljes', price: '390 kr', image: 'oak-lounge-chair-4k.png', distance: '3 min bort', area: 'Ditt kvarter', description: 'Bekväm stol i skandinavisk stil. Hämta nära, utan transportbokning.' },
    { title: 'Sticklingar från monstera', category: 'Växter', kind: 'Skänkes', price: 'Gratis', image: 'monstera-green-pot-4k.png', distance: '2 min bort', area: 'Din fastighet', description: 'Tre rotade sticklingar som gärna flyttar till andra hem i huset.' }
  ];

  const categories = ['Alla', 'Möbler', 'Växter', 'Verktyg', 'Fritid'];
  const state = { category: 'Alla', query: '', scope: 'Närmast först' };
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="concept-ribbon"><span>OBEROENDE KONCEPTDEMO</span><p>En möjlig ny vardagsfunktion för Balders hyresgäster</p></div>
    <header class="site-header">
      <a class="brand" href="#top" aria-label="Balder Grannbytet, startsida">
        <span class="balder-mark" aria-hidden="true"><i></i><b>BAL<br>DER</b></span>
        <span class="brand-divider"></span>
        <span class="product-name"><strong>Grannbytet</strong><small>för Boendeappen</small></span>
      </a>
      <nav class="nav-links" aria-label="Huvudmeny"><a href="#annonser">Utforska</a><a href="#sa-fungerar-det">Så fungerar det</a><button data-open="pilot">Pilotförslag</button></nav>
      <div class="header-actions"><button class="button button-ghost" data-open="pilot">För Balder</button><button class="button button-primary" data-open="create">${icons.plus}<span>Lägg upp</span></button><button class="icon-button" aria-label="Min profil">${icons.user}</button></div>
    </header>

    <main id="main">
      <section class="hero" id="top">
        <div class="hero-shade"></div>
        <div class="hero-content">
          <p class="eyebrow">TRYGGT ÅTERBRUK MELLAN GRANNAR</p>
          <h1>DET DU INTE BEHÖVER<br>KAN BO VIDARE NÄRA.</h1>
          <p class="hero-lead">En lokal marknadsplats för verifierade Balder-hyresgäster – direkt i Boendeappen, utan offentliga adresser eller okända användare.</p>
          <div class="hero-actions"><a class="button button-primary button-large" href="#annonser">Se vad som finns nära ${icons.arrow}</a><button class="button button-light button-large" data-open="create">Lägg upp en sak</button></div>
        </div>
        <aside class="verification-card">
          <span class="verification-icon">${icons.shield}</span>
          <p>VERIFIERAT BOENDE</p>
          <h2>Bara grannar med ett aktivt hyresavtal.</h2>
          <ul><li>Område visas, aldrig lägenhetsnummer</li><li>Kontakt öppnas först när båda vill</li><li>Ingen betalning i pilotversionen</li></ul>
        </aside>
      </section>

      <section class="trust-strip" aria-label="Trygghetsprinciper">
        <article><span>${icons.shield}</span><div><strong>Avtalsverifierat</strong><small>Rätt användare i rätt område</small></div></article>
        <article><span>${icons.pin}</span><div><strong>Nära utan exakt adress</strong><small>Integritet från första vy</small></div></article>
        <article><span>${icons.leaf}</span><div><strong>Cirkulärt i vardagen</strong><small>Enklare att återbruka stort och smått</small></div></article>
      </section>

      <section class="market" id="annonser">
        <div class="section-intro"><div><p class="kicker">GRANNBYTET</p><h2>NÄRA DIG JUST NU</h2><p>Alla annonser, avstånd och användare är realistiska demoexempel.</p></div><button class="text-link" data-open="create">Lägg upp något ${icons.arrow}</button></div>
        <div class="market-toolbar">
          <label class="search-box">${icons.search}<span class="sr-only">Sök annonser</span><input id="search" type="search" placeholder="Vad letar du efter?"></label>
          <label class="select-wrap"><span class="sr-only">Sortering</span><select id="scope"><option>Närmast först</option><option>Senast publicerat</option><option>Gratis först</option></select></label>
        </div>
        <div class="category-row" aria-label="Kategorier">${categories.map((category, index) => `<button class="category" data-category="${category}" aria-pressed="${index === 0}">${category}</button>`).join('')}</div>
        <div class="result-line"><strong id="result-count"></strong><span>Inom ditt verifierade område</span></div>
        <div class="listing-grid" id="listing-grid"></div>
      </section>

      <section class="app-integration" id="sa-fungerar-det">
        <div class="phone-wrap" aria-label="Konceptvy av Grannbytet i Boendeappen">
          <div class="phone"><div class="phone-top"><span class="mini-mark">B</span><span>Boendeappen</span><i></i></div><div class="phone-body"><p>HEMMA HOS DIG</p><h3>Hej, Lina</h3><div class="phone-grid"><span>Felanmälan</span><span>Hyra & betalning</span><span>Tvättstuga</span><span class="active">Grannbytet <b>NY</b></span></div><div class="phone-feature"><img src="assets/oak-lounge-chair-4k.png" alt="Loungefåtölj i ek"><div><small>2 MIN BORT</small><strong>Loungefåtölj i ek</strong><span>650 kr</span></div></div></div></div>
        </div>
        <div class="integration-copy"><p class="kicker">BYGGT FÖR BOENDEAPPEN</p><h2>EN NYTTA SOM REDAN HAR ETT HEM.</h2><p>Balder samlar redan felanmälan, betalningsinformation, tvättstugebokning och viktig boendeinformation i Boendeappen. Grannbytet blir en naturlig, tydligt avgränsad nästa funktion.</p><ol><li><span>01</span><div><strong>Öppna med befintlig inloggning</strong><p>Hyresavtalet styr automatiskt vad användaren får se.</p></div></li><li><span>02</span><div><strong>Publicera på under en minut</strong><p>Välj säljes, skänkes eller lånas ut och lägg till bilder.</p></div></li><li><span>03</span><div><strong>Möt en verifierad granne</strong><p>Kontakt och överlämning sker utan offentlig persondata.</p></div></li></ol><button class="button button-primary button-large" data-open="pilot">Se den föreslagna piloten ${icons.arrow}</button></div>
      </section>

      <section class="impact">
        <div><p class="kicker">PILOT MED KONTROLL</p><h2>LITEN START.<br>TYDLIGT VÄRDE.</h2><p>Konceptet är utformat för att testa faktisk boendenytta utan att öppna en extern marknadsplats.</p></div>
        <div class="metrics"><article><strong>8–12</strong><span>veckors avgränsad pilot</span></article><article><strong>0</strong><span>externa användare</span></article><article><strong>3</strong><span>flöden: sälj, skänk, låna</span></article><article><strong>100%</strong><span>avtalsverifierade konton</span></article></div>
        <p class="metric-note">Omfattning och principer ovan är förslag för en pilot, inte påstådda resultat.</p>
      </section>
    </main>

    <footer><div class="footer-brand"><span class="balder-mark small" aria-hidden="true"><i></i><b>BAL<br>DER</b></span><strong>Grannbytet</strong></div><p>Oberoende konceptdemo. Inte beställd, godkänd eller publicerad av Fastighets AB Balder.</p><a href="https://www.balder.se/" target="_blank" rel="noreferrer">Besök balder.se</a></footer>

    <div class="modal-backdrop" id="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div class="modal modal-wide"><div class="modal-head"><p>VERIFIERAD DEMOANNONS</p><button class="modal-close" aria-label="Stäng">×</button></div><div id="detail-content"></div></div></div>
    <div class="modal-backdrop" id="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div class="modal"><div class="modal-head"><div><p>GRANNBYTET</p><h2 id="create-title">Lägg upp en sak</h2></div><button class="modal-close" aria-label="Stäng">×</button></div><form id="create-form" class="form"><label>Rubrik<input required maxlength="70" placeholder="Vad vill du sälja, skänka eller låna ut?"></label><div class="form-row"><label>Typ<select><option>Säljes</option><option>Skänkes</option><option>Lånas ut</option></select></label><label>Synlighet<select><option>Min fastighet</option><option>Mitt kvarter</option><option>Mitt område</option></select></label></div><label>Beskrivning<textarea maxlength="400" placeholder="Skick, mått och praktisk information"></textarea></label><p class="form-note">Exakt adress, port och lägenhetsnummer visas aldrig i annonsen.</p><div class="form-actions"><button type="button" class="button button-ghost cancel">Avbryt</button><button class="button button-primary" type="submit">Skapa förhandsvisning</button></div></form></div></div>
    <div class="modal-backdrop" id="pilot-modal" role="dialog" aria-modal="true" aria-labelledby="pilot-title"><div class="modal modal-wide"><div class="modal-head"><div><p>FÖRSLAG TILL BALDER</p><h2 id="pilot-title">Från klickbar demo till kontrollerad pilot</h2></div><button class="modal-close" aria-label="Stäng">×</button></div><div class="pilot-grid"><article><span>01</span><h3>Avgränsa</h3><p>Välj ett bostadsområde med aktiv Boendeapp-användning och tydlig lokal förvaltning.</p></article><article><span>02</span><h3>Säkra</h3><p>Fastställ moderering, dataskydd, tillgänglighet, ansvar och incidentvägar innan verkliga data används.</p></article><article><span>03</span><h3>Mät</h3><p>Följ aktivering, publiceringar, genomförda överlämningar, modereringsbehov och upplevd boendenytta.</p></article><article><span>04</span><h3>Besluta</h3><p>Skala bara om piloten visar tydlig hyresgästnytta med hanterbar operativ risk.</p></article></div><div class="pilot-source"><strong>Konceptets faktagrund</strong><p>Balder beskriver Boendeappen som tillgänglig för bostadshyresgäster med bland annat felanmälan, betalningsinformation, tvättstugebokning och viktig information. Integrationsbilden här är ett designförslag; ingen Balder-data eller systemintegration används.</p></div></div></div>
    <div class="toast" role="status" aria-live="polite"></div>
  `;

  const grid = document.querySelector('#listing-grid');
  const count = document.querySelector('#result-count');

  function renderListings() {
    const query = state.query.trim().toLocaleLowerCase('sv');
    const visible = listings.filter(item => (state.category === 'Alla' || item.category === state.category) && (!query || `${item.title} ${item.category} ${item.kind}`.toLocaleLowerCase('sv').includes(query)));
    const sorted = [...visible];
    if (state.scope === 'Gratis först') sorted.sort((a, b) => (a.price === 'Gratis' ? -1 : 1) - (b.price === 'Gratis' ? -1 : 1));
    count.textContent = `${sorted.length} demoannonser`;
    grid.innerHTML = sorted.length ? sorted.map(item => `<article class="listing-card"><button class="card-hit" data-id="${listings.indexOf(item)}" aria-label="Visa ${item.title}"></button><div class="listing-image"><img src="assets/${item.image}" alt="${item.title}"><span class="listing-kind">${item.kind}</span><button class="favorite" aria-label="Spara ${item.title}" aria-pressed="false">♡</button></div><div class="listing-body"><div class="listing-location">${icons.pin}<span>${item.distance} · ${item.area}</span></div><h3>${item.title}</h3><div class="listing-bottom"><strong>${item.price}</strong><span>Visa ${icons.arrow}</span></div></div></article>`).join('') : '<div class="empty"><strong>Inga saker matchar sökningen.</strong><span>Prova en annan kategori eller sökfras.</span></div>';
  }

  document.querySelector('#search').addEventListener('input', event => { state.query = event.target.value; renderListings(); });
  document.querySelector('#scope').addEventListener('change', event => { state.scope = event.target.value; renderListings(); announce(`Sorterar efter ${state.scope.toLocaleLowerCase('sv')}`); });
  document.querySelectorAll('.category').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.category').forEach(item => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true'); state.category = button.dataset.category; renderListings();
  }));

  document.addEventListener('click', event => {
    const card = event.target.closest('.card-hit'); if (card) { showDetail(listings[Number(card.dataset.id)]); return; }
    const favorite = event.target.closest('.favorite'); if (favorite) { const active = favorite.getAttribute('aria-pressed') === 'true'; favorite.setAttribute('aria-pressed', String(!active)); favorite.textContent = active ? '♡' : '♥'; announce(active ? 'Borttagen från sparade' : 'Sparad i demon'); return; }
    const trigger = event.target.closest('[data-open]'); if (trigger) { openModal(document.querySelector(`#${trigger.dataset.open}-modal`)); return; }
    if (event.target.classList.contains('modal-backdrop') || event.target.closest('.modal-close') || event.target.closest('.cancel')) closeModals();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModals(); });
  document.querySelector('#create-form').addEventListener('submit', event => { event.preventDefault(); closeModals(); announce('Förhandsvisning skapad – inget har publicerats'); event.target.reset(); });

  function showDetail(item) {
    document.querySelector('#detail-content').innerHTML = `<div class="detail-layout"><img src="assets/${item.image}" alt="${item.title}"><div class="detail-copy"><p class="kicker">${item.kind} · ${item.distance}</p><h2 id="detail-title">${item.title}</h2><strong class="detail-price">${item.price}</strong><p>${item.description}</p><div class="safe-box">${icons.shield}<div><strong>Trygg kontakt</strong><span>Exakt adress och lägenhetsnummer visas aldrig i katalogen.</span></div></div><button class="button button-primary button-large" id="interest">Skicka intresse ${icons.arrow}</button></div></div>`;
    openModal(document.querySelector('#detail-modal'));
    document.querySelector('#interest').addEventListener('click', () => announce('Intresse sparat lokalt i demon'));
  }

  function openModal(modal) { modal.classList.add('open'); document.body.classList.add('modal-open'); const focusable = modal.querySelector('button, input, select'); if (focusable) focusable.focus(); }
  function closeModals() { document.querySelectorAll('.modal-backdrop.open').forEach(modal => modal.classList.remove('open')); document.body.classList.remove('modal-open'); }
  function announce(message) { const toast = document.querySelector('.toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(window.__balderToast); window.__balderToast = setTimeout(() => toast.classList.remove('show'), 2300); }

  renderListings();
})();
