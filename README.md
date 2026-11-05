# beshak-qa: Playwright + JavaScript (Page Object Model)

Automates the test cases in `../Beshak_Test_Cases.xlsx` against https://www.beshak.org (production).
The **Term Proposal Form** sheet is out of scope and has no tests.

| Sheet | Spec | Tests |
|---|---|---|
| Health Insurance | `tests/health-plans.spec.js` | TC-HP01 – HP08 |
| Term Insurance | `tests/term-plans.spec.js` | TC-TP01 – TP08 |
| Comparison | `tests/comparison.spec.js` | TC-CP01 – CP06 |
| Health Proposal Form | `tests/health-proposal-form.spec.js` | TC-HF01 – HF10 |
| Articles | `tests/articles.spec.js` | TC-A01 – A06 |
| Videos | `tests/videos.spec.js` | TC-V01 – V05 |

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then set HEALTH_PROPOSAL_ID
```

## Run

```bash
npm test                      # everything (43 tests)
npm run test:smoke            # @smoke only
npm run test:no-bugs          # skip tests of known, already-logged bugs
npm run test:bugs             # only @Bugs tests
npm run test:health           # one sheet (also: test:term, test:compare, test:proposal, test:Article/Video)
npx playwright test -g TC-HP03
npm run report                # open the HTML report
```

## Tags

- `@smoke`, `@data`, `@functional`, and the priority (`@P1`, `@P2`).
- `@Bugs`: the test checks behaviour already logged as a bug (all of TC-HF01–HF10, TC-A06).
  These tests **assert the expected result and fail until the bug is fixed**.

A failing test that is **not** tagged `@Bugs` is a new finding (or the site changed) and needs triage.

## Structure

```
src/
  config/env.js            .env loading (BASE_URL, HEALTH_PROPOSAL_ID, WORKERS, BLOCK_TRACKERS)
  fixtures/test.js         `test` with page-object fixtures, tracker blocking, console-error collector
  pages/                   one class per page; specs never contain selectors
    BasePage.js
    plans/                 BestPlansPage (shared Health/Term logic), HealthPlansPage, TermPlansPage, PlanDetailPage
    ComparisonPage.js
    content/               ArticlesPage, VideosPage
    proposal/              HealthProposalPage + steps/ (Basic, Bank/KYC, Nominee, Upload, Insured Members)
  components/              PlanCard, CompareTray, ContentSwitch, VideoModal, DatePicker
  api/                     CmsApi (article library from the public CMS), YouTubeApi (oEmbed)
  data/                    expected values per sheet
  utils/                   ordering helpers, upload files, dates, network guards, console errors
tests/
  shared/bestPlansSuite.js test bodies shared by the Health and Term specs
  *.spec.js                one spec per sheet
```

## Safety on production

- **Trackers blocked**: analytics/ad requests are aborted so runs don't skew real analytics (`BLOCK_TRACKERS=false` to disable).
- **Proposal write guard**: in the proposal tests every non-GET request to Beshak backends and S3 is blocked.
  The form only writes on Submit, and Submit is clicked only in TC-HF10 **with the browser offline**.
- **No customer data in reports**: assertion messages in the proposal tests name fields, never values.
  Note that failure screenshots, videos and traces of the proposal form can still show data pre-filled from the proposal.
  Keep `playwright-report/` and `test-results/` private.
- Upload fixtures (an `.exe`-named text stub, `.txt`, two `image.jpg`, a 4.9 MB PDF) are generated per test in `test-results/`.

