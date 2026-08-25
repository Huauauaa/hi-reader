/** ponytail: fixed char pages; upgrade to measure DOM if needed */
export function paginateTxt(
  text: string,
  opts: { charsPerPage: number },
): string[] {
  const { charsPerPage } = opts
  if (text.length === 0) return ['']
  const pages: string[] = []
  for (let i = 0; i < text.length; i += charsPerPage) {
    pages.push(text.slice(i, i + charsPerPage))
  }
  return pages
}
