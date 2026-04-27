declare module 'lucide-vue-next' {
  import type { FunctionalComponent, SVGAttributes } from 'vue'

  interface IconProps extends SVGAttributes {
    size?: string | number
    strokeWidth?: string | number
    absoluteStrokeWidth?: boolean
  }

  type LucideIcon = FunctionalComponent<IconProps>

  export const AlertTriangle: LucideIcon
  export const Plus: LucideIcon
  export const Edit: LucideIcon
  export const Eye: LucideIcon
  export const CheckCircle: LucideIcon
  export const X: LucideIcon
  export const ArrowRight: LucideIcon
  export const Home: LucideIcon
  export const Trash2: LucideIcon
  export const Trash: LucideIcon
  export const Printer: LucideIcon
}
