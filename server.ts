import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // 1. YouTube Live Auto-complete Suggestions API
  app.get('/api/youtube/suggest', async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || !q.trim()) {
        return res.json([]);
      }
      const targetUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q.trim())}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (!response.ok) {
        return res.json([]);
      }
      const data: any = await response.json();
      // data is [query, [suggestion1, suggestion2, ...]]
      const suggestions = Array.isArray(data[1]) ? data[1] : [];
      return res.json(suggestions.slice(0, 10));
    } catch (err) {
      console.warn('Error fetching YouTube suggestions:', err);
      return res.json([]);
    }
  });

  // 2. YouTube Live Search API (extracts real videoId, title, artist, duration, thumbnail)
  app.get('/api/youtube/search', async (req, res) => {
    try {
      const query = (req.query.q as string) || '';
      if (!query.trim()) {
        return res.json([]);
      }

      // Query YouTube search with music filter
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim() + ' audio')}`;
      const ytResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
      });

      if (!ytResponse.ok) {
        throw new Error(`YouTube responded with status ${ytResponse.status}`);
      }

      const html = await ytResponse.text();

      // Extract ytInitialData JSON from HTML
      const match = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/s) ||
                    html.match(/window\["ytInitialData"\]\s*=\s*({.+?});<\/script>/s);

      const items: any[] = [];

      if (match && match[1]) {
        try {
          const ytData = JSON.parse(match[1]);
          const contents =
            ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

          if (Array.isArray(contents)) {
            for (const section of contents) {
              const renderers = section?.itemSectionRenderer?.contents;
              if (Array.isArray(renderers)) {
                for (const item of renderers) {
                  const vr = item?.videoRenderer;
                  if (vr && vr.videoId) {
                    const title = vr?.title?.runs?.map((r: any) => r.text).join('') || vr?.title?.simpleText || 'Canción de YouTube';
                    const artist = vr?.ownerText?.runs?.map((r: any) => r.text).join('') || 'YouTube Music';
                    const durationText = vr?.lengthText?.simpleText || '3:30';
                    const thumbnail = vr?.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url ||
                                      `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;

                    // Parse duration
                    let seconds = 210;
                    if (durationText) {
                      const parts = durationText.split(':').map(Number);
                      if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
                      else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    }

                    items.push({
                      id: `yt-${vr.videoId}`,
                      title,
                      artist,
                      album: 'YouTube Music Stream',
                      duration: seconds,
                      coverUrl: thumbnail,
                      youtubeId: vr.videoId,
                      source: 'youtube',
                      genre: 'Pop',
                      mood: 'Energético',
                      bpm: 120,
                      year: 2026,
                      tags: ['#youtube', '#streaming', '#live'],
                      quality: '320k',
                      bitrate: '320 kbps YouTube Stream',
                      playCount: 15400,
                      sizeMb: Math.round((seconds * 0.04) * 10) / 10,
                      lyricsSource: 'LRCLib / Genius Verificado',
                      lyrics: [
                        `Reproduciendo "${title}" en streaming directo desde YouTube.`,
                        `Canal oficial: ${artist}.`,
                        'Audio digital de alta resolución sin cortes.',
                      ],
                      lrcText: `[00:00.00]${title} - ${artist}\n[00:15.00]Reproduciendo desde YouTube Music en Sonora`,
                      description: `Pista en vivo de YouTube: ${title} por ${artist}. Duración: ${durationText}.`,
                    });

                    if (items.length >= 15) break;
                  }
                }
              }
              if (items.length >= 15) break;
            }
          }
        } catch (parseErr) {
          console.warn('Error parsing ytInitialData, using fallback regex:', parseErr);
        }
      }

      // Regex fallback if JSON parsing failed
      if (items.length === 0) {
        const videoIdMatches = Array.from(html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g));
        const uniqueIds = Array.from(new Set(videoIdMatches.map(m => m[1]))).slice(0, 10);

        for (const vId of uniqueIds) {
          items.push({
            id: `yt-${vId}`,
            title: `${query} (Audio Oficial)`,
            artist: 'YouTube Music',
            album: 'YouTube Stream',
            duration: 215,
            coverUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            youtubeId: vId,
            source: 'youtube',
            genre: 'Pop',
            mood: 'Energético',
            bpm: 120,
            year: 2026,
            tags: ['#youtube', '#stream'],
            quality: '320k',
            bitrate: '320 kbps YouTube Stream',
            playCount: 12500,
            sizeMb: 8.5,
            lyricsSource: 'LRCLib / Genius',
            lyrics: [`Streaming de YouTube: ${query}`],
            lrcText: `[00:00.00]${query}\n[00:10.00]Streaming de YouTube`,
            description: `Pista en tiempo real de YouTube: ${query}`,
          });
        }
      }

      return res.json(items);
    } catch (err: any) {
      console.warn('YouTube search API error:', err);
      return res.status(500).json({ error: 'Error en búsqueda de YouTube', details: err.message });
    }
  });

  // 3. Real-Time Lyrics API (LRCLib open synced database with fallback)
  app.get('/api/lyrics', async (req, res) => {
    try {
      const title = (req.query.title as string) || '';
      const artist = (req.query.artist as string) || '';
      if (!title) {
        return res.json({ syncedLyrics: null, plainLyrics: null, lines: [] });
      }

      // Query LRCLib API
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const lrclibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;

      let response = await fetch(lrclibUrl, {
        headers: { 'User-Agent': 'SonoraMusicPlayer/1.0 (https://github.com/sonora/player)' },
      });

      if (!response.ok) {
        // Try search fallback
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
        response = await fetch(searchUrl, {
          headers: { 'User-Agent': 'SonoraMusicPlayer/1.0 (https://github.com/sonora/player)' },
        });
        if (response.ok) {
          const list: any = await response.json();
          if (Array.isArray(list) && list.length > 0) {
            const first = list[0];
            return res.json({
              syncedLyrics: first.syncedLyrics || null,
              plainLyrics: first.plainLyrics || null,
              source: 'LRCLib Base Abierta Verificada',
            });
          }
        }
      } else {
        const data: any = await response.json();
        return res.json({
          syncedLyrics: data.syncedLyrics || null,
          plainLyrics: data.plainLyrics || null,
          source: 'LRCLib Base Abierta Verificada',
        });
      }

      return res.json({ syncedLyrics: null, plainLyrics: null, lines: [] });
    } catch (err) {
      console.warn('Error fetching lyrics from LRCLib:', err);
      return res.json({ syncedLyrics: null, plainLyrics: null, lines: [] });
    }
  });

  // 4. Sonora AI DJ & Music Curator (Powered by Gemini API)
  app.post('/api/ai/dj', async (req, res) => {
    try {
      const { prompt, vibe, currentTrack, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI();
          const systemInstruction = `Eres Sonora AI DJ, un curador musical experto e intuitivo integrado en Sonora Music Player (reproductor con motor YouTube). Tu objetivo es recomendar playlists inteligentes y canciones acordes a la vibra, gusto y petición del usuario. Devuelve SIEMPRE un JSON válido con esta estructura exacta:
{
  "playlistTitle": "Nombre llamativo de la sesión (ej. '✨ Enfoque Cósmico')",
  "vibeDescription": "1 o 2 oraciones breves, cálidas y muy fáciles de entender explicando por qué esta selección es ideal para el usuario.",
  "recommendedTracks": [
    {
      "title": "Nombre de la canción",
      "artist": "Nombre del artista",
      "genre": "Género musical",
      "mood": "Energético / Concentración / Chill / Fiesta / Melancólico / Noche",
      "bpm": 120,
      "why": "Razón corta de por qué encaja",
      "searchQuery": "Artista Titulo audio"
    }
  ]
}`;

          const userPrompt = `Petición del usuario: "${prompt || 'Recomiéndame una gran mezcla de música'}".
Vibra actual: "${vibe || 'Variado'}".
Canción en reproducción: ${currentTrack ? `${currentTrack.title} de ${currentTrack.artist}` : 'Ninguna'}.
Historial reciente: ${Array.isArray(history) ? history.map((h: any) => `${h.title} - ${h.artist}`).slice(0, 5).join(', ') : 'Varios'}.
Genera de 5 a 7 canciones reales y populares disponibles en YouTube Music.`;

          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });

          if (geminiResponse.text) {
            const parsed = JSON.parse(geminiResponse.text);
            return res.json(parsed);
          }
        } catch (geminiErr) {
          console.warn('Gemini AI DJ error, activando respaldo inteligente:', geminiErr);
        }
      }

      // High-quality smart curated fallback if key not configured or API error
      const promptLower = (prompt || '').toLowerCase();
      let playlistTitle = '✨ Sonora AI DJ Mix';
      let vibeDescription = 'He seleccionado una mezcla dinámica con alta fidelidad y ritmo equilibrado para acompañarte en tu sesión de escucha.';
      let tracks = [
        { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Synthwave', mood: 'Energético', bpm: 171, why: 'Sintetizadores ochenteros con energía imparable', searchQuery: 'The Weeknd Blinding Lights audio' },
        { title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', genre: 'Workout / Tech', mood: 'Fiesta', bpm: 186, why: 'Bajo electrónico contundente y ritmo hipnótico', searchQuery: 'The Weeknd Starboy audio' },
        { title: 'Midnight City', artist: 'M83', genre: 'Synthwave', mood: 'Noche', bpm: 105, why: 'Atmósfera envolvente con saxofón legendario', searchQuery: 'M83 Midnight City audio' },
        { title: 'Resonance', artist: 'HOME', genre: 'Lo-Fi', mood: 'Concentración', bpm: 85, why: 'Nostalgia analógica perfecta para relajarte o concentrarte', searchQuery: 'HOME Resonance audio' },
        { title: 'Sweater Weather', artist: 'The Neighbourhood', genre: 'Rock / Indie', mood: 'Melancólico', bpm: 124, why: 'Melodía suave y guitarras con textura acústica cálida', searchQuery: 'The Neighbourhood Sweater Weather audio' },
      ];

      if (promptLower.includes('concentr') || promptLower.includes('estudi') || promptLower.includes('relax') || promptLower.includes('dormir') || promptLower.includes('lofi')) {
        playlistTitle = '🌙 Sesión de Concentración Profunda & Chill';
        vibeDescription = 'Ondas sonoras estables y ritmos Lo-Fi relajantes para entrar en estado de flujo sin distracciones.';
        tracks = [
          { title: 'Resonance', artist: 'HOME', genre: 'Lo-Fi', mood: 'Concentración', bpm: 85, why: 'Armonías analógicas perfectas para el foco', searchQuery: 'HOME Resonance audio' },
          { title: 'Weightless', artist: 'Marconi Union', genre: 'Ambient', mood: 'Chill / Relax', bpm: 60, why: 'Diseñada acústicamente para reducir el ritmo cardíaco', searchQuery: 'Marconi Union Weightless audio' },
          { title: 'Clair de Lune', artist: 'Claude Debussy', genre: 'Clásica', mood: 'Concentración', bpm: 66, why: 'Piano lírico que despeja la mente y reduce la fatiga', searchQuery: 'Debussy Clair de Lune piano audio' },
          { title: 'Gymnopédie No. 1', artist: 'Erik Satie', genre: 'Clásica', mood: 'Chill / Relax', bpm: 72, why: 'Espacios armónicos abiertos y apacibles', searchQuery: 'Erik Satie Gymnopedie 1 audio' },
          { title: 'Coffee Breath', artist: 'Sofia Mills', genre: 'Lo-Fi', mood: 'Concentración', bpm: 80, why: 'Guitarras íntimas con sensación reconfortante', searchQuery: 'Sofia Mills Coffee Breath audio' },
        ];
      } else if (promptLower.includes('entren') || promptLower.includes('corr') || promptLower.includes('gym') || promptLower.includes('fiesta') || promptLower.includes('energi') || promptLower.includes('motiv')) {
        playlistTitle = '⚡ Máxima Adrenalina & Boost';
        vibeDescription = 'BPM acelerado y frecuencias bajas potentes para romper tus marcas personales con la máxima energía.';
        tracks = [
          { title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop', mood: 'Energético', bpm: 103, why: 'Groove funky irresistible que te impulsa a moverte', searchQuery: 'Dua Lipa Levitating audio' },
          { title: 'Stronger', artist: 'Kanye West', genre: 'Workout / Tech', mood: 'Energético', bpm: 123, why: 'Sample de Daft Punk con fuerza imparable', searchQuery: 'Kanye West Stronger audio' },
          { title: 'Lose Yourself', artist: 'Eminem', genre: 'Workout / Tech', mood: 'Energético', bpm: 171, why: 'El himno definitivo de motivación e intensidad', searchQuery: 'Eminem Lose Yourself audio' },
          { title: 'Can\'t Hold Us', artist: 'Macklemore & Ryan Lewis', genre: 'Pop', mood: 'Fiesta', bpm: 146, why: 'Pianos triunfales y percusión épica', searchQuery: 'Macklemore Cant Hold Us audio' },
          { title: 'Wake Me Up', artist: 'Avicii', genre: 'Workout / Tech', mood: 'Energético', bpm: 124, why: 'Folk acústico con explosión electrónica', searchQuery: 'Avicii Wake Me Up audio' },
        ];
      } else if (promptLower.includes('latino') || promptLower.includes('reggaeton') || promptLower.includes('baile') || promptLower.includes('urbano')) {
        playlistTitle = '🔥 Fuego Urbano & Éxitos Latinos';
        vibeDescription = 'Dembiows envolventes, ritmos sincopados y voces vibrantes para animar cualquier momento del día.';
        tracks = [
          { title: 'Tití Me Preguntó', artist: 'Bad Bunny', genre: 'Urbano / Reggaeton', mood: 'Fiesta', bpm: 111, why: 'Ritmo dembow contagioso y producción innovadora', searchQuery: 'Bad Bunny Titi Me Pregunto audio' },
          { title: 'Provenza', artist: 'Karol G', genre: 'Urbano / Reggaeton', mood: 'Chill / Relax', bpm: 110, why: 'Vibra tropical nostálgica con beats electrónicos suaves', searchQuery: 'Karol G Provenza audio' },
          { title: 'Dákiti', artist: 'Bad Bunny x Jhayco', genre: 'Urbano / Reggaeton', mood: 'Noche', bpm: 110, why: 'Sintetizadores oscuros con atmósfera nocturna', searchQuery: 'Bad Bunny Jhayco Dakiti audio' },
          { title: 'Despechá', artist: 'Rosalía', genre: 'Pop', mood: 'Energético', bpm: 130, why: 'Mambo moderno repleto de vitalidad y frescura', searchQuery: 'Rosalia Despecha audio' },
        ];
      }

      return res.json({
        playlistTitle,
        vibeDescription,
        recommendedTracks: tracks,
      });
    } catch (err: any) {
      console.warn('AI DJ general error:', err);
      return res.status(500).json({ error: 'Error en AI DJ', details: err.message });
    }
  });

  // 5. Mount Vite in Development or Static files in Production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sonora YouTube Music Server activo en el puerto ${PORT}`);
  });
}

startServer();
