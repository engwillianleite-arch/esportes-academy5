export function cleanCpf(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function formatCpf(raw: string): string {
  const d = cleanCpf(raw).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function validateCpf(cpf: string): boolean {
  const d = cleanCpf(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false // all same digits
  // First check digit
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  // Second check digit
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}
