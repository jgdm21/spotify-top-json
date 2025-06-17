const fs = require('fs');
const fetch = require('node-fetch');

// --- CREDENCIALES TU APP ---
const CLIENT_ID = '9d86d2e08c284c5a9705becee24c556e';
const CLIENT_SECRET = '156b9e3ac7444f919a462cc27a7eceaf';

// --- IDS de las playlists ---
const PLAYLISTS = [
{ name: "Billboard Hot 100", id: "6UeSakyzhiEt4NB3UAd6NQ"},
  { name: "Billboard Hot 100",    id: "6UeSakyzhiEt4NB3UAd6NQ" },
  { name: "Pitchfork Selects", id: "7f9o34JAe8ZSRq4GX7f0Ol" },
  { name: "Rolling Stone's Greatest Hip-Hop Songs of All Time", id: "1oHOxzRga11XX4XEmuje3z" },
  { name: "TikTok Viral Hits 2025", id: "6mKEyAOZ82zQm4ysV3LvqQ" },
  { name: "TIK TOK 2025 🔥 VIRAL TIKTOK: Canciones Virales de TikTok", id: "3BOQwadZjKpHajawvEO9T8" }

];

// --- FUNCIONES ---

async function getAccessToken() {
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await resp.json();
  if (!data.access_token) {
    console.error('No se pudo obtener token:', data);
    process.exit(1);
  }
  return data.access_token;
}

async function getPlaylistTracks(playlistId, token) {
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  let tracks = [];
  while (url) {
    const resp = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await resp.json();
    if (!data.items) {
      console.error('Error descargando tracks:', data);
      break;
    }
    tracks = tracks.concat(data.items);
    url = data.next; // sigue paginando si hay más de 100 tracks
  }
  return tracks.map(item => {
    if (!item.track) return null;
    return {
      track: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      playlist: playlistId,
      playlistName: PLAYLISTS.find(p => p.id === playlistId)?.name || playlistId,
      url: item.track.external_urls.spotify
    };
  }).filter(Boolean);
}

(async () => {
  const token = await getAccessToken();
  let allTracks = [];
  for (const pl of PLAYLISTS) {
    console.log('Descargando:', pl.name);
    const tracks = await getPlaylistTracks(pl.id, token);
    allTracks = allTracks.concat(tracks);
  }
  // Guarda el JSON final
  fs.writeFileSync('spotify_top_tracks.json', JSON.stringify(allTracks, null, 2), 'utf-8');
  console.log('¡Listo! Canciones guardadas en spotify_top_tracks.json');
})();
