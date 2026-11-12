// scripts/check-custom.mjs
//
// Custom component protocol (AGENTS.md §3). Adapted from the Foundry pack's
// check-custom.mjs for Lynk's layout.
//
// Foundry decides "custom" by whether a file uses any library component. Lynk
// decides it by folder: everything in src/components/yarowa/ is our own
// component, composition or not, so every one of them must carry
//
//   /**
//    * @custom   Why no shadcn component or composition covers this.
//    * @approved <name>, <YYYY-MM-DD>
//    */
//
// and be imported by a Storybook story whose title starts with "Custom/".
// Stories live next to the component (yarowa/<name>.stories.tsx) or anywhere
// else under src/.
//
//   node scripts/check-custom.mjs           every component (CI, npm run check:custom)
//   node scripts/check-custom.mjs --staged  only staged components (pre-commit)

import ts from "typescript";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

const COMPONENTS = /^src\/components\/yarowa\/.+\.tsx$/u;
const EXEMPT = /\.(?:stories|test)\.tsx$/u;
const CUSTOM_GROUP = "Custom/";

const cwd = process.cwd();
const portable = (file) => relative(cwd, file).split(sep).join("/");
const parse = (file, text) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (/\.tsx?$/u.test(entry.name)) out.push(path);
  }
  return out;
}

function resolveLocal(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = resolve(cwd, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  return (
    ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]
      .map((ext) => base + ext)
      .find((f) => existsSync(f) && statSync(f).isFile()) ?? null
  );
}

/** The @custom / @approved block; null when absent, { error } when malformed. */
export function readMarker(text) {
  const block = text.match(/\/\*\*(?:(?!\*\/)[\s\S])*?@custom\b[\s\S]*?\*\//u)?.[0];
  if (!block) return /@custom\b/u.test(text) ? { error: "@custom must sit in a /** … */ block" } : null;
  const lines = block.split("\n").map((l) => l.replace(/^\s*\/?\*+\/?\s?/u, "").trim());
  const start = lines.findIndex((l) => l.startsWith("@custom"));
  const end = lines.findIndex((l) => l.startsWith("@approved"));
  const reason = lines
    .slice(start, end > start ? end : undefined)
    .join(" ")
    .replace(/^@custom\s*/u, "")
    .trim();
  const approved = lines[end]?.match(/^@approved\s+(.+?),?\s+(\d{4}-\d{2}-\d{2})$/u);
  if (reason.length < 10) return { error: "@custom needs the reason no shadcn component or composition covers this" };
  if (!approved || Number.isNaN(Date.parse(approved[2])))
    return { error: "@approved needs a name and a date: @approved <name>, <YYYY-MM-DD>" };
  return { reason, approvedBy: approved[1], date: approved[2] };
}

function hasJsx(file, text) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) found = true;
    else ts.forEachChild(node, visit);
  };
  visit(parse(file, text));
  return found;
}

function customStories() {
  return walk(resolve(cwd, "src"))
    .filter((f) => f.endsWith(".stories.tsx"))
    .map((file) => {
      const sf = parse(file, readFileSync(file, "utf8"));
      let title = null;
      const visit = (node) => {
        if (
          ts.isPropertyAssignment(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === "title" &&
          ts.isStringLiteralLike(node.initializer)
        )
          title ??= node.initializer.text;
        ts.forEachChild(node, visit);
      };
      visit(sf);
      const imports = sf.statements
        .filter(ts.isImportDeclaration)
        .map((st) => resolveLocal(file, st.moduleSpecifier.text))
        .filter(Boolean);
      return { path: portable(file), title, imports };
    });
}

function stagedFiles() {
  return execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

export function check({ staged = false } = {}) {
  const only = staged ? new Set(stagedFiles()) : null;
  const stories = customStories();
  const errors = [];
  const approved = [];
  let checked = 0;
  for (const file of walk(resolve(cwd, "src/components/yarowa"))) {
    const path = portable(file);
    if (!COMPONENTS.test(path) || EXEMPT.test(path) || (only && !only.has(path))) continue;
    const text = readFileSync(file, "utf8");
    if (!hasJsx(file, text)) continue;
    checked++;
    const problems = [];
    const marker = readMarker(text);
    if (!marker) problems.push("no @custom / @approved header");
    else if (marker.error) problems.push(marker.error);
    const own = stories.filter((s) => s.imports.includes(file));
    if (!own.length) problems.push(`no story — add one titled "${CUSTOM_GROUP}<Name>" that imports it`);
    else if (!own.some((s) => s.title?.startsWith(CUSTOM_GROUP)))
      problems.push(
        `story is not in the Custom group: ${own.map((s) => `${s.path} ("${s.title}")`).join(", ")} — retitle it "${CUSTOM_GROUP}…"`
      );
    if (problems.length) errors.push(`${path}\n      ${problems.join("\n      ")}`);
    else approved.push(`${path} — approved by ${marker.approvedBy}, ${marker.date}`);
  }
  return { checked, approved, errors };
}

const staged = process.argv.includes("--staged");
const { checked, approved, errors } = check({ staged });
if (staged && !checked) process.exit(0);
console.log(`Custom components${staged ? " (staged)" : ""}: ${approved.length} of ${checked} complete.`);
for (const line of approved) console.log(`  ✓ ${line}`);
if (errors.length) {
  console.error(
    `\n✖ ${errors.length} custom component(s) missing the header or a Custom/ story (AGENTS.md §3).\n` +
      "  Ask Yuliya for approval; never write @approved yourself.\n\n  " +
      errors.join("\n  ")
  );
  process.exitCode = 1;
} else console.log("Passed custom component check.");
