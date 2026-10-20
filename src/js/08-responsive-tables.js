;(function () {
  'use strict'

  var article = document.querySelector('article.doc')
  if (!article) return

  var tables = [].slice.call(article.querySelectorAll('table.tableblock'))
  if (!tables.length) return

  var scrollers = new Map()
  var buttons = new Map()
  var active
  var panelAnimation
  var dialog = document.createElement('dialog')
  dialog.className = 'table-lightbox'
  dialog.setAttribute('aria-label', 'Expanded table')
  var panel = document.createElement('div')
  panel.className = 'table-lightbox-panel'
  var closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'table-lightbox-close'
  closeButton.textContent = 'Close'
  var content = document.createElement('div')
  content.className = 'doc table-lightbox-content'
  content.tabIndex = 0
  panel.appendChild(closeButton)
  panel.appendChild(content)
  dialog.appendChild(panel)
  document.body.appendChild(dialog)
  closeButton.addEventListener('click', closeExpandedTable)
  dialog.addEventListener('cancel', function (event) {
    event.preventDefault()
    closeExpandedTable()
  })
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) closeExpandedTable()
  })
  window.addEventListener('beforeprint', restoreTable)
  document.addEventListener('doc:fragment-jump', function (event) {
    if (!active) return
    var target = event.detail.target
    if (!content.contains(target) || dialog.classList.contains('is-closing')) {
      restoreTable()
      return
    }
    event.preventDefault()
    if (event.detail.updateHash) window.history.pushState(null, '', '#' + target.id)
    // Scroll only the table viewport, without moving the document behind it.
    var viewport = content.getBoundingClientRect()
    var destination = target.getBoundingClientRect()
    content.scrollTo({
      top: content.scrollTop + destination.top - viewport.top,
      left: content.scrollLeft + destination.left - viewport.left,
      behavior: 'instant',
    })
  })
  var resizeObserver = window.ResizeObserver && new window.ResizeObserver(updateScrollableStates)

  tables.forEach(function (table, index) {
    var scroller = ensureTableScroller(table)

    if (!scrollers.has(scroller)) {
      var caption = table.caption && table.caption.textContent.trim()
      scrollers.set(scroller, caption || 'Table ' + (index + 1))
      var button = document.createElement('button')
      button.type = 'button'
      button.className = 'table-expand'
      button.textContent = '⛶'
      button.title = 'Expand table'
      button.setAttribute('aria-label', 'Expand ' + scrollers.get(scroller))
      button.setAttribute('aria-haspopup', 'dialog')
      button.hidden = true
      button.addEventListener('click', function () {
        openExpandedTable(scroller, table, button)
      })
      buttons.set(scroller, button)
      scroller.parentNode.appendChild(button)
      scroller.addEventListener('scroll', function () {
        updateScrollableState(scroller)
      })
      if (resizeObserver) resizeObserver.observe(scroller)
    }
    if (resizeObserver) resizeObserver.observe(table)
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
    scrollers.forEach(function (label, scroller) {
      updateScrollableState(scroller)
    })
  }

  function updateScrollableState (scroller) {
    if (active && active.scroller === scroller) return
    var maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    var isScrollable = maxScrollLeft > 1
    var canScrollLeft = scroller.scrollLeft > 1
    var canScrollRight = scroller.scrollLeft < maxScrollLeft - 1
    buttons.get(scroller).hidden = !isScrollable

    if (isScrollable) {
      scroller.setAttribute('tabindex', '0')
      scroller.setAttribute('role', 'region')
      scroller.setAttribute('aria-label', scrollers.get(scroller))
    } else {
      scroller.removeAttribute('tabindex')
      scroller.removeAttribute('role')
      scroller.removeAttribute('aria-label')
    }

    scroller.parentNode.classList.toggle('can-scroll-left', isScrollable && canScrollLeft)
    scroller.parentNode.classList.toggle('can-scroll-right', isScrollable && canScrollRight)
  }

  function openExpandedTable (scroller, table, button) {
    if (active) return
    active = {
      scroller: scroller,
      table: table,
      button: button,
      height: scroller.style.height,
      scrollLeft: scroller.scrollLeft,
    }
    scroller.style.height = scroller.getBoundingClientRect().height + 'px'
    content.appendChild(table)
    dialog.setAttribute('aria-label', scrollers.get(scroller))
    document.documentElement.classList.add('is-clipped--table-lightbox')
    dialog.showModal()
    content.scrollTop = content.scrollLeft = 0
    animatePanel(false)
    closeButton.focus()
  }

  function animatePanel (closing) {
    var currentFrame
    if (panelAnimation) {
      var style = window.getComputedStyle(panel)
      currentFrame = { transform: style.transform, opacity: style.opacity }
      panelAnimation.cancel()
      panelAnimation = undefined
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    var from = active.scroller.getBoundingClientRect()
    var to = panel.getBoundingClientRect()
    var scale = Math.min(from.width / to.width, from.height / to.height, 1)
    var transform = 'translate(' + (from.left + from.width / 2 - to.left - to.width / 2) + 'px, ' +
      (from.top + from.height / 2 - to.top - to.height / 2) + 'px) scale(' + scale + ')'
    var collapsedFrame = { transform: transform, opacity: 0 }
    var expandedFrame = { transform: 'none', opacity: 1 }
    var frames = closing ? [currentFrame || expandedFrame, collapsedFrame] : [collapsedFrame, expandedFrame]
    panelAnimation = panel.animate(frames, {
      duration: closing ? 280 : 360,
      easing: closing ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)',
      // Keep the final frame until the dialog is closed, even if rendering is delayed.
      fill: 'both',
    })
    return panelAnimation
  }

  function closeExpandedTable () {
    if (!active || dialog.classList.contains('is-closing')) return
    // Restore the source before fading the overlay, so it is already visible
    // underneath. Only the outgoing visual copy remains in the dialog.
    var visualCopy = active.table.cloneNode(true)
    visualCopy.removeAttribute('id')
    ;[].forEach.call(visualCopy.querySelectorAll('[id]'), function (element) {
      element.removeAttribute('id')
    })
    visualCopy.setAttribute('aria-hidden', 'true')
    visualCopy.setAttribute('inert', '')
    content.replaceChild(visualCopy, active.table)
    active.scroller.appendChild(active.table)
    active.scroller.style.height = active.height
    active.scroller.scrollLeft = active.scrollLeft
    dialog.classList.add('is-closing')
    var animation = animatePanel(true)
    if (animation) {
      animation.onfinish = restoreTable
    } else {
      restoreTable()
    }
  }

  function restoreTable () {
    if (!active) return
    dialog.dispatchEvent(new window.CustomEvent('table-lightbox:restore', { bubbles: true }))
    var previous = active
    previous.scroller.appendChild(previous.table)
    previous.scroller.style.height = previous.height
    previous.scroller.scrollLeft = previous.scrollLeft
    active = undefined
    dialog.close()
    content.textContent = ''
    if (panelAnimation) {
      panelAnimation.cancel()
      panelAnimation = undefined
    }
    dialog.classList.remove('is-closing')
    document.documentElement.classList.remove('is-clipped--table-lightbox')
    updateScrollableStates()
    if (!previous.button.hidden) previous.button.focus({ preventScroll: true })
  }
})()
