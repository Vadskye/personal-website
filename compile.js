const fs = require("fs");
const { JSDOM } = require("jsdom");
const { paramCase, snakeCase } = require("change-case");
const { titleCase } = require("title-case");
const childProcess = require("child_process");

let pageTemplateHtml = "";

function generateIndexHtml(
  sagaName,
  folderName,
  navBarHtml,
  titlesByFolderName
) {
  const folderPath = `${__dirname}/${snakeCase(sagaName)}/${folderName}`;
  const partialText = fs.readFileSync(`${folderPath}.html`, "utf8");
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
    elysium:
      "These stories tell the saga of a brave group of ex-cultists adrift in time who tried to save the world from demonic corruption.",
    praxis:
      "These stories tell the saga of the apocalypse-ravaged world of Praxis and a group of adventurers that reshaped its future.",
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
          )}/${folderName}">Episode ${folderName.replace(/[^0-9]/g, "")}: ${
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
    .filter((n) => n !== "index.html")
    .map((n) => n.replace(/[^0-9]/g, ""));

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
    body: `
      <p>This site has a collection of things I've created. The main attraction is probably the stories of my old RPG campaigns, which are linked along the top. Those were run using the <a href="https://github.com/vadskye/rise">rulebook I'm writing on Github</a>.</p>
      <p>
        Also, I made some fun custom cards for a board game called <a href="https://sentinelsdigital.com/learntoplay">Sentinels of the Multiverse</a>! You can find them <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=2111698527">on this Steam Workshop mod</a>.
      </p>
    `,
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
  // Compile the basic style.css
  childProcess.execSync(`lessc ${__dirname}/style.less > ${outputDirectoryPath}/style.css`);
  // Create the root index.html file
  fs.writeFileSync(
    `${outputDirectoryPath}/index.html`,
    generateGlobalIndexHtml()
  );

  const sagaNames = ["praxis", "donut saga", "elysium"];
  for (const sagaName of sagaNames) {
    generateSagaHtml(sagaName, outputDirectoryPath);
  }

  generateRiseBookHtml(outputDirectoryPath)
}

function generateRiseBookHtml(outputDirectoryPath) {
  // 'recursive' is basically just to avoid errors if it already exists
  fs.mkdirSync(`${outputDirectoryPath}/rise`, { recursive: true });
  // Generate the Rise-specific style.css
  childProcess.execSync(`lessc ${__dirname}/rise.less > ${outputDirectoryPath}/rise/rise.css`);
  // TODO: make this a CLI argument so it's easier to use on different systems
  const riseHtmlDirectoryPath = `${__dirname}/../Rise/html_book`;
  const htmlFiles = fs
    .readdirSync(riseHtmlDirectoryPath)
    .filter((f) => f.includes(".html"));
  for (const filename of htmlFiles) {
    const outputHtml = restructureGeneratedRiseHtml(
      `${riseHtmlDirectoryPath}/${filename}`
    );
    fs.writeFileSync(`${outputDirectoryPath}/rise/${filename}`, outputHtml);
  }
}

function restructureGeneratedRiseHtml(filename) {
  const generatedHtml = fs.readFileSync(filename, 'utf8');
  const parsedHtml = new JSDOM(generatedHtml);
  const document = parsedHtml.window.document;
  const style = document.createElement("link");
  style.type = 'text/css';
  style.href = '../style.css';
  style.rel = 'stylesheet';
  document.head.appendChild(style);
  return generateHtml({
    body: document.body.innerHTML,
    head: document.head.innerHTML,
  });
}

if (require.main === module) {
  main();
}
