module.exports = {
    entry: {
        bundle: "./src/index.ts",
    },
    output: {
        path: `${__dirname}/docs`,
        filename: "main.js",
    },
    mode: "development", // development or production
    resolve: {
        extensions: [".ts", ".js"],
    },
    devServer: {
        static: {
            directory: `${__dirname}/docs`,
        },
        open: true,
        hot: true,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
            }
        ],
    }
};
