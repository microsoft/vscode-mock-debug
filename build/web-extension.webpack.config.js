/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
'use strict';

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/
module.exports = /** @type WebpackConfig */ {
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	target: 'webworker', // extensions run in a webworker context
	entry: {
		extension: './src/web-extension.ts',	// source of the web extension main file
	},
	output: {
		filename: 'web-extension.js',
		libraryTarget: 'commonjs'
	},
	devtool: 'nosources-source-map', // create a source map that points to the original source file
	externals: {
		'vscode': 'commonjs vscode', // ignored because it doesn't exist
	},
	resolve: {
		mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
		extensions: ['.ts', '.js'], // support ts-files and js-files
		fallback: {
			events: require.resolve('events'),
			path: require.resolve('path-browserify'),
			url: require.resolve('url')
		}
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						// configure TypeScript loader:
						// * enable sources maps for end-to-end source maps
						loader: 'ts-loader',
						options: {
							compilerOptions: {
								'sourceMap': true,
								'declaration': false
							}
						}
					}
				]
			}
		]
	},
	performance: {
		hints: false
	}
};
