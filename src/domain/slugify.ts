export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD') // rozdziela znaki diakrytyczne
    .replace(/[\u0300-\u036f]/g, '') // usuwa diakrytyki (np. ą -> a)
    .replace(/[^a-z0-9\s-]/g, '') // usuwa znaki specjalne
    .trim()
    .replace(/\s+/g, '-') // zamienia spacje na myślniki
    .replace(/-+/g, '-') // usuwa wielokrotne myślniki
}