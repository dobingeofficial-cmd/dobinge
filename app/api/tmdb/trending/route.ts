import { NextRequest } from "next/server";
import { ApiUtils } from "@/lib/utils/api-response";
import { TmdbService } from "@/services/tmdb.service";

export async function GET(request: NextRequest) {
  try {
    const data = await TmdbService.getTrending();
    return ApiUtils.success(data);
  } catch (error) {
    console.error("Trending API Fault:", error);
    return ApiUtils.error("Failed to fetch trending media from neural core", 500);
  }
}