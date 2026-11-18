'use strict'

const { configure } = require('@antora/assembler')

// Assemble AsciiDoc before conversion so Antora xrefs, images and duplicate
// section IDs are resolved by Assembler, rather than concatenating HTML pages.
module.exports.register = function ({ config = {} }) {
  const exports = new Set()
  const originalNavigation = new Map()

  this.on('contentClassified', ({ contentCatalog }) => {
    if (!contentCatalog.publishableFamilies)
      throw new Error('MEGA requires Antora 3.2 or newer')
  })
  this.on('navigationBuilt', ({ contentCatalog }) => {
    // Retain the published reading order, then include pages omitted from nav.
    // Only the assembly sees the supplemental list; normal navigation is unchanged.
    contentCatalog.getComponents().forEach(({ versions }) => versions.forEach((cv) => {
      const listed = new Set()
      const visit = (items = []) => items.forEach((item) => {
        if (item.url) listed.add(item.url.split('#')[0])
        visit(item.items)
      })
      visit(cv.navigation)
      listed.add(cv.url)
      const extra = contentCatalog.findBy({ component: cv.name, version: cv.version, family: 'page' })
        .filter((page) => page.out && !listed.has(page.pub.url))
        .sort((a, b) => a.pub.url.localeCompare(b.pub.url))
      if (!cv.navigation || !extra.length) return
      originalNavigation.set(cv, cv.navigation)
      cv.navigation = cv.navigation.concat({
        content: 'Supplementary pages',
        root: true,
        items: extra.map((page) => ({
          content: page.asciidoc.navtitle || page.src.relative,
          url: page.pub.url,
          urlType: 'internal',
        })),
      })
    }))
  })

  const converter = {
    backend: 'html-single',
    format: 'html',
    extname: '.html',
    mediaType: 'text/html',
    async convert (file, attributes) {
      const { loadAsciiDoc } = this.getFunctions()
      const { contentCatalog, siteAsciiDocConfig } = this.getVariables()
      const doc = loadAsciiDoc(file, contentCatalog, {
        antoraResourceRefs: false,
        attributes: Object.assign({}, attributes, { 'toc!': '', 'source-highlighter': 'highlightjs' }),
        docdir: attributes.docdir,
        docfile: attributes.docfile,
        extensions: siteAsciiDocConfig.extensions,
        safe: 'unsafe',
        standalone: false,
      })
      // The UI supplies the document h1. Render the assembly's top-level
      // sections as h1 too, with their descendants one heading level below.
      doc.findBy({ context: 'section' }).forEach((section) => {
        section.setLevel(Math.max(0, section.getLevel() - 1))
      })
      exports.add(file)
      return Buffer.from(doc.withLogger ? doc.withLogger(() => doc.convert()) : doc.convert())
    },
  }

  configure(this, converter, {
    configSource: {
      componentVersions: config.components || ['**', '!**@top'],
      assembly: { rootLevel: 0, sectionMergeStrategy: 'enclose', linkReferenceStyle: 'relative' },
      build: { dir: config.buildDir || './build/mega', keepSource: true, processLimit: 1 },
    },
  })

  this.on('navigationBuilt', ({ contentCatalog }) => {
    // Assembler provides the exact fragment for each included page. Keep its
    // export location so relative image/attachment URLs remain valid.
    originalNavigation.forEach((navigation, cv) => {
      cv.navigation = navigation
    })
    const pages = contentCatalog.getPages().slice()
    for (const file of contentCatalog.findBy({ family: 'export' })) {
      // Only wrap exports produced by this converter.
      if (!exports.has(file)) continue
      const entries = []
      let contents = file.contents.toString()
      const ids = new Set(Array.from(contents.matchAll(/\bid="([^"]+)"/g), (match) => match[1]))
      for (const page of pages) {
        const entry = ((page.assembler && page.assembler.exports) || []).find((it) => it.file === file)
        if (!entry) continue
        if (entry.root && entry.fragment && !ids.has(entry.fragment.slice(1))) {
          const id = entry.fragment.slice(1).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
          contents = `<div id="${id}"></div>\n` + contents
          ids.add(entry.fragment.slice(1))
        }
        entries.push({ url: page.pub.url, fragment: entry.fragment || '', title: page.asciidoc.navtitle })
        Object.assign(page.asciidoc.attributes, {
          'page-mega-url': file.pub.url + (entry.fragment || ''),
          'page-pages-url': page.pub.url,
        })
      }
      if (!entries.length) continue
      const { component, version } = file.src
      const cv = contentCatalog.getComponentVersion(component, version)
      const start = entries.find((entry) => entry.url === cv.url) || entries[0]
      contentCatalog.removeFile(file)
      contentCatalog.addFile({
        src: { component, version, module: 'ROOT', family: 'page', relative: 'mega.adoc' },
        pub: file.pub,
        out: file.out,
        contents: Buffer.from(contents),
        title: cv.title,
        asciidoc: {
          attributes: {
            'page-mega': true,
            'page-mega-url': file.pub.url,
            'page-pages-url': start.url,
            'page-mega-pages': JSON.stringify(entries),
          },
        },
      })
    }
  })
}
