import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const isDark = mounted ? resolvedTheme === 'dark' : false

	function toggle() {
		setTheme(isDark ? 'light' : 'dark')
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggle}
			aria-label={isDark ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
			title={isDark ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
			className="relative"
		>
			<SunIcon
				className={`size-4 transition-transform duration-300 ${
					isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
				}`}
			/>
			<MoonIcon
				className={`absolute size-4 transition-transform duration-300 ${
					isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'
				}`}
			/>
		</Button>
	)
}
