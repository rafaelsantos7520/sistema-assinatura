'use client'

import { Phone } from 'lucide-react'
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'

interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    withIcon?: boolean
    label?: string
    required?: boolean
}

export function formatPhoneDisplay(value: string): string {
    if (!value) return ''
    try {
        const formatter = new AsYouType('BR')
        return formatter.input(value)
    } catch {
        return value
    }
}

export function isValidPhone(value: string): boolean {
    try {
        const phone = parsePhoneNumberFromString(value, 'BR')
        return phone?.isValid() ?? false
    } catch {
        return false
    }
}

export function getPhoneDigits(value: string): string {
    return value.replace(/\D/g, '')
}

export function getWhatsAppLink(phone: string, message: string): string {
    const digits = getPhoneDigits(phone)
    const cleaned = digits.startsWith('55') ? digits : `55${digits}`
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

export default function PhoneInput({
    value,
    onChange,
    placeholder = '+55 (11) 99999-9999',
    withIcon = false,
    label,
    required = false,
}: PhoneInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d+]/g, '')
        onChange(raw)
    }

    const displayValue = formatPhoneDisplay(value)

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            )}
            <div className="relative">
                {withIcon && (
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                )}
                <input
                    type="tel"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full ${withIcon ? 'pl-10' : 'px-4'} pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder-gray-400`}
                />
            </div>
        </div>
    )
}
