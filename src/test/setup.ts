import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// ponytail: jsdom Blob lacks .text(); polyfill for store tests
if (!Blob.prototype.text) {
  Blob.prototype.text = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}
