interface SubwayCircleProps {
    letter: string;
    color: string;
    size?: number;
}

function SubwayCircle({ letter, color, size = 28 }: SubwayCircleProps) {
    return (
        <span
            className="inline-flex items-center justify-center rounded-full font-bold text-white shrink-0"
            style={{
                backgroundColor: color,
                width: size,
                height: size,
                fontSize: size * 0.5,
                lineHeight: 1,
            }}
        >
            {letter}
        </span>
    );
}

export function SubwayLogo({ size = 28 }: { size?: number }) {
    return (
        <span className="inline-flex items-center gap-1">
            <SubwayCircle letter="G" color="#6CBE45" size={size} />
            <SubwayCircle letter="O" color="#FF6319" size={size} />
        </span>
    );
}

export function SubwayHero() {
    return (
        <div className="inline-flex flex-col items-start gap-3">
            <div className="inline-flex items-center gap-2">
                <SubwayCircle letter="G" color="#6CBE45" size={56} />
                <SubwayCircle letter="O" color="#FF6319" size={56} />
                <span className="text-[clamp(3rem,7vw+1rem,5rem)] font-bold tracking-[-0.04em] text-chalk leading-none ml-1">
                    Train
                </span>
            </div>
        </div>
    );
}
