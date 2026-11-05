/**
 * YouTube's public oEmbed endpoint: confirms a video ID exists and returns its title.
 * Used to check "the correct video plays" without playing video in the test browser.
 */
class YouTubeApi {
  /** @param {import('@playwright/test').APIRequestContext} request */
  constructor(request) {
    this.request = request;
  }

  async oembed(videoId) {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
    const res = await this.request.get(url);
    return { status: res.status(), title: res.ok() ? (await res.json()).title : null };
  }
}

/**
 * Replaces the YouTube embed page with a tiny stub so videos don't autoplay in the test browser
 * (real playback makes headless Chromium sluggish and flaky). The site still creates the player
 * iframe with the real video URL, which is what the tests check.
 */
async function stubYouTubeEmbeds(page) {
  await page.route(/https:\/\/www\.youtube(-nocookie)?\.com\/embed\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub player</title><body>stub</body>' }),
  );
}

module.exports = { YouTubeApi, stubYouTubeEmbeds };
