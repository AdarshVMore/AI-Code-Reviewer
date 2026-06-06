import axios from "axios";

type GiphyResponse = {
  data: Array<{ images: { fixed_height: { url: string } } }>;
};

export async function findGIF(query: string): Promise<string | null> {
  const giphyApiKey = process.env.GIPHY_API_KEY;
  if (!giphyApiKey || !query.trim()) return null;

  try {
    const response = await axios.get<GiphyResponse>(
      "https://api.giphy.com/v1/gifs/search",
      {
        params: {
          api_key: giphyApiKey,
          q: query,
          limit: 1,
        },
      },
    );

    return response.data.data[0]?.images.fixed_height.url ?? null;
  } catch (error) {
    console.error("Failed to find GIF for review comment", error);
    return null;
  }
}
