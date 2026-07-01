#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const projectRoot = path.resolve(__dirname, '..');
const sourceRoots = ['app', 'components', 'layouts', 'config', 'utils', 'services', 'store'];
const dictionaryPath = path.join(projectRoot, 'components', 'AppProviders.js');
const displayProps = new Set([
  'placeholder', 'title', 'alt', 'aria-label', 'label', 'message', 'description',
  'okText', 'cancelText', 'emptyText', 'tooltip', 'help', 'text', 'content',
  'subTitle', 'subtitle'
]);
const allowedExact = new Set([
  '-', 'ID', 'VAT', 'VND', 'USD', 'EUR', 'DN-', 'NAV', 'ALLOW', 'BLOCK',
  'CUSTOMS', 'EMP-001', 'CUS001', '2026-05', 'name@company.com',
  'Invoice0626/2144', '10366', '4,100,000 VND/40', 'kg /', 'cbm',
  'Dương Minh Logistics', 'Dương Minh Logistics - ERP',
  'Hệ thống quản lý nhân sự và vận hành Dương Minh Logistics'
]);

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return /\.[jt]sx?$/.test(entry.name) ? [fullPath] : [];
  });
}

function parse(source, file) {
  try {
    return parser.parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'optionalChaining']
    });
  } catch (error) {
    throw new Error(`${path.relative(projectRoot, file)}: ${error.message}`);
  }
}

function propertyName(node) {
  if (node?.type === 'Identifier') return node.name;
  if (node?.type === 'StringLiteral') return node.value;
  return null;
}

function staticText(node) {
  if (!node) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'JSXText') return node.value.replace(/\s+/g, ' ').trim();
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map((part) => part.value.cooked).join('${…}');
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const left = staticText(node.left);
    const right = staticText(node.right);
    return left || right ? `${left || '${…}'}${right || '${…}'}` : null;
  }
  return null;
}

function shouldTranslate(value) {
  const text = String(value || '').trim();
  if (!text || !/[A-Za-zÀ-ỹ]/u.test(text) || allowedExact.has(text)) return false;
  if (/^(https?:|mailto:|tel:|\/|\.\/|@\/|#[0-9a-f]{3,8}$)/i.test(text)) return false;
  if (/^[A-Z0-9_.:/#-]{1,20}$/.test(text)) return false;
  if (/^[\d.,/%+\-\s]+$/.test(text)) return false;
  return true;
}

function objectChild(object, name) {
  return object?.properties?.find(
    (property) => property.type === 'ObjectProperty' && propertyName(property.key) === name
  )?.value;
}

function flattenKeys(object, prefix = '', keys = new Set()) {
  if (object?.type !== 'ObjectExpression') return keys;
  for (const property of object.properties) {
    if (property.type !== 'ObjectProperty') continue;
    const name = propertyName(property.key);
    if (!name) continue;
    const key = prefix ? `${prefix}.${name}` : name;
    if (property.value.type === 'ObjectExpression') flattenKeys(property.value, key, keys);
    else keys.add(key);
  }
  return keys;
}

const dictionarySource = fs.readFileSync(dictionaryPath, 'utf8');
const dictionaryAst = parse(dictionarySource, dictionaryPath);
let dictionaryNode;
traverse(dictionaryAst, {
  VariableDeclarator(nodePath) {
    if (nodePath.node.id.type === 'Identifier' && nodePath.node.id.name === 'dictionary') {
      dictionaryNode = nodePath.node.init;
      nodePath.stop();
    }
  }
});

if (!dictionaryNode) throw new Error('Unable to locate the dictionary object.');

const enKeys = flattenKeys(objectChild(dictionaryNode, 'en'));
const viKeys = flattenKeys(objectChild(dictionaryNode, 'vi'));
const findings = [];
const usedKeys = new Map();
const files = sourceRoots
  .flatMap((root) => listFiles(path.join(projectRoot, root)))
  .filter((file) => file !== dictionaryPath);

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);
  const ast = parse(source, file);
  const relativeFile = path.relative(projectRoot, file).replace(/\\/g, '/');

  function add(node, kind, value) {
    if (!node?.loc || !shouldTranslate(value)) return;
    const line = node.loc.start.line;
    if (lines[line - 1]?.includes('i18n-audit-ignore')) return;
    findings.push({ file: relativeFile, line, kind, value, snippet: lines[line - 1].trim() });
  }

  function containingAttribute(nodePath) {
    const container = nodePath.findParent((candidate) => candidate.isJSXExpressionContainer());
    return container?.parentPath?.isJSXAttribute() ? container.parentPath.node.name?.name : null;
  }

  traverse(ast, {
    JSXText(nodePath) {
      add(nodePath.node, 'JSX text', staticText(nodePath.node));
    },
    JSXAttribute(nodePath) {
      const name = nodePath.node.name?.name;
      if (!displayProps.has(name)) return;
      const value = nodePath.node.value?.type === 'JSXExpressionContainer'
        ? nodePath.node.value.expression
        : nodePath.node.value;
      add(value || nodePath.node, `${name} attribute`, staticText(value));
    },
    ObjectProperty(nodePath) {
      const name = propertyName(nodePath.node.key);
      if (displayProps.has(name)) add(nodePath.node.value, `${name} property`, staticText(nodePath.node.value));
    },
    ConditionalExpression(nodePath) {
      if (!nodePath.findParent((candidate) => candidate.isJSXExpressionContainer())) return;
      const attribute = containingAttribute(nodePath);
      if (attribute && !displayProps.has(attribute)) return;
      add(nodePath.node.consequent, 'conditional UI text', staticText(nodePath.node.consequent));
      add(nodePath.node.alternate, 'conditional UI text', staticText(nodePath.node.alternate));
    },
    LogicalExpression(nodePath) {
      if (nodePath.node.operator !== '||') return;
      const left = nodePath.node.left;
      if (left.type === 'CallExpression' && left.callee.type === 'Identifier' && left.callee.name === 't') {
        add(nodePath.node.right, 'translation fallback', staticText(nodePath.node.right));
      }
    },
    CallExpression(nodePath) {
      const { callee, arguments: args } = nodePath.node;
      if (callee.type === 'Identifier' && callee.name === 't' && args[0]?.type === 'StringLiteral') {
        const key = args[0].value;
        if (!usedKeys.has(key)) usedKeys.set(key, []);
        usedKeys.get(key).push(`${relativeFile}:${args[0].loc.start.line}`);
      }
      if (callee.type !== 'MemberExpression') return;
      const owner = propertyName(callee.object) || propertyName(callee.object?.object);
      const method = propertyName(callee.property);
      if (['message', 'notification', 'Modal'].includes(owner)
        && ['success', 'error', 'warning', 'info', 'confirm'].includes(method)) {
        add(args[0], `${owner}.${method}`, staticText(args[0]));
      }
    }
  });
}

const enOnly = [...enKeys].filter((key) => !viKeys.has(key)).sort();
const viOnly = [...viKeys].filter((key) => !enKeys.has(key)).sort();
const missingUsed = [...usedKeys.entries()]
  .filter(([key]) => !enKeys.has(key) || !viKeys.has(key))
  .sort(([a], [b]) => a.localeCompare(b));

if (findings.length) {
  console.error(`\nHardcoded UI findings (${findings.length}):`);
  for (const item of findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
    console.error(`- ${item.file}:${item.line} [${item.kind}] ${JSON.stringify(item.value)}`);
    console.error(`  ${item.snippet}`);
  }
}
if (enOnly.length) console.error(`\nEnglish-only keys (${enOnly.length}):\n- ${enOnly.join('\n- ')}`);
if (viOnly.length) console.error(`\nVietnamese-only keys (${viOnly.length}):\n- ${viOnly.join('\n- ')}`);
if (missingUsed.length) {
  console.error(`\nUsed keys missing from a locale (${missingUsed.length}):`);
  for (const [key, locations] of missingUsed) {
    console.error(`- ${key} (en=${enKeys.has(key)}, vi=${viKeys.has(key)}) at ${locations.join(', ')}`);
  }
}

const issueCount = findings.length + enOnly.length + viOnly.length + missingUsed.length;
if (issueCount) {
  console.error(`\ni18n audit failed with ${issueCount} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(`i18n audit passed: ${files.length} source files, ${enKeys.size} synchronized keys, ${usedKeys.size} statically used keys.`);
}
