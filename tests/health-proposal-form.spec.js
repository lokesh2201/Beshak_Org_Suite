// Sheet: "Health Proposal Form" (TC-HF01 - TC-HF10)
//
// Safety on production:
//  - Every test blocks non-GET requests to Beshak backends and S3 (src/utils/network.js).
//  - Submit is only clicked in TC-HF10, with the browser offline.
//  - Assertion messages never print customer values (names, mobile, email), only field names.
const base = require('../src/fixtures/test');
const { expect } = base;
const env = require('../src/config/env');
const pd = require('../src/data/proposal.data');
const { guardProposalWrites } = require('../src/utils/network');
const { createUploadFiles } = require('../src/utils/files');

const ID = env.HEALTH_PROPOSAL_ID;

const test = base.test.extend({
  blockedWrites: [async ({ context }, use) => use(await guardProposalWrites(context)), { auto: true }],
  files: async ({}, use, testInfo) => use(createUploadFiles(testInfo)),
});

test.describe('Health Proposal Form', () => {
  test.skip(!ID, 'Set HEALTH_PROPOSAL_ID in .env to run the proposal form tests');

  test.beforeEach(async ({ proposalPage }, testInfo) => {
    if (testInfo.title.startsWith('TC-HF08') || testInfo.title.startsWith('TC-HF09')) return;
    await proposalPage.openProposal(ID);
    await proposalPage.waitForForm();
  });

  test('TC-HF01 Proposer date of birth must be 18+', { tag: ['@functional', '@P1', '@Bugs'] }, async ({ proposalPage }) => {
    const opened = await proposalPage.basic.dob.openedAt();
    const openedYear = Number(opened.match(/\d{4}/)?.[0]);
    const thisYear = new Date().getFullYear();
    expect.soft(openedYear, `calendar opens at "${opened}"; expected a year a typical adult proposer (18-60) was born`)
      .toBeGreaterThanOrEqual(thisYear - 60);

    await proposalPage.basic.fill({ ...pd.validBasic, dob: pd.underageProposerDob() });
    await proposalPage.clickContinue();
    expect(await proposalPage.activeStep(), 'a proposer under 18 must not pass Basic Details').toBe('Basic Details');
    const dob = (await proposalPage.basic.fieldStates()).find((f) => f.key === 'dob');
    expect.soft(dob.error, 'clear DOB error shown').not.toBe('');
  });

  test('TC-HF02 Required fields and Address field work correctly', { tag: ['@functional', '@P1', '@Bugs'] }, async ({ proposalPage, page }) => {
    await proposalPage.basic.clearAll();
    await proposalPage.clickContinue();
    const states = await proposalPage.basic.fieldStates();
    const errorWithoutStar = states.filter((f) => f.error && !f.required).map((f) => f.key);
    const starWithoutError = states.filter((f) => f.required && !f.error).map((f) => f.key);
    expect.soft(errorWithoutStar, 'required fields (they show an error) that are not marked *').toEqual([]);
    expect.soft(starWithoutError, 'fields marked * that show no error when empty').toEqual([]);

    await proposalPage.basic.fill({ ...pd.validBasic, address: '' });
    await proposalPage.basic.address.click();
    await page.keyboard.type(pd.addressMultiLine[0]);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    expect(await proposalPage.activeStep(), 'Enter in Address must not submit the step').toBe('Bank Details');
    await page.keyboard.type(pd.addressMultiLine[1]);
    expect(await proposalPage.basic.address.inputValue(), 'Enter adds a new line').toContain('\n');
  });

  test('TC-HF03 Adding, removing and switching members keeps data correct', { tag: ['@data', '@P1', '@Bugs'] },
    async ({ proposalPage, files }) => {
      const m = proposalPage.members;
      await proposalPage.goToStep('Upload Documents');
      await proposalPage.completeUploads(files);
      expect(await proposalPage.activeStep()).toBe('Insured Member Details');

      const original = await m.allMembers();
      const fingerprint = (list) => JSON.stringify(list);
      const proposerName = `${pd.validBasic.firstName} ${pd.validBasic.lastName}`;

      await test.step('Proposer is insured = Yes adds the proposer as a new member', async () => {
        await m.goTo(1);
        await m.setProposerIsInsured(true);
        const after = await m.allMembers();
        expect.soft(after.length, 'one more member').toBe(original.length + 1);
        expect.soft(fingerprint(after.filter((x) => x.name !== proposerName)) === fingerprint(original), 'existing members unchanged').toBe(true);
      });

      await test.step('Switching back to No restores the original members', async () => {
        await m.setProposerIsInsured(false);
        expect.soft(fingerprint(await m.allMembers()) === fingerprint(original), 'original member data restored').toBe(true);
      });

      await test.step('Add a member, delete it, delete another', async () => {
        const before = (await m.position()).total;
        await m.addMember();
        expect.soft((await m.position()).total, 'member added').toBe(before + 1);
        await m.goTo(before + 1);
        await m.removeCurrentMember();
        expect.soft((await m.position()).total, 'new member deleted').toBe(before);
        if (before >= 2) {
          await m.goTo(2);
          await m.removeCurrentMember();
          expect.soft((await m.position()).total, 'second member deleted').toBe(before - 1);
        }
        const deletes = (await proposalPage.savedData())?.value?.proposalFormDetail?.deleteMemberData ?? [];
        const ids = deletes.map((d) => d.id);
        expect.soft(deletes.filter((d) => d.id == null).length, 'empty delete entries (no member id)').toBe(0);
        expect.soft(ids.length - new Set(ids).size, 'duplicate delete entries').toBe(0);
      });

      await test.step('Errors are shown for every member with errors', async () => {
        await m.addMember();
        await m.addMember();
        const { total } = await m.position();
        await proposalPage.clickContinue(); // "Review Details"
        const withoutErrors = [];
        for (const index of [total - 1, total]) {
          await m.goTo(index);
          if (!(await m.visibleErrors()).length) withoutErrors.push(`Member ${index}`);
        }
        expect.soft(withoutErrors, 'members with empty required fields but no error shown').toEqual([]);
      });
    });

  test('TC-HF04 Nominee age and mobile rules', { tag: ['@functional', '@P1', '@Bugs'] }, async ({ proposalPage }) => {
    await proposalPage.goToStep('Nominee Details');
    const n = proposalPage.nominee;

    const prefilled = await n.values();
    expect.soft(prefilled.relationship, 'relationship pre-filled with a placeholder value').not.toBe(pd.placeholderNominee.relationship);
    expect.soft(prefilled.dob, 'nominee DOB pre-filled with a placeholder date').not.toBe(pd.placeholderNominee.dob);

    await n.dob.pick(pd.minorNomineeDob);
    expect.soft(await n.appointeeVisible(), 'a 17-year-old nominee requires Appointee details').toBe(true);

    await n.fill({ ...pd.validNominee, mobile: pd.invalidNomineeMobile });
    await proposalPage.clickContinue();
    expect(await proposalPage.activeStep(), 'mobile with symbols must be rejected').toBe('Nominee Details');
  });

  test('TC-HF05 KYC and bank details are validated', { tag: ['@functional', '@P1', '@Bugs'] }, async ({ proposalPage, page }) => {
    await proposalPage.goToStep('Bank Details');
    await proposalPage.kycBank.fillBank(pd.invalidBank);
    await proposalPage.clickContinue();
    expect.soft(await proposalPage.activeStep(), `invalid bank name "${pd.invalidBank.name}", account "${pd.invalidBank.accountNo}", IFSC "${pd.invalidBank.ifsc}" must be rejected`).toBe('Bank Details');

    if ((await proposalPage.activeStep()) === 'Bank Details') await proposalPage.completeBank();
    await proposalPage.kycBank.fillKyc(pd.unusualKyc);
    await proposalPage.clickContinue();
    const flagged = (await proposalPage.activeStep()) === 'KYC Information'
      || (await proposalPage.errors()).length > 0
      || (await page.locator('.toasted, [role="dialog"]:visible').count()) > 0;
    expect.soft(flagged, 'Student with income > 25 Lakhs is flagged').toBe(true);
  });

  test('TC-HF06 File type, size and duplicate rules', { tag: ['@functional', '@P1', '@Bugs'] }, async ({ proposalPage, files }) => {
    await proposalPage.goToStep('Upload Documents');
    const u = proposalPage.uploads;

    const misspelt = (await u.labels()).filter((l) => /aadhar/i.test(l) && !/aadhaar/i.test(l));
    expect.soft(misspelt, 'labels spelt "Aadhar" instead of "Aadhaar"').toEqual([]);

    await u.upload('aadhaarBack', files.exe);
    expect.soft((await u.fileNames('aadhaarBack')).includes('virus.exe') && !(await u.error('aadhaarBack')), '.exe file accepted').toBe(false);

    await u.upload('pan', files.txt);
    expect.soft((await u.fileNames('pan')).includes('notes.txt') && !(await u.error('pan')), '.txt file accepted').toBe(false);

    await u.upload('aadhaarFront', [files.imageA, files.imageB]);
    const sameName = (await u.fileNames('aadhaarFront')).filter((f) => f === 'image.jpg').length;
    const told = (await u.error('aadhaarFront')) || (await u.toasts()).join(' ');
    expect.soft(sameName === 2 || !!told, `two different files named image.jpg: ${sameName} kept, no message`).toBe(true);

    await u.upload('cheque', files.pdf4_9MB);
    expect.soft(await u.error('cheque'), '4.9 MB PDF rejected').toBe('');
    expect.soft(await u.fileNames('cheque'), '4.9 MB PDF listed').toContain('large-4.9MB.pdf');
  });

  test('TC-HF07 Refresh keeps data and saved data belongs to one proposal', { tag: ['@data', '@P1', '@Bugs'] },
    async ({ proposalPage, page, files }) => {
      await proposalPage.goToStep('Upload Documents');
      await proposalPage.uploads.upload('aadhaarFront', files.imageA);
      await proposalPage.uploads.upload('pan', files.smallPdf);

      await page.reload();
      await proposalPage.waitForForm();
      const saved = await proposalPage.savedData();
      expect(saved?.value?.proposalFormDetail?.basicForm?.proposer_first_name, 'basic details kept after refresh').toBe(pd.validBasic.firstName);
      // The form may reopen a step earlier; walk forward (saved data) to check the uploads.
      const warned = (await proposalPage.uploads.toasts()).length > 0;
      await proposalPage.goToStep('Upload Documents');
      const kept = (await proposalPage.uploads.fileNames('aadhaarFront')).length + (await proposalPage.uploads.fileNames('pan')).length;
      expect.soft(kept === 2 || warned, `uploads kept after refresh (or a warning shown): ${kept} of 2 kept`).toBe(true);

      const keys = await proposalPage.storageKeys();
      const tied = keys.some((k) => k.includes(ID)) || JSON.stringify(saved).includes(ID);
      expect.soft(tied, `saved progress ("${proposalPage.constructor.storageKey}") is keyed by proposal ID`).toBe(true);

      await proposalPage.openProposal(pd.fakeProposalId);
      if (await proposalPage.isFormVisible()) {
        expect.soft(await proposalPage.basic.firstName.inputValue(), 'saved data loads into a different proposal').not.toBe(pd.validBasic.firstName);
      }
    });

  test('TC-HF08 Invalid proposal link shows a clear message', { tag: ['@functional', '@P1', '@Bugs'] }, async ({ proposalPage }) => {
    await proposalPage.openProposal(pd.fakeProposalId);
    expect(await proposalPage.isFormVisible(), 'form must not render for a fake ID').toBe(false);
    const text = await proposalPage.pageText();
    expect.soft(/invalid|expired|not valid|no longer/i.test(text), '"This link is invalid" style message').toBe(true);
    expect.soft(/contact|call|whatsapp|email|support/i.test(text.replace(/Need Help.*?My Account/s, '')), 'contact options in the message').toBe(true);
  });

  test('TC-HF09 Customer data is not exposed without login', { tag: ['@functional', '@P1', '@Bugs'] }, async ({ playwright }) => {
    const anon = await playwright.request.newContext(); // no cookies, no login
    const res = await anon.get(`${env.PROPOSAL_API_URL}/${ID}`);
    expect(res.status(), 'verify API reachable').toBeLessThan(500);
    const body = res.ok() ? await res.json() : {};
    const exposed = new Set();
    (function walk(o) {
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        const filled = v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
        if (pd.piiFields.includes(k) && filled) exposed.add(k);
        if (typeof v === 'object') walk(v);
      }
    })(body);
    await anon.dispose();
    // Only field NAMES are reported, never their values.
    expect([...exposed], 'personal/medical fields returned without login').toEqual([]);
  });

  test('TC-HF10 Failed submission shows an error and keeps data', { tag: ['@functional', '@P1', '@Bugs'] },
    async ({ proposalPage, context, page, files, blockedWrites }) => {
      await proposalPage.goToStep('Upload Documents');
      await proposalPage.completeUploads(files);
      expect(await proposalPage.completeMembersAndReview(), 'review page reached').toBe(true);

      await context.setOffline(true);
      try {
        await proposalPage.submitButton.click();
        await page.waitForTimeout(4000);
        const text = await proposalPage.pageText();
        const toasts = await proposalPage.uploads.toasts();
        const shown = /fail|try again|went wrong|error|offline|network/i.test(`${text} ${toasts.join(' ')}`);
        expect.soft(shown, 'clear error such as "Submission failed, please try again"').toBe(true);
        expect.soft(await proposalPage.isReview(), 'still on the review page').toBe(true);
        const saved = await proposalPage.savedData();
        expect.soft(saved?.value?.proposalFormDetail?.basicForm?.proposer_first_name, 'entered data kept').toBe(pd.validBasic.firstName);
      } finally {
        await context.setOffline(false);
      }
      test.info().annotations.push({ type: 'write guard', description: `${blockedWrites.length} write request(s) blocked` });
    });
});
