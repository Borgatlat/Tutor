// Screen tests: drive every screen and button of the web build in Chromium
// against a fake Supabase backend that records every write, then check what
// the app sent. Nothing touches a real project.
//
//   npx expo export --platform web --output-dir dist
//   npm run test:e2e            (WEB_BUILD=other/dir to test another build)
//
// The database rules behind these writes are tested for real in
// supabase/tests/database.test.sql (npm run test:db).
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(process.env.WEB_BUILD || path.join(__dirname, '..', 'dist'));
const SHOTS = process.env.SHOTS_DIR || null;   // set to save screenshots
const shot = (page, name) => SHOTS ? page.screenshot({ path: path.join(SHOTS, name) }) : null;
if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error(`No web build at ${ROOT}. Run: npx expo export --platform web --output-dir dist`);
  process.exit(1);
}
const srv = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, 'index.html');
  const t = {'.js':'application/javascript','.html':'text/html','.ttf':'font/ttf','.png':'image/png','.json':'application/json','.css':'text/css'}[path.extname(f)];
  res.writeHead(200, {'Content-Type': t || 'application/octet-stream'}); fs.createReadStream(f).pipe(res);
}).listen(8099);

const UID = '00000000-0000-0000-0000-000000000001';
const now = Math.floor(Date.now()/1000);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = `${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:UID,exp:now+86400,role:'authenticated',aud:'authenticated'})}.sig`;
const user = { id: UID, email: 'jsmith@mail.strakejesuit.org', aud:'authenticated', role:'authenticated', user_metadata:{full_name:'James Smith', role:'both'} };
const session = { access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 86400, expires_at: now+86400, user };
const tutors = [
  { id:'t1', full_name:'Alex Kim', email:'akim@mail.strakejesuit.org', avg_rating:4.9, review_count:12, session_count:24, bio:'Senior.', subjects:[{subject:'SAT Math',grade:'800'},{subject:'Chemistry'}], availability:[{period:2},{period:3}] },
  { id:'t2', full_name:'Luke Patel', email:'lpatel@mail.strakejesuit.org', avg_rating:4.8, review_count:8, session_count:17, bio:'Junior.', show_phone:true, subjects:[{subject:'SAT English'}], availability:[{period:6}] },
];
const SESS = {
  upcoming: [
    { id:'s1', tutor_id:'t1', student_id:UID, status:'confirmed', subject:'SAT Math', period:3, notes:'x', tutor:{id:'t1',full_name:'Alex Kim'}, student:{id:UID,full_name:'James Smith'} },
    { id:'s2', tutor_id:UID, student_id:'t2', status:'pending', subject:'Calculus', period:6, notes:null, tutor:{id:UID,full_name:'James Smith'}, student:{id:'t2',full_name:'Luke Patel'} },
    { id:'s4', tutor_id:UID, student_id:'t2', status:'confirmed', subject:'Calculus', period:4, notes:null, tutor:{id:UID,full_name:'James Smith'}, student:{id:'t2',full_name:'Luke Patel'} },
  ],
  past: [
    { id:'s3', tutor_id:'t2', student_id:UID, status:'completed', subject:'SAT English', period:5, notes:null, tutor:{id:'t2',full_name:'Luke Patel'}, student:{id:UID,full_name:'James Smith'} },
    { id:'s5', tutor_id:UID, student_id:'t2', status:'completed', subject:'Calculus', period:2, notes:null, created_at:'2026-10-01T15:00:00Z', tutor:{id:UID,full_name:'James Smith'}, student:{id:'t2',full_name:'Luke Patel'} },
  ],
};

const results = []; let writes = []; let denied = [];
// The days the app should offer for block 3, from the app's own rotation
// rules (sucrase, already installed with Expo, loads the ES module here).
require('sucrase/register');
const BOOKABLE = require('../src/utils/schedule').bookableDays({ period: 3, count: 10 });
const ok = (name, cond, detail='') => { results.push({ name, pass: !!cond, detail }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const lastWrite = (pred) => [...writes].reverse().find(pred);

async function ctxFor(browser, mode, failWrites = false, tour = false) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.route(/supabase\.co/, async (route) => {
    const r = route.request(); const u = r.url(); const m = r.method(); const accept = r.headers()['accept'] || '';
    let body = null; try { body = r.postDataJSON(); } catch {}
    if (m !== 'GET' && !u.includes('/auth/v1/token') && !u.includes('/auth/v1/logout')) writes.push({ m, u, body });
    if (m === 'POST' && u.includes('/auth/v1/token')) {
      return route.fulfill({ status: 400, contentType:'application/json', body: JSON.stringify({ error:'invalid_grant', error_description:'Invalid login credentials', msg:'Invalid login credentials' }) });
    }
    if (failWrites && m !== 'GET' && u.includes('/rest/v1/') && !u.includes('/rpc/')) {
      return route.fulfill({ status: 403, contentType:'application/json', body: JSON.stringify({ message:'new row violates row-level security policy', code:'42501' }) });
    }
    let out = [];
    if (u.includes('/auth/v1/signup')) out = { id:'new', email: body?.email, user_metadata: body?.data };
    else if (u.includes('/auth/v1/resend')) out = {};
    else if (u.includes('/auth/v1/logout')) return route.fulfill({ status: 204, body: '' });
    else if (u.includes('/auth/v1/user')) out = mode === 'setup' ? {...user, user_metadata:{role:'both'}} : user;
    else if (u.includes('/rpc/tutor_booked_slots')) out = [{ session_date: BOOKABLE[1], period: 3 }];
    else if (u.includes('/rpc/community_stats')) out = [{ sessions_completed: 42, hours_tutored: 35, active_tutors: 9 }];
    else if (u.includes('/rpc/shared_phone')) out = body?.uid === 't2' ? '7135550142' : null;
    else if (u.includes('/rpc/delete_my_account')) out = null;
    else if (u.includes('/storage/v1/object/list/avatars')) out = [{ name: 'avatar.jpg' }];
    else if (u.includes('/storage/v1/object/avatars') && m === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    else if (u.includes('/rpc/search_tutors') && mode === 'empty') out = [];
    else if (u.includes('/rest/v1/sessions') && m === 'GET' && mode === 'empty') out = [];
    else if (u.includes('/rpc/search_tutors')) out = (body?.query_name && !'alex kim luke patel'.includes(body.query_name.toLowerCase())) ? [] : tutors;
    else if ((u.includes('/rest/v1/profiles') && m === 'GET') || u.includes('/rpc/get_my_profile')) {
      if (u.includes('/rest/v1/profiles') && /select=\*|phone[,&]|phone$/.test(decodeURIComponent(u).replace('show_phone', ''))) {
        // Same as the real database: phone numbers aren't readable here.
        denied.push(u);
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: '42501', message: 'permission denied for table profiles' }) });
      }
      const t = tutors.find((t) => u.includes('eq.' + t.id));
      const p = t ? { ...t, role:'tutor' } : (mode === 'setup'
        ? { id: UID, email: user.email, full_name: '', role: 'both', setup_complete: false }
        : { id: UID, email: user.email, full_name: 'James Smith', role: 'both', bio: 'Bio here', phone: null, setup_complete: true, is_moderator: mode === 'mod' });
      out = accept.includes('object') ? p : [p];
    }
    else if (u.includes('/rest/v1/tutor_subjects') && m === 'GET') out = u.includes('eq.t1') ? [{subject:'SAT Math',grade:'800'},{subject:'Chemistry',grade:null}] : [{subject:'SAT Math',grade:'790'}];
    else if (u.includes('/rest/v1/tutor_availability') && m === 'GET') out = [{period:2},{period:3}];
    else if (u.includes('/rest/v1/sessions') && m === 'GET') out = u.includes('completed') ? SESS.past : SESS.upcoming;
    else if (u.includes('/rest/v1/reports') && m === 'GET') out = [{ id: 'r1', reason: 'Spam or advertising', details: 'Kept posting links', created_at: '2026-10-01T15:00:00Z', reporter: { full_name: 'Ben Lee' }, reported: { full_name: 'Cal Out' } }];
    else if (u.includes('/rest/v1/messages') && m === 'GET') out = [];
    else if (u.includes('/rest/v1/messages') && m === 'POST') return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'msg1', ...body, created_at: new Date().toISOString() }) });
    else if (u.includes('/rest/v1/reviews') && m === 'GET') out = u.includes('session_id') ? [] : [];
    if (m !== 'GET' && accept.includes('object') && !u.includes('/rpc/')) out = {};
    await route.fulfill({ status: m === 'GET' || m === 'POST' ? 200 : 204, contentType: 'application/json', body: m === 'PATCH' || m === 'DELETE' ? '' : JSON.stringify(out) });
  });
  if (mode !== 'signedOut') await ctx.addInitScript((s) => localStorage.setItem('sb-lmavnypvqdomdefpjbok-auth-token', s), JSON.stringify(session));
  if (!tour) await ctx.addInitScript(() => localStorage.setItem('welcomeTour.seen.v1', '1'));
  // Record links the app opens in a new tab, and answer outside sites locally
  // so the checks never wait on the network.
  await ctx.addInitScript(() => {
    const open = window.open.bind(window);
    window.__opened = [];
    window.open = (url, ...rest) => { window.__opened.push(String(url)); return open(url, ...rest); };
  });
  await ctx.route((url) => !/^(localhost|127\.0\.0\.1)$/.test(url.hostname) && !url.hostname.endsWith('supabase.co'),
    (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>external</title>' }));
  const page = await ctx.newPage(); page.setDefaultTimeout(6000);
  page.on('pageerror', (e) => ok(`no JS crash (${mode})`, false, e.message));
  page.on('popup', (p) => { page._popups = (page._popups || []).concat(p.url()); });
  await page.goto('http://localhost:8099/'); await page.waitForTimeout(2500);
  return { ctx, page };
}

const RX = (t, exact) => typeof t === 'string' ? new RegExp((exact ? '^' : '') + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (exact ? '$' : ''), 'i') : t;
const V = (page, t, exact = true) => page.getByText(RX(t, exact)).filter({ visible: true }).first();
const L = (page, l) => page.getByLabel(l, { exact: true }).filter({ visible: true }).first();
const tab = (page, n) => page.getByRole('tab', { name: n }).filter({ visible: true }).first().click();
const seen = async (page, t, exact = true) => (await page.getByText(RX(t, exact)).filter({ visible: true }).count()) > 0;
const wait = (page, ms = 700) => page.waitForTimeout(ms);
async function type(page, label, text) { const el = page.locator(`[aria-label="${label}"]`).filter({ visible: true }).first(); await el.fill(text); }

(async () => {
  const browser = await chromium.launch();

  // ── Signed out: Login / Sign up / Verify ────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'signedOut');
    await V(page, 'Sign In').click().catch(()=>{});
    await page.getByRole('button', { name: 'Sign In' }).filter({ visible: true }).first().click(); await wait(page);
    ok('Login: empty submit shows validation', await seen(page, 'Enter a valid email', false) || await seen(page, 'Required', false) || await seen(page, 'expected string', false));
    await type(page, 'School email', 'someone@gmail.com'); await type(page, 'Password', 'secret123');
    await page.getByRole('button', { name: 'Sign In' }).filter({ visible: true }).first().click(); await wait(page);
    ok('Login: non-school email rejected', await seen(page, 'Must be a @mail.strakejesuit.org address'));
    await type(page, 'School email', 'jsmith@mail.strakejesuit.org');
    await L(page, 'Show password').click(); await wait(page, 200);
    ok('Login: show/hide password toggles', await page.locator('[aria-label="Password"]').getAttribute('type') === 'text');
    await page.getByRole('button', { name: 'Sign In' }).filter({ visible: true }).first().click(); await wait(page, 1500);
    ok('Login: wrong password shows server error', await seen(page, 'Invalid login credentials'));
    await V(page, 'Privacy Policy').click(); await wait(page, 800);
    { const opened = await page.evaluate(() => window.__opened);
      ok('Login: Privacy Policy link opens', opened.includes('https://betterullc.com/privacy'), opened.join(',')); }
    await page.getByRole('button', { name: 'Create an Account' }).filter({ visible: true }).first().click(); await wait(page);
    ok('Login → Sign up navigation', await seen(page, 'Create Account'));
    await page.getByRole('button', { name: 'Create Account' }).filter({ visible: true }).first().click(); await wait(page);
    ok('Sign up: empty submit shows validation', await seen(page, 'Enter your full name'));
    await page.getByRole('radio', { name: /^Tutor/ }).filter({ visible: true }).first().click(); await wait(page, 200);
    await type(page, 'Full name', 'Test Student'); await type(page, 'School email', 'TStudent@mail.strakejesuit.org'); await type(page, 'Password', 'short');
    await page.getByRole('button', { name: 'Create Account' }).filter({ visible: true }).first().click(); await wait(page);
    ok('Sign up: short password rejected', await seen(page, 'Password must be at least 8 characters'));
    await type(page, 'Password', 'longenough1');
    writes = [];
    await page.getByRole('button', { name: 'Create Account' }).filter({ visible: true }).first().click(); await wait(page, 1500);
    const su = lastWrite((w) => w.u.includes('/auth/v1/signup'));
    ok('Sign up: sends lowercased email + name + role', su && su.body.email === 'tstudent@mail.strakejesuit.org' && su.body.data?.role === 'tutor' && su.body.data?.full_name === 'Test Student', JSON.stringify(su?.body?.data));
    ok('Sign up → Verify email screen', await seen(page, 'Confirm Your Email'));
    await page.getByRole('button', { name: 'Resend Confirmation Email' }).filter({ visible: true }).first().click(); await wait(page, 1200);
    ok('Verify: resend works', await seen(page, 'Resend requested', false) && !!lastWrite((w) => w.u.includes('/auth/v1/resend')));
    await shot(page, 'verify.png');
    await ctx.close(); }

  // ── Profile setup ───────────────────────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'setup');
    ok('Setup: step 1 of 3 with progress', await seen(page, 'About you') && await seen(page, 'Step 1 of 3'));
    ok('Setup: no phone field (private, added later in Profile)', (await page.locator('[aria-label="Phone number"]').count()) === 0);
    await type(page, 'Bio', 'I like math');
    await page.getByRole('button', { name: 'Next' }).filter({ visible: true }).first().click(); await wait(page, 400);
    ok('Setup: step 2 is what you teach', await seen(page, 'What you teach') && await seen(page, 'Step 2 of 3'));
    await page.getByRole('button', { name: 'Back' }).filter({ visible: true }).first().click(); await wait(page, 300);
    ok('Setup: Back returns to step 1 and keeps the bio', await seen(page, 'About you') && (await page.locator('[aria-label="Bio"]').filter({ visible: true }).first().inputValue()) === 'I like math');
    await page.getByRole('button', { name: 'Next' }).filter({ visible: true }).first().click(); await wait(page, 400);
    await L(page, 'Math, 0 selected').click(); await wait(page, 300);
    await V(page, 'Calculus').click(); await wait(page, 300);
    await type(page, 'Grade for Calculus', 'A');
    await page.getByRole('button', { name: 'Next' }).filter({ visible: true }).first().click(); await wait(page, 400);
    ok('Setup: step 3 is free blocks', await seen(page, "When you're free") && await seen(page, 'Step 3 of 3'));
    await shot(page, 'free-times.png');
    ok('Setup: Community Time is a CT chip like B1–B8', await page.getByLabel('Community Time, not free').filter({ visible: true }).count() > 0 && await seen(page, 'CT'));
    await L(page, 'Block 4, not free').click(); await wait(page, 300);
    await L(page, 'Community Time, not free').click(); await wait(page, 300);
    writes = [];
    await page.getByRole('button', { name: 'Finish setup' }).filter({ visible: true }).first().click(); await wait(page, 2500);
    const prof = lastWrite((w) => w.u.includes('/rest/v1/profiles') && w.m === 'PATCH' && w.body?.bio);
    const subj = lastWrite((w) => w.u.includes('/rest/v1/tutor_subjects') && w.m === 'POST');
    const av = lastWrite((w) => w.u.includes('/rest/v1/tutor_availability') && w.m === 'POST');
    ok('Setup: saves bio (and no phone)', prof && prof.body.bio === 'I like math' && !('phone' in prof.body), JSON.stringify(prof?.body));
    ok('Setup: saves CT with the free blocks', av && JSON.stringify(av.body).includes('"period":9') && JSON.stringify(av.body).includes('"period":4'), JSON.stringify(av?.body));
    ok('Setup: saves subject + grade', subj && JSON.stringify(subj.body).includes('"grade":"A"'), JSON.stringify(subj?.body));
    ok('Setup: saves free block', av && JSON.stringify(av.body).includes('"period":4'), JSON.stringify(av?.body));
    ok('Setup → app after "Finish setup"', await seen(page, 'Upcoming Sessions') || await seen(page, 'Top Tutors'));
    await ctx.close(); }
  { const { ctx, page } = await ctxFor(browser, 'setup');
    await V(page, 'Skip for now').click(); await wait(page, 1500);
    ok('Setup: "Skip for now" enters app', await seen(page, 'Top Tutors'));
    await ctx.close(); }

  // ── Forgot password ───────────────────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'signedOut');
    await L(page, 'Forgot password? Send a reset link to my school email').click(); await wait(page, 400);
    ok('Forgot password: asks for the school email first', await seen(page, 'then tap', false));
    await type(page, 'School email', 'jsmith@mail.strakejesuit.org'); writes = [];
    await L(page, 'Forgot password? Send a reset link to my school email').click(); await wait(page, 1200);
    ok('Forgot password: sends reset email', !!lastWrite((w) => w.u.includes('/auth/v1/recover')) && await seen(page, 'reset link was requested', false));
    await ctx.close(); }

  // ── Get started: invite a friend ──────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'in');
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:8099' });
    await page.evaluate(() => { try { delete navigator.share; } catch {} });
    await L(page, 'Invite a friend').click(); await wait(page, 800);
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    ok('Checklist: invite copies a link', clip.includes('http://localhost:8099'), clip);
    ok('Checklist: last step done hides the card', !(await seen(page, 'Get started')));
    await ctx.close(); }
  { const { ctx, page } = await ctxFor(browser, 'in');
    await L(page, 'Hide the get started checklist').click(); await wait(page, 300);
    ok('Checklist: can be hidden', !(await seen(page, 'Get started')));
    await page.reload(); await wait(page, 2500);
    ok('Checklist: stays hidden after reload', !(await seen(page, 'Get started')) && await seen(page, 'Alex Kim'));
    await ctx.close(); }

  // ── Moderator tools ──────────────────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'mod');
    await tab(page, 'Profile'); await wait(page, 1000);
    await L(page, 'Open moderator tools').click(); await wait(page, 1200);
    ok('Moderation: hours queue', await seen(page, 'Moderator tools') && await seen(page, 'to verify', false));
    writes = [];
    await page.getByRole('button', { name: /^Verify .*session/ }).filter({ visible: true }).first().click(); await wait(page, 1000);
    const vf = lastWrite((w) => w.u.includes('/rest/v1/sessions') && w.m === 'PATCH');
    ok('Moderation: verify hours', vf && !!vf.body.verified_at, JSON.stringify(vf?.body));
    await page.getByRole('tab', { name: 'Reports' }).filter({ visible: true }).first().click(); await wait(page, 1000);
    ok('Moderation: reports queue shows the report', await seen(page, 'Cal Out') && await seen(page, 'Kept posting links', false));
    writes = [];
    await page.getByRole('button', { name: /^Mark the report/ }).filter({ visible: true }).first().click(); await wait(page, 1000);
    const rv2 = lastWrite((w) => w.u.includes('/rest/v1/reports') && w.m === 'PATCH');
    ok('Moderation: mark report reviewed', rv2 && rv2.body.reviewed === true && rv2.body.reviewed_by === UID, JSON.stringify(rv2?.body));
    ok('Moderation: handled report leaves the queue', !(await seen(page, 'Cal Out')));
    await ctx.close(); }

  // ── First-run tour ─────────────────────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'in', false, true);
    ok('Tour: shows on first visit', await seen(page, "Hi, I'm Ollie!"));
    await page.getByRole('button', { name: 'Next' }).filter({ visible: true }).first().click(); await wait(page, 300);
    ok('Tour: step 2', await seen(page, 'Book a free block'));
    await page.getByRole('button', { name: 'Next' }).filter({ visible: true }).first().click(); await wait(page, 300);
    await page.getByRole('button', { name: 'Get started', exact: true }).filter({ visible: true }).first().click(); await wait(page, 500);
    ok('Tour: closes and is remembered', !(await seen(page, 'Book a free block')) && (await page.evaluate(() => localStorage.getItem('welcomeTour.seen.v1'))) === '1');
    await page.reload(); await wait(page, 2500);
    ok('Tour: not shown again', !(await seen(page, "Hi, I'm Ollie!")));
    await ctx.close(); }

  // ── Signed-in app ───────────────────────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'in');
    // Home
    ok('Home loads tutors', await seen(page, 'Alex Kim'));
    ok('Badges: Top tutor on tutor card', await seen(page, 'Top tutor'));
    ok('Checklist: Get started card on Home', await seen(page, 'Get started') && await seen(page, 'Invite a friend') && await seen(page, 'Host your first session'));
    ok('Home: school-wide impact strip', await seen(page, 'Hours tutored') && await seen(page, '35'));
    await L(page, 'Find a tutor').click(); await wait(page);
    ok('Home: Find a Tutor → Search', await seen(page, 'Find a Tutor'));
    await tab(page, 'Home'); await wait(page);
    await L(page, 'My sessions').click(); await wait(page);
    ok('Home: My Sessions → Sessions', await seen(page, 'My Sessions'));
    await tab(page, 'Home'); await wait(page);
    await L(page, 'See all').click(); await wait(page);
    ok('Home: See all → Sessions', await seen(page, 'My Sessions'));
    await tab(page, 'Home'); await wait(page);
    await L(page, 'Open your profile').click(); await wait(page);
    ok('Home: avatar → Profile', await seen(page, 'Profile Info'));
    await tab(page, 'Home'); await wait(page);
    await L(page, 'Browse tutors for core classes, SAT and AP').click(); await wait(page);
    ok('Home: promo → Search', await seen(page, 'Find a Tutor'));

    // Search
    writes = [];
    await type(page, 'Search tutors by name', 'zzz'); await wait(page, 1200);
    ok('Search: no-results empty state', await seen(page, 'No tutors found'));
    await L(page, 'Clear search').click(); await wait(page, 1200);
    ok('Search: clear search restores list', await seen(page, 'Alex Kim'));
    await L(page, 'Show filters').click(); await wait(page);
    await L(page, 'Filter to Block 3').click(); await wait(page, 1000);
    const rpc = lastWrite((w) => w.u.includes('search_tutors'));
    ok('Search: block filter sent', rpc && rpc.body.filter_period === 3, JSON.stringify(rpc?.body));
    await L(page, 'Filter to Community Time').click(); await wait(page, 1000);
    const rpcCt = lastWrite((w) => w.u.includes('search_tutors'));
    ok('Search: CT filter sent as block 9', rpcCt && rpcCt.body.filter_period === 9, JSON.stringify(rpcCt?.body));
    await L(page, 'Filter to Block 3').click(); await wait(page, 1000);
    await V(page, 'SAT Prep').click().catch(()=>{}); await wait(page, 300);
    await V(page, 'SAT Math').click(); await wait(page, 1000);
    const rpc2 = lastWrite((w) => w.u.includes('search_tutors'));
    ok('Search: subject filter sent', rpc2 && rpc2.body.filter_subject === 'SAT Math', JSON.stringify(rpc2?.body));
    await V(page, 'Match my schedule').click(); await wait(page, 1000);
    const rpc3 = lastWrite((w) => w.u.includes('search_tutors'));
    ok('Search: match my schedule sent', rpc3 && rpc3.body.match_schedule === true && rpc3.body.student_id === UID);
    await L(page, 'Clear all filters').click(); await wait(page, 1000);
    const rpc4 = lastWrite((w) => w.u.includes('search_tutors'));
    ok('Search: clear filters resets', rpc4 && rpc4.body.filter_period === null && rpc4.body.filter_subject === null && rpc4.body.match_schedule === false);
    await L(page, 'Hide filters').click(); await wait(page);
    await page.getByLabel("View Alex Kim's profile").filter({ visible: true }).first().click(); await wait(page, 1500);

    // Tutor profile
    ok('Search → Tutor profile', await seen(page, 'At a glance'));
    { const bb = page.getByRole('button', { name: 'Book Session' }).filter({ visible: true }); const n = await bb.count(); const info = n ? await bb.first().evaluate(e => e.outerHTML.slice(0,300)) : ''; ok('Tutor profile: Book bar hidden before choosing block', n === 0, info); }
    ok('Privacy: tutor email address not shown', !(await seen(page, 'akim@mail.strakejesuit.org', false)));
    ok('Privacy: Message button instead', (await page.getByRole('button', { name: 'Message Alex' }).filter({ visible: true }).count()) === 1);
    ok('Privacy: no Text button when phone not shared', (await page.getByRole('button', { name: 'Text Alex' }).filter({ visible: true }).count()) === 0);
    ok('Privacy: app never asks for phone numbers it can\'t see', denied.length === 0, denied.join(' '));
    await L(page, 'Block 3, free').click(); await wait(page, 300);
    ok('Tutor profile: picking block enables Book', await seen(page, 'Block 3') && !(await page.getByRole('button', { name: 'Book Session' }).filter({ visible: true }).first().isDisabled()));
    // Report modal
    await L(page, 'Report or block this user').click(); await wait(page);
    ok('Report: pop-up opens', await seen(page, 'Report or Block'));
    await V(page, 'Spam or advertising').click(); writes = [];
    await page.getByRole('button', { name: 'Submit Report' }).filter({ visible: true }).first().click(); await wait(page, 1200);
    const rep = lastWrite((w) => w.u.includes('/rest/v1/reports'));
    ok('Report: submits reason for this tutor', rep && rep.body.reason === 'Spam or advertising' && rep.body.reported_user_id === 't1');
    ok('Report: success message', await seen(page, 'Report Submitted'));
    await page.getByRole('button', { name: 'Done' }).filter({ visible: true }).first().click(); await wait(page);
    await L(page, 'Report or block this user').click(); await wait(page); writes = [];
    await page.getByRole('button', { name: 'Block Alex' }).filter({ visible: true }).first().click(); await wait(page, 1200);
    ok('Block: saves block', !!lastWrite((w) => w.u.includes('/rest/v1/blocked_users') && w.body?.blocked_id === 't1'));
    await page.getByRole('button', { name: 'Done' }).filter({ visible: true }).first().click(); await wait(page);
    await L(page, 'Report or block this user').click(); await wait(page);
    await L(page, 'Close').click(); await wait(page);
    ok('Report: close button closes', !(await seen(page, 'Report or Block')));

    // Book
    await L(page, 'Block 3, free').click().catch(()=>{}); await wait(page, 300);
    await page.getByRole('button', { name: 'Book Session' }).filter({ visible: true }).first().click(); await wait(page, 1000);
    ok('Tutor profile → Book screen', await seen(page, 'Book a Session') && await seen(page, 'Block 3', false));
    ok('Book: day picker offers the days block 3 meets', (await page.getByRole('button', { name: /(Today|Tomorrow|Mon|Tue|Wed|Thu|Fri)/ }).filter({ visible: true }).count()) === BOOKABLE.length && BOOKABLE.length >= 5, String(BOOKABLE));
    ok('Book: shows the rotation day and real block time', await seen(page, /Day [1-8] · \d{1,2}:\d\d [AP]M – /, false));
    { const busyChip = page.locator('[aria-label$=", already booked"]').filter({ visible: true });
      ok('Book: days the tutor is already booked are greyed out', (await busyChip.count()) === 1 && (await busyChip.first().getAttribute('aria-disabled')) === 'true'); }
    await shot(page, 'book.png');
    await V(page, 'Chemistry').click(); await wait(page, 200);
    await type(page, 'Notes (optional)', 'Stoichiometry help'); writes = [];
    await page.getByRole('button', { name: 'Send Request' }).filter({ visible: true }).first().click(); await wait(page, 1500);
    const bk = lastWrite((w) => w.u.includes('/rest/v1/sessions') && w.m === 'POST');
    ok('Book: sends a real school-day date', bk && bk.body.session_date === BOOKABLE[0], JSON.stringify(bk?.body));
    ok('Book: sends tutor/student/block/subject/notes', bk && bk.body.tutor_id === 't1' && bk.body.student_id === UID && bk.body.period === 3 && bk.body.subject === 'Chemistry' && bk.body.notes === 'Stoichiometry help' && bk.body.status === 'pending', JSON.stringify(bk?.body));
    ok('Book: success screen', await seen(page, 'Session Requested'));
    await shot(page, 'booked.png');
    await page.getByRole('button', { name: 'View My Sessions' }).filter({ visible: true }).first().click(); await wait(page, 1200);
    ok('Book success → My Sessions', await seen(page, 'My Sessions'));

    // Sessions
    writes = [];
    await page.getByRole('button', { name: 'Confirm' }).filter({ visible: true }).first().click(); await wait(page, 1200);
    const cf = lastWrite((w) => w.u.includes('/rest/v1/sessions') && w.m === 'PATCH');
    ok('Sessions: Confirm sets confirmed', cf && cf.body.status === 'confirmed' && cf.u.includes('id=eq.s2'), cf?.u);
    ok('Celebration: confirm shows a cheer', await seen(page, 'Session confirmed!'));
    await page.getByRole('button', { name: 'Decline' }).filter({ visible: true }).first().click(); await wait(page, 800);
    ok('Sessions: Decline asks first', await seen(page, 'Cancel this session?'));
    await page.getByRole('button', { name: 'Keep It' }).filter({ visible: true }).first().click(); await wait(page, 600);
    ok('Sessions: Keep it closes', !(await seen(page, 'Cancel this session?')));
    await page.getByRole('button', { name: 'Decline' }).filter({ visible: true }).first().click(); await wait(page, 800); writes = [];
    await page.getByRole('button', { name: 'Yes, Cancel' }).filter({ visible: true }).first().click(); await wait(page, 1200);
    const cn = lastWrite((w) => w.u.includes('/rest/v1/sessions') && w.m === 'PATCH');
    ok('Sessions: Yes, cancel sets cancelled', cn && cn.body.status === 'cancelled');
    const dl = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await page.getByRole('button', { name: 'Add to Calendar' }).filter({ visible: true }).first().click();
    const d = await dl; await wait(page, 600);
    ok('Sessions: Add to Calendar downloads .ics', d && d.suggestedFilename().endsWith('.ics'), d?.suggestedFilename());
    ok('Sessions: calendar confirmation toast', await seen(page, 'Calendar file downloaded', false));
    ok('Sessions: confirmed session can be marked done', await page.getByRole('button', { name: /Mark .*(Done|Complete)/i }).filter({ visible: true }).count() > 0);
    writes = [];
    await page.getByRole('button', { name: 'Mark as Done' }).filter({ visible: true }).first().click().catch(()=>{}); await wait(page, 1200);
    const md = lastWrite((w) => w.u.includes('/rest/v1/sessions') && w.m === 'PATCH');
    ok('Sessions: Mark as Done sets completed on tutor\'s session', md && md.body.status === 'completed' && md.u.includes('id=eq.s4'), md?.u);
    ok('Celebration: done shows service hours', await seen(page, 'Session done!') && await seen(page, '+1 service hour'));
    ok('Sessions: student does not see Mark as Done on own booking', await page.getByRole('button', { name: 'Mark as Done' }).filter({ visible: true }).count() === 1);
    await V(page, 'Past').click(); await wait(page, 1200);
    await page.getByRole('button', { name: 'Leave a Review' }).filter({ visible: true }).first().click(); await wait(page, 800);
    ok('Review: pop-up opens', await seen(page, 'Leave a Review'));
    await L(page, '4 stars').click().catch(()=>{}); await wait(page, 200);
    await page.locator('textarea').filter({ visible: true }).first().fill('Great help');
    writes = [];
    await page.getByRole('button', { name: /Submit/ }).filter({ visible: true }).first().click(); await wait(page, 1200);
    const rv = lastWrite((w) => w.u.includes('/rest/v1/reviews') && w.m === 'POST');
    ok('Review: sends rating + comment for tutor', rv && rv.body.rating === 4 && rv.body.comment === 'Great help' && rv.body.tutor_id === 't2', JSON.stringify(rv?.body));

    // Chat
    await tab(page, 'Sessions'); await wait(page, 800);
    await page.getByRole('tab', { name: 'Upcoming sessions' }).filter({ visible: true }).first().click(); await wait(page, 800);
    await L(page, 'Message Alex Kim').click(); await wait(page, 1200);
    ok('Chat: opens with the other person and a safety note', await seen(page, 'Alex Kim') && await seen(page, 'Keep it about tutoring', false) && await seen(page, 'Say hi', false));
    await type(page, 'Message', 'Can we do section 3?'); writes = [];
    await L(page, 'Send message').click(); await wait(page, 1000);
    const msg = lastWrite((w) => w.u.includes('/rest/v1/messages') && w.m === 'POST');
    ok('Chat: sends to this session as me', msg && msg.body.session_id === 's1' && msg.body.sender_id === UID && msg.body.body === 'Can we do section 3?', JSON.stringify(msg?.body));
    ok('Chat: message bubble shows', await seen(page, 'Can we do section 3?'));
    await L(page, 'Go back').click(); await wait(page, 600);

    // Profile
    await tab(page, 'Profile'); await wait(page, 1000);
    ok('Moderation: hidden for regular users', !(await seen(page, 'Moderator tools')));
    ok('Profile: service hours card (1 taught session = 1 h)', await seen(page, 'Service hours') && await seen(page, '1'));
    { const [d] = await Promise.all([page.waitForEvent('download', { timeout: 4000 }).catch(() => null),
        page.getByRole('button', { name: 'Download hours log' }).filter({ visible: true }).first().click()]);
      let csv = ''; if (d) { const fp = await d.path(); csv = require('fs').readFileSync(fp, 'utf8'); }
      ok('Profile: hours log downloads as CSV', d && d.suggestedFilename() === 'service-hours-james-smith.csv' && csv.includes('Total hours,1\r') && csv.includes('Luke Patel'), d?.suggestedFilename()); }
    await L(page, 'Edit profile info').click(); await wait(page, 300);
    await type(page, 'Bio', 'New bio');
    await type(page, 'Phone', '7135550100');
    await L(page, 'Show my phone number on my tutor profile').click(); await wait(page, 200); writes = [];
    await page.getByRole('button', { name: 'Save Changes' }).filter({ visible: true }).first().click(); await wait(page, 1500);
    const pu = lastWrite((w) => w.u.includes('/rest/v1/profiles') && w.m === 'PATCH');
    ok('Profile: save info', pu && pu.body.bio === 'New bio', JSON.stringify(pu?.body));
    ok('Privacy: phone opt-in saved', pu && pu.body.phone === '7135550100' && pu.body.show_phone === true, JSON.stringify(pu?.body));
    await page.getByRole('radio', { name: /^Student/ }).filter({ visible: true }).first().click(); await wait(page, 300); writes = [];
    await page.getByRole('button', { name: 'Save Role' }).filter({ visible: true }).first().click(); await wait(page, 1500);
    const ro = lastWrite((w) => w.u.includes('/rest/v1/profiles') && w.m === 'PATCH');
    ok('Profile: save role', ro && ro.body.role === 'student');
    await page.getByRole('radio', { name: /^Both/ }).filter({ visible: true }).first().click(); await wait(page, 300);
    await L(page, 'Edit subjects').click().catch(e=>console.log('no edit subjects', e.message)); await wait(page, 400);
    await L(page, 'Math, 0 selected').click(); await wait(page, 300);
    await V(page, 'Geometry').click(); await wait(page, 200); writes = [];
    await page.getByRole('button', { name: 'Save Subjects' }).filter({ visible: true }).first().click(); await wait(page, 1500);
    const ss = lastWrite((w) => w.u.includes('/rest/v1/tutor_subjects') && w.m === 'POST');
    ok('Profile: save subjects', ss && JSON.stringify(ss.body).includes('Geometry') && JSON.stringify(ss.body).includes('SAT Math'), JSON.stringify(ss?.body));
    writes = [];
    await L(page, 'Block 7, not free').click(); await wait(page, 800);
    ok('Profile: toggle availability on', !!lastWrite((w) => w.u.includes('/rest/v1/tutor_availability') && w.m === 'POST' && w.body?.period === 7));
    await L(page, 'Block 2, free').click(); await wait(page, 800);
    ok('Profile: toggle availability off', !!lastWrite((w) => w.u.includes('/rest/v1/tutor_availability') && w.m === 'DELETE' && w.u.includes('period=eq.2')));
    await page.getByRole('button', { name: 'Sign Out' }).filter({ visible: true }).first().click(); await wait(page, 500);
    ok('Profile: sign out asks first', await seen(page, 'Sign out of your account?'));
    await page.getByRole('button', { name: 'Cancel' }).filter({ visible: true }).first().click(); await wait(page, 400);
    await page.getByRole('button', { name: 'Sign Out' }).filter({ visible: true }).first().click(); await wait(page, 500);
    await page.getByRole('button', { name: 'Sign Out' }).filter({ visible: true }).last().click(); await wait(page, 2000);
    ok('Profile: sign out returns to login', await seen(page, 'Sign In'));
    await ctx.close(); }

  // ── A tutor who shares their phone ─────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'in'); writes = [];
    await tab(page, 'Search'); await wait(page, 1200);
    await page.getByLabel("View Luke Patel's profile").filter({ visible: true }).first().click(); await wait(page, 1500);
    ok('Privacy: shared phone fetched through shared_phone', !!lastWrite((w) => w.u.includes('/rpc/shared_phone') && w.body?.uid === 't2'));
    ok('Privacy: Text button when the tutor shares a phone', (await page.getByRole('button', { name: 'Text Luke' }).filter({ visible: true }).count()) === 1);
    ok('Privacy: shared number still not printed on screen', !(await seen(page, '7135550142', false)));
    await ctx.close(); }

  // ── Delete account ─────────────────────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'in');
    await tab(page, 'Profile'); await wait(page, 1000);
    await L(page, 'Delete account').click(); await wait(page, 400);
    ok('Delete account: asks first and explains what is removed', await seen(page, 'Delete your account?') && await seen(page, "can't be undone", false));
    await page.getByText('Delete your account?').first().scrollIntoViewIfNeeded(); await shot(page, 'delete-account.png');
    await page.getByRole('button', { name: 'Keep account' }).filter({ visible: true }).first().click(); await wait(page, 300);
    ok('Delete account: Keep account backs out', !(await seen(page, 'Delete your account?')));
    await L(page, 'Delete account').click(); await wait(page, 400); writes = [];
    await page.getByRole('button', { name: 'Delete forever' }).filter({ visible: true }).first().click(); await wait(page, 2000);
    const rm = lastWrite((w) => w.u.includes('/storage/v1/object/avatars') && w.m === 'DELETE');
    ok('Delete account: removes the profile photo', rm && JSON.stringify(rm.body).includes(`${UID}/avatar.jpg`), JSON.stringify(rm?.body));
    ok('Delete account: calls delete_my_account', !!lastWrite((w) => w.u.includes('/rpc/delete_my_account')));
    ok('Delete account: back to the login screen', await seen(page, 'Sign In') && !(await page.evaluate(() => localStorage.getItem('sb-lmavnypvqdomdefpjbok-auth-token'))));
    await ctx.close(); }

  // ── Nobody here yet: empty screens invite people in ────────────────────
  { const { ctx, page } = await ctxFor(browser, 'empty');
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:8099' });
    await page.evaluate(() => { try { delete navigator.share; } catch {} });
    const clip = () => page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    await shot(page, 'empty-home.png');
    ok('Empty: Home asks to invite a tutor', await seen(page, 'No tutors yet') && await seen(page, 'Tutoring here is just getting started', false));
    ok('Empty: Home sessions offer sharing', (await page.getByRole('button', { name: 'Share the app with students' }).filter({ visible: true }).count()) === 1);
    await page.getByRole('button', { name: 'Invite someone to tutor' }).filter({ visible: true }).first().click(); await wait(page, 800);
    { const c = await clip();
      ok('Empty: Home invite copies a recruit message with the link', c.includes('Are you good at a class?') && c.includes('http://localhost:8099'), c); }
    ok('Empty: invite confirms the link was copied', await seen(page, 'Invite link copied', false));
    await tab(page, 'Search'); await wait(page, 1200);
    ok('Empty: Search encourages starting tutoring', await seen(page, 'Be the one who gets tutoring started', false));
    await L(page, 'Show filters').click(); await wait(page);
    await V(page, 'SAT Prep').click().catch(() => {}); await wait(page, 300);
    await V(page, 'SAT Math').click(); await wait(page, 1200);
    await L(page, 'Hide filters').click(); await wait(page);
    await shot(page, 'empty-search.png');
    ok('Empty: filtered search suggests clearing filters', await seen(page, 'No tutors found') && (await page.getByRole('button', { name: 'Clear filters' }).filter({ visible: true }).count()) > 0);
    await page.getByRole('button', { name: 'Invite someone to tutor SAT Math' }).filter({ visible: true }).first().click(); await wait(page, 800);
    { const c = await clip();
      ok('Empty: subject invite names the subject', c.includes('Are you good at SAT Math?'), c); }
    await tab(page, 'Sessions'); await wait(page, 1200);
    ok('Empty: Sessions invites a study friend', await seen(page, 'No upcoming sessions') && (await page.getByRole('button', { name: 'Invite a friend to study with' }).filter({ visible: true }).count()) === 1);
    await page.getByRole('button', { name: 'Invite a friend to study with' }).filter({ visible: true }).first().click(); await wait(page, 800);
    { const c = await clip();
      ok('Empty: study invite is the normal invite message', c.includes('Strake Jesuit Tutors') && !c.includes('Are you good at'), c); }
    await shot(page, 'empty-sessions.png');
    await ctx.close(); }

  // ── Errors are shown, not swallowed ─────────────────────────────────────
  { const { ctx, page } = await ctxFor(browser, 'in', true);
    await tab(page, 'Sessions'); await wait(page, 1200);
    await page.getByRole('button', { name: 'Confirm' }).filter({ visible: true }).first().click(); await wait(page, 1200);
    ok('Error: failed Confirm is reported', await seen(page, 'row-level security', false) || await seen(page, "Couldn't", false) || await seen(page, 'Could not', false));
    await tab(page, 'Profile'); await wait(page, 1000);
    await L(page, 'Block 7, not free').click(); await wait(page, 1200);
    ok('Error: failed availability toggle is reported + reverted', (await seen(page, 'row-level security', false) || await seen(page, 'Could not', false)) && await page.getByLabel('Block 7, not free').filter({ visible: true }).count() > 0);
    await ctx.close(); }

  // ── Desktop: sidebar navigation ─────────────────────────────────────────
  { const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    await ctx.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: /profile/.test(r.request().url()) ? JSON.stringify(r.request().headers()['accept']?.includes('object') ? { id: UID, full_name: 'James Smith', role: 'both', setup_complete: true } : []) : r.request().url().includes('/auth/v1/user') ? JSON.stringify(user) : '[]' }));
    await ctx.addInitScript((s) => localStorage.setItem('sb-lmavnypvqdomdefpjbok-auth-token', s), JSON.stringify(session));
    await ctx.addInitScript(() => localStorage.setItem('welcomeTour.seen.v1', '1'));
    const page = await ctx.newPage(); await page.goto('http://localhost:8099/'); await wait(page, 2500);
    for (const [t, expect] of [['Search','Find a Tutor'],['Sessions','My Sessions'],['Profile','Profile Info'],['Home','Top Tutors']]) {
      await tab(page, t); await wait(page, 800); ok(`Desktop sidebar → ${t}`, await seen(page, expect));
    }
    await ctx.close(); }

  await browser.close(); srv.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (process.env.RESULTS_FILE) fs.writeFileSync(process.env.RESULTS_FILE, JSON.stringify(results, null, 1));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.log('SCRIPT ERROR', e.message.split('\n')[0]); srv.close(); process.exit(1); });
