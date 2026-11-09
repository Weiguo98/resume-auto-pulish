import { useCallback, useEffect, useState } from "react";
import type { Cv, Version } from "../shared/api.ts";
import { getCvs, getVersions } from "./api.ts";

export function useWorkspace() {
  const [cvs, setCvs] = useState<Cv[] | null>(null);
  const [cvId, setCvId] = useState<string | null>(null);
  const [versions, setVersions] = useState<{ cvId: string; list: Version[] } | null>(null);
  const [loadError, setLoadError] = useState("");

  const refreshCvs = useCallback(async () => {
    const list = await getCvs();
    setCvs(list);
    return list;
  }, []);

  useEffect(() => {
    refreshCvs()
      .then((list) => setCvId(list[0].id))
      .catch(() => setLoadError("Your CVs didn't load. Check that the server is running, then reload the page."));
  }, [refreshCvs]);

  useEffect(() => {
    if (!cvId) return;
    let current = true;
    getVersions(cvId)
      .then((list) => current && setVersions({ cvId, list }))
      .catch(() => current && setLoadError("This CV didn't load. Reload the page to try again."));
    return () => {
      current = false;
    };
  }, [cvId]);

  const cv = cvs?.find((c) => c.id === cvId) ?? null;
  const loaded = Boolean(cv && versions?.cvId === cv.id);

  const update = useCallback(
    (fn: (list: Version[]) => Version[]) => setVersions((v) => v && { ...v, list: fn(v.list) }),
    [],
  );

  return { cvs: cvs ?? [], cv, versions: loaded ? versions!.list : [], loaded, loadError, select: setCvId, refreshCvs, update };
}
