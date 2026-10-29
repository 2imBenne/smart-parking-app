export function maskSensitiveValue(value: string, visibleSuffix = 4) {
  const normalized = value.trim()
  if (!normalized) return ''
  const suffixLength = Math.min(Math.max(visibleSuffix, 0), normalized.length)
  return `${'*'.repeat(Math.max(0, normalized.length - suffixLength))}${normalized.slice(-suffixLength)}`
}
