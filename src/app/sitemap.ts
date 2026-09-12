import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    if (siteConfig.driveAppsScriptUrl) {
      const url = new URL(siteConfig.driveAppsScriptUrl);
      url.searchParams.set("folderId", siteConfig.driveFolderId);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const rootData = await response.json();
        
        if (rootData && rootData.children) {
          // Add all top-level folders
          rootData.children
            .filter((child: any) => child.type === "folder")
            .forEach((folder: any) => {
              routes.push({
                url: `${baseUrl}/explore/${folder.id}`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.8,
              });
              
              // Optionally add second-level folders
              if (folder.children) {
                folder.children
                  .filter((sub: any) => sub.type === "folder")
                  .forEach((subFolder: any) => {
                    routes.push({
                      url: `${baseUrl}/explore/${subFolder.id}`,
                      lastModified: new Date(),
                      changeFrequency: "weekly",
                      priority: 0.7,
                    });
                  });
              }
            });
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch drive data for sitemap:", error);
  }

  return routes;
}
