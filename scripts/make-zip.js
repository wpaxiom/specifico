#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const { execSync } = require( 'child_process' );
const { createWriteStream } = require( 'fs' );
const archiver = require( 'archiver' );

const PLUGIN_SLUG = 'specifico';
const TMP_DIR = 'release';
const DIST_DIR = path.join( TMP_DIR, PLUGIN_SLUG );

function getVersion() {
	const content = fs.readFileSync( `${ PLUGIN_SLUG }.php`, 'utf8' );
	const match = content.match( /Version:\s*([^\s]+)/i );
	return match ? match[ 1 ] : '0.0.0';
}

function clean() {
	console.log( '🧹 Cleaning previous build...' );
	if ( fs.existsSync( TMP_DIR ) ) {
		fs.rmSync( TMP_DIR, { recursive: true, force: true } );
	}
	const existingZip = fs
		.readdirSync( '.' )
		.find(
			( f ) => f.startsWith( `${ PLUGIN_SLUG }-` ) && f.endsWith( '.zip' )
		);
	if ( existingZip ) fs.unlinkSync( existingZip );
}

function generatePot() {
	console.log( '🌍 Generating POT file...' );
	fs.mkdirSync( 'languages', { recursive: true } );

	if ( ! WP_CLI ) {
		console.warn( '⚠️  WP-CLI not found. Skipping POT generation.' );
		console.warn(
			'   Set WP_CLI_BIN env var or install wp-cli to enable.'
		);
		return;
	}

	try {
		execSync(
			`${ WP_CLI } i18n make-pot . languages/${ PLUGIN_SLUG }.pot --slug=${ PLUGIN_SLUG } --domain=${ PLUGIN_SLUG } --exclude=node_modules,release,build,scripts,vendor,.claude,.wordpress-org,src,assets/src`,
			{ stdio: 'inherit' }
		);
		console.log( '✅ POT file generated' );
	} catch ( err ) {
		console.warn( '⚠️  wp i18n make-pot failed. Skipping POT generation.' );
	}
}

// --- Toolchain resolution ---------------------------------------------------
// composer / wp-cli are not on PATH in this environment — they ship inside the
// Local by Flywheel installation. Resolve them (and a working PHP to run the
// .phars) from Local's bundled locations, with env-var overrides and a few
// common fallbacks.

function findLocalByFlywheelPhp() {
	const phpRoot = path.join(
		process.env.APPDATA || '',
		'Local',
		'lightning-services'
	);
	if ( ! fs.existsSync( phpRoot ) ) return null;

	const phpDirs = fs
		.readdirSync( phpRoot )
		.filter( ( n ) => n.startsWith( 'php-' ) )
		.sort()
		.reverse();
	for ( const dir of phpDirs ) {
		const phpBin = path.join( phpRoot, dir, 'bin', 'win64' );
		const php = path.join( phpBin, 'php.exe' );
		const extDir = path.join( phpBin, 'ext' );
		if ( ! fs.existsSync( php ) ) continue;

		// Local-by-Flywheel's bundled PHP, plus composer/wp-cli .phars,
		// sometimes ship their own ini fragments that pre-load the same
		// extensions we're about to request — that triggers
		// "Module X is already loaded" warnings on stderr. Two-part fix:
		//   1. Probe `php -m` and only `-d extension=` the ones missing.
		//   2. Set `display_startup_errors=0` as a safety net for any
		//      remaining duplicate loads inside composer/wp-cli themselves.
		const needed = [ 'openssl', 'curl', 'mbstring', 'fileinfo', 'zip' ];
		let loaded = new Set();
		try {
			loaded = new Set(
				execSync( `"${ php }" -m`, {
					stdio: [ 'ignore', 'pipe', 'ignore' ],
				} )
					.toString()
					.split( /\r?\n/ )
					.map( ( l ) => l.trim().toLowerCase() )
					.filter( Boolean )
			);
		} catch ( _ ) {
			/* fall through: assume nothing loaded */
		}
		const missing = needed.filter( ( e ) => ! loaded.has( e ) );

		const phpFlags = [
			'-d display_startup_errors=0',
			`-d extension_dir="${ extDir }"`,
			...missing.map( ( e ) => `-d extension=${ e }` ),
		].join( ' ' );
		return `"${ php }" ${ phpFlags }`;
	}
	return null;
}

function findLocalByFlywheelComposer() {
	const programFiles =
		process.env[ 'ProgramFiles(x86)' ] || 'C:\\Program Files (x86)';
	const phar = path.join(
		programFiles,
		'Local',
		'resources',
		'extraResources',
		'bin',
		'composer',
		'composer.phar'
	);
	if ( ! fs.existsSync( phar ) ) return null;
	const phpCmd = findLocalByFlywheelPhp();
	if ( ! phpCmd ) return null;
	return `${ phpCmd } "${ phar }"`;
}

function findLocalByFlywheelWpCli() {
	const programFiles =
		process.env[ 'ProgramFiles(x86)' ] || 'C:\\Program Files (x86)';
	const phar = path.join(
		programFiles,
		'Local',
		'resources',
		'extraResources',
		'bin',
		'wp-cli',
		'wp-cli.phar'
	);
	if ( ! fs.existsSync( phar ) ) return null;
	const phpCmd = findLocalByFlywheelPhp();
	if ( ! phpCmd ) return null;
	return `${ phpCmd } "${ phar }"`;
}

function resolveComposer() {
	if ( process.env.COMPOSER_BIN ) return process.env.COMPOSER_BIN;

	const local = findLocalByFlywheelComposer();
	if ( local ) {
		try {
			execSync( `${ local } --version`, { stdio: 'pipe' } );
			return local;
		} catch ( _ ) {
			/* fall through */
		}
	}

	const candidates = [
		'composer',
		'composer.bat',
		'composer.phar',
		path.join( process.env.APPDATA || '', 'Composer', 'composer.phar' ),
		path.join( process.env.APPDATA || '', 'Composer', 'composer.bat' ),
		'C:\\ProgramData\\ComposerSetup\\bin\\composer.bat',
		'C:\\ProgramData\\ComposerSetup\\bin\\composer.phar',
	];

	for ( const c of candidates ) {
		try {
			execSync(
				`${ c.endsWith( '.phar' ) ? 'php ' : '' }"${ c }" --version`,
				{ stdio: 'pipe' }
			);
			return c.endsWith( '.phar' ) ? `php "${ c }"` : `"${ c }"`;
		} catch ( _ ) {
			/* try next */
		}
	}
	throw new Error(
		'composer not found on PATH or in standard locations.\n' +
			'Set COMPOSER_BIN env var to the path of your composer binary, e.g.:\n' +
			'  set COMPOSER_BIN=C:\\path\\to\\composer.phar   (cmd)\n' +
			'  $env:COMPOSER_BIN="C:\\path\\to\\composer.phar" (powershell)\n' +
			'  export COMPOSER_BIN=/c/path/to/composer.phar   (bash)\n'
	);
}

function resolveWpCli() {
	if ( process.env.WP_CLI_BIN ) return process.env.WP_CLI_BIN;

	const local = findLocalByFlywheelWpCli();
	if ( local ) {
		try {
			execSync( `${ local } --version`, { stdio: 'pipe' } );
			return local;
		} catch ( _ ) {
			/* fall through */
		}
	}

	for ( const c of [ 'wp', 'wp.bat', 'wp-cli.phar' ] ) {
		try {
			execSync(
				`${ c.endsWith( '.phar' ) ? 'php ' : '' }"${ c }" --version`,
				{ stdio: 'pipe' }
			);
			return c.endsWith( '.phar' ) ? `php "${ c }"` : `"${ c }"`;
		} catch ( _ ) {
			/* try next */
		}
	}
	return null;
}

const COMPOSER = resolveComposer();
const WP_CLI = resolveWpCli();

function composerProd() {
	console.log(
		`📦 Running composer install --no-dev (using ${ COMPOSER })...`
	);
	execSync( `${ COMPOSER } install --no-dev --optimize-autoloader`, {
		stdio: 'inherit',
	} );
}

function composerDev() {
	console.log( '📦 Running composer install (restoring dev dependencies)...' );
	execSync( `${ COMPOSER } install`, { stdio: 'inherit' } );
}

function getExclusions() {
	const content = fs.readFileSync( '.distignore', 'utf8' );
	return content
		.split( '\n' )
		.map( ( l ) => l.trim() )
		.filter( ( l ) => l && ! l.startsWith( '#' ) && ! l.startsWith( '!' ) );
}

function shouldExclude( filePath, exclusions ) {
	const parts = filePath.split( path.sep );
	const fileName = path.basename( filePath );
	const normalizedPath = filePath.replace( /\\/g, '/' );

	for ( const pattern of exclusions ) {
		const normalizedPattern = pattern
			.replace( /\\/g, '/' )
			.replace( /^\//, '' );
		if ( parts.includes( pattern ) ) return true;
		if ( fileName === pattern ) return true;
		if ( normalizedPath === normalizedPattern ) return true;
		if (
			pattern.includes( '*' ) &&
			new RegExp( '^' + pattern.replace( /\*/g, '.*' ) + '$' ).test(
				fileName
			)
		)
			return true;
	}
	return false;
}

function copyRecursive( src, dest, exclusions ) {
	const stat = fs.statSync( src );
	const relativePath = path.relative( process.cwd(), src );

	if (
		shouldExclude( relativePath, exclusions ) ||
		shouldExclude( path.basename( src ), exclusions )
	) {
		return;
	}

	if ( stat.isDirectory() ) {
		fs.mkdirSync( dest, { recursive: true } );
		fs.chmodSync( dest, 0o755 );
		const entries = fs.readdirSync( src );
		for ( const entry of entries ) {
			copyRecursive(
				path.join( src, entry ),
				path.join( dest, entry ),
				exclusions
			);
		}
	} else {
		fs.copyFileSync( src, dest );
		fs.chmodSync( dest, 0o644 );
	}
}

function copyFiles() {
	console.log( '📂 Copying files with exclusions...' );
	fs.mkdirSync( DIST_DIR, { recursive: true } );
	const exclusions = getExclusions();
	const entries = fs.readdirSync( '.' );

	for ( const entry of entries ) {
		if ( entry === TMP_DIR ) continue;
		copyRecursive( entry, path.join( DIST_DIR, entry ), exclusions );
	}
}

function makeZip() {
	return new Promise( ( resolve, reject ) => {
		const version = getVersion();
		const zipName = `${ PLUGIN_SLUG }-${ version }.zip`;

		console.log( '📦 Creating zip...' );
		const output = createWriteStream( zipName );
		const archive = archiver( 'zip', { zlib: { level: 9 } } );

		output.on( 'close', () => {
			fs.rmSync( TMP_DIR, { recursive: true, force: true } );
			console.log(
				`✅ Built: ${ zipName } (${ (
					archive.pointer() / 1024
				).toFixed( 1 ) } KB)`
			);
			resolve();
		} );

		archive.on( 'error', reject );
		archive.pipe( output );
		archive.directory( DIST_DIR, PLUGIN_SLUG );
		archive.finalize();
	} );
}

( async () => {
	try {
		clean();
		generatePot();
		composerProd();
		copyFiles();
		await makeZip();
		composerDev();
	} catch ( err ) {
		console.error( '❌ Error:', err.message );
		process.exit( 1 );
	}
} )();
