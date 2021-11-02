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
	target: 'node',	 // vscode extensions run in a Node.js-context
	entry: './src/extension.ts', // the entry point of this extension
	output: {	// the bundle is stored in the 'dist' folder (check package.json)
        filename: 'extension.js',
        libraryTarget: "commonjs2"
	},
	devtool: 'source-map',
	externals: {
		vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed
	},
	resolve: { // support reading TypeScript and JavaScript files
		extensions: ['.ts', '.js']
	},
	module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader',
                options: {
                    compilerOptions: {
						'sourceMap': true,
						'declaration': false
                    }
                }
            }]
        }]
    }
};
