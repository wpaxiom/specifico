const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const rtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const path = require( 'path' );

const srcDir = process.env.WP_SOURCE_PATH || 'src';

const entry = defaultConfig.entry();
entry.specification =  path.resolve( `${ srcDir }/specification.js` );
entry.groups =  path.resolve( `${ srcDir }/groups.js` );
entry.mapping =  path.resolve( `${ srcDir }/mapping.js` );
entry.settings =  path.resolve( `${ srcDir }/settings.js` );
entry.exportImport =  path.resolve( `${ srcDir }/exportImport.js` );
entry.productOptions =  path.resolve( `${ srcDir }/productOptions.js` );

const reactConfig = {
    ...defaultConfig,
    entry,
    plugins: [
        ...defaultConfig.plugins,
        new rtlCssPlugin( {filename: `[name]-rtl.css`} ),
    ],
    performance: {
        hints: 'warning',
        maxAssetSize: 512000,
        maxEntrypointSize: 512000,
    },
};

const assetsConfig = {
    ...defaultConfig,
    entry: {
        // admin.css is compiled separately by the `tailwind` npm script into
        // assets/dist/css/admin.css and enqueued in <head> (see Admin.php), so it
        // is intentionally NOT bundled here — bundling it made style-loader inject
        // the CSS at runtime in the footer, flashing unstyled content on load.
        'admin': ['./assets/src/js/admin.js'],
        'specifico': ['./assets/src/js/specifico.js']
    },
    output: {
        ...defaultConfig.output,
        filename: './js/[name].js',
        path: path.resolve( process.cwd(), 'assets/dist' ),
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [
                    "style-loader",
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        "postcss-preset-env",
                                        {
                                            // Options
                                        },
                                    ],
                                ],
                            },
                        },
                    },
                ],
            },
        ],
    },

    plugins: [
        new MiniCSSExtractPlugin(
            {
                filename: "./css/[name].css"
            }
        ),
    ],
}

module.exports = [reactConfig, assetsConfig];