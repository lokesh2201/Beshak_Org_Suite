// Sheet: "Videos" (TC-V01 - TC-V05)
const { test, expect } = require('../src/fixtures/test');
const { norm } = require('../src/utils/assertions');
const { videos: data } = require('../src/data/content.data');
const { YouTubeApi, stubYouTubeEmbeds } = require('../src/api/YouTubeApi');

/**
 * Plays a card and checks the pop-up loads the card's YouTube video with autoplay.
 * With `youtube`, also checks on YouTube (oEmbed) that the video exists and its title matches the card.
 */
async function expectCardPlaysItsVideo(videosPage, card, label, youtube) {
  const { card: info, player } = await videosPage.play(card);
  expect.soft(info.videoId, `${label}: card has a YouTube thumbnail`).toBeTruthy();
  expect.soft(player.videoId, `${label}: plays the card's video ("${info.title}")`).toBe(info.videoId);
  expect.soft(player.autoplay, `${label}: starts playing`).toBe(true);
  expect.soft(await videosPage.modal.isOpen(), `${label}: pop-up open`).toBe(true);
  if (youtube && player.videoId) {
    const yt = await youtube.oembed(player.videoId);
    expect.soft(yt.status, `${label}: video ${player.videoId} exists on YouTube`).toBe(200);
    // Many videos were renamed on YouTube after the cards were written, so a title
    // difference is recorded for content review instead of failing (the video ID already matches).
    if (yt.title && !norm(yt.title).startsWith(norm(info.title).slice(0, 25))) {
      test.info().annotations.push({ type: 'title differs on YouTube', description: `${label}: card "${info.title}" / YouTube "${yt.title}"` });
    }
  }
  await videosPage.closePlayer();
}

test.describe('Health Videos page', () => {
  test.beforeEach(async ({ page }) => stubYouTubeEmbeds(page));

  test('TC-V01 Videos page loads with heading, featured videos, list and thumbnails',
    { tag: ['@smoke', '@P1'] }, async ({ videosPage, consoleErrors, page }) => {
      const response = await videosPage.open();
      expect(response?.status()).toBe(200);
      await expect(videosPage.h1).toHaveText(data.h1);
      expect(await videosPage.switch.activeTab()).toBe('Videos');
      expect(await videosPage.featuredCount()).toBe(data.featuredCount);
      expect(await videosPage.listCount()).toBe(data.listCount);

      const missingThumbs = [];
      for (const cards of [videosPage.featuredCards, videosPage.listCards]) {
        for (let i = 0; i < (await cards.count()); i++) {
          const info = await videosPage.readCard(cards.nth(i));
          if (!info.videoId) missingThumbs.push(info.title);
        }
      }
      expect.soft(missingThumbs, 'cards without a thumbnail').toEqual([]);
      expect.soft(consoleErrors.list(), 'console errors').toEqual([]);
    });

  test('TC-V02 Clicking a featured video plays it in a pop-up', { tag: ['@functional', '@P1'] }, async ({ videosPage, request }) => {
    const youtube = new YouTubeApi(request);
    await videosPage.open();
    const count = await videosPage.featuredCount();
    for (let i = 0; i < count; i++) {
      await test.step(`Featured video ${i + 1}`, () => expectCardPlaysItsVideo(videosPage, videosPage.featuredCards.nth(i), `featured #${i + 1}`, youtube));
    }
  });

  test('TC-V03 Every video in All Videos plays the correct video', { tag: ['@functional', '@P1'] }, async ({ videosPage, request }) => {
    test.setTimeout(5 * 60_000);
    const youtube = new YouTubeApi(request);
    await videosPage.open();
    const count = await videosPage.listCount();
    expect(count).toBe(data.listCount);
    for (let i = 0; i < count; i++) {
      await test.step(`Video ${i + 1}`, () => expectCardPlaysItsVideo(videosPage, videosPage.listCards.nth(i), `video #${i + 1}`, youtube));
    }
  });

  test('TC-V04 Closing the pop-up stops the video', { tag: ['@functional', '@P1'] }, async ({ videosPage }) => {
    await videosPage.open();
    await videosPage.play(videosPage.featuredCards.first());
    expect(await videosPage.modal.isOpen()).toBe(true);
    await videosPage.closePlayer();
    expect(await videosPage.modal.isOpen(), 'pop-up closes').toBe(false);
    expect(await videosPage.modal.isStopped(), 'no YouTube player left playing').toBe(true);
  });

  test('TC-V05 Searching by keyword shows matching videos; clearing restores the list',
    { tag: ['@functional', '@P1'] }, async ({ videosPage }) => {
      await videosPage.open();
      const all = await videosPage.listCount();
      for (const term of data.searchTerms) {
        await test.step(`Search "${term}"`, async () => {
          await videosPage.searchFor(term);
          const titles = await videosPage.listTitles();
          expect.soft(titles.length, `"${term}" has results`).toBeGreaterThan(0);
          expect.soft(titles.filter((t) => !norm(t).includes(norm(term))), `"${term}": non-matching results`).toEqual([]);
        });
      }
      await videosPage.clearSearch();
      expect(await videosPage.listCount(), 'clearing restores all videos').toBe(all);
    });
});
