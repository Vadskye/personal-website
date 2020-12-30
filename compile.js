const fs = require("fs");

function generateFolderPath(folderName) {
  return `${__dirname}/praxis/${folderName}`;
}

function generateIndexHtml(folderName, navBarHtml, titlesByFolderName) {
  const folderPath = generateFolderPath(folderName);
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
    <title>Praxis ${folderName}: ${titleMatch[1]}</title>
  </head>
  <body>
${navBarHtml}
${partialText}
${navBarHtml}
  </body>
</html>
`;
}

function generateNavBarHtml(currentFolderName, folderNames) {
  const previousFolderName = (Number(currentFolderName) - 1).toString();
  const nextFolderName = (Number(currentFolderName) + 1).toString();

  return `
    <div class="nav-bar">
      ${
        folderNames.includes(previousFolderName)
          ? `<a href="/praxis/${previousFolderName}">Previous</a>`
          : "<div></div>"
      }
      <a href="/praxis">Index</a>
      ${
        folderNames.includes(nextFolderName)
          ? `<a href="/praxis/${nextFolderName}">Next</a>`
          : "<div></div>"
      }
    </div>
  `;
}

function generateGlobalIndexHtml(titlesByFolderName) {
  const sortedFolderNames = Object.keys(titlesByFolderName).sort((a, b) => a - b);
  return `
<html>
  <head>
    <link rel="stylesheet" href="/style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Praxis</title>
  </head>
  <body>
    <p>
      Whenever I run a major RPG campaign, I send out emails each week summarizing the events of the previous week.
      This helps me and the players keep track of what's going on, it's fun to write, and it helps any players that missed a week to catch up on what they missed.
      The stories here tell the saga of the world of Praxis and a group of adventurers that reshaped its future.
    </p>
    ${sortedFolderNames.map((folderName) => {
      return `<div><a href="/praxis/${folderName}">Episode ${folderName}: ${titlesByFolderName[folderName]}</a></div>`;
    }).join('\n')}
  </body>
</html>
`;
}

function main() {
  const folderNames = fs.readdirSync(`${__dirname}/praxis`).filter((n) => n !== 'index.html');

  const titlesByFolderName = {};

  for (const folderName of folderNames) {
    const folderPath = generateFolderPath(folderName);
    fs.writeFileSync(
      `${folderPath}/index.html`,
      generateIndexHtml(folderName, generateNavBarHtml(folderName, folderNames), titlesByFolderName)
    );
  }

  fs.writeFileSync(`${__dirname}/praxis/index.html`, generateGlobalIndexHtml(titlesByFolderName));
}

if (require.main === module) {
  main();
}
