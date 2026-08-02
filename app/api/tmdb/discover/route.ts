import { NextRequest } from "next/server";
import { ApiUtils } from "@/lib/utils/api-response";
import { TmdbService } from "@/services/tmdb.service";

export async function GET(request: NextRequest) {
  try {
    const data = await TmdbService.getDiscoverFeed("default");
    return ApiUtils.success(data);
  } catch (error) {
    return ApiUtils.error("Failed to fetch discover feed", 500);
  }
}