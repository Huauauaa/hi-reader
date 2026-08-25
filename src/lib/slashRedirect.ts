/** Return a Location if `reqUrl` is the base path missing its trailing slash. */
export function slashRedirect(reqUrl: string, base: string): string | null {
  const slash = base.endsWith('/') ? base : `${base}/`
  const bare = slash.slice(0, -1)
  if (!bare) return null
  const q = reqUrl.indexOf('?')
  const path = q < 0 ? reqUrl : reqUrl.slice(0, q)
  if (path !== bare) return null
  return q < 0 ? slash : `${slash}${reqUrl.slice(q)}`
}
