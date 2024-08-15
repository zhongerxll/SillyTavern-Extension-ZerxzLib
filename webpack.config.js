/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('node:path');
const fs = require('node:fs');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const sillyTavern = __dirname.substring(0, __dirname.lastIndexOf('public') + 6);
const manifest = require(path.join(__dirname, 'manifest.json'));
let { js:scriptFilepath } = manifest;
scriptFilepath = path.dirname(path.join(__dirname, scriptFilepath));
const relativePath = path.relative(scriptFilepath, sillyTavern );
module.exports = {
    experiments: {
        outputModule: true,
    },
    target: 'browserslist',
    entry: {
        'zerxz-lib': path.join(__dirname, 'src/index.ts'),
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist/'),
        chunkFormat: 'module',
        chunkFilename: '[name].[contenthash].chunk.js',
        library: {
            // do not specify a `name` here
            type: 'module',
        },
    },

    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.jsx'],
        plugins: [new TsconfigPathsPlugin({ extensions: ['.ts', '.js', '.tsx', '.jsx'], baseUrl: path.join(__dirname, 'src/'), configFile: path.join(__dirname, 'tsconfig.json') })],
        alias: {
            '@silly-tavern': path.join(__dirname, '../../../../..'),
        },
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: [
                    /node_modules/,
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: [

                            ['@babel/preset-env', {}],
                            ['@babel/preset-typescript', {}],
                            ['@babel/preset-react', { runtime: 'automatic' }],

                        ],
                    },
                },
            },

        ],
    },
    optimization: {

        minimize: true,
        minimizer: [new TerserPlugin({ extractComments: false })],
        splitChunks:{
            chunks: 'async',
        },
    },
    externals: [({ context, request }, callback) => {
        let scriptPath = path.join(context, request);
        const basenameDir = path.basename(__dirname);
        if (/^@silly-tavern/.test(request)) {
            const script = (relativePath + '\\' + request.replace('@silly-tavern/', '')).replace(/\\/g, '/');
            return callback(null, script);
        }
        if (!scriptPath.includes(basenameDir)) {
            let isJs = path.extname(scriptPath) === '.js';
            if (!isJs) {
                isJs = fs.existsSync(scriptPath + '.js');
                scriptPath = isJs ? scriptPath + '.js' : scriptPath;
            }
            if (isJs) {
                const script = (relativePath  + scriptPath.replace(sillyTavern,'')).replace(/\\/g, '/');
                return callback(null, script);
            }
        }
        console.log(`External: ${request} Context: ${context} Path: ${scriptPath}`);
        callback();
    }],
};
