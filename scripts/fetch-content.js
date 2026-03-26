const { createClient } = require("@sanity/client");
const fs = require("fs");
const path = require("path");

const client = createClient({
projectId: "gukxnj2e",
dataset: "production",
apiVersion: "2024-01-01",
useCdn: false,
perspective: "published",
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

// Vi henter kun publiserte poster
const posts = await client.fetch(`*[_type == "post" && defined(slug.current)] | order(_createdAt desc)`);

console.log(`Fant ${posts.length} innlegg i Sanity`);

const dir = "content";

// VIKTIG: Slett alle gamle .md filer i content-mappen først
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith(".md")) {
      fs.unlinkSync(path.join(dir, file));
      console.log(`Slettet gammel fil: ${file}`);
    }
  }
} else {
  fs.mkdirSync(dir, { recursive: true });
}

posts.forEach((post) => {
  const body = blocksToText(post.body);
  const date = post.publishedAt || post._createdAt;
  
  // Vi legger til 'slug' i frontmatter så Hugo har kontroll
  const content = `+++
title = "${post.title}"
date = "${date}"
slug = "${post.slug.current}"
draft = false
+++

${body}
`;
  fs.writeFileSync(path.join(dir, `${post.slug.current}.md`), content);
  console.log(`Opprettet fersk fil: ${post.slug.current}.md`);
});
}