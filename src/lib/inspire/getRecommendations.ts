import { buildQuery } from "./buildQuery";


export async function getRecommendations(pref: any) {
  const query = buildQuery(pref);

  console.log("YOUTUBE QUERY:", query);
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      query
    )}&maxResults=9&key=${import.meta.env.VITE_YT_KEY}`
  );

  const data = await res.json();

if (!data.items) {
  console.error(data);
  return [];
}

return data.items.map((item: any) => ({
  id: item.id.videoId,
  title: item.snippet.title,
  thumbnail: item.snippet.thumbnails.medium.url,
  videoUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
}
));
}