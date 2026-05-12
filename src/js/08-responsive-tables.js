;(function () {
  'use strict'

  var article = document.querySelector('article.doc')
  if (!article) return

  var tables = [].slice.call(article.querySelectorAll('table.tableblock'))
  if (!tables.length) return

  var containers = new Set()

  tables.forEach(function (table) {
    var container = ensureTableContainer(table)

    if (!containers.has(container)) {
      containers.add(container)
      container.addEventListener('scroll', function () {
        updateScrollableState(container)
      })
    }
  })

  window.addEventListener('resize', updateScrollableStates)
  updateScrollableStates()

  function ensureTableContainer (table) {
    var container = table.closest('.tablecontainer')
    if (container) return container

    container = document.createElement('div')
    container.className = 'tablecontainer'
    table.parentNode.insertBefore(container, table)
    container.appendChild(table)
    return container
  }

  function updateScrollableStates () {
    containers.forEach(function (container) {
      updateScrollableState(container)
    })
  }

  function updateScrollableState (container) {
    var isScrollable = container.scrollWidth - container.clientWidth > 1
    var hasScrolled = container.scrollLeft > 1
    var hasSeenScrollHint = container.classList.contains('has-seen-scroll-hint')
    if (isScrollable && hasScrolled && !hasSeenScrollHint) {
      container.classList.add('has-seen-scroll-hint')
      hasSeenScrollHint = true
    }
    container.classList.toggle('is-scrollable', isScrollable && !hasSeenScrollHint)
    container.classList.toggle('is-scrolled', isScrollable && hasScrolled)
  }
})()
