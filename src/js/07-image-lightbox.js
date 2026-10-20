;(function () {
  'use strict'

  var article = document.querySelector('article.doc')
  if (!article) return

  var images = [].slice.call(article.querySelectorAll('.imageblock img, .image > img, .image a > img'))
    .filter(function (img, index, self) {
      return (img.currentSrc || img.src) && self.indexOf(img) === index
    })
  if (!images.length) return

  var html = document.documentElement
  var lightbox = document.createElement('div')
  lightbox.className = 'image-lightbox'
  lightbox.setAttribute('aria-hidden', 'true')
  var closeTimer
  var activeSourceImage
  var parentDialog
  var parentPanel
  var previousFocus
  var animationDuration = 360
  lightbox.tabIndex = 0
  lightbox.setAttribute('role', 'dialog')
  lightbox.setAttribute('aria-label', 'Image viewer')

  var lightboxImage = document.createElement('img')
  lightboxImage.alt = ''
  lightbox.appendChild(lightboxImage)
  document.body.appendChild(lightbox)

  images.forEach(function (img) {
    img.addEventListener('click', function (e) {
      e.preventDefault()
      openLightbox(img)
    })
  })

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox()
  })

  window.addEventListener('keydown', function (e) {
    if (!parentDialog && e.key === 'Escape' && lightbox.classList.contains('is-active')) closeLightbox()
  })

  document.addEventListener('table-lightbox:restore', function (e) {
    if (e.target === parentDialog) closeLightbox(true)
  })

  function openLightbox (img) {
    window.clearTimeout(closeTimer)
    activeSourceImage = img
    previousFocus = document.activeElement
    parentDialog = img.closest('.table-lightbox[open]')
    if (parentDialog) {
      parentPanel = parentDialog.querySelector('.table-lightbox-panel')
      parentDialog.appendChild(lightbox)
      parentPanel.inert = true
      parentDialog.addEventListener('cancel', cancelImage, true)
    }
    lightboxImage.src = img.currentSrc || img.src
    lightboxImage.alt = img.alt || ''
    lightbox.classList.add('is-active')
    lightbox.setAttribute('aria-hidden', 'false')
    html.classList.add('is-clipped--image-lightbox')
    lightbox.focus({ preventScroll: true })
    if (lightboxImage.complete) {
      animateLightboxImage(img)
    } else {
      lightboxImage.addEventListener('load', function onLoad () {
        lightboxImage.removeEventListener('load', onLoad)
        if (lightbox.classList.contains('is-active')) animateLightboxImage(img)
      })
    }
  }

  function cancelImage (e) {
    e.preventDefault()
    e.stopImmediatePropagation()
    if (lightbox.classList.contains('is-active')) closeLightbox()
  }

  function closeLightbox (immediate) {
    var sourceImage = activeSourceImage
    lightbox.classList.remove('is-active')
    lightbox.setAttribute('aria-hidden', 'true')
    html.classList.remove('is-clipped--image-lightbox')
    window.clearTimeout(closeTimer)
    function finishClose () {
      if (!lightbox.classList.contains('is-active')) {
        lightboxImage.removeAttribute('src')
        lightboxImage.style.transform = ''
        lightboxImage.style.transition = ''
        if (parentDialog) {
          parentDialog.removeEventListener('cancel', cancelImage, true)
          parentPanel.inert = false
          document.body.appendChild(lightbox)
          parentDialog = parentPanel = undefined
        }
        if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true })
      }
    }
    if (immediate === true) {
      finishClose()
    } else {
      closeTimer = window.setTimeout(finishClose, animationDuration)
      if (sourceImage) animateLightboxImage(sourceImage, true)
    }
  }

  function animateLightboxImage (img, isClosing) {
    window.requestAnimationFrame(function () {
      var sourceRect = img.getBoundingClientRect()
      var targetRect = lightboxImage.getBoundingClientRect()
      var transform = getTransformFromRects(sourceRect, targetRect)

      lightboxImage.style.transition = 'none'
      lightboxImage.style.transform = isClosing ? 'translate(0, 0) scale(1)' : transform
      lightboxImage.getBoundingClientRect()

      window.requestAnimationFrame(function () {
        lightboxImage.style.transition = 'transform ' + animationDuration + 'ms cubic-bezier(0.22, 1, 0.36, 1)'
        lightboxImage.style.transform = isClosing ? transform : 'translate(0, 0) scale(1)'
      })
    })
  }

  function getTransformFromRects (fromRect, toRect) {
    if (!toRect.width || !toRect.height) return 'translate(0, 0) scale(1)'

    var translateX = fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2)
    var translateY = fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2)
    var scaleX = fromRect.width / toRect.width
    var scaleY = fromRect.height / toRect.height

    return (
      'translate(' + translateX + 'px, ' + translateY + 'px) ' +
      'scale(' + scaleX + ', ' + scaleY + ')'
    )
  }
})()
