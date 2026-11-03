import puppeteer from 'puppeteer-core';
import assert from 'assert';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE FLICKER & INPUT TEST SUITE');
  console.log('====================================================\n');

  // 1. Get real doctor token
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZTlmMjg4NzMzMmQzNDcwZjQ4NThjMiIsInJvbGUiOiJkb2N0b3IiLCJpYXQiOjE3OTM3MzcwNDQsImV4cCI6MTc5NDM0MTg0NH0.iybYvt1myI9zoiQbzWhw8r2X_v-g7gpsRUzuDWdwRTc';
  const user = {
    _id: "6ae9f2887332d3470f4858c2",
    id: "6ae9f2887332d3470f4858c2",
    name: "sarthy",
    email: "sarthakmisra311@gmail.com",
    role: "doctor"
  };

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('React DevTools')) {
      console.log('  [Browser]', msg.type(), text);
    }
  });

  // Navigate to /doctor
  await page.goto('http://localhost:5173/doctor', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t, u) => {
    localStorage.setItem('doctor_token', t);
    localStorage.setItem('token', t);
    localStorage.setItem('doctor_user', JSON.stringify(u));
    localStorage.setItem('user', JSON.stringify(u));
  }, token, user);

  await page.goto('http://localhost:5173/doctor', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Navigate to Profile tab
  console.log('--- Navigating to Profile Settings Tab ---');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Profile') || text.includes('Doctor Profile')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));

  // Verify all 10 clinical input elements are present
  const fieldNames = [
    'name',
    'specialty',
    'jobTitle',
    'experience',
    'hospital',
    'degree',
    'price',
    'phone',
    'licenseNumber',
    'availableDays'
  ];

  for (const name of fieldNames) {
    const el = await page.$(`input[name="${name}"]`);
    assert.ok(el, `Input field "${name}" must exist in the DOM`);
  }
  console.log('✔ All 10 clinical fields located in DOM.\n');

  // Track DOM node remounts, blur count, and flicker events
  await page.evaluate(() => {
    window.__stats = {
      remounts: {},
      unexpectedBlurs: 0,
      focusLosses: 0
    };

    const fieldNames = [
      'name', 'specialty', 'jobTitle', 'experience',
      'hospital', 'degree', 'price', 'phone',
      'licenseNumber', 'availableDays'
    ];

    fieldNames.forEach(fn => {
      const el = document.querySelector(`input[name="${fn}"]`);
      if (el) {
        window.__stats.remounts[fn] = 0;
        let lastNode = el;

        const observer = new MutationObserver(() => {
          const cur = document.querySelector(`input[name="${fn}"]`);
          if (cur && cur !== lastNode) {
            window.__stats.remounts[fn]++;
            lastNode = cur;
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
  });

  // TEST 1: Continuous typing into every text field
  console.log('--- Test 1: Continuous Typing into Every Text Field ---');
  for (const fn of fieldNames) {
    const inp = await page.$(`input[name="${fn}"]`);
    await inp.click();
    await page.evaluate(el => el.select(), inp);
    await page.keyboard.press('Backspace');

    const testVal = fn === 'experience' ? '15' : fn === 'price' ? '1200' : fn === 'phone' ? '9876543210' : `Continuous Test ${fn}`;
    await page.keyboard.type(testVal, { delay: 20 });

    const currentVal = await page.evaluate(el => el.value, inp);
    assert.strictEqual(currentVal, testVal, `Field ${fn} should hold exact typed text "${testVal}", got "${currentVal}"`);
    const isFocused = await page.evaluate(el => document.activeElement === el, inp);
    assert.ok(isFocused, `Field ${fn} should remain active/focused during typing`);
  }
  console.log('✔ Test 1 Passed: Continuous typing into all 10 fields preserved focus without flicker.\n');

  // TEST 2: Type in the middle of existing text
  console.log('--- Test 2: Typing in the Middle of Existing Text ---');
  const nameInput = await page.$('input[name="name"]');
  await nameInput.click();
  await page.evaluate((el) => { 
    el.value = 'Dr. Sharma'; 
    el.dispatchEvent(new Event('input', { bubbles: true })); 
  }, nameInput);
  // Place cursor after "Dr. "
  await page.evaluate((el) => { 
    el.focus();
    el.setSelectionRange(4, 4); 
  }, nameInput);
  await page.keyboard.type('Rahul ', { delay: 30 });
  const middleTypedVal = await page.evaluate(el => el.value, nameInput);
  assert.strictEqual(middleTypedVal, 'Dr. Rahul Sharma', `Expected "Dr. Rahul Sharma", got "${middleTypedVal}"`);
  console.log('✔ Test 2 Passed: Typing in middle of text preserved exact cursor position and content.\n');

  // TEST 3: Backspace and Delete repeatedly
  console.log('--- Test 3: Repeated Backspace and Delete ---');
  await nameInput.click();
  // Move cursor to end
  await page.evaluate((el) => { 
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length); 
  }, nameInput);
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Backspace');
  }
  const afterBackspace = await page.evaluate(el => el.value, nameInput);
  assert.strictEqual(afterBackspace, 'Dr. Rahul', `Expected "Dr. Rahul", got "${afterBackspace}"`);
  console.log('✔ Test 3 Passed: Backspace worked cleanly with zero jumping or value resets.\n');

  // TEST 4: Paste long text
  console.log('--- Test 4: Pasting Long Text ---');
  const longBioTitle = 'Senior Consultant Interventional Cardiologist & Electrophysiologist - MBBS, MD, DM';
  const jobTitleInput = await page.$('input[name="jobTitle"]');
  await jobTitleInput.click();
  await page.evaluate((el, text) => {
    el.select();
    document.execCommand('insertText', false, text);
  }, jobTitleInput, longBioTitle);
  const pastedVal = await page.evaluate(el => el.value, jobTitleInput);
  assert.strictEqual(pastedVal, longBioTitle, 'Pasted text must match completely');
  console.log('✔ Test 4 Passed: Pasted long text seamlessly.\n');

  // TEST 5: Switching between multiple fields
  console.log('--- Test 5: Rapid Switching Between Multiple Fields ---');
  await page.$eval('input[name="specialty"]', el => el.focus());
  await page.keyboard.type(' Cardiology Super Specialist');
  await page.$eval('input[name="hospital"]', el => el.focus());
  await page.keyboard.type(' Metro Heart Institute');
  await page.$eval('input[name="degree"]', el => el.focus());
  await page.keyboard.type(' MBBS, MD, DNB, FACC');

  const specialtyVal = await page.$eval('input[name="specialty"]', el => el.value);
  const hospitalVal = await page.$eval('input[name="hospital"]', el => el.value);
  const degreeVal = await page.$eval('input[name="degree"]', el => el.value);

  assert.ok(specialtyVal.includes('Cardiology Super Specialist'), 'Specialty retained after switching fields');
  assert.ok(hospitalVal.includes('Metro Heart Institute'), 'Hospital retained after switching fields');
  assert.ok(degreeVal.includes('MBBS, MD, DNB, FACC'), 'Degree retained after switching fields');
  console.log('✔ Test 5 Passed: Switching between multiple fields retained all entered values.\n');

  // TEST 6: Numbers in experience and fee fields
  console.log('--- Test 6: Number Inputs (Experience & Fees) ---');
  const expInput = await page.$('input[name="experience"]');
  await expInput.click();
  await page.evaluate(el => el.select(), expInput);
  await page.keyboard.type('18', { delay: 50 });
  const expVal = await page.evaluate(el => el.value, expInput);
  assert.strictEqual(expVal, '18', `Experience should be "18", got "${expVal}"`);

  const feeInput = await page.$('input[name="price"]');
  await feeInput.click();
  await page.evaluate(el => el.select(), feeInput);
  await page.keyboard.type('750', { delay: 50 });
  const feeVal = await page.evaluate(el => el.value, feeInput);
  assert.strictEqual(feeVal, '750', `Fee should be "750", got "${feeVal}"`);
  console.log('✔ Test 6 Passed: Experience and fee number inputs typed cleanly without cursor glitching.\n');

  // TEST 7: Type while unrelated components update (simulate background tick / SSE)
  console.log('--- Test 7: Typing While Unrelated Events Occur ---');
  const phoneInput = await page.$('input[name="phone"]');
  await phoneInput.click();
  await page.evaluate(el => el.select(), phoneInput);
  await page.keyboard.type('9811223344');

  // Simulate remote background dispatch of unrelated doctors update
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('sehat_db_change', {
      detail: { collection: 'appointments', operationType: 'update' }
    }));
  });
  await new Promise(r => setTimeout(r, 200));

  const phoneAfterEvent = await page.evaluate(el => el.value, phoneInput);
  assert.strictEqual(phoneAfterEvent, '9811223344', 'Phone input must not be reset by unrelated background events');
  console.log('✔ Test 7 Passed: Unrelated background updates did not reset or flicker inputs.\n');

  // Verify Zero DOM Remounts during all interactions
  const finalStats = await page.evaluate(() => window.__stats);
  console.log('Final DOM Remount Statistics per field:', finalStats.remounts);
  for (const [f, count] of Object.entries(finalStats.remounts)) {
    assert.strictEqual(count, 0, `DOM node for field "${f}" was remounted ${count} times (must be 0)`);
  }
  console.log('✔ Zero DOM remounts across the entire form.\n');

  // TEST 8: Save the form and verify persistence
  console.log('--- Test 8: Save Details and Verify Database Persistence ---');
  // Click "Save Details" button
  const saveBtn = await page.$('button[title*="Save clinical details"]');
  assert.ok(saveBtn, 'Save Details button must exist');
  await saveBtn.click();
  await page.waitForFunction(() => {
    const text = document.querySelector('button[title*="Save clinical details"]')?.textContent || '';
    return !text.includes('Saving...');
  }, { timeout: 10000 });

  const btnText = await page.evaluate(el => el.textContent, saveBtn);
  console.log('Save button status:', btnText.trim());
  assert.ok(btnText.includes('Saved to Database') || btnText.includes('Save Details'), 'Save should succeed');

  // Reload page
  console.log('Reloading page to verify persistence...');
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Go to Profile tab again
  const reloadedButtons = await page.$$('button');
  for (const b of reloadedButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Profile') || text.includes('Doctor Profile')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));

  const reloadedName = await page.$eval('input[name="name"]', el => el.value);
  const reloadedExp = await page.$eval('input[name="experience"]', el => el.value);
  const reloadedPhone = await page.$eval('input[name="phone"]', el => el.value);

  console.log(`Persisted values after reload: Name="${reloadedName}", Exp="${reloadedExp}", Phone="${reloadedPhone}"`);
  assert.strictEqual(reloadedName, 'Dr. Rahul', 'Name was persisted and reloaded correctly');
  assert.strictEqual(reloadedExp, '18', 'Experience was persisted and reloaded correctly');
  assert.strictEqual(reloadedPhone, '9811223344', 'Phone was persisted and reloaded correctly');
  console.log('✔ Test 8 Passed: Form saved and persisted cleanly in MongoDB across browser refresh.\n');

  // Teardown: Restore original doctor profile
  try {
    await fetch('http://localhost:5000/api/doctors/6ae9f2887332d3470f4858c2', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        name: 'Dr. Sarthy',
        specialty: 'Cardiologist',
        specialization: 'Cardiologist',
        hospital: 'Camry Hospital',
        degree: 'MBBS, MD',
        qualifications: 'MBBS, MD',
        experience: 5,
        price: 500,
        fees: 500,
        phone: '1111111111',
        contact_number: '1111111111',
        jobTitle: 'xyz',
        licenseNumber: 'xyz',
        availableDays: '10-2'
      })
    });
  } catch {}

  console.log('====================================================');
  console.log('🎉 ALL 8 MANDATORY VERIFICATION TESTS PASSED CLEANLY!');
  console.log('====================================================');

  await browser.close();
}

runTestSuite().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
