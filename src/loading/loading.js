export function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay')
  if (overlay) {
    overlay.classList.add('hidden')

    setTimeout(() => {
      overlay.style.display = 'none'
    }, 1500)
  }
}

export function showLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay')
  if (overlay) {
    overlay.style.display = 'flex'
    overlay.classList.remove('hidden')
  }
}

export function updateLoadingText(text) {
  const textElement = document.querySelector('.loading-text')
  if (textElement) {
    textElement.textContent = text
  }
}
