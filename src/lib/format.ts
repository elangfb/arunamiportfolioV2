// Formatting helpers — all currency/date display goes through here so
// the prototype stays consistent and is trivial to re-skin.

export function rpJt(jt: number): string {
  if (Math.abs(jt) >= 1000) {
    return 'Rp ' + (jt / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M'
  }
  return 'Rp ' + jt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' jt'
}

export function rpB(b: number): string {
  return 'IDR ' + b + ' M'
}

export function pct(n: number, digits = 1): string {
  return n.toFixed(digits) + '%'
}

export function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function uid(prefix = 'id'): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 9)
}

export function today(): string {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
