// ════════════════════════════════════════════════
// SUPABASE AUTH — username + password only
// ════════════════════════════════════════════════
// Username is mapped to a hidden email (username@EMAIL_DOMAIN) so we can use
// Supabase Auth without ever showing an email field to the user.

const SUPABASE_URL      = 'https://hjivswouewclgmmjfapd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lWff8NqB05_DOOLismmftw_6T9zEGVD'; // publishable (client-safe) key
const EMAIL_DOMAIN      = 'mypayments.app';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $overlay  = document.getElementById('auth-overlay');
const $username = document.getElementById('auth-username');
const $password = document.getElementById('auth-password');
const $submit   = document.getElementById('auth-submit');
const $error    = document.getElementById('auth-error');
const $subtitle = document.getElementById('auth-subtitle');
const $toggle   = document.getElementById('auth-toggle');
const $toggleLink = document.getElementById('auth-toggle-link');

let authMode = 'signin'; // 'signin' | 'signup'

function usernameToEmail(u){ return u.toLowerCase().trim() + '@' + EMAIL_DOMAIN; }
function emailToUsername(e){ return (e || '').split('@')[0]; }

function showError(msg){ $error.textContent = msg; $error.style.display = 'block'; }
function clearError(){ $error.textContent = ''; $error.style.display = 'none'; }

function translateError(msg){
  const m = (msg || '').toLowerCase();
  if(m.includes('invalid login credentials')) return 'اسم المستخدم أو كلمة المرور غير صحيحة';
  if(m.includes('already registered') || m.includes('already exists')) return 'اسم المستخدم مستخدم بالفعل — سجّل الدخول';
  if(m.includes('password should be at least')) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  if(m.includes('email logins are disabled')) return 'تسجيل الدخول معطّل في إعدادات Supabase';
  if(m.includes('failed to fetch')) return 'تعذّر الاتصال — تحقق من الإنترنت أو إعدادات Supabase';
  return msg || 'حدث خطأ، حاول مرة أخرى';
}

function setMode(mode){
  authMode = mode;
  clearError();
  if(mode === 'signin'){
    $submit.textContent = 'تسجيل الدخول';
    $subtitle.textContent = 'سجّل دخولك للمتابعة';
    $toggle.firstChild.textContent = 'ما عندك حساب؟ ';
    $toggleLink.textContent = 'أنشئ حساب';
    $password.setAttribute('autocomplete', 'current-password');
  } else {
    $submit.textContent = 'إنشاء حساب';
    $subtitle.textContent = 'أنشئ حساباً جديداً';
    $toggle.firstChild.textContent = 'عندك حساب؟ ';
    $toggleLink.textContent = 'تسجيل الدخول';
    $password.setAttribute('autocomplete', 'new-password');
  }
}

function showApp(session){
  const username = emailToUsername(session && session.user && session.user.email);
  const accEl = document.getElementById('account-user');
  if(accEl) accEl.textContent = username ? ('مسجّل الدخول باسم: ' + username) : '';
  $overlay.style.display = 'none';
}

function showAuth(){
  $overlay.style.display = 'flex';
}

async function handleSubmit(){
  const u = $username.value.trim();
  const p = $password.value;
  clearError();
  if(!u || !p){ showError('أدخل اسم المستخدم وكلمة المرور'); return; }
  if(authMode === 'signup' && p.length < 6){ showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }

  $submit.disabled = true;
  $submit.textContent = '...';
  const email = usernameToEmail(u);

  try{
    let res;
    if(authMode === 'signin'){
      res = await sb.auth.signInWithPassword({ email, password: p });
    } else {
      res = await sb.auth.signUp({ email, password: p });
    }

    if(res.error){ showError(translateError(res.error.message)); return; }

    // Sign-up succeeded but no session yet (email confirmation still on) —
    // try to sign in directly; if that fails, ask user to confirm email setting.
    if(authMode === 'signup' && !(res.data && res.data.session)){
      const si = await sb.auth.signInWithPassword({ email, password: p });
      if(si.error){
        setMode('signin');
        showError('تم إنشاء الحساب. إذا لم تستطع الدخول، عطّل "Confirm email" في إعدادات Supabase.');
        return;
      }
      showApp(si.data.session);
      return;
    }

    showApp(res.data.session);
  } catch(e){
    showError(translateError(e && e.message));
  } finally {
    $submit.disabled = false;
    $submit.textContent = authMode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب';
  }
}

$submit.addEventListener('click', handleSubmit);
$password.addEventListener('keydown', e => { if(e.key === 'Enter') handleSubmit(); });
$username.addEventListener('keydown', e => { if(e.key === 'Enter') $password.focus(); });
$toggleLink.addEventListener('click', () => setMode(authMode === 'signin' ? 'signup' : 'signin'));

const $logout = document.getElementById('btn-logout');
if($logout) $logout.addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

// On load: show app if already signed in, otherwise show the login form.
sb.auth.getSession().then(({ data }) => {
  if(data && data.session) showApp(data.session);
  else showAuth();
});
