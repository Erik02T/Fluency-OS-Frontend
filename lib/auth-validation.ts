/**
 * Espelha as regras do CreateUserDto do backend.
 * Mantém feedback imediato no formulário sem inventar regras diferentes.
 */
export const PASSWORD_MIN_LENGTH = 8
export const NAME_MIN_LENGTH = 2

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha deve conter pelo menos uma letra maiúscula."
  }

  if (!/[a-z]/.test(password)) {
    return "A senha deve conter pelo menos uma letra minúscula."
  }

  if (!/[0-9]/.test(password)) {
    return "A senha deve conter pelo menos um número."
  }

  return null
}

export function validateDisplayName(name: string): string | null {
  if (name.trim().length < NAME_MIN_LENGTH) {
    return `O nome deve ter pelo menos ${NAME_MIN_LENGTH} caracteres.`
  }

  return null
}

export function validateRegisterInput(input: {
  email: string
  password: string
  name: string
}): string | null {
  if (!isValidEmail(input.email)) {
    return "Informe um email válido."
  }

  const nameError = validateDisplayName(input.name)
  if (nameError) {
    return nameError
  }

  return validatePassword(input.password)
}

export function validateLoginInput(input: {
  email: string
  password: string
}): string | null {
  if (!isValidEmail(input.email)) {
    return "Informe um email válido."
  }

  if (!input.password.trim()) {
    return "Informe a senha."
  }

  return null
}
