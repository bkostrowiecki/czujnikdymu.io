import PocketBase from 'pocketbase'

export const createPbInstance = () => new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
