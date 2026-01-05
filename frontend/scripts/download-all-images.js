const fs = require('fs');
const path = require('path');
const https = require('https');

// Extract all unique image URLs from blog articles
const imageUrls = new Set([
  // Featured images
  'https://images.unsplash.com/photo-1515562141207-7a9a7f08af9b?w=1200&h=630&fit=crop', // language-exchange (failed, use alternative)
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=630&fit=crop', // icebreakers
  'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1200&h=630&fit=crop', // talk-to-strangers
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=630&fit=crop', // omegle-alternatives
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop', // stay-safe
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop', // voice-vs-text
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop', // practice-languages
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=630&fit=crop', // psychology
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop', // top-10-apps
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop', // changed-social
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=630&fit=crop', // privacy-guide
  'https://images.unsplash.com/photo-1557091498-ba6b2678e904?w=1200&h=630&fit=crop', // conversation-starters (failed, use alternative)
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&h=630&fit=crop', // why-people-use
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop', // handle-awkward
  'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=630&fit=crop', // cultural-exchange
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=630&fit=crop', // future-random-chat
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=630&fit=crop', // etiquette
  
  // Alternative URLs for failed images
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop', // language-exchange alternative
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop', // conversation-starters alternative
  
  // Article content images
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1604537466158-719b197b851b?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551185298-40ea1fe489fb?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515562141207-7a9a7f08af9b?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop',
]);

const outputDir = path.join(__dirname, '..', 'public', 'blog-images');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function getImageId(url) {
  const match = url.match(/photo-(\d+)/);
  return match ? match[1] : null;
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307 || response.statusCode === 308) {
        if (response.headers.location) {
          return downloadImage(response.headers.location, filepath)
            .then(resolve)
            .catch(reject);
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadAll() {
  console.log('Downloading all blog images...\n');
  
  const imageMap = new Map();
  let successCount = 0;
  let failCount = 0;
  
  for (const url of imageUrls) {
    const imageId = getImageId(url);
    if (!imageId) {
      console.log(`⚠ Skipping invalid URL: ${url}`);
      continue;
    }
    
    const filename = `unsplash-${imageId}.jpg`;
    const filepath = path.join(outputDir, filename);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`✓ Already exists: ${filename}`);
      imageMap.set(url, `/blog-images/${filename}`);
      continue;
    }
    
    try {
      console.log(`Downloading: ${filename}...`);
      await downloadImage(url, filepath);
      imageMap.set(url, `/blog-images/${filename}`);
      successCount++;
      console.log(`✓ Downloaded: ${filename}\n`);
    } catch (error) {
      console.error(`✗ Error downloading ${filename}:`, error.message);
      failCount++;
    }
  }
  
  console.log(`\nDownload complete!`);
  console.log(`Success: ${successCount}, Failed: ${failCount}`);
  console.log(`\nImage mapping saved to image-map.json`);
  
  // Save mapping for reference
  const mapping = Object.fromEntries(imageMap);
  fs.writeFileSync(
    path.join(__dirname, '..', 'image-map.json'),
    JSON.stringify(mapping, null, 2)
  );
}

downloadAll().catch(console.error);