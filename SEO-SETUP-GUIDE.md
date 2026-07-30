# SEO Setup Guide for Pokytalk

This guide will help you submit your site to search engines and enable AI search discoverability.

## ✅ Files Created

1. **`src/app/sitemap.ts`** - Generates `/sitemap.xml` at build time. Blog URLs are
   derived from `src/lib/blogArticles.ts`, so adding an article to that array is all
   that's needed — do not hand-edit the XML (there is no longer a static file).
2. **`src/app/robots.ts`** - Generates `/robots.txt` at build time.
3. **`src/lib/seo.ts`** - Per-page titles, descriptions, canonicals and JSON-LD.
   Every page sets its own canonical here; `layout.tsx` deliberately does not, or
   it would be inherited by every page and point them all at the homepage.
4. **Structured data** - `WebApplication` + `Organization` site-wide, `BlogPosting`
   and `BreadcrumbList` on articles, `FAQPage` on landing pages.

## 📋 Google Search Console Setup

### Step 1: Submit Sitemap

1. **Go to Google Search Console**
   - Visit: https://search.google.com/search-console
   - Select your property (pokytalk.com)

2. **Navigate to Sitemaps**
   - In the left sidebar, click **"Sitemaps"**
   - Or go directly to: https://search.google.com/search-console/sitemaps

3. **Add Sitemap URL**
   - In the "Add a new sitemap" field, enter:
     ```
     https://pokytalk.com/sitemap.xml
     ```
   - Click **"Submit"**

4. **Verify Submission**
   - Google will process your sitemap
   - Status should show "Success" within a few hours
   - You can check status in the Sitemaps section

### Step 2: Request Indexing (Optional but Recommended)

1. **URL Inspection Tool**
   - In Google Search Console, use the **URL Inspection** tool (top search bar)
   - Enter your homepage: `https://pokytalk.com/`
   - Click **"Test Live URL"**
   - If it's not indexed, click **"Request Indexing"**

2. **Request Indexing for Key Pages**
   - Homepage: `https://pokytalk.com/`
   - Blog: `https://pokytalk.com/blog/`
   - Article: `https://pokytalk.com/blog/talk-to-strangers-online/`

## 🔍 Additional Search Engine Submissions

### Bing Webmaster Tools

1. **Sign up**: https://www.bing.com/webmasters
2. **Add your site**: Submit `https://pokytalk.com`
3. **Submit sitemap**: `https://pokytalk.com/sitemap.xml`
4. **Verify ownership**: Similar to Google Search Console

### Yandex Webmaster

1. **Sign up**: https://webmaster.yandex.com
2. **Add your site** and submit sitemap

### DuckDuckGo

- DuckDuckGo uses Bing's index, so submitting to Bing covers DuckDuckGo

## 🤖 AI Search Engine Discoverability (GPT to Search)

### What is "GPT to Search"?

This refers to making your site discoverable by AI search engines like:
- **ChatGPT** (OpenAI)
- **Perplexity AI**
- **Google's Search Generative Experience (SGE)**
- **Claude** (Anthropic)
- **Bing Chat** (Microsoft)

### How We've Enabled It

1. **robots.txt** - Allows AI crawlers:
   ```
   User-agent: GPTBot
   Allow: /
   
   User-agent: ChatGPT-User
   Allow: /
   
   User-agent: PerplexityBot
   Allow: /
   ```

2. **Structured Data (JSON-LD)** - Added to layout.tsx:
   - Schema.org markup
   - WebApplication schema
   - Helps AI understand your site's purpose

3. **Enhanced Metadata**:
   - Rich descriptions
   - Open Graph tags
   - Twitter cards
   - Canonical URLs

### Additional Steps for AI Search

#### 1. Submit to OpenAI (ChatGPT)

Currently, OpenAI doesn't have a direct submission form, but:
- Ensure your site is indexed by Google (ChatGPT uses Google's index)
- Make sure your content is publicly accessible
- Use clear, descriptive content

#### 2. Submit to Perplexity

- Perplexity uses Bing's index
- Submit to Bing Webmaster Tools (see above)
- Ensure your sitemap is submitted

#### 3. Google Search Generative Experience (SGE)

- SGE uses Google's index
- Focus on Google Search Console optimization
- Ensure high-quality, original content
- Use structured data (already added)

#### 4. Verify AI Crawler Access

Test if AI crawlers can access your site:

```bash
# Test GPTBot access
curl -A "GPTBot" https://pokytalk.com/robots.txt

# Test PerplexityBot access
curl -A "PerplexityBot" https://pokytalk.com/robots.txt
```

## 📊 Monitoring & Verification

### Check Indexing Status

1. **Google Search Console**
   - Go to "Coverage" report
   - Check "Valid" pages
   - Monitor for errors

2. **Google Search**
   - Search: `site:pokytalk.com`
   - See which pages are indexed

3. **Bing Webmaster Tools**
   - Check "Sitemaps" section
   - View indexed pages

### Monitor Search Performance

1. **Google Search Console**
   - "Performance" report
   - Track impressions, clicks, CTR
   - Monitor search queries

2. **Google Analytics**
   - Already set up (G-2M4YCB127Y)
   - Track organic traffic
   - Monitor user behavior

## 🚀 Quick Checklist

- [x] Sitemap.xml created
- [x] robots.txt created
- [x] Enhanced metadata added
- [x] Structured data (JSON-LD) added
- [ ] Submit sitemap to Google Search Console
- [ ] Request indexing for key pages
- [ ] Submit to Bing Webmaster Tools
- [ ] Verify robots.txt allows AI crawlers
- [ ] Test sitemap accessibility: `https://pokytalk.com/sitemap.xml`
- [ ] Test robots.txt: `https://pokytalk.com/robots.txt`
- [ ] Monitor indexing status in Search Console

## 📝 Important Notes

1. **Sitemap Updates**: Nothing to do by hand. `lastmod` comes from each article's
   `date` in `src/lib/blogArticles.ts` and is regenerated on every build.
2. **robots.txt**: Already configured to allow AI crawlers
3. **Structured Data**: Site-wide blocks come from layout.tsx; per-page blocks come
   from `src/lib/seo.ts`
4. **New pages**: Every new page must export its own `metadata` (use `pageMetadata()`
   or `articleMetadata()` from `src/lib/seo.ts`). A page marked `'use client'` cannot
   export metadata at all and will silently inherit the site defaults — keep pages as
   server components and push interactivity into child components.
5. **No fake ratings**: Do not add `aggregateRating` to the structured data unless a
   real review system exists; inventing review data risks a manual action.
4. **Domain**: Make sure you're using `pokytalk.com` (not `www.pokytalk.com` or subdomain) consistently

## 🔗 Useful Links

- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Schema.org Documentation](https://schema.org/)
- [Google's Search Central](https://developers.google.com/search)
- [OpenAI GPTBot Documentation](https://platform.openai.com/docs/gptbot)

## 🎯 Next Steps

1. **Deploy the changes** (sitemap.xml and robots.txt are generated into `frontend/out`
   by `npm run build` — they are no longer static files in `public/`)
2. **Submit sitemap to Google Search Console** (follow Step 1 above)
3. **Submit to Bing Webmaster Tools**
4. **Wait 24-48 hours** for initial indexing
5. **Monitor Search Console** for any issues
6. **Request indexing** for important pages if needed

---

**Note**: It may take a few days to weeks for search engines to fully index your site. Be patient and continue creating quality content!

