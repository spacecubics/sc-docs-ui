;(function () {
  'use strict'

  var article = document.querySelector('article.doc')
  if (!article) return

  var tables = [].slice.call(article.querySelectorAll('table.tableblock'))
  if (!tables.length) return

  var scrollers = new Set()

  tables.forEach(function (table) {
    var scroller = ensureTableScroller(table)

    if (!scrollers.has(scroller)) {
      scrollers.add(scroller)
      scroller.addEventListener('scroll', function () {
        updateScrollableState(scroller)
      })
    }
  })

  window.addEventListener('resize', updateScrollableStates)
  updateScrollableStates()

  // The scroll fade is drawn on the non-scrolling .tablecontainer wrapper
  // rather than the scrolling element itself, so it stays pinned to the
  // visible edges instead of moving with the scrolled table content.
  function ensureTableScroller (table) {
    var scroller = table.closest('.tablescroll')
    if (scroller) return scroller

    var container = document.createElement('div')
    container.className = 'tablecontainer'
    scroller = document.createElement('div')
    scroller.className = 'tablescroll'
    table.parentNode.insertBefore(container, table)
    container.appendChild(scroller)
    scroller.appendChild(table)
    return scroller
  }

  function updateScrollableStates () {
    scrollers.forEach(function (scroller) {
      updateScrollableState(scroller)
    })
  }

  function updateScrollableState (scroller) {
    var maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    var isScrollable = maxScrollLeft > 1
    var canScrollLeft = scroller.scrollLeft > 1
    var canScrollRight = scroller.scrollLeft < maxScrollLeft - 1

    scroller.parentNode.classList.toggle('can-scroll-left', isScrollable && canScrollLeft)
    scroller.parentNode.classList.toggle('can-scroll-right', isScrollable && canScrollRight)
  }
})()
