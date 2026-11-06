const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.main-nav');
toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}));

if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}else{
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
}

const productSelect=document.querySelector('#rfq-product');
document.querySelectorAll('.product-card').forEach(card=>card.querySelector('.product-link')?.addEventListener('click',()=>{
  if(productSelect)productSelect.value=card.dataset.product||'';
  document.querySelector('#inquiry')?.scrollIntoView({behavior:'smooth'});
}));

const params=new URLSearchParams(window.location.search);
const attributionKeys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
attributionKeys.forEach(key=>{
  const incoming=params.get(key);
  if(incoming) sessionStorage.setItem('liangrui_'+key,incoming);
  const value=incoming||sessionStorage.getItem('liangrui_'+key)||'';
  const el=document.querySelector('#'+key.replaceAll('_','-'));
  if(el) el.value=value;
});
const landing=document.querySelector('#landing-page');
if(landing) landing.value=window.location.pathname;
const referrer=document.querySelector('#referrer');
if(referrer) referrer.value=document.referrer||'direct';

const form=document.querySelector('#rfq-form');
const status=document.querySelector('#form-status');

function buildInquiry(){
  const data=new FormData(form);
  const val=n=>String(data.get(n)||'').trim();
  const subject='Knit Blanket Development Inquiry'+(val('company')?' | '+val('company'):'');
  const body=[
    'Hi Henry,',
    '',
    'I would like to discuss a knit blanket development program.',
    '',
    `Name: ${val('name')||'-'}`,
    `Company: ${val('company')||'-'}`,
    `Email: ${val('email')||'-'}`,
    `WhatsApp / phone: ${val('phone')||'-'}`,
    `Company website: ${val('website')||'-'}`,
    `Product: ${val('product')||'-'}`,
    `Target quantity: ${val('quantity')||'-'}`,
    `Size / specification: ${val('size')||'-'}`,
    '',
    'Development brief:',
    val('message')||'-',
    '',
    'Best regards,'
  ].join('\n');
  return{subject,body};
}

// Submit directly through the configured form provider using a native POST.
// This avoids cross-origin AJAX failures and preserves the redirect flow.
form?.addEventListener('submit',(event)=>{
  if(!form.reportValidity()){
    event.preventDefault();
    return;
  }

  const email=document.querySelector('#rfq-email');
  const reply=document.querySelector('#rfq-replyto');
  if(reply&&email) reply.value=email.value;

  const submitButton=form.querySelector('button[type="submit"]');
  if(submitButton?.disabled){
    event.preventDefault();
    return;
  }

  // The thank-you page only counts a lead after the provider redirects there.
  // Allow time for the provider's anti-spam verification step.
  try{
    sessionStorage.setItem('liangrui_lead_pending',String(Date.now()));
  }catch(error){
    console.warn('Unable to save lead-tracking marker:',error);
  }
  if(submitButton) submitButton.disabled=true;
  if(status){
    status.textContent='Opening the secure inquiry confirmation…';
    status.setAttribute('role','status');
  }
  // Do not preventDefault: browser POST handles validation and success redirect.
});

document.querySelector('#copy-inquiry')?.addEventListener('click',async()=>{
  if(!form.reportValidity())return;
  const{subject,body}=buildInquiry();
  try{
    await navigator.clipboard.writeText(`To: henry.zhang@movellc.net\nSubject: ${subject}\n\n${body}`);
    if(status)status.textContent='Inquiry copied. Paste it into any email app.';
  }catch{
    if(status)status.textContent='Copy was blocked. Please email henry.zhang@movellc.net directly.';
  }
});

/*
 * Mobile image resilience: anticipate images near the viewport and retry
 * transient same-origin asset failures without changing layout or form logic.
 */
(() => {
  const images = Array.from(document.querySelectorAll('img[src]')).filter(image => {
    const source = image.getAttribute('src') || '';
    return source.startsWith('assets/') || source.startsWith('/assets/');
  });

  images.forEach(image => {
    const originalSource = image.getAttribute('src');
    let attempts = 0;
    let retryTimer = null;

    const retry = () => {
      if (attempts >= 2 || retryTimer !== null) return;
      attempts += 1;
      const nextSource = new URL(originalSource, document.baseURI);
      nextSource.searchParams.set('lr_image_retry', attempts + '-' + Date.now());
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        if (!image.isConnected || (image.complete && image.naturalWidth > 0)) return;
        image.src = nextSource.href;
      }, attempts === 1 ? 700 : 1800);
    };

    image.addEventListener('error', retry);
    image.addEventListener('load', () => {
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    });
    if (image.complete && image.naturalWidth === 0) retry();
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute('loading', 'eager');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '600px 0px', threshold: 0.01 });

    images.filter(image => image.getAttribute('loading') === 'lazy')
      .forEach(image => observer.observe(image));
  }
})();
