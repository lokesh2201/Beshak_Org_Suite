/**
 * Read-only client for the public CMS GraphQL that the Articles / Videos pages use.
 * Tests use it as an independent source of truth: the full library with tags,
 * so filters and search can be checked against everything that exists.
 */
const CMS_GRAPHQL = 'https://cms.beshak.org/graphql';

const LIST_QUERY = `
query ArticleList($limit: Int = 100, $start: Int = 0, $postType: String = "Article", $categorySlug: String) {
  articles(limit: $limit, start: $start, where: {postType: $postType, category: {slug: $categorySlug}}, sort: "publishedDate:desc") {
    title
    slug
    url
    publishedDate
    tags { title slug }
  }
}`;

class CmsApi {
  /** @param {import('@playwright/test').APIRequestContext} request */
  constructor(request) {
    this.request = request;
  }

  /** @param {'Article'|'Video'} postType */
  async listAll(postType = 'Article', categorySlug = 'health-insurance') {
    const all = [];
    for (let start = 0; start < 5000; start += 100) {
      const res = await this.request.post(CMS_GRAPHQL, {
        data: { operationName: 'ArticleList', query: LIST_QUERY, variables: { limit: 100, start, postType, categorySlug } },
      });
      if (!res.ok()) throw new Error(`CMS GraphQL ${res.status()}: ${await res.text()}`);
      const batch = (await res.json()).data?.articles ?? [];
      all.push(...batch.map((a) => ({ ...a, title: a.title.trim(), tagSlugs: (a.tags || []).map((t) => t.slug) })));
      if (batch.length < 100) break;
    }
    return all;
  }
}

module.exports = { CmsApi };
