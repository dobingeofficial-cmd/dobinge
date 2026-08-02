import { NextRequest } from "next/server";
import { ApiUtils } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    // TODO: Call ProfileService in Milestone 2
    return ApiUtils.success({ genres: [], platforms: [] });
  } catch (error) {
    return ApiUtils.error("Failed to fetch preferences", 500);
  }
}