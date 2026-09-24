import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'font-semibold',
    'transition-all',
    'duration-100',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-[#D93B2B]',
    'disabled:opacity-40',
    'disabled:pointer-events-none',
    'cursor-pointer',
    'select-none',
    'tracking-wide',
    'text-sm',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-[#D93B2B] text-[#FAF6EC] hover:bg-[#BF3323] active:scale-[0.98] border border-[#D93B2B]',

        secondary:
          'bg-transparent text-foreground border border-foreground hover:bg-foreground hover:text-[#F0EAD6] active:scale-[0.98]',

        ghost:
          'bg-transparent text-foreground hover:bg-secondary active:scale-[0.98]',

        accent:
          'bg-[#06C167] text-[#0E0D0B] hover:bg-[#05A656] active:scale-[0.98] border border-[#06C167]',

        danger:
          'bg-[#D93B2B] text-[#FAF6EC] hover:bg-[#BF3323] border border-[#D93B2B]',

        found:
          'bg-[#06C167] text-[#0E0D0B] hover:bg-[#05A656] border border-[#06C167]',

        sidebar:
          'bg-transparent text-[#F0EAD6] hover:bg-[#2A2925] active:scale-[0.98]',

        outline:
          'bg-transparent border border-border text-foreground hover:bg-secondary active:scale-[0.98]',
      },

      size: {
        sm: 'h-8 px-3 text-xs',

        md: 'h-10 px-4',

        lg: 'h-12 px-6 text-base',

        icon: 'h-9 w-9',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className = '',
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({
        variant,
        size,
        className,
      })}
      {...props}
    />
  )
}