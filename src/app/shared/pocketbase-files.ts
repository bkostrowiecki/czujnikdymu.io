import Client from "pocketbase";

export function getPbFileUrl(record: any, field: string, pb: Client) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL + pb.files.getURL(record, field);
}
