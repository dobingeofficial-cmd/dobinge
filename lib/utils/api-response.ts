import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api.types";

export class ApiUtils {
  static success<T>(data: T, status = 200) {
    const payload: ApiResponse<T> = { success: true, data, error: null };
    return NextResponse.json(payload, { status });
  }

  static error(message: string, status = 400) {
    const payload: ApiResponse<null> = { success: false, data: null, error: message };
    return NextResponse.json(payload, { status });
  }
}