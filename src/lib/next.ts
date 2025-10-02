export type RouteParams<T extends Record<string, string>> = {
  params: Promise<T>
}

export async function resolveRouteParams<T extends Record<string, string>>(params: Promise<T>): Promise<T> {
  return params
}
