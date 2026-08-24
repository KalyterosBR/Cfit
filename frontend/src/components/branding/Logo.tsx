import logo from "@/assets/logo/cfit-logo.png";
import sidebarLogo from "@/assets/logo/cfit-logo-sidebar.png";

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
            className="h-auto select-none object-contain"
            draggable={false}
        />
    );
}
