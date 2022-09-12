const fs = require("fs");
const path = require("path");

const jsonsInDir = fs
  .readdirSync("./src")
  .filter((file) => path.extname(file) === ".json");

var data = {};
jsonsInDir.forEach((file) => {
  const fileData = fs.readFileSync(path.join("./src", file));
  const json = JSON.parse(fileData.toString());
  const key = Object.keys(json)[0];

  data[key] = json[key];
});

var isobject = function (x) {
  return Object.prototype.toString.call(x) === "[object Object]";
};

var flattenToken = function (obj, prefix) {
  var keys = Object.keys(obj);

  return keys.reduce(function (result, key) {
    if (isobject(obj[key])) {
      const newPrefix = prefix ? prefix + "-" : "";

      if (key.match(/^\$([a-z]+)/gis)) {
        result[prefix] = {
          ...result[prefix],
          [key]: obj[key],
        };
      } else {
        result = { ...result, ...flattenToken(obj[key], newPrefix + key) };
      }
    } else {
      if (key.match(/^\$([a-z]+)/gis)) {
        result[prefix] = {
          ...result[prefix],
          [key]: obj[key],
        };
      }
    }
    return result;
  }, []);
};

var toCSSVariables = function (obj, prefix) {
  var keys = Object.keys(obj);

  return keys.reduce(function (result, key) {
    if (isobject(obj[key])) {
      if (!key.match(/^\$([a-z]+)/gis)) {
        // catches $appearance if we need to do something else to it
      }
      const newPrefix = prefix ? prefix + "-" : "";
      result = { ...result, ...toCSSVariables(obj[key], newPrefix + key) };
    } else {
      if (key.endsWith("$value")) {
        const varName = `--${prefix.replace("$", "")}`;
        result[varName] = obj[key];
      }
    }
    return result;
  }, []);
};

function createCSSVariableFile(data) {
  const dir = "./build";

  let string = "";
  Object.entries(toCSSVariables(data)).forEach(([key, val]) => {
    string = string.concat(`${key}: ${val};`);
  });

  const content = `:root { ${string} }`;

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error(err);
  } finally {
    fs.writeFileSync("./build/variables.css", content, (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    });
  }
}

createCSSVariableFile(data);
