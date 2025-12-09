// src/components/Button/Button.tsx
import { type ComponentPropsWithoutRef } from "react";
// Подключаем ранее упомянутую библиотеку clsx
import clsx from "clsx"; 
// Импорт CSS-модуля даёт объект "s" со свойствами-классами (s.button, s.primary ...).
import s from "./Button.module.css";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

// Базовые нативные пропсы кнопки (type, autoFocus, aria-*, и т.д.)
type NativeButtonProps = ComponentPropsWithoutRef<"button">;

interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // className, disabled и children уже есть в NativeButtonProps, дублировать не обязательно
}

/**
 * Универсальная кнопка.
 * При помощи знака `=` сразу указываем значения "по умолчанию" для части параметров
 */
export function Button({
  children,
  variant = "primary",  // дефолтный вариант
  size = "md",          // дефолтный размер
  type = "button",      // по умолчанию button, но потом можем переопределить на submit (например, формы)
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      className={clsx(  // Объединяем набор из нескольких стилей для кнопки
        s.button,
        s[variant],  // s.primary или s.secondary
        s[size],     // s.sm, s.md или s.lg
        rest.disabled && s.disabled,
        rest.className
      )}
    >
      {children}
    </button>
  );
}