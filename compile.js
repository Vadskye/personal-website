const fs = require("fs");
const { paramCase, snakeCase } = require("change-case");
const { titleCase } = require("title-case");

let pageTemplateHtml = "";

function generateIndexHtml(
  sagaName,
  folderName,
  navBarHtml,
  titlesByFolderName
) {
  const folderPath = `${__dirname}/${snakeCase(sagaName)}/${folderName}`;
  const partialText = fs.readFileSync(folderPath, "utf8");
  const titleMatch = partialText.match(/<h2>(.*)<\/h2>/);
  if (!(titleMatch && titleMatch[1])) {
    throw new Error(`Error processing ${folderPath}: No h2 tag found`);
  }
  titlesByFolderName[folderName] = titleMatch[1];
  return generateHtml({
    head: `<title>${titleCase(sagaName)} ${folderName}: ${
      titleMatch[1]
    }</title>`,
    body: `
      ${navBarHtml}
      ${partialText}
      ${navBarHtml}
    `,
  });
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
      <a href="/${sagaUrl}">${titleCase(sagaName)} Index</a>
      ${
        folderNames.includes(nextFolderName)
          ? `<a href="/${sagaUrl}/${nextFolderName}">Next</a>`
          : "<div></div>"
      }
    </div>
  `;
}

function generateSagaIndexHtml(sagaName, titlesByFolderName) {
  const sortedFolderNames = Object.keys(titlesByFolderName).sort(
    (a, b) => a - b
  );

  const sagaDescriptions = {
    "donut saga":
      "These stories tell the short tale of a ragtag group of adventurers who woke up in a basement and tried to make the world a slightly more donut-filled place.",
    praxis:
      "These stories tell the saga of the world of Praxis and a group of adventurers that reshaped its future.",
  };

  return generateHtml({
    head: `<title>${titleCase(sagaName)}</title>`,
    body: `
      <p>
        Whenever I run a major RPG campaign, I send out emails each week summarizing the events of the previous week.
        This helps the players and me keep track of what's going on, it's fun to write, and it helps any players that missed a week catch up on what they missed.
      </p>
      <p>
        ${sagaDescriptions[sagaName]}
      </p>
      ${sortedFolderNames
        .map((folderName) => {
          return `<div><a href="/${paramCase(
            sagaName
          )}/${folderName}">Episode ${folderName}: ${
            titlesByFolderName[folderName]
          }</a></div>`;
        })
        .join("\n")}
    `,
  });
}

function generateSagaHtml(sagaName, outputDirectoryPath) {
  const folderNames = fs
    .readdirSync(`${__dirname}/${snakeCase(sagaName)}`)
    .filter((n) => n !== "index.html");

  const titlesByFolderName = {};

  for (const folderName of folderNames) {
    const episodeOutputDirectoryPath = `${outputDirectoryPath}/${paramCase(
      sagaName
    )}/${folderName}`;
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
    generateSagaIndexHtml(sagaName, titlesByFolderName)
  );
}

function generateGlobalIndexHtml() {
  return generateHtml({
    body:
      "<div>Here you may find a rapidly expanding set of things I've created. Enjoy!</div>",
  });
}

function generateHtml({ body, head } = {}) {
  if (!pageTemplateHtml) {
    pageTemplateHtml = fs.readFileSync(
      `${__dirname}/page_template.html`,
      "utf8"
    );
  }
  return pageTemplateHtml
    .replace("$head", head || "")
    .replace("$body", body || "");
}

function main() {
  const outputDirectoryPath = "/var/www/html";
  // Copy over the basic style.css
  fs.copyFileSync(`${__dirname}/style.css`, `${outputDirectoryPath}/style.css`);
  // Create the root index.html file
  fs.writeFileSync(
    `${outputDirectoryPath}/index.html`,
    generateGlobalIndexHtml()
  );

  const sagaNames = ["praxis", "donut saga"];
  for (const sagaName of sagaNames) {
    generateSagaHtml(sagaName, outputDirectoryPath);
  }
}

if (require.main === module) {
  main();
}
