const fs = require("fs");
const { paramCase, snakeCase } = require("change-case");
const { titleCase } = require("title-case");

function generateIndexHtml(
  sagaName,
  folderName,
  navBarHtml,
  titlesByFolderName
) {
  const folderPath = `${__dirname}/${snakeCase(sagaName)}/${folderName}`;
  const partialText = fs.readFileSync(`${folderPath}/partial.html`, "utf8");
  const titleMatch = partialText.match(/<h2>(.*)<\/h2>/);
  if (!(titleMatch && titleMatch[1])) {
    throw new Error(`Error processing ${folderPath}: No h2 tag found`);
  }
  titlesByFolderName[folderName] = titleMatch[1];
  return `
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${titleCase(sagaName)} ${folderName}: ${titleMatch[1]}</title>
  </head>
  <body>
${navBarHtml}
${partialText}
${navBarHtml}
  </body>
</html>
`;
}

function generateNavBarHtml(sagaName, currentFolderName, folderNames) {
  const previousFolderName = (Number(currentFolderName) - 1).toString();
  const nextFolderName = (Number(currentFolderName) + 1).toString();
  const sagaUrl = paramCase(sagaName);

  return `
    <div class="nav-bar">
      ${
        folderNames.includes(previousFolderName)
          ? `<a href="/${sagaUrl}/${previousFolderName}">Previous</a>`
          : "<div></div>"
      }
      <a href="/${sagaUrl}">Index</a>
      ${
        folderNames.includes(nextFolderName)
          ? `<a href="/${sagaUrl}/${nextFolderName}">Next</a>`
          : "<div></div>"
      }
    </div>
  `;
}

function generateGlobalIndexHtml(sagaName, titlesByFolderName) {
  const sortedFolderNames = Object.keys(titlesByFolderName).sort(
    (a, b) => a - b
  );

  const sagaDescriptions = {
    "donut saga":
      "These stories tell the short tale of a ragtag group of adventurers who woke up in a basement and tried to make the world a slightly more donut-filled place.",
    praxis:
      "These stories tell the saga of the world of Praxis and a group of adventurers that reshaped its future.",
  };

  return `
<html>
  <head>
    <link rel="stylesheet" href="/style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${titleCase(sagaName)}</title>
  </head>
  <body>
    <p>
      Whenever I run a major RPG campaign, I send out emails each week summarizing the events of the previous week.
      This helps the players and me keep track of what's going on, it's fun to write, and it helps any players that missed a week catch up on what they missed.
    </p>
    <p>
      ${sagaDescriptions[sagaName]}
    </p>
    ${sortedFolderNames
      .map((folderName) => {
        return `<div><a href="/${paramCase(sagaName)}/${folderName}">Episode ${folderName}: ${titlesByFolderName[folderName]}</a></div>`;
      })
      .join("\n")}
  </body>
</html>
`;
}

function generateSagaHtml(sagaName, outputDirectoryPath) {
  const folderNames = fs
    .readdirSync(`${__dirname}/${snakeCase(sagaName)}`)
    .filter((n) => n !== "index.html");

  const titlesByFolderName = {};

  for (const folderName of folderNames) {
    const episodeOutputDirectoryPath = `${outputDirectoryPath}/${paramCase(sagaName)}/${folderName}`;
    fs.mkdirSync(episodeOutputDirectoryPath, { recursive: true });
    fs.writeFileSync(
      `${episodeOutputDirectoryPath}/index.html`,
      generateIndexHtml(
        sagaName,
        folderName,
        generateNavBarHtml(sagaName, folderName, folderNames),
        titlesByFolderName
      )
    );
  }

  fs.writeFileSync(
    `${outputDirectoryPath}/${paramCase(sagaName)}/index.html`,
    generateGlobalIndexHtml(sagaName, titlesByFolderName)
  );
}

function main() {
  const outputDirectoryPath =  '/var/www/html';
  // Copy over the root index.html file
  fs.copyFileSync(`${__dirname}/index.html`, `${outputDirectoryPath}/index.html`);

  const sagaNames = ["praxis", "donut saga"];
  for (const sagaName of sagaNames) {
    generateSagaHtml(sagaName, outputDirectoryPath);
  }
}

if (require.main === module) {
  main();
}
