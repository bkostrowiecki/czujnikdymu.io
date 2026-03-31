import PocketBase from 'pocketbase'

export const createPb = () => new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
