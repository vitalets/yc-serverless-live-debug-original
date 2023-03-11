/**
 * Generate package.json with excluding dependencies.
 * todo: do it in more smart way
 * 
 * Usage:
 * ts-node [target-dir-for-package.json] [...deps-to-clean]
 */
import fs from 'node:fs';
import path from 'node:path';
import pkg from '../package.json';

const targetDir = process.argv[2];
const excludeDeps = process.argv.slice(3);

const keys = Object.keys(pkg.dependencies) as unknown as (keyof typeof pkg.dependencies)[];
keys.forEach(key => {
  if (excludeDeps.includes(key)) {
    delete pkg.dependencies[key];
  }
});

const targetFile = path.join(targetDir, 'package.json');
const content = JSON.stringify(pkg, null, 2);
fs.writeFileSync(targetFile, content);
console.log(`Generated: ${targetFile}`);
