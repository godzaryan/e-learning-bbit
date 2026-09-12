import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { fetchDriveData } from "@/lib/drive";

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
    // Try to fetch dynamic folders to include in sitemap
    // This allows search engines to index individual subfolders
    const rootData = await fetchDriveData("all");
    
    if (rootData && rootData.children) {
      // Add all top-level folders
      rootData.children
        .filter((child) => child.type === "folder")
        .forEach((folder) => {
          routes.push({
            url: `${baseUrl}/explore/${folder.id}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
          });
          
          // Optionally add second-level folders
          if (folder.children) {
            folder.children
              .filter((sub) => sub.type === "folder")
              .forEach((subFolder) => {
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
  } catch (error) {
    console.error("Failed to fetch drive data for sitemap:", error);
  }

  return routes;
}
