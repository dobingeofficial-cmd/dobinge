import { NextRequest } from "next/server";
import { ApiUtils } from "@/lib/utils/api-response";
import { VaultService } from "@/services/vault.service";

export async function GET(request: NextRequest) {
  try {
    const data = await VaultService.getUserInteractions("temp_user_id");
    return ApiUtils.success(data);
  } catch (error) {
    return ApiUtils.error("Failed to fetch vault interactions", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Parse body and call VaultService.addInteraction
    return ApiUtils.success({ added: true }, 201);
  } catch (error) {
    return ApiUtils.error("Failed to save interaction", 500);
  }
}