const { PrismaClient } = require('@prisma/client');

const baseUrl = 'http://127.0.0.1:3000';

async function testAll() {
  const results = [];

  // 1. Frontend Page Delivery
  try {
    const resHome = await fetch(baseUrl + '/');
    const textHome = await resHome.text();
    results.push({
      layer: 'Frontend',
      test: 'Landing Page (/)',
      status: resHome.status === 200 && textHome.includes('FitConnect') ? 'PASSED (200 OK)' : 'FAILED'
    });
  } catch (e) {
    results.push({ layer: 'Frontend', test: 'Landing Page (/)', status: 'ERROR: ' + e.message });
  }

  try {
    const resLogin = await fetch(baseUrl + '/auth/login');
    const textLogin = await resLogin.text();
    results.push({
      layer: 'Frontend',
      test: 'Login Page (/auth/login)',
      status: resLogin.status === 200 && textLogin.includes('Welcome Back') ? 'PASSED (200 OK)' : 'FAILED'
    });
  } catch (e) {
    results.push({ layer: 'Frontend', test: 'Login Page (/auth/login)', status: 'ERROR: ' + e.message });
  }

  try {
    const resReg = await fetch(baseUrl + '/auth/register');
    const textReg = await resReg.text();
    results.push({
      layer: 'Frontend',
      test: 'Register Page (/auth/register)',
      status: resReg.status === 200 && textReg.includes('FitConnect') ? 'PASSED (200 OK)' : 'FAILED'
    });
  } catch (e) {
    results.push({ layer: 'Frontend', test: 'Register Page (/auth/register)', status: 'ERROR: ' + e.message });
  }

  // 2. Database Write: Register new trainee via API
  const testEmail = 'live_test_' + Date.now() + '@fitconnect.test';
  let token = '';
  try {
    const regRes = await fetch(baseUrl + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        name: 'Live Verified User',
        role: 'USER'
      })
    });
    const regData = await regRes.json();
    if (regRes.ok && regData.success) {
      token = regData.token;
      results.push({
        layer: 'Backend -> Database Write',
        test: 'User Registration (/api/auth/register -> Supabase User Table)',
        status: 'PASSED (User registered: ' + testEmail + ')'
      });
    } else {
      results.push({ layer: 'Backend -> Database Write', test: 'User Registration', status: 'FAILED: ' + JSON.stringify(regData) });
    }
  } catch (e) {
    results.push({ layer: 'Backend -> Database Write', test: 'User Registration', status: 'ERROR: ' + e.message });
  }

  // 3. Database Read: Login via API
  try {
    const loginRes = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.success) {
      token = loginData.token;
      results.push({
        layer: 'Backend -> Database Read',
        test: 'User Login & Password Check (/api/auth/login -> Supabase)',
        status: 'PASSED (JWT Authenticated, Name: ' + loginData.data.name + ')'
      });
    } else {
      results.push({ layer: 'Backend -> Database Read', test: 'User Login', status: 'FAILED: ' + JSON.stringify(loginData) });
    }
  } catch (e) {
    results.push({ layer: 'Backend -> Database Read', test: 'User Login', status: 'ERROR: ' + e.message });
  }

  // 4. Authenticated Session /api/auth/me
  try {
    const meRes = await fetch(baseUrl + '/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const meData = await meRes.json();
    results.push({
      layer: 'Backend & JWT Middleware',
      test: 'Current User Verification (/api/auth/me)',
      status: meRes.ok && meData.success ? 'PASSED (Session confirmed for ' + meData.data.email + ')' : 'FAILED'
    });
  } catch (e) {
    results.push({ layer: 'Backend & JWT Middleware', test: 'Current User Verification', status: 'ERROR: ' + e.message });
  }

  // 5. Backend Data Queries from Supabase
  try {
    const trainersRes = await fetch(baseUrl + '/api/trainers', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const trainersData = await trainersRes.json();
    results.push({
      layer: 'Backend -> Database Read',
      test: 'Fetch Verified Trainers (/api/trainers -> Supabase)',
      status: trainersRes.ok && trainersData.success ? 'PASSED (' + trainersData.data.length + ' trainers returned)' : 'FAILED'
    });
  } catch (e) {
    results.push({ layer: 'Backend -> Database Read', test: 'Fetch Trainers', status: 'ERROR: ' + e.message });
  }

  try {
    const eventsRes = await fetch(baseUrl + '/api/events');
    const eventsData = await eventsRes.json();
    results.push({
      layer: 'Backend -> Database Read',
      test: 'Fetch Fitness Events (/api/events -> Supabase)',
      status: eventsRes.ok && eventsData.success ? 'PASSED (' + eventsData.data.length + ' events returned)' : 'FAILED'
    });
  } catch (e) {
    results.push({ layer: 'Backend -> Database Read', test: 'Fetch Events', status: 'ERROR: ' + e.message });
  }

  try {
    const postsRes = await fetch(baseUrl + '/api/posts');
    const postsData = await postsRes.json();
    results.push({
      layer: 'Backend -> Database Read',
      test: 'Fetch Community Posts (/api/posts -> Supabase)',
      status: postsRes.ok && postsData.success ? 'PASSED (' + (postsData.data ? postsData.data.length : 0) + ' posts returned)' : 'FAILED'
    });
  } catch (e) {
    results.push({ layer: 'Backend -> Database Read', test: 'Fetch Posts', status: 'ERROR: ' + e.message });
  }

  // 6. Direct Verification with Prisma Client on Supabase
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    results.push({
      layer: 'Database Cloud Persistence',
      test: 'Direct Supabase Table Count (Prisma -> Supabase PostgreSQL)',
      status: 'PASSED (Total users in Supabase: ' + count + ')'
    });
    await prisma.$disconnect();
  } catch (e) {
    results.push({ layer: 'Database Cloud Persistence', test: 'Direct Supabase Table Count', status: 'ERROR: ' + e.message });
  }

  console.log(JSON.stringify(results, null, 2));
}

testAll();
