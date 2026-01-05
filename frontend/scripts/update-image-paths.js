const fs = require('fs');
const path = require('path');

// Image URL to local path mapping
const imageMap = {
  'https://images.unsplash.com/photo-1515562141207-7a9a7f08af9b?w=1200&h=630&fit=crop': '/blog-images/unsplash-1434030216411.jpg',
  'https://images.unsplash.com/photo-1515562141207-7a9a7f08af9b?w=1200&h=600&fit=crop': '/blog-images/unsplash-1434030216411.jpg',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=630&fit=crop': '/blog-images/unsplash-1529156069898.jpg',
  'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1200&h=630&fit=crop': '/blog-images/unsplash-1577563908411.jpg',
  'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1200&h=600&fit=crop': '/blog-images/unsplash-1577563908411.jpg',
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=630&fit=crop': '/blog-images/unsplash-1551650975.jpg',
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop': '/blog-images/unsplash-1551650975.jpg',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop': '/blog-images/unsplash-1563013544.jpg',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop': '/blog-images/unsplash-1563013544.jpg',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop': '/blog-images/unsplash-1516321318423.jpg',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop': '/blog-images/unsplash-1434030216411.jpg',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop': '/blog-images/unsplash-1434030216411.jpg',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=630&fit=crop': '/blog-images/unsplash-1511512578047.jpg',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop': '/blog-images/unsplash-1551288049.jpg',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop': '/blog-images/unsplash-1551288049.jpg',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop': '/blog-images/unsplash-1451187580459.jpg',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop': '/blog-images/unsplash-1451187580459.jpg',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=630&fit=crop': '/blog-images/unsplash-1589829545856.jpg',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=600&fit=crop': '/blog-images/unsplash-1589829545856.jpg',
  'https://images.unsplash.com/photo-1557091498-ba6b2678e904?w=1200&h=630&fit=crop': '/blog-images/unsplash-1522202176988.jpg',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&h=630&fit=crop': '/blog-images/unsplash-1531746020798.jpg',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop': '/blog-images/unsplash-1507003211169.jpg',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop': '/blog-images/unsplash-1507003211169.jpg',
  'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=630&fit=crop': '/blog-images/unsplash-1556740738.jpg',
  'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=600&fit=crop': '/blog-images/unsplash-1556740738.jpg',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=630&fit=crop': '/blog-images/unsplash-1485827404703.jpg',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop': '/blog-images/unsplash-1485827404703.jpg',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=630&fit=crop': '/blog-images/unsplash-1556761175.jpg',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop': '/blog-images/unsplash-1522202176988.jpg',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop': '/blog-images/unsplash-1522202176988.jpg',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=600&fit=crop': '/blog-images/unsplash-1522202176988.jpg',
  'https://images.unsplash.com/photo-1604537466158-719b197b851b?w=1200&h=600&fit=crop': '/blog-images/unsplash-1522202176988.jpg',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop': '/blog-images/unsplash-1481627834876.jpg',
  'https://images.unsplash.com/photo-1551185298-40ea1fe489fb?w=1200&h=600&fit=crop': '/blog-images/unsplash-1522202176988.jpg',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=630&fit=crop': '/blog-images/unsplash-1521737604893.jpg',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=600&fit=crop': '/blog-images/unsplash-1521737604893.jpg',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop': '/blog-images/unsplash-1460925895917.jpg',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop': '/blog-images/unsplash-1558494949.jpg',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop': '/blog-images/unsplash-1503676260728.jpg',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop': '/blog-images/unsplash-1552664730.jpg',
};

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findPageFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const blogDir = path.join(__dirname, '..', 'src', 'app', 'blog');
const files = findPageFiles(blogDir);

let totalReplacements = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let fileReplacements = 0;
  
  // Replace each URL
  for (const [url, localPath] of Object.entries(imageMap)) {
    const regex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, localPath);
      fileReplacements += matches.length;
    }
  }
  
  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${path.relative(blogDir, filePath)}: ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  }
});

console.log(`\nTotal replacements: ${totalReplacements}`);