import { chakra, type HTMLChakraProps } from '@chakra-ui/react'

export type IconProps = HTMLChakraProps<'svg'>

const Svg = chakra('svg', {
    base: {
        display: 'inline-block',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.75',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        boxSize: '1em',
    },
})

function svgIcon(path: React.ReactNode) {
    return function SvgIcon(props: IconProps) {
        return (
            <Svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
                {path}
            </Svg>
        )
    }
}

export const MailIcon = svgIcon(
    <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />,
)

export const LockIcon = svgIcon(
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
)

export const EyeIcon = svgIcon(
    <>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </>,
)

export const EyeOffIcon = svgIcon(
    <path d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.97 10.97 0 01-2.293 3.95M6.34 6.336C4.42 7.64 3.03 9.62 2.458 12c.639 2.126 1.976 3.99 3.727 5.25A9.42 9.42 0 0012 19c.994 0 1.953-.15 2.856-.427" />,
)

export const BadgeScanIcon = svgIcon(
    <path
        strokeWidth="1.8"
        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
    />,
)

export const ShieldCheckIcon = svgIcon(
    <path
        strokeWidth="2"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />,
)

export const GridIcon = svgIcon(
    <path
        strokeWidth="2"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />,
)

export const ArrowRightIcon = svgIcon(<path strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />)

export const ChevronsLeftIcon = svgIcon(
    <path strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />,
)

export const MenuIcon = svgIcon(<path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />)

export const LogoutIcon = svgIcon(
    <path strokeWidth="2" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m4 14l5-5-5-5m5 5H9" />,
)

export const ChevronDownIcon = svgIcon(<path strokeWidth="2" d="M6 9l6 6 6-6" />)
