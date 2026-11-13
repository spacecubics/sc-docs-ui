;(function () {
  'use strict'

  var storageKey = 'sc-docs-ui-theme'
  var values = ['light', 'dark', 'system']
  var labels = { light: 'Light', dark: 'Dark', system: 'System' }
  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
  var preference = getPreference()
  var button

  function getPreference () {
    try {
      var value = window.localStorage.getItem(storageKey)
      return values.indexOf(value) === -1 ? 'system' : value
    } catch (e) {
      return 'system'
    }
  }

  function nextPreference () {
    return values[(values.indexOf(preference) + 1) % values.length]
  }

  function applyPreference () {
    var theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference
    document.documentElement.setAttribute('data-theme', theme)
    if (!button) return
    var label = 'Theme: ' + labels[preference] + '. Switch to ' + labels[nextPreference()]
    button.setAttribute('data-theme-preference', preference)
    button.setAttribute('aria-label', label)
    button.setAttribute('title', label)
  }

  function initialize () {
    button = document.querySelector('[data-theme-switcher]')
    applyPreference()
    if (!button) return
    button.disabled = false
    button.addEventListener('click', function () {
      preference = nextPreference()
      try {
        // Persist explicit light as well, so it does not revert to system mode.
        window.localStorage.setItem(storageKey, preference)
      } catch (e) {
      }
      applyPreference()
    })
  }

  systemTheme.addEventListener('change', function () {
    if (preference === 'system') applyPreference()
  })
  window.addEventListener('storage', function (event) {
    if (event.key !== storageKey && event.key !== null) return
    preference = getPreference()
    applyPreference()
  })

  applyPreference()
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
  } else {
    initialize()
  }
})()
