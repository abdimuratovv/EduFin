"use client";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

export interface SessionInfo {
  mode: "parent" | "child";
  child: { name: string; avatar: string; age: number };
}

export type SessionState =
  | { status: "loading" }
  | { status: "none" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & SessionInfo);

export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const refresh = useCallback(async () => {
    try {
      const s = await api<SessionInfo>("/api/session");
      setState({ status: "ready", ...s });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setState({ status: "none" });
      else setState({ status: "error", message: e instanceof ApiError ? e.message : "Xatolik" });
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sahifa ochilganda boshlang'ich ma'lumotni yuklash
    void refresh();
  }, [refresh]);
  return { state, refresh };
}
