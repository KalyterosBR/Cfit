import logo from "@/assets/logo/cfit-logo.png";

type LogoProps = {
    width?: number;
};

export default function Logo({
    width = 180,
}: LogoProps) {
    return (
        <img
            src={logo}
            alt="Cfit"
            width={width}
            className="h-auto select-none"
            draggable={false}
        />
    );
}