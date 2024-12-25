const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const rtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const path = require( 'path' );

const entry = defaultConfig.entry();
entry.specification =  path.resolve( `${ process.env.WP_SRC_DIRECTORY }/specification.js` );
entry.groups =  path.resolve( `${ process.env.WP_SRC_DIRECTORY }/groups.js` );
entry.mapping =  path.resolve( `${ process.env.WP_SRC_DIRECTORY }/mapping.js` );
entry.settings =  path.resolve( `${ process.env.WP_SRC_DIRECTORY }/settings.js` );
entry.productOptions =  path.resolve( `${ process.env.WP_SRC_DIRECTORY }/productOptions.js` );

const reactConfig = {
    ...defaultConfig,
    entry,
    plugins: [
        ...defaultConfig.plugins,
        new rtlCssPlugin( {filename: `[name]-rtl.css`} ),
    ],
};

const assetsConfig = {
    ...defaultConfig,
    entry: {
        'admin': ['./assets/src/js/admin.js', './assets/src/css/admin.css'],
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