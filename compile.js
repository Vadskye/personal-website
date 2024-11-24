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
    link: `<div><a href="/tales/${paramCase(
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
          ? `<a href="/tales/${sagaUrl}/${episodeNumber - 1}">Previous</a>`
          : "<div></div>"
      }
      ${
        allEpisodeNumbers.includes(episodeNumber + 1)
          ? `<a href="/tales/${sagaUrl}/${episodeNumber + 1}">Next</a>`
          : "<div></div>"
      }
    </div>
  `;
}

function writeTalesHtml(outputDirectoryPath) {
  const episodesBySaga = {
    "creation mythos": [],
    "donut saga": [],
    "rite of maturity": [],
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
      const episodeOutputDirectoryPath = `${outputDirectoryPath}/tales/${paramCase(
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
        Whenever I run a major <a href="/rise/rise.html">Rise</a> campaign, I send out emails each week summarizing the events of the previous week.
        This helps everyone keep track of what's going on, it's fun to write, and it helps any players that missed a week catch up on what they missed.
        Each session also has "Stupid Awards", which commemorate memorable things that happened during the session in humorous and often pun-filled ways.
      </p>
      <h2>The Donut Saga</h2>
      <p>
        These stories tell the short tale of a ragtag group of adventurers who woke up in a basement and tried to make the world a slightly more donut-filled place.
        It's pretty short and silly, and a reasonable starting point.
        The rest of the campains after this one are in chronological order, so there's some <a href="https://tvtropes.org/pmwiki/pmwiki.php/Main/EarlyInstallmentWeirdness">early installment weirdness</a>.
      </p>
      ${episodesBySaga["donut saga"].map((e) => e.link).join("\n")}

      <h2>The Rite of Maturity</h2>
      <p>
        These stories tell the story of a group of involuntary do-gooders tasked with helping people as part of an ancient tradition called the Rite of Maturity.
        The party immediately decided to ignore all of the conveniently obvious quests and just walk south until something interesting happened.
      </p>
      <p>
        This was the first campaign to have weekly email summaries, so some of the early details are tragically lost to time, and the first several emails are very short and only somewhat helpful.
        We didn't even use Stupid Awards until episode 17!
      </p>
      ${episodesBySaga["rite of maturity"].map((e) => e.link).join("\n")}

      <h2>The Creation Mythos</h2>
      <p>
        These stories form a world-spanning epic about the struggles of gods, empires, and keeping a party of adventurers together admist frequently changing scheduling conflicts.
      </p>
      ${episodesBySaga["creation mythos"].map((e) => e.link).join("\n")}

      <h2>Ex-Cultists of Elysium</h2>
      <p>
        These stories tell the saga of a brave group of ex-cultists adrift in time who tried to save the world from demonic corruption.
        It's a direct sequel to The Creation Mythos, set in a world reshaped by the events of that campaign.
      </p>
      ${episodesBySaga.elysium.map((e) => e.link).join("\n")}

      <h2>The Tale of Praxis</h2>
      <p>
        These stories take place in a world reshaped by a magical apocalypse that left only one city standing.
        A thousand years later, civilization expands as magic becomes acceptable again after centuries of prohibition, but dangerous forces work to reshape this budding future toward uncertain ends...
      </p>
      ${episodesBySaga.praxis.map((e) => e.link).join("\n")}
    `,
  });
  fs.mkdirSync(`${outputDirectoryPath}/tales`, { recursive: true });
  fs.writeFileSync(`${outputDirectoryPath}/tales/index.html`, talesIndexHtml);
}

function generateGlobalIndexHtml() {
  return generateHtml({
    body: `
      <p>This site has a collection of things I've created. The main attraction is probably the <a href="/tales">stories of my old RPG campaigns</a>. Those were run using the <a href="https://github.com/vadskye/rise">rulebook I'm writing on Github</a>.</p>
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
    .replace("$body", body || "")
    .replace(/sparkleemojiplaceholder/g, "✨")
    .replace(/poisonemojiplaceholder/g, "🧪")
    .replace(/potionemojiplaceholder/g, "⚗️");
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
  writeSentinelsHtml(outputDirectoryPath);

  writeTalesHtml(outputDirectoryPath);

  generateRiseCharacterSheetHtml(outputDirectoryPath);

  generateRiseImages(outputDirectoryPath);

  generateRiseBookHtml(outputDirectoryPath);
}

function generateRiseCharacterSheetHtml(outputDirectoryPath) {
  // 'recursive' is basically just to avoid errors if it already exists
  fs.mkdirSync(`${outputDirectoryPath}/rise/character-sheet`, {
    recursive: true,
  });
  // TODO: make this a CLI argument so it's easier to use on different systems
  const sheetDirectoryPath = `${__dirname}/../Rise/character_sheet/paper_sheet`;
  const sheetFiles = fs.readdirSync(sheetDirectoryPath);
  for (const filename of sheetFiles) {
    if (filename.includes(".html") || filename.includes(".css")) {
      fs.copyFileSync(
        `${sheetDirectoryPath}/${filename}`,
        `${outputDirectoryPath}/rise/character-sheet/${filename}`
      );
    }
  }
}

function generateRiseImages(outputDirectoryPath) {
  childProcess.execSync(
    `cp -r ${__dirname}/../Rise/core_book/images ${outputDirectoryPath}/rise`
  );
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

function writeSentinelsHtml(outputDirectoryPath) {
  const sentinelsText = fs.readFileSync(
    `${__dirname}/sentinels/index.html`,
    "utf8"
  );
  const sentinelsHtml = generateHtml({
    head: `<title>Sentinels of the Multiverse</title>`,
    body: sentinelsText,
  });
  fs.mkdirSync(`${outputDirectoryPath}/sentinels`, { recursive: true });
  fs.writeFileSync(
    `${outputDirectoryPath}/sentinels/index.html`,
    sentinelsHtml
  );
  for (const collection of [
    "dark-souls",
    "dr-mcninja",
    "gatewatch",
    "ixalan",
    "krumit",
    "magic-misc",
    "oots",
    "other",
    "ravnica",
    "strixhaven",
  ]) {
    const collectionText = fs.readFileSync(
      `${__dirname}/sentinels/${collection}.html`,
      "utf8"
    );
    const titleMatch = collectionText.match(/<h1>(.*)<\/h1>/);
    if (!(titleMatch && titleMatch[1])) {
      throw new Error(
        `Error processing collection ${collection}: No h1 tag found`
      );
    }
    const collectionHtml = generateHtml({
      head: `<title>${titleMatch[1]}</title>`,
      body: collectionText,
    });
    fs.writeFileSync(
      `${outputDirectoryPath}/sentinels/${collection}.html`,
      collectionHtml
    );
  }
}

if (require.main === module) {
  main();
}
