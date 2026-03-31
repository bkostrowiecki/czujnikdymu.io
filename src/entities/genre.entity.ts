export type GenreId = string & {
    __brand: 'genre';
}

export interface GenreEntity {
    id: GenreId;
    name: string;
    created: Date;
    updated: Date;
}
