import React from "react";

export const SettingButtonGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  return (
    <div className={`flex flex-col flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {childrenArray.map((child, idx) => (
        <React.Fragment key={idx}>
          {child}
          {idx < childrenArray.length - 1 && (
            <div className="h-px bg-white/10 ml-4" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const SettingRow: React.FC<{
  icon?: React.ReactNode;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  className?: string;
  asLabel?: boolean;
}> = ({ icon, label, sublabel, iconBg = "bg-primary/20 text-primary", onClick, right, destructive, className = "", asLabel }) => {
  const Component = asLabel ? "label" : onClick ? "button" : "div";
  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-colors ${
        onClick || asLabel ? "hover:bg-white/5 cursor-pointer" : ""
      } ${destructive ? "text-[#ff453a]" : "text-white"} ${className}`}
    >
      {icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0 pr-2">
        <div className={`text-[15px] font-medium truncate ${destructive ? "text-[#ff453a] group-hover:text-red-400" : ""}`}>{label}</div>
        {sublabel && (
          <div className={`text-[13px] leading-snug mt-0.5 truncate ${destructive ? "text-[#ff453a]/60 group-hover:text-red-400/80" : "text-white/50"}`}>{sublabel}</div>
        )}
      </div>
      {right && <div className="shrink-0 flex items-center">{right}</div>}
    </Component>
  );
};
