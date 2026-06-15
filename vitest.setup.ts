import { computed, reactive, ref, toRef, toRefs, watch } from 'vue'

Object.assign(globalThis, {
  ref,
  reactive,
  computed,
  watch,
  toRef,
  toRefs,
})
