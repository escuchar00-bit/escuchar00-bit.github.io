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

form?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(!form.reportValidity()) return;

  const email=document.querySelector('#rfq-email');
  const reply=document.querySelector('#rfq-replyto');
  if(reply&&email) reply.value=email.value;

  const submitButton=form.querySelector('button[type="submit"]');
  if(submitButton?.disabled) return;
  if(submitButton) submitButton.disabled=true;
  if(status) {
    status.textContent='Sending your inquiry…';
    status.setAttribute('role','status');
  }

  const payload=Object.fromEntries(new FormData(form).entries());
  const ajaxUrl=form.action.replace('https://formsubmit.co/','https://formsubmit.co/ajax/');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);

  try {
    const response=await fetch(ajaxUrl,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload),
      signal:controller.signal
    });
    if(!response.ok) throw new Error('FormSubmit HTTP '+response.status);
    const result=await response.json();
    // Only a positive provider acknowledgement can lead to the thank-you page.
    if(result.success!==true&&result.success!=='true') {
      throw new Error(result.message||'FormSubmit did not confirm delivery');
    }
    sessionStorage.setItem('liangrui_lead_confirmed',String(Date.now()));
    window.location.assign('https://liangruihome.com/thank-you.html');
  } catch(error) {
    console.error('Inquiry submission not confirmed:',error);
    if(status) {
      status.textContent='We could not confirm your inquiry was sent. Please try again, or email henry.zhang@movellc.net directly.';
      status.setAttribute('role','alert');
    }
    if(submitButton) submitButton.disabled=false;
  } finally {
    clearTimeout(timer);
  }
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
