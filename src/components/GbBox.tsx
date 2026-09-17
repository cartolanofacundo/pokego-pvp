export function GbBox({
  children,
  dark = false,
  className = "",
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`${dark ? "gb-box-dark" : "gb-box"} p-2 ${className}`}>
      {children}
    </div>
  );
}
