import {
	AccessibilityIcon,
	BabyIcon,
	BriefcaseBusinessIcon,
	CircleHelpIcon,
	GraduationCapIcon,
	HandHeartIcon,
	HeartPulseIcon,
	HomeIcon,
	LeafIcon,
	PawPrintIcon,
	RecycleIcon,
	ScaleIcon,
	ShieldAlertIcon,
	SparklesIcon,
	type LucideIcon,
	UsersIcon,
	UsersRoundIcon,
	VenusIcon,
	WheatIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
	'briefcase-business': BriefcaseBusinessIcon,
	'graduation-cap': GraduationCapIcon,
	leaf: LeafIcon,
	users: UsersIcon,
	scale: ScaleIcon,
	'shield-alert': ShieldAlertIcon,
	'heart-pulse': HeartPulseIcon,
	sparkles: SparklesIcon,
	accessibility: AccessibilityIcon,
	wheat: WheatIcon,
	recycle: RecycleIcon,
	'users-round': UsersRoundIcon,
	baby: BabyIcon,
	venus: VenusIcon,
	'hand-heart': HandHeartIcon,
	home: HomeIcon,
	'paw-print': PawPrintIcon,
	'circle-help': CircleHelpIcon,
}

interface TaxonomyIconProps {
	name?: string | null
	className?: string
	fallback?: LucideIcon
}

export function TaxonomyIcon({
	name,
	className,
	fallback = SparklesIcon,
}: TaxonomyIconProps) {
	const Icon = (name && ICON_MAP[name]) || fallback
	return <Icon className={className} aria-hidden="true" />
}
