const path = require("path");
const webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');

const mydoc = {
    target: "web",
    mode: "production",
    entry: [
        "./mydoc/index.js",
    ],
    output: {
        path: path.resolve(__dirname, "dist/mydoc/"),
        filename: "mydoc.min.js",
        publicPath: '/docsite/mydoc',
    },
    module: {
        rules: [
            {test: /\.css$/, use: ['style-loader', 'css-loader']}
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'mydoc/index.html',
            filename: 'index.html',
            minify: false,
            head: true,
        })
    ]
};

const mydocPluginContentIndex = {
    target: "web",
    mode: "production",
    entry: [
        "./mydoc/plugins/content_index/index.js",
    ],
    output: {
        path: path.resolve(__dirname, "dist/mydoc/plugins"),
        filename: "content_index.min.js"
    },
    module: {
        rules: [
            {test: /\.css$/, use: ['style-loader', 'css-loader']}
        ]
    }
};

module.exports = [mydoc, mydocPluginContentIndex];