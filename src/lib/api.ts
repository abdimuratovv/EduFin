export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/** Server javobini o'qiydi. Tarmoq uzilsa NETWORK xatosi (muvaffaqiyat hech qachon taxmin qilinmaydi). */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      credentials: "same-origin",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK", "Aloqa uzildi. Internetni tekshirib, qayta urinib ko‘ring.", 0);
  }
  const json = (await res.json().catch(() => null)) as
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string } }
    | null;
  if (!json) throw new ApiError("BAD_RESPONSE", "Kutilmagan javob. Qayta urinib ko‘ring.", res.status);
  if (!json.ok) throw new ApiError(json.error.code, json.error.message, res.status);
  return json.data;
}

export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi. Qayta urinib ko‘ring.");
