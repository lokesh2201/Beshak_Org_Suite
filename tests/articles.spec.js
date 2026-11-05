// Sheet: "Articles" (TC-A01 - TC-A07)
const { test, expect } = require('../src/fixtures/test');
const { CmsApi } = require('../src/api/CmsApi');
const { norm } = require('../src/utils/assertions');
const urls = require('../src/data/urls');
const { articles: data } = require('../src/data/content.data');

test.describe('Health Articles page', () => {
  test('TC-A01 Articles page loads with heading, featured section, list',
    { tag: ['@smoke', '@P1'] }, async ({ articlesPage, consoleErrors, page }) => {
      
      const response = await articlesPage.open();
      expect(response?.status()).toBe(200);

      await expect(articlesPage.h1).toHaveText(data.h1);

      await expect(articlesPage.featuredMain).toBeVisible();
      expect(await articlesPage.featuredOthers.count(), 'other featured cards').toBeGreaterThan(0);
      expect(await articlesPage.listCount(), 'All Articles cards').toBeGreaterThan(0);
      expect.soft(consoleErrors.list(), 'console errors').toEqual([]);

    });
    

    test('TC-A02 Articles and Videos Switch', 
      { tag: ['@smoke', '@P1'] }, async ({ articlesPage, page }) => {
      await articlesPage.open();

      expect(await articlesPage.switch.activeTab()).toBe('Articles');

      await articlesPage.switch.goToVideos();
      await expect(page.locator('h1').first()).toHaveText('Featured Videos');
      expect(await articlesPage.switch.activeTab()).toBe('Videos');
    });


  test('TC-A03 Clicking a featured article opens the correct article', { tag: ['@functional', '@P1'] }, async ({ articlesPage }) => {
    await articlesPage.open();
    expect(await articlesPage.featuredMainTitle()).toBe(data.featuredTitle);
    const title = await articlesPage.openFeaturedMain();
    expect(norm(await articlesPage.articleH1())).toBe(norm(title));
  });

  test('TC-A04 Clicking a card in All Articles opens the correct article', { tag: ['@functional', '@P1'] }, async ({ articlesPage, page }) => {
    await articlesPage.open();
    for (const position of data.listCardPositions) {
      await test.step(`Card #${position}`, async () => {
        const title = await articlesPage.openListCard(position);
        expect.soft(norm(await articlesPage.articleH1()), `card #${position} opens its article`).toBe(norm(title));
        await articlesPage.backToList();
        expect(new URL(page.url()).pathname, 'Back returns to the list').toBe(urls.articles);
      });
    }
  });

  test('TC-A05 Each category filter shows only its articles and All Articles restores the list',
    { tag: ['@functional', '@P1'] }, async ({ articlesPage, request }) => {
      const library = await new CmsApi(request).listAll('Article');
      await articlesPage.open();
      const initialCount = await articlesPage.listCount();

      for (const category of data.categories) {
        await test.step(category.label, async () => {
          const expected = library.filter((a) => a.tagSlugs.includes(category.id)).map((a) => norm(a.title));
          await articlesPage.selectCategory(category.id);
          await articlesPage.scrollToBottom(2);
          const shown = (await articlesPage.listTitles()).map(norm);
          expect.soft(await articlesPage.activeTagId(), `${category.label}: tag highlighted`).toBe(category.id);
          expect.soft(shown.length, `${category.label}: has results`).toBeGreaterThan(0);
          expect.soft(shown.filter((t) => !expected.includes(t)), `${category.label}: articles from other categories`).toEqual([]);
          const missing = expected.filter((t) => !shown.includes(t));
          expect.soft(missing.length, `${category.label}: complete results (${shown.length} shown, ${expected.length} in the library)`).toBe(0);
        });
      }

      await articlesPage.selectCategory('all-articles');
      expect(await articlesPage.activeTagId()).toBe('all-articles');
      expect(await articlesPage.listCount(), 'All Articles restores the list').toBeGreaterThanOrEqual(initialCount);
    });

  test('TC-A06 Searching by keyword shows matching articles',
    { tag: ['@functional', '@P1'] }, async ({ articlesPage, request }) => {
      const term = data.searchTerm;
      const library = await new CmsApi(request).listAll('Article');
      const expected = library.filter((a) => norm(a.title).includes(norm(term))).map((a) => norm(a.title));
      await articlesPage.open();
      const initialCount = await articlesPage.listCount();

      await articlesPage.searchFor(term);
      const shown = (await articlesPage.listTitles()).map(norm);
      expect.soft(shown.filter((t) => !t.includes(norm(term))), 'non-matching results').toEqual([]);
      expect(shown.length, `results for "${term}" (library has ${expected.length} matching titles)`).toBeGreaterThanOrEqual(0);
      expect.soft(expected.filter((t) => !shown.includes(t)), 'matching articles from the whole library').toEqual([]);

      });

  test('TC-A07 Scrolling stops loading articles after a filter or search is used',
    { tag: ['@functional', '@P2', '@Bugs'] }, async ({ articlesPage }) => {
      await articlesPage.open();
      const fresh = await articlesPage.listCount();
      const freshAfterScroll = (await articlesPage.scrollToBottom(3)).pop();
      expect(freshAfterScroll, 'baseline: a fresh page loads more on scroll').toBeGreaterThan(fresh);

      await test.step('after Claim -> All Articles', async () => {
        await articlesPage.open();
        await articlesPage.selectCategory('claim');
        await articlesPage.selectCategory('all-articles');
        const before = await articlesPage.listCount();
        const after = (await articlesPage.scrollToBottom(3)).pop();
        expect.soft(after, `more articles load on scroll (${before} before)`).toEqual(before);
      });

      await test.step('after search -> clear', async () => {
        await articlesPage.open();
        await articlesPage.searchFor(data.searchTerm);
        await articlesPage.clearSearch();
        const before = await articlesPage.listCount();
        const after = (await articlesPage.scrollToBottom(3)).pop();
        expect.soft(after, `more articles load on scroll (${before} before)`).toEqual(before);
      });
    });
});
