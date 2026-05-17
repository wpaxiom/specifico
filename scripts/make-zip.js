#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createWriteStream } = require('fs');
const archiver = require('archiver');

const PLUGIN_SLUG = 'specifico';
const TMP_DIR = 'release';
const DIST_DIR = path.join(TMP_DIR, PLUGIN_SLUG);

function getVersion() {
    const content = fs.readFileSync(`${PLUGIN_SLUG}.php`, 'utf8');
    const match = content.match(/Version:\s*([^\s]+)/i);
    return match ? match[1] : '0.0.0';
}

function clean() {
    console.log('🧹 Cleaning previous build...');
    if (fs.existsSync(TMP_DIR)) {
        fs.rmSync(TMP_DIR, { recursive: true, force: true });
    }
    const existingZip = fs.readdirSync('.').find(f => f.startsWith(`${PLUGIN_SLUG}-`) && f.endsWith('.zip'));
    if (existingZip) fs.unlinkSync(existingZip);
}

function generatePot() {
    console.log('🌍 Generating POT file...');
    fs.mkdirSync('languages', { recursive: true });

    try {
        execSync(
            `wp i18n make-pot . languages/${PLUGIN_SLUG}.pot --slug=${PLUGIN_SLUG} --domain=${PLUGIN_SLUG} --exclude=node_modules,release,build,scripts,vendor,.claude,.wordpress-org,src,assets/src`,
            { stdio: 'inherit' }
        );
        console.log('✅ POT file generated');
    } catch (err) {
        console.warn('⚠️  WP-CLI not available or i18n command failed. Skipping POT generation.');
    }
}

function composerProd() {
    console.log('📦 Running composer install --no-dev...');
    execSync('composer install --no-dev --optimize-autoloader', { stdio: 'inherit' });
}

function composerDev() {
    console.log('📦 Running composer install (restoring dev dependencies)...');
    execSync('composer install', { stdio: 'inherit' });
}

function getExclusions() {
    const content = fs.readFileSync('.distignore', 'utf8');
    return content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#') && !l.startsWith('!'));
}

function shouldExclude(filePath, exclusions) {
    const parts = filePath.split(path.sep);
    const fileName = path.basename(filePath);

    for (const pattern of exclusions) {
        if (parts.includes(pattern)) return true;
        if (fileName === pattern) return true;
        if (pattern.includes('*') && new RegExp('^' + pattern.replace(/\*/g, '.*') + '$').test(fileName)) return true;
    }
    return false;
}

function copyRecursive(src, dest, exclusions) {
    const stat = fs.statSync(src);
    const relativePath = path.relative(process.cwd(), src);

    if (shouldExclude(relativePath, exclusions) || shouldExclude(path.basename(src), exclusions)) {
        return;
    }

    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.chmodSync(dest, 0o755);
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry), exclusions);
        }
    } else {
        fs.copyFileSync(src, dest);
        fs.chmodSync(dest, 0o644);
    }
}

function copyFiles() {
    console.log('📂 Copying files with exclusions...');
    fs.mkdirSync(DIST_DIR, { recursive: true });
    const exclusions = getExclusions();
    const entries = fs.readdirSync('.');

    for (const entry of entries) {
        if (entry === TMP_DIR) continue;
        copyRecursive(entry, path.join(DIST_DIR, entry), exclusions);
    }
}

function makeZip() {
    return new Promise((resolve, reject) => {
        const version = getVersion();
        const zipName = `${PLUGIN_SLUG}-${version}.zip`;

        console.log('📦 Creating zip...');
        const output = createWriteStream(zipName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            fs.rmSync(TMP_DIR, { recursive: true, force: true });
            console.log(`✅ Built: ${zipName} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(DIST_DIR, PLUGIN_SLUG);
        archive.finalize();
    });
}

(async () => {
    try {
        clean();
        generatePot();
        composerProd();
        copyFiles();
        await makeZip();
        composerDev();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
