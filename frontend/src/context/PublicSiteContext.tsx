import { createContext, useContext } from "react";
import type { PublicSitePayload } from "../types";

export const PublicSiteContext = createContext<PublicSitePayload | null>(null);

export function usePublicSite(): PublicSitePayload {
  const v = useContext(PublicSiteContext);
  if (!v) {
    throw new Error("usePublicSite 必须在 PublicShell 内使用");
  }
  return v;
}
