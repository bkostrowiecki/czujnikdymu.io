import type Client from "pocketbase";

export function getPbFileUrl(
  record: any,
  field: string | undefined | null,
  pb?: Client,
) {
  if (!record || !field) {
    return "";
  }

  if (pb) {
    const url = pb.files.getURL(record, field);
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
    return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
  const collection = record.collectionId || record.collectionName || "artists";
  return `${baseUrl.replace(/\/$/, "")}/api/files/${collection}/${record.id}/${field}`;
}
