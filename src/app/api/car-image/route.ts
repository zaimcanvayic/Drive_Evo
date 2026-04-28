import { NextResponse } from 'next/server';

// Önce Google Custom Search'ü dene, yoksa Wikimedia Commons'a geri dön
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // 1) Google Custom Search API varsa kullan
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (apiKey && searchEngineId) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        return NextResponse.json({ imageUrl: data.items[0].link });
      }
    } catch (err) {
      console.warn('[car-image] Google API başarısız, Wikimedia\'ya geçiliyor:', err);
    }
  }

  // 2) Fallback: Wikipedia thumbnail - birden fazla arama denenir
  const cleanQuery = query.replace(/\s+\d{4}\s+car$/, '').trim(); // "Toyota Corolla"
  const parts = cleanQuery.split(' '); // ["Toyota", "Corolla"]

  const wikiTitles = [
    cleanQuery,                                   // "Toyota Corolla"
    parts.length > 1 ? parts[1] : parts[0],      // "Corolla"
    parts[0],                                     // "Toyota"
  ];

  for (const title of wikiTitles) {
    try {
      const wikiSearch = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
      const wikiRes = await fetch(wikiSearch);
      const wikiData = await wikiRes.json();
      const pages = wikiData?.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as any;
        if (page?.thumbnail?.source) {
          return NextResponse.json({ imageUrl: page.thumbnail.source });
        }
      }
    } catch {}
  }

  // 3) Son Fallback: Unsplash'tan genel bir araç fotoğrafı (her zaman çalışır)
  const brand = parts[0].toLowerCase();
  const unsplashSeeds: Record<string, string> = {
    toyota: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80',
    fiat:   'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=600&q=80',
    volkswagen: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80',
    renault: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80',
    ford:   'https://images.unsplash.com/photo-1551830820-330a71b99659?w=600&q=80',
    bmw:    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80',
    audi:   'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=600&q=80',
    mercedes: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80',
    honda:  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&q=80',
    hyundai: 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=600&q=80',
    porsche: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&q=80',
  };

  const fallbackUrl = unsplashSeeds[brand] ?? 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80';
  return NextResponse.json({ imageUrl: fallbackUrl });
}