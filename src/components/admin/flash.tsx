type FlashParams = Record<string, string | string[] | undefined>;

function firstValue(params: FlashParams | undefined, key: string) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

/// Friendly confirmation / denial banners rendered from redirect query flags
/// (?saved=1, ?restored=1, ?error=…, ?denied=1). Server component — editors
/// simply render <SavedBanner params={await searchParams} />.
export function SavedBanner({ params }: { params?: FlashParams }) {
  const restored = firstValue(params, "restored");
  const saved = firstValue(params, "saved");
  const synced = firstValue(params, "synced");
  const error = firstValue(params, "error");
  const denied = firstValue(params, "denied");
  const notice = firstValue(params, "notice");
  if (notice) {
    return <p className="cms-ok" role="status">{notice}</p>;
  }
  if (restored) {
    return <p className="cms-ok" role="status">Version restored — the content now matches that snapshot. Changed your mind? Pick a newer version in the history list below.</p>;
  }
  if (saved) {
    return <p className="cms-ok" role="status">Changes saved.</p>;
  }
  if (synced) {
    return <p className="cms-ok" role="status">Enquiry synced to Salesforce.</p>;
  }
  if (error) {
    return <p className="cms-error" role="alert">{error}</p>;
  }
  if (denied) {
    return <p className="cms-error" role="alert">That area is reserved for administrators. Ask an administrator if you need access.</p>;
  }
  return null;
}
