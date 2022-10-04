const path = require("path");
const webpack = require("webpack");

const environment = process.env.ENVIRONMENT;

console.log("environment:::::", environment);

let ENVIRONMENT_VARIABLES = {
  "process.env.ENVIRONMENT": "dev",
  "process.env.PORT": "3080",
  "process.env.MINIO_END_POINT": "localhost",
  "process.env.MINIO_ACCESS_KEY": "minio",
  "process.env.MINIO_SECRET_KEY": "minio123",
};
module.exports = {
  entry: "./index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "api.bundle.js",
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" },
    ],
  },
  target: "node",
  plugins: [new webpack.DefinePlugin(ENVIRONMENT_VARIABLES)],
};
