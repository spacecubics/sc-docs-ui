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
    if (e.key === 'Escape' && lightbox.classList.contains('is-active')) closeLightbox()
  })

  function openLightbox (img) {
    lightboxImage.src = img.currentSrc || img.src
    lightboxImage.alt = img.alt || ''
    lightbox.classList.add('is-active')
    lightbox.setAttribute('aria-hidden', 'false')
    html.classList.add('is-clipped--image-lightbox')
  }

  function closeLightbox () {
    lightbox.classList.remove('is-active')
    lightbox.setAttribute('aria-hidden', 'true')
    html.classList.remove('is-clipped--image-lightbox')
    lightboxImage.removeAttribute('src')
  }
})()
