import { defineConfig } from 'vite';
import obfuscator from 'rollup-plugin-obfuscator';

// Obfuscation du build de production uniquement : le code source reste lisible et maintenable,
// mais ce qui est publié sur GitHub Pages cache la recette de Hitman (signatures, clés, contrôles).
const base = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  selfDefending: false,
  debugProtection: false,
  sourceMap: false,
  target: 'browser',
};
// Anti-triche et sauvegarde : clés, chaînes et noms cachés (chaînes chiffrées RC4 et découpées, clés d'objets transformées).
// Pas d'aplatissement du flux de contrôle ni de nombres en expressions : le Proxy et le hachage sont appelés des milliers
// de fois par clic, et ces options multipliaient le temps d'un clic par 3 (mesuré : 6,7 ms → 22 ms).
const SECURE = /src[\\/]engine[\\/](hitman|save|achievements)\.js$/;
const fort = obfuscator({
  include: [SECURE],
  options: { ...base, stringArrayThreshold: 1, stringArrayEncoding: ['rc4'], stringArrayWrappersCount: 2, reservedStrings: ['^(object|function|string|number|Error|call|length|charCodeAt|imul)$'], splitStrings: true, splitStringsChunkLength: 4, controlFlowFlattening: false, deadCodeInjection: false, numbersToExpressions: false, transformObjectKeys: true },
});
// Reste du jeu : minifié par Vite seulement. L'obfuscation légère coûtait ~15 ms par clic (rendu HTML plein de chaînes)
// pour un gain de sécurité faible : les secrets de Hitman ne sont pas dans ces fichiers. Conservée ici pour mémoire.
const leger = obfuscator({
  include: [/src[\\/].*\.js$/],
  exclude: [SECURE],
  options: { ...base, stringArrayThreshold: 0.5, controlFlowFlattening: false, deadCodeInjection: false },
});

// Chemins relatifs : le jeu marche aussi bien en local que sur https://destinolife.github.io/
export default defineConfig({
  base: './',
  plugins: [{ ...fort, apply: 'build' }],
});
