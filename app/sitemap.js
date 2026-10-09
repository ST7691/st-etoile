const SITE_URL = "https://st-etoile.vercel.app";

export default function sitemap() {
  const routes = [
    "",
    "/menu",
    "/about",
    "/gallery",
    "/contact",
    "/reservation",
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
