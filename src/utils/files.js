const fs = require('fs');
const path = require('path');

/**
 * Creates the upload fixtures for TC-HF06 inside the test's own output folder,
 * so nothing binary is committed and every run starts clean.
 * The "exe" is just a text stub with an .exe name; nothing executable is created.
 */
function createUploadFiles(testInfo) {
  const dir = testInfo.outputPath('uploads');
  fs.mkdirSync(path.join(dir, 'second'), { recursive: true });

  const write = (rel, content) => {
    const p = path.join(dir, rel);
    fs.writeFileSync(p, content);
    return p;
  };

  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const pdf = (sizeBytes) => {
    const head = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const tail = Buffer.from('\n%%EOF\n');
    const pad = Buffer.alloc(Math.max(0, sizeBytes - head.length - tail.length), 0x20);
    return Buffer.concat([head, pad, tail]);
  };

  return {
    exe: write('virus.exe', 'MZ - harmless test stub, not an executable'),
    txt: write('notes.txt', 'plain text notes'),
    imageA: write('image.jpg', Buffer.concat([jpegHeader, Buffer.from('first image')])),
    imageB: write(path.join('second', 'image.jpg'), Buffer.concat([jpegHeader, Buffer.from('second, different image')])),
    smallPdf: write('doc.pdf', pdf(2048)),
    pdf4_9MB: write('large-4.9MB.pdf', pdf(Math.round(4.9 * 1024 * 1024))),
  };
}

module.exports = { createUploadFiles };
