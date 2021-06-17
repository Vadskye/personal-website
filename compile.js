const fs = require("fs");
const { JSDOM } = require("jsdom");
const { paramCase, snakeCase } = require("change-case");
const { titleCase } = require("title-case");
const childProcess = require("child_process");

let pageTemplateHtml = "";

function parseEpisodeInfo(saga, episodeNumber) {
  const episodeFilename = `${__dirname}/${snakeCase(
    saga
  )}/${episodeNumber}.html`;
  const episodeText = fs.readFileSync(episodeFilename, "utf8");
  const titleMatch = episodeText.match(/<h2>(.*)<\/h2>/);
  if (!(titleMatch && titleMatch[1])) {
    throw new Error(
      `Error processing episode ${episodeNumber}: No h2 tag found`
    );
  }
  return {
    link: `<div><a href="/${paramCase(
      saga
    )}/${episodeNumber}">Episode ${episodeNumber}: ${titleMatch[1]}</a></div>`,
    number: episodeNumber,
    text: episodeText,
    title: titleMatch[1],
  };
}

function generateEpisodeHtml(saga, episode, allEpisodes) {
  const navBarHtml = generateEpisodeNavBar(
    saga,
    episode.number,
    allEpisodes.map((e) => e.number)
  );
  return generateHtml({
    head: `<title>${titleCase(saga)} ${episode.number}: ${
      episode.title
    }</title>`,
    body: `
      ${navBarHtml}
      ${episode.text}
      ${navBarHtml}
    `,
  });
}

function generateEpisodeNavBar(sagaName, episodeNumber, allEpisodeNumbers) {
  const sagaUrl = paramCase(sagaName);

  return `
    <div class="nav-bar">
      ${
        allEpisodeNumbers.includes(episodeNumber - 1)
          ? `<a href="/${sagaUrl}/${episodeNumber - 1}">Previous</a>`
          : "<div></div>"
      }
      <a href="/tales">Index</a>
      ${
        allEpisodeNumbers.includes(episodeNumber + 1)
          ? `<a href="/${sagaUrl}/${episodeNumber + 1}">Next</a>`
          : "<div></div>"
      }
    </div>
  `;
}

function writeTalesHtml(outputDirectoryPath) {
  const episodesBySaga = {
    "donut saga": [],
    elysium: [],
    praxis: [],
  };

  // Read the files for each episode so we can understand all the context we need
  for (const saga of Object.keys(episodesBySaga)) {
    const episodeNumbers = fs
      .readdirSync(`${__dirname}/${snakeCase(saga)}`)
      .filter((n) => n !== "index.html")
      .map((n) => Number(n.replace(/[^0-9]/g, "")));
    episodeNumbers.sort((a, b) => a - b);
    episodesBySaga[saga] = episodeNumbers.map((n) => parseEpisodeInfo(saga, n));
  }

  // Write the individual files for each episode
  for (const saga of Object.keys(episodesBySaga)) {
    for (const episode of episodesBySaga[saga]) {
      const episodeHtml = generateEpisodeHtml(
        saga,
        episode,
        episodesBySaga[saga]
      );
      // We create one folder for each episode, and fill that folder with a single
      // index.html file.
      const episodeOutputDirectoryPath = `${outputDirectoryPath}/${paramCase(
        saga
      )}/${episode.number}`;
      fs.mkdirSync(episodeOutputDirectoryPath, { recursive: true });
      fs.writeFileSync(`${episodeOutputDirectoryPath}/index.html`, episodeHtml);
    }
  }

  // Write the overall tales index file
  const talesIndexHtml = generateHtml({
    head: `<title>Tales of Games Past</title>`,
    body: `
      <h1>Tales of Games Past</h1>
      <p>
        Whenever I run a major RPG campaign, I send out emails each week summarizing the events of the previous week.
        This helps the players and me keep track of what's going on, it's fun to write, and it helps any players that missed a week catch up on what they missed.
      </p>
      <h2>The Tale of Praxis</h2>
      <p>
        These stories tell the saga of the apocalypse-ravaged world of Praxis and a group of adventurers that reshaped its future.
      </p>
      ${episodesBySaga.praxis.map((e) => e.link).join("\n")}
      <h2>Ex-Cultists of Elysium</h2>
      <p>
        These stories tell the saga of a brave group of ex-cultists adrift in time who tried to save the world from demonic corruption.
      </p>
      ${episodesBySaga.elysium.map((e) => e.link).join("\n")}
      <h2>The Donut Saga</h2>
      <p>
        These stories tell the short tale of a ragtag group of adventurers who woke up in a basement and tried to make the world a slightly more donut-filled place.
      </p>
      ${episodesBySaga['donut saga'].map((e) => e.link).join("\n")}
    `,
  });
  fs.mkdirSync(`${outputDirectoryPath}/tales`, { recursive: true });
  fs.writeFileSync(`${outputDirectoryPath}/tales/index.html`, talesIndexHtml);
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
  childProcess.execSync(
    `lessc ${__dirname}/style.less > ${outputDirectoryPath}/style.css`
  );
  // Create the root index.html file
  fs.writeFileSync(
    `${outputDirectoryPath}/index.html`,
    generateGlobalIndexHtml()
  );

  writeTalesHtml(outputDirectoryPath);

  generateRiseBookHtml(outputDirectoryPath);
}

function generateRiseBookHtml(outputDirectoryPath) {
  // 'recursive' is basically just to avoid errors if it already exists
  fs.mkdirSync(`${outputDirectoryPath}/rise`, { recursive: true });
  // Generate the Rise-specific style.css
  childProcess.execSync(
    `lessc ${__dirname}/rise.less > ${outputDirectoryPath}/rise/rise.css`
  );
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
  const generatedHtml = fs.readFileSync(filename, "utf8");
  const parsedHtml = new JSDOM(generatedHtml);
  const document = parsedHtml.window.document;
  const style = document.createElement("link");
  style.type = "text/css";
  style.href = "../style.css";
  style.rel = "stylesheet";
  document.head.appendChild(style);
  return generateHtml({
    body: document.body.innerHTML,
    head: document.head.innerHTML,
  });
}

if (require.main === module) {
  main();
}
