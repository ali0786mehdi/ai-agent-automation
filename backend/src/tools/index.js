// backend/src/tools/index.js
const emailTool = require("./emailTool");
const fileTool = require("./fileTool");
const browserTool = require("./browserTool"); // 
const hackerNewsTool = require("./hackerNewsTool"); // New tool for fetching HackerNews top stories

module.exports = {
  emailTool,
  fileTool,
  browserTool,
  hackerNewsTool: require("./hackerNewsTool"),
};
