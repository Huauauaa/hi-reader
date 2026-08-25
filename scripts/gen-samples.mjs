import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import JSZip from 'jszip'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public/books')
mkdirSync(outDir, { recursive: true })

async function writePdf() {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  page.drawText('Sample PDF', { x: 200, y: 400, size: 28, font, color: rgb(0.1, 0.1, 0.1) })
  writeFileSync(join(outDir, 'sample.pdf'), await pdf.save())
}

async function writeEpub() {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.folder('META-INF').file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )
  const oebps = zip.folder('OEBPS')
  oebps.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">sample-epub</dc:identifier>
    <dc:title>示例 EPUB</dc:title>
    <dc:language>zh</dc:language>
  </metadata>
  <manifest>
    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter"/>
  </spine>
</package>`,
  )
  oebps.file(
    'chapter.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="zh">
<head><title>示例 EPUB</title></head>
<body><h1>示例 EPUB</h1><p>这是一段示例章节。</p></body>
</html>`,
  )
  oebps.file(
    'toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="sample-epub"/></head>
  <docTitle><text>示例 EPUB</text></docTitle>
  <navMap>
    <navPoint id="nav1" playOrder="1">
      <navLabel><text>示例 EPUB</text></navLabel>
      <content src="chapter.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`,
  )
  writeFileSync(join(outDir, 'sample.epub'), await zip.generateAsync({ type: 'nodebuffer' }))
}

await writePdf()
await writeEpub()
console.log('Wrote public/books/sample.pdf and sample.epub')
