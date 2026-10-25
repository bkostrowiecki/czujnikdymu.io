export type GenreId = string & {
  __brand: "genre";
};

export interface GenreEntity {
  id: GenreId;
  slug: string;
  name: string;
  searchTerms?: string;
  created: Date;
  updated: Date;
}
