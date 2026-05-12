;(function () {
  'use strict'

  var article = document.querySelector('article.doc')
  if (!article) return

  var tables = [].slice.call(article.querySelectorAll('table.tableblock'))
  if (!tables.length) return

  tables.forEach(function (table) {
    ensureTableContainer(table)
  })

  function ensureTableContainer (table) {
    var container = table.closest('.tablecontainer')
    if (container) return container

    container = document.createElement('div')
    container.className = 'tablecontainer'
    table.parentNode.insertBefore(container, table)
    container.appendChild(table)
    return container
  }
})()
