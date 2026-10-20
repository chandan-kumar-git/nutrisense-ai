// NutriSense AI · IDP P020: exports the app's food knowledge base to JSON for the ML pipeline.
// Run from the project root:  node ml/scripts/export_knowledge_base.mjs
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const out = path.resolve('ml/data/knowledge_base')
const tmp = path.join(out, '.kb.mjs')
await build({
  stdin: { contents: "export { FOODS } from './src/data/foods.js'; export { MEALS, SCAN_SCENARIOS } from './src/data/meals.js'", resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', outfile: tmp, logLevel: 'error',
})
const { FOODS, MEALS, SCAN_SCENARIOS } = await import(pathToFileURL(tmp).href)
fs.rmSync(tmp)
fs.writeFileSync(path.join(out, 'foods.json'), JSON.stringify(FOODS, null, 1))
fs.writeFileSync(path.join(out, 'meals.json'), JSON.stringify(MEALS, null, 1))
fs.writeFileSync(path.join(out, 'scan_classes.json'), JSON.stringify(SCAN_SCENARIOS.map((s) => s.mealId), null, 1))
console.log(`exported ${FOODS.length} foods, ${MEALS.length} meals, ${SCAN_SCENARIOS.length} scan classes`)
