import { useEffect, useRef } from "react";

export default function Cursor() {
    const ring = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const move = (e: PointerEvent) => {
            if (e.pointerType === "touch" || !ring.current) return;
            ring.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        };
        const tap = (e: PointerEvent) => {
            const r = document.createElement("span");
            r.className = "cur-ripple";
            r.style.left = `${e.clientX}px`;
            r.style.top = `${e.clientY}px`;
            document.body.appendChild(r);
            setTimeout(() => r.remove(), 600);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerdown", tap);
        return () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerdown", tap);
        };
    }, []);

    return <div ref={ring} className="cur-ring" />;
}
