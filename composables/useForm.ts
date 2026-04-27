export function useForm<T extends Record<string, any>>(
  initialState: T,
  validators?: Record<string, (value: any) => string | null>
) {
  const form = reactive({ ...initialState })
  const errors = reactive<Record<string, string>>({})
  const touched = reactive<Record<string, boolean>>({})

  function validate(): boolean {
    if (!validators) return true

    Object.keys(form).forEach(key => {
      if (validators[key]) {
        const error = validators[key](form[key])
        if (error) {
          errors[key] = error
        } else {
          errors[key] = ''
        }
      }
    })

    return Object.values(errors).every(e => !e)
  }

  function validateField(key: string): boolean {
    if (!validators?.[key]) return true

    const error = validators[key](form[key])
    errors[key] = error || ''
    touched[key] = true
    return !error
  }

  function resetForm() {
    Object.keys(form).forEach(key => {
      form[key] = initialState[key]
    })
    Object.keys(errors).forEach(key => {
      errors[key] = ''
    })
    Object.keys(touched).forEach(key => {
      touched[key] = false
    })
  }

  function setFieldValue(key: string, value: any) {
    form[key] = value
    if (touched[key]) {
      validateField(key)
    }
  }

  function markFieldTouched(key: string) {
    touched[key] = true
    validateField(key)
  }

  return {
    form,
    errors,
    touched,
    validate,
    validateField,
    resetForm,
    setFieldValue,
    markFieldTouched,
  }
}
