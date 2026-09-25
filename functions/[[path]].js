export async function onRequest(context) {
  // Fetch the static asset from Cloudflare Pages
  const response = await context.env.ASSETS.fetch(context.request);
  
  // If the asset doesn't exist (e.g. it's a React Router path like /login),
  // fallback to serving the root index.html
  if (response.status === 404) {
    const url = new URL(context.request.url);
    url.pathname = '/';
    return context.env.ASSETS.fetch(new Request(url, context.request));
  }
  
  return response;
}
