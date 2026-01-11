import Image from 'next/image';

interface TokenIconProps {
    symbol: 'MNT' | 'WMNT' | 'USDC' | 'USDT';
    size?: number;
    className?: string;
}

const TOKEN_LOGOS: Record<string, string> = {
    MNT: '/mantle-mnt-logo.png',
    WMNT: '/mantle-mnt-logo.png',
    USDC: '/usd-coin-usdc-logo.png',
    USDT: '/tether-usdt-logo.png',
};

export function TokenIcon({ symbol, size = 32, className = '' }: TokenIconProps) {
    const logoPath = TOKEN_LOGOS[symbol];

    if (!logoPath) {
        return <span className={className}>💵</span>;
    }

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <Image
                src={logoPath}
                alt={`${symbol} logo`}
                fill
                className="object-contain"
                sizes={`${size}px`}
            />
        </div>
    );
}
