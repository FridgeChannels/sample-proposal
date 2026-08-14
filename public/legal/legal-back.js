(function () {
  const params = new URLSearchParams(window.location.search)
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('is-embed')
    document.body.classList.add('is-embed')
  }

  const back = document.getElementById('legal-back')
  if (!back) return

  const sameOriginPath = (value) => {
    try {
      const url = new URL(value, window.location.origin)
      if (url.origin !== window.location.origin) return ''
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return ''
    }
  }

  const fromQuery = sameOriginPath(new URLSearchParams(window.location.search).get('return') || '')
  if (fromQuery) {
    back.setAttribute('href', fromQuery)
    return
  }

  const fromReferrer = sameOriginPath(document.referrer || '')
  if (fromReferrer) {
    back.setAttribute('href', fromReferrer)
    return
  }

  back.addEventListener('click', (event) => {
    event.preventDefault()
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    window.location.href = '/post-meeting.html#plan'
  })
})()
