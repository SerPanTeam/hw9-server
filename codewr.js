'use strict'

// combine-files.js
const fs = require('fs');
const path = require('path');
// import path from 'path';
// import { fileURLToPath } from 'url';

// Поскольку мы используем ES модули, нужно определить __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Название выходного файла
const outputFile = path.join(__dirname, 'combined-files.md');

// Массив дополнительных файлов
const additionalFiles = [
  'index.html',
  // Добавьте другие файлы по необходимости
];

// Функция для генерации дерева файлов
const generateFileTree = (dir, prefix = '') => {
  let tree = '';
  const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    // Сортируем директории первыми
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  items.forEach((item, index) => {
    if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') return; // Пропускаем node_modules и .git

    const isLast = index === items.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    tree += `${prefix}${pointer}${item.name}\n`;

    if (item.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      tree += generateFileTree(path.join(dir, item.name), newPrefix);
    }
  });

  return tree;
};

// Функция для добавления файла в выходной файл с заголовком и кодовым блоком
const addFile = (filePath) => {
  try {
    const relativePath = path.relative(__dirname, filePath);
    const fileName = path.basename(filePath);
    fs.appendFileSync(outputFile, `## ${relativePath}\n\n`);

    // Определяем язык для кодового блока
    const ext = path.extname(fileName).toLowerCase();
    let lang = '';
    if (['.ts', '.tsx'].includes(ext)) lang = 'typescript';
    else if (['.js', '.jsx'].includes(ext)) lang = 'javascript';
    else if (ext === '.css') lang = 'css';
    else if (ext === '.json') lang = 'json';
    else if (ext === '.html') lang = 'html'; // Поддержка .html
    else lang = ''; // Для других типов файлов

    if (lang) {
      fs.appendFileSync(outputFile, `\`\`\`${lang}\n`);
    } else {
      fs.appendFileSync(outputFile, '```\n');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    fs.appendFileSync(outputFile, `${content}\n\`\`\`\n\n`);
  } catch (error) {
    console.error(`Ошибка при добавлении файла ${filePath}:`, error);
    fs.appendFileSync(outputFile, `⚠️ Произошла ошибка при добавлении файла **${filePath}**.\n\n`);
  }
};

// Функция для рекурсивного сбора всех .ts, .tsx, .css файлов
const collectFiles = (dir, collectedFiles = []) => {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    if (item.name === 'codewr.js' || item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') return; // Пропускаем node_modules и .git
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      collectFiles(fullPath, collectedFiles);
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (['.ts', '.tsx','.js', '.jsx', '.css'].includes(ext)) {
        collectedFiles.push(fullPath);
      }
    }
  });
  return collectedFiles;
};

// Очистка или создание выходного файла
try {
  fs.writeFileSync(outputFile, '');
} catch (error) {
  console.error(`Не удалось создать или очистить файл ${outputFile}:`, error);
  process.exit(1);
}

console.log('🔍 Сканирование проекта...');

try {
  // 1. Добавление дерева файлов проекта
  const fileTree = generateFileTree(__dirname);
  fs.appendFileSync(outputFile, `# Структура проекта\n\n\`\`\`plaintext\n${fileTree}\n\`\`\`\n\n`);
} catch (error) {
  console.error('Ошибка при генерации дерева файлов:', error);
  fs.appendFileSync(outputFile, `⚠️ Не удалось сгенерировать структуру проекта.\n\n`);
}

try {
  // 2. Сбор всех .ts, .tsx, .css файлов
  const collectedFiles = collectFiles(__dirname);

  // Добавление содержимого собранных файлов
  fs.appendFileSync(outputFile, `# Файлы .ts, .tsx, .css\n\n`);
  collectedFiles.forEach(file => {
    addFile(file);
  });
} catch (error) {
  console.error('Ошибка при сборе файлов .ts, .tsx, .css:', error);
  fs.appendFileSync(outputFile, `⚠️ Произошла ошибка при сборе файлов .ts, .tsx, .css.\n\n`);
}

try {
  // 3. Добавление содержимого дополнительных файлов
  if (additionalFiles.length > 0) {
    fs.appendFileSync(outputFile, `# Дополнительные файлы\n\n`);
    additionalFiles.forEach((file) => {
      // Проверка, находится ли файл в src/ или в корне
      let fullPath = path.join(__dirname, 'src', file);
      if (!fs.existsSync(fullPath)) {
        fullPath = path.join(__dirname, file);
      }

      if (fs.existsSync(fullPath)) {
        console.log(`📄 Добавление файла: ${fullPath}`);
        addFile(fullPath);
      } else {
        console.warn(`⚠️ Файл **${file}** не найден и пропущен.`);
        fs.appendFileSync(outputFile, `⚠️ Файл **${file}** не найден и пропущен.\n\n`);
      }
    });
  }
} catch (error) {
  console.error('Ошибка при добавлении дополнительных файлов:', error);
  fs.appendFileSync(outputFile, `⚠️ Произошла ошибка при добавлении дополнительных файлов.\n\n`);
}

console.log(`✅ Все файлы были объединены в ${outputFile}.`);
