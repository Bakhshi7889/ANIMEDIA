import { load } from "cheerio";
import { DateTime } from "luxon";
import crypto from 'crypto';

export class Dimension {
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public getAspectRatio(): string {
        const gcd = this.gcd(this.width, this.height);
        return `${this.width / gcd}:${this.height / gcd}`;
    }
    public getWidthInPx(): number { return this.width; }
    public getHeightInPx(): number { return this.height; }
    public getWidthInRem(baseFontSize: number = 16): number { return this.width / baseFontSize; }
    public getHeightInRem(baseFontSize: number = 16): number { return this.height / baseFontSize; }
    private gcd(a: number, b: number): number {
        if (b === 0) return a;
        return this.gcd(b, a % b);
    }
    public static fromString(dimensionString: string): Dimension | null {
        const [width, height] = dimensionString.split('x').map(Number);
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return null;
        return new Dimension(width, height);
    }
}

export class CryptoHelper {
    public static rot13Cipher(str: string): string {
      return str.replace(/[a-zA-Z]/g, (c) => {
        const charCode = c.charCodeAt(0);
        const isUpperCase = charCode >= 65 && charCode <= 90;
        const shiftedCharCode = isUpperCase ? ((charCode - 65 + 13) % 26) + 65 : ((charCode - 97 + 13) % 26) + 97;
        return String.fromCharCode(shiftedCharCode);
      });
    }
}

export class Rule34 {
    private baseUrl: string = "https://rule34.xxx";
    
    public async fetchSearchResult(query: string, page = 1, perPage = 42) {
        if (!query) query = "alisa_mikhailovna_kujou";
        const url = `${this.baseUrl}/index.php?page=post&s=list&tags=${query}&pid=${(page - 1) * perPage}`;

        const response = await fetch(url);
        const data = await response.text();
        const $ = load(data);
        const results: any[] = [];

        $('.image-list span').each((i, e) => {
            const $e = $(e);
            const id = $e.attr('id')?.replace('s', '');
            const image = $e.find('img').attr('src');
            const tags = $e.find('img').attr('alt')?.trim()?.split(' ').filter(tag => tag !== "");
            results.push({ id: id!, image: image!, tags: tags!, type: 'preview' });
        });

        const pagination = $('#paginator .pagination');
        const totalPages = parseInt(pagination.find('a:last').attr('href')?.split('pid=')[1] || "1", 10) / perPage + 1;
        const hasNextPage = page < totalPages;
        return { total: totalPages * perPage, pages: totalPages, page: page, hasNextPage, results };
    }

    public async fetchInfo(id: string) {
        const url = `${this.baseUrl}/index.php?page=post&s=view&id=${id}`;
        const resizeCookies = { 'resize-notification': 1, 'resize-original': 1 };

        const [resizedResponse, nonResizedResponse] = await Promise.all([
          fetch(url), 
          fetch(url, { headers: { cookie: Object.entries(resizeCookies).map(([key, value]) => `${key}=${value}`).join('; ') } })
        ]);

        const [resized, original] = await Promise.all([resizedResponse.text(), nonResizedResponse.text()]);
        const $resized = load(resized);
        const resizedImageUrl = $resized('#image').attr('src');
        const $ = load(original);
        const fullImage = $('#image').attr('src');
        const tags = $('#image').attr('alt')?.trim()?.split(' ').filter(tag => tag !== "");

        return { id, fullImage, resizedImageUrl, tags };
    }
}

export function getNumberFromString(str: string): number | null {
  const numbers = str.match(/\d+/g);
  return numbers ? numbers.map((n) => Number(n))[0] : null;
}

export class HentaiHaven {
    private baseUrl: string = "https://hentaihaven.xxx";

    public async fetchSearchResult(query: string) {
        if (!query) query = "Hatsukoi Jikan";
        const url = `${this.baseUrl}/?s=${query}&post_type=wp-manga`;

        const response = await fetch(url);
        const data = await response.text();
        const $ = load(data);
        const results: any[] = [];

        $(".c-tabs-item__content").each((i, el) => {
            const cover = $(el).find(".c-image-hover img").attr("src")!;
            const id = $(el).find(".c-image-hover a").attr("href")?.split("/")[4]!;
            const title = $(el).find(".post-title h3").text().trim();
            results.push({ id, title, cover: cover ? cover.replaceAll(" ", "%20") : "" });
        });
        return results;
    }

    public async fetchInfo(id: string) {
        if (!id) throw new Error("Id is required");
        const url = `${this.baseUrl}/watch/${id}`;

        const response = await fetch(url);
        const data = await response.text();
        const $ = load(data);

        const title = $(".post-title h1").text().trim();
        const cover = $(".summary_image img").attr("src")!;
        const summary = $(".description-summary p").text().trim();
        const episodes: any[] = [];

        const episodesLength = $("li.wp-manga-chapter").length;
        $("li.wp-manga-chapter").each((i, el) => {
            const thumbnail = $(el).find("img").attr("src");
            const epUrl = $(el).find("a").attr("href");
            if (epUrl) {
                const parts = epUrl.split("/");
                const id = `${parts[4]}/${parts[5]}`;
                const title = $(el).find("a").text().trim();
                const number = episodesLength - i;
                episodes.push({ id: btoa(id), title, thumbnail, number });
            }
        });
        
        episodes.sort((a, b) => a.number - b.number);
        return { id, title, cover: cover ? cover.replaceAll(" ", "%20") : "", summary, episodes };
    }

    public async fetchSources(id?: string) {
        if (id?.includes("episode-")) throw new Error("The Episode ID must be encoded.");
        const pageUrl = `${this.baseUrl}/watch/${atob(id!)}`;

        const pageResponse = await fetch(pageUrl);
        const pageHtml = await pageResponse.text();
        const $page = load(pageHtml);
        const iframeSrc = $page(".player_logic_item > iframe").attr("src");
        if(!iframeSrc) throw new Error("Not found");

        const iframeResponse = await fetch(iframeSrc);
        const iframeHtml = await iframeResponse.text();
        const $iframe = load(iframeHtml);
        const secureToken = $iframe('meta[name="x-secure-token"]').attr("content")?.replace("sha512-", "");

        const rotatedSha = CryptoHelper.rot13Cipher(secureToken!);
        const decryptedData = JSON.parse(
          atob(CryptoHelper.rot13Cipher(atob(CryptoHelper.rot13Cipher(atob(rotatedSha)))))
        );

        const formData = new FormData();
        formData.append("action", "zarat_get_data_player_ajax");
        formData.append("a", decryptedData.en);
        formData.append("b", decryptedData.iv);

        const apiUrl = `${decryptedData.uri || "https://hentaihaven.xxx/wp-content/plugins/player-logic/"}api.php`;
        const apiResponse: any = await (await fetch(apiUrl, { method: "POST", body: formData })).json();

        return { sources: apiResponse.data.sources, thumbnail: apiResponse.data.image };
    }
}
