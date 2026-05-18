;(function () {
  'use strict'

  var storageKey = 'sc-docs-ui-theme'
  var values = ['light', 'dark']

  function getStoredPreference () {
    try {
      return window.localStorage.getItem(storageKey)
    } catch (e) {
      return null
    }
  }

  function setStoredPreference (value) {
    try {
      if (value === 'light') {
        window.localStorage.removeItem(storageKey)
      } else {
        window.localStorage.setItem(storageKey, value)
      }
    } catch (e) {
    }
  }

  function getPreference () {
    var value = getStoredPreference()
    return values.indexOf(value) === -1 ? 'light' : value
  }

  function applyPreference (value) {
    if (values.indexOf(value) === -1) value = 'light'

    document.documentElement.setAttribute('data-theme', value)

    var select = document.querySelector('[data-theme-switcher]')
    if (select) select.value = value
  }

  function setPreference (value) {
    if (values.indexOf(value) === -1) value = 'light'

    setStoredPreference(value)
    applyPreference(value)
  }

  applyPreference(getPreference())

  document.addEventListener('DOMContentLoaded', function () {
    var select = document.querySelector('[data-theme-switcher]')

    applyPreference(getPreference())

    if (!select) return

    select.addEventListener('change', function () {
      setPreference(select.value)
    })
  })
})()
