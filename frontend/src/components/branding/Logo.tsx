import logo from "@/assets/logo/cfit-logo.webp";
import sidebarLogo from "@/assets/logo/cfit-logo-sidebar.webp";

type LogoProps = {
    width?: number;
    variant?: "default" | "sidebar";
};

export default function Logo({
    width = 180,
    variant = "default",
}: LogoProps) {
    return (
        <img
            src={variant === "sidebar" ? sidebarLogo : logo}
            alt="Cfit"
            width={width}
            height={Math.round(width * (variant === "sidebar" ? 260 / 600 : 400 / 600))}
            className="h-auto select-none object-contain"
            decoding="async"
            draggable={false}
        />
    );
}
