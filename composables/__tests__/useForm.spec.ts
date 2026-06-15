import { describe, it, expect, beforeEach } from 'vitest'
import { useForm } from '~/composables/useForm'

interface TestForm {
  name: string
  email: string
  age: number
}

describe('useForm', () => {
  let form: ReturnType<typeof useForm<TestForm>>
  const initialState: TestForm = { name: '', email: '', age: 0 }

  const validators = {
    name: (v: string) => !v ? 'Requerido' : v.length < 3 ? 'Min 3 caracteres' : null,
    email: (v: string) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email inválido' : null,
    age: (v: number) => v < 18 ? 'Debe ser mayor de 18' : null,
  }

  beforeEach(() => {
    form = useForm(initialState, validators)
  })

  describe('initialization', () => {
    it('should initialize with provided state', () => {
      expect((form.form as any).name).toBe(initialState.name)
      expect((form.form as any).email).toBe(initialState.email)
      expect((form.form as any).age).toBe(initialState.age)
    })

    it('should initialize errors as empty', () => {
      expect(Object.keys(form.errors as object)).toHaveLength(0)
    })

    it('should initialize touched fields as empty', () => {
      expect(Object.keys(form.touched as object)).toHaveLength(0)
    })
  })

  describe('field value management', () => {
    it('should set field values', () => {
      form.setFieldValue('name', 'Juan')
      expect((form.form as any).name).toBe('Juan')
    })

    it('should update multiple fields', () => {
      form.setFieldValue('name', 'Juan')
      form.setFieldValue('email', 'juan@example.com')
      form.setFieldValue('age', 25)

      expect((form.form as any).name).toBe('Juan')
      expect((form.form as any).email).toBe('juan@example.com')
      expect((form.form as any).age).toBe(25)
    })
  })

  describe('field validation', () => {
    it('should validate individual field', () => {
      form.setFieldValue('name', 'ab')
      form.validateField('name')

      expect((form.errors as any).name).toBe('Min 3 caracteres')
    })

    it('should clear error when field is valid', () => {
      form.setFieldValue('name', 'ab')
      form.validateField('name')
      expect((form.errors as any).name).not.toBe('')

      form.setFieldValue('name', 'Juan')
      form.validateField('name')
      expect((form.errors as any).name).toBe('')
    })

    it('should validate email format', () => {
      form.setFieldValue('email', 'invalid-email')
      form.validateField('email')
      expect((form.errors as any).email).toBe('Email inválido')

      form.setFieldValue('email', 'valid@example.com')
      form.validateField('email')
      expect((form.errors as any).email).toBe('')
    })

    it('should validate age range', () => {
      form.setFieldValue('age', 16)
      form.validateField('age')
      expect((form.errors as any).age).toBe('Debe ser mayor de 18')

      form.setFieldValue('age', 25)
      form.validateField('age')
      expect((form.errors as any).age).toBe('')
    })
  })

  describe('whole form validation', () => {
    it('should validate entire form and return false if any field has error', () => {
      form.setFieldValue('name', 'a')
      form.setFieldValue('email', 'valid@example.com')
      form.setFieldValue('age', 25)

      const isValid = form.validate()
      expect(isValid).toBe(false)
      expect((form.errors as any).name).not.toBe('')
    })

    it('should return true when all fields are valid', () => {
      form.setFieldValue('name', 'Juan García')
      form.setFieldValue('email', 'juan@example.com')
      form.setFieldValue('age', 25)

      const isValid = form.validate()
      expect(isValid).toBe(true)
      expect((form.errors as any).name).toBe('')
      expect((form.errors as any).email).toBe('')
      expect((form.errors as any).age).toBe('')
    })

    it('should find all validation errors in one pass', () => {
      form.setFieldValue('name', 'a')
      form.setFieldValue('email', 'invalid')
      form.setFieldValue('age', 10)

      const isValid = form.validate()
      expect(isValid).toBe(false)
      expect((form.errors as any).name).not.toBe('')
      expect((form.errors as any).email).not.toBe('')
      expect((form.errors as any).age).not.toBe('')
    })
  })

  describe('touched field tracking', () => {
    it('should mark field as touched', () => {
      expect((form.touched as any).name).toBeUndefined()
      form.markFieldTouched('name')
      expect((form.touched as any).name).toBe(true)
    })

    it('should not auto-mark touched on setFieldValue', () => {
      form.setFieldValue('name', 'Juan')
      expect((form.touched as any).name).toBeUndefined()
    })

    it('should track multiple touched fields', () => {
      form.markFieldTouched('name')
      form.markFieldTouched('email')

      expect((form.touched as any).name).toBe(true)
      expect((form.touched as any).email).toBe(true)
      expect((form.touched as any).age).toBeUndefined()
    })
  })

  describe('form reset', () => {
    it('should reset form to initial state', () => {
      form.setFieldValue('name', 'Juan')
      form.setFieldValue('email', 'juan@example.com')
      form.setFieldValue('age', 25)

      form.resetForm()

      expect((form.form as any).name).toBe(initialState.name)
      expect((form.form as any).email).toBe(initialState.email)
      expect((form.form as any).age).toBe(initialState.age)
    })

    it('should clear errors on reset', () => {
      form.setFieldValue('name', 'a')
      form.validateField('name')
      expect((form.errors as any).name).not.toBe('')

      form.resetForm()
      expect((form.errors as any).name).toBe('')
    })
  })

  describe('form without validators', () => {
    it('should work without validators', () => {
      const simpleForm = useForm<TestForm>(initialState)
      
      simpleForm.setFieldValue('name', 'Juan')
      expect((simpleForm.form as any).name).toBe('Juan')

      const isValid = simpleForm.validate()
      expect(isValid).toBe(true)
    })
  })
})
