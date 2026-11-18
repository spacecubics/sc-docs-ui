;(function () {
  'use strict'

  var switcher = document.querySelector('.page-mode')
  if (!switcher) return
  var picker = switcher.querySelector('details')
  document.addEventListener('click', function (event) {
    if (!picker.contains(event.target) || event.target.closest('a')) picker.open = false
  })
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && picker.open) {
      picker.open = false
      picker.querySelector('summary').focus()
    }
  })
  if (!switcher.hasAttribute('data-mega-pages')) return
  var pages = JSON.parse(switcher.dataset.megaPages)
  var pagesLink = switcher.querySelector('[data-page-mode-pages]')
  // Resolve from the site root, including deployments below a URL prefix.
  var initial = pages.filter(function (page) {
    return new URL(pagesLink.href).pathname.endsWith(page.url)
  })[0] || pages[0]
  var sitePrefix = new URL(pagesLink.href).pathname.slice(0, -initial.url.length)
  pages.forEach(function (page) {
    page.href = sitePrefix + page.url
    page.target = page.fragment && document.getElementById(decodeURIComponent(page.fragment.slice(1)))
  })
  document.querySelectorAll('.nav-menu a[href]').forEach(function (link) {
    var target = new URL(link.href)
    if (target.origin !== window.location.origin) return
    var page = pages.filter(function (entry) {
      return target.pathname === entry.href
    })[0]
    if (page && page.target && !target.hash) link.setAttribute('href', page.fragment)
  })
  var ordered = pages.filter(function (page) {
    return page.target
  }).sort(function (a, b) {
    return a.target === b.target ? 0 : a.target.compareDocumentPosition(b.target) & 4 ? -1 : 1
  })
  var pending = false
  function update () {
    pending = false
    var current = initial
    var toolbar = document.querySelector('.toolbar')
    var top = (toolbar ? toolbar.getBoundingClientRect().bottom : 0) + 48
    ordered.some(function (page) {
      if (page.target.getBoundingClientRect().top > top) return true
      current = page
      return false
    })
    pagesLink.setAttribute('href', current.href || sitePrefix + current.url)
    pagesLink.title = current.title || 'Read as separate pages'
  }
  window.addEventListener('scroll', function () {
    if (!pending) {
      pending = true
      window.requestAnimationFrame(update)
    }
  }, { passive: true })
  window.addEventListener('load', update)
  update()
})()
