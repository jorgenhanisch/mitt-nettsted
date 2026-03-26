const { createClient } = require("@sanity/client");
const fs = require("fs");
const path = require("path");

const client = createClient({
  projectId: "gukxnj2e",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

function blocksToText(blocks) {
  if (!blocks) return "";
  return blocks
    .map((block) => {
      if (block._type !== "block") return "";
      return block.children.map((child) => child.text).join("");
    })
    .join("\n\n");
}

async function fetchPosts() {
  console.log("Henter innlegg...");
  
  const posts = await client.fetch(`*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))] | order(_createdAt desc)`);

  console.log(`Fant ${posts.length} innlegg`);

  const dir = "content";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  posts.forEach((post) => {
    const body = blocksToText(post.body);
    const date = post.publishedAt || post._createdAt;
    const content = `+++
title = "${post.title}"
date = "${date}"
draft = false
+++

${body}
`;
    fs.writeFileSync(path.join(dir, `${post.slug.current}.md`), content);
    console.log(`Skrev: ${post.slug.current}.md`);
  });
}

fetchPosts()
  .then(() => console.log("Ferdig!"))
  .catch((err) => console.error("Feil:", err))
  .finally(() => process.exit());