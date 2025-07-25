const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3011;
const app = express();

const sites = require("./data/sites");

// Ensure screenshots folder exists
const outputDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1200, height: 1600 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ], // Optimize for stability
  });

  for (const site of sites) {
    let page;
    try {
      const filename = `${site.name}.jpg`;
      const filePath = path.join(outputDir, filename);

      if (fs.existsSync(filePath)) {
        console.log(`! Screenshot already exists for ${site.url}: ${filePath}`);
        continue;
      }

      console.log(`📸 Capturing: ${site.url}`);
      page = await browser.newPage();

      // Set a realistic user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
      );

      // Navigate with a longer timeout and lenient wait condition
      await page.goto(site.url, {
        waitUntil: "domcontentloaded", // Use 'domcontentloaded' for faster loading
        timeout: 120000, // Increase timeout to 2 minutes
      });

      // Wait for additional time to ensure dynamic content loads
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await page.screenshot({
        path: filePath,
        fullPage: false,
        type: "jpeg",
        quality: 80,
      });

      console.log(`✅ Saved: ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed to capture ${site.url}:`, err.message);
      // Optionally, add retry logic here
    } finally {
      // Close the page to free resources
      if (page) await page.close();
      // Add a small delay between captures to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  await browser.close();
  console.log("✅ All captures completed.");
})();

app.listen(PORT, () => {
  console.log(`listening to port: ${PORT}`);
});
