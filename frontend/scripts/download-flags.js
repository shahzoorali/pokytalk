const https = require('https');
const fs = require('fs');
const path = require('path');

// List of all country codes (from countries.ts)
const countries = [
  'AF', 'AL', 'DZ', 'AD', 'AO', 'AR', 'AM', 'AU', 'AT', 'AZ',
  'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BT', 'BO',
  'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA',
  'CV', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CR', 'CI',
  'HR', 'CU', 'CY', 'CZ', 'CD', 'DK', 'DJ', 'DM', 'DO', 'EC',
  'EG', 'SV', 'GQ', 'ER', 'EE', 'ET', 'FJ', 'FI', 'FR', 'GA',
  'GM', 'GE', 'DE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GY',
  'HT', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE',
  'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR',
  'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT',
  'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MR',
  'MU', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM',
  'NA', 'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'NO', 'OM',
  'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT',
  'QA', 'RO', 'RU', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST',
  'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO',
  'ZA', 'SS', 'ES', 'LK', 'SD', 'SR', 'SZ', 'SE', 'CH', 'SY',
  'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR',
  'TM', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU',
  'VA', 'VE', 'VN', 'YE', 'ZM', 'ZW'
];

const flagsDir = path.join(__dirname, '../public/flags');

// Create flags directory if it doesn't exist
if (!fs.existsSync(flagsDir)) {
  fs.mkdirSync(flagsDir, { recursive: true });
}

// Function to download a flag from GitHub
function downloadFlag(countryCode) {
  return new Promise((resolve) => {
    // Use lipis/flag-icons repository - most reliable source
    const url = `https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/${countryCode.toLowerCase()}.svg`;
    const filePath = path.join(flagsDir, `${countryCode.toLowerCase()}.svg`);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${countryCode} already exists`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded ${countryCode}`);
          resolve();
        });
      } else {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.log(`✗ Failed to download ${countryCode} (${response.statusCode})`);
        resolve(); // Continue even if one fails
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.log(`✗ Error downloading ${countryCode}: ${err.message}`);
      resolve(); // Continue even if one fails
    });
  });
}

// Download all flags
async function downloadAllFlags() {
  console.log('Downloading country flags from GitHub...');
  const countries = COUNTRIES || [];
  
  for (let i = 0; i < countries.length; i++) {
    await downloadFlag(countries[i].code);
    // Small delay to avoid rate limiting
    if (i < countries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  console.log(`\nDone! Downloaded flags for ${countries.length} countries.`);
}

downloadAllFlags().catch(console.error);
