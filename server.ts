import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { Rule34, HentaiHaven } from './server-providers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // -- hanime API routes --
  const jsongen = async (url: string) => {
    try {
      const headers = {
        'X-Signature-Version': 'web2',
        'X-Signature': crypto.randomBytes(32).toString('hex'),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
      };
      const res = await axios.get(url, { headers });
      return res.data;
    } catch (error: any) {
      throw new Error(`Error fetching data: ${error.message}`);
    }
  };

  const searchHTV = async (data: any) => {
    try {
        const response = await axios.post("https://search.htv-services.com", data, {
            headers: { "Content-Type": "application/json" }
        });
        const d = response.data;
        const hits = JSON.parse(d.hits);
        return hits.map((x: any) => ({
            id: x.id,
            name: x.name,
            slug: x.slug,
            cover_url: x.cover_url,
            views: x.views,
            link: `/watch/${x.slug}`,
            source: 'hanime'
        }));
    } catch (e: any) {
        throw new Error(`Search error: ${e.message}`);
    }
  };

  const getTrending = async (time: string, page: string) => {
    return await searchHTV({
        blacklist: [],
        brands: [],
        order_by: "views",
        page: parseInt(page),
        tags: [],
        search_text: "",
        tags_mode: "AND"
    });
  };

  const getVideo = async (slug: string) => {
    const videoApiUrl = 'https://hanime.tv/api/v8/video?id=';
    const videoDataUrl = videoApiUrl + slug;
    const videoData = await jsongen(videoDataUrl);
    const tags = videoData.hentai_tags.map((t: any) => ({
      name: t.text,
      link: `/hentai-tags/${t.text}/0`,
    }));
    const streams = videoData.videos_manifest.servers[0].streams.map((s: any) => ({
      width: s.width,
      height: s.height,
      size_mbs: s.filesize_mbs,
      url: s.url,
    }));
    const episodes = videoData.hentai_franchise_hentai_videos.map((e: any) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      cover_url: e.cover_url,
      views: e.views,
      link: `/watch/${e.slug}`,
    }));
    return [{
      id: videoData.hentai_video.id,
      name: videoData.hentai_video.name,
      description: videoData.hentai_video.description,
      poster_url: videoData.hentai_video.poster_url,
      cover_url: videoData.hentai_video.cover_url,
      views: videoData.hentai_video.views,
      streams: streams,
      tags: tags,
      episodes: episodes,
    }];
  };

  const getBrowse = async () => {
    const browseUrl = 'https://hanime.tv/api/v8/browse';
    return await jsongen(browseUrl);
  };

  const getBrowseVideos = async (type: string, category: string, page: string, extraTags: string[] = []) => {
    const cleanCategory = category.replace(/-/g, ' '); 
    const isTag = type === 'hentai_tags' || type === 'tags';
    const isBrand = type === 'brands';
    
    let allTags = [...extraTags];
    if (isTag && cleanCategory) allTags.push(cleanCategory);

    return await searchHTV({
        blacklist: [],
        brands: isBrand ? [cleanCategory] : [],
        order_by: "created_at_unix", // Use newest
        page: parseInt(page),
        tags: allTags,
        search_text: "",
        tags_mode: "AND"
    });
  };

  app.get('/api/search', async (req, res, next) => {
    try {
      const { text, page = "0", source = "all" } = req.query; 
      let results: any[] = [];
      const promises = [];

      if (source === 'all' || source === 'hanime') {
        promises.push((async () => {
             const data = await searchHTV({
                 blacklist: [], brands: [], order_by: "created_at_unix",
                 page: parseInt(page as string), tags: [], search_text: text as string || "", tags_mode: "AND"
             });
             return data;
        })());
      }
      
      if (source === 'all' || source === 'rule34') {
         promises.push((async () => {
             const r34 = new Rule34();
             const data = await r34.fetchSearchResult(text as string, parseInt(page as string) + 1); 
             return data.results.map((d: any) => ({
                 id: d.id, name: d.tags.join(' '), slug: d.id, cover_url: d.image, views: 0, source: 'rule34'
             }));
         })().catch(() => []));
      }

      if (source === 'all' || source === 'hentaihaven') {
         promises.push((async () => {
             const hh = new HentaiHaven();
             const data = await hh.fetchSearchResult(text as string);
             return data.map((d: any) => ({
                 id: d.id, name: d.title, slug: d.id, cover_url: d.cover, views: 0, source: 'hentaihaven'
             }));
         })().catch(() => []));
      }

      const allData = await Promise.all(promises);
      results = allData.flat();

      res.json({ results, next_page: `/api/search?text=${text}&page=${parseInt(page as string) + 1}&source=${source}` });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/:provider/watch/:slug', async (req, res, next) => {
    try {
      const { provider, slug } = req.params;
      if (provider === 'hanime') {
          const jsondata = await getVideo(slug);
          res.json({ results: jsondata });
      } else if (provider === 'rule34') {
          const r34 = new Rule34();
          const info = await r34.fetchInfo(slug);
          res.json({ results: [{
              id: info.id,
              name: "Rule34 " + info.id,
              description: "",
              poster_url: info.fullImage,
              cover_url: info.resizedImageUrl,
              views: 0,
              streams: [{ url: info.fullImage }],
              tags: (info.tags || []).map((t: string) => ({ name: t })),
              episodes: []
          }]});
      } else if (provider === 'hentaihaven') {
          const hh = new HentaiHaven();
          const info = await hh.fetchInfo(slug);
          res.json({ results: [{
              id: info.id,
              name: info.title,
              description: info.summary,
              poster_url: info.cover,
              cover_url: info.cover,
              views: 0,
              streams: [], // Must fetch dynamically using episode id usually
              tags: [],
              episodes: info.episodes.map((e: any) => ({
                  id: e.id, name: e.title, slug: e.id, cover_url: e.thumbnail, views: 0
              }))
          }]});
      } else {
          res.status(404).json({error: "Unknown provider"});
      }
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/hentaihaven/sources/:id', async (req, res, next) => {
      try {
          const hh = new HentaiHaven();
          const sources = await hh.fetchSources(req.params.id);
          res.json({ results: sources });
      } catch (e) { next(e); }
  });

  app.get('/api/hanime/trending/:time/:page', async (req, res, next) => {
    try {
      const { time, page } = req.params;
      const jsondata = await getTrending(time, page);
      const nextPage = `/api/hanime/trending/${time}/${parseInt(page) + 1}`;
      res.json({ results: jsondata, next_page: nextPage });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/hanime/browse/:type', async (req, res, next) => {
    try {
      const { type } = req.params;
      const data = await getBrowse();
      let jsondata = data[type];
      if (type === 'hentai_tags') {
        jsondata = jsondata.map((x: any) => ({ ...x, url: `/api/hanime/hentai-tags/${x.text}/0` }));
      } else if (type === 'brands') {
        jsondata = jsondata.map((x: any) => ({ ...x, url: `/api/hanime/brands/${x.slug}/0` }));
      }
      res.json({ results: jsondata });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/hanime/tags', async (req, res, next) => {
    try {
      const data = await getBrowse();
      const jsondata = data.hentai_tags.map((x: any) => ({ ...x, url: `/api/hanime/tags/${x.text}/0` }));
      res.json({ results: jsondata });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/hanime/:type/:category/:page', async (req, res, next) => {
    try {
      const { type, category, page } = req.params;
      const { tags } = req.query;
      const parsedTags = tags ? (tags as string).split(',') : [];
      const data = await getBrowseVideos(type, category, page, parsedTags);
      const nextPage = `/api/hanime/${type}/${category}/${parseInt(page) + 1}${tags ? `?tags=${tags}` : ''}`;
      res.json({ results: data, next_page: nextPage });
    } catch (error) {
      next(error);
    }
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
