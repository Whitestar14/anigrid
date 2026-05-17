import React from "react";

/**
 * SettingButtonGroup — structural container ONLY.
 * Callers are responsible for providing surface styling via className.
 *
 * Settings panel (dock):  className="bg-surface border border-border rounded-[20px] overflow-hidden"
 * Grid sidebar toggles:   className="glass rounded-[20px] overflow-hidden"
 *
 * This separation is intentional: the two contexts have different background
 * contrast requirements and must never share a hardcoded surface style.
 */
export const SettingButtonGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  return (
    <div className={`flex flex-col flex-shrink-0 ${className}`}>
      {childrenArray.map((child, idx) => (
        <React.Fragment key={idx}>
          {child}
          {idx < childrenArray.length - 1 && (
            <div className="h-[0.5px] bg-border" />
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
  onClick?: (e: React.MouseEvent) => void;
  right?: React.ReactNode;
  destructive?: boolean;
  className?: string;
  asLabel?: boolean;
  as?: "div" | "button" | "label" | "a";
  href?: string;
  target?: string;
  rel?: string;
}> = ({
  icon,
  label,
  sublabel,
  iconBg = "bg-primary/20 text-primary",
  onClick,
  right,
  destructive,
  className = "",
  asLabel,
  as,
  ...rest
}) => {
  const Component = as || (asLabel ? "label" : onClick ? "button" : "div");
  const isBtn = Component === "button";
  const isClickable = !!onClick || asLabel || Component === "a";

  return (
    <Component
      type={isBtn ? "button" : undefined}
      onClick={onClick}
      role={!isBtn && (onClick || Component === "a") ? "button" : undefined}
      tabIndex={!isBtn && (onClick || Component === "a") ? 0 : undefined}
      className={`relative flex items-center gap-3.5 px-4 py-2 min-h-[56px] w-full text-left transition-colors ${
        isClickable ? "hover:bg-hover active:bg-black/5 dark:active:bg-white/5 cursor-pointer" : ""
      } ${destructive ? "text-red-500" : "text-text"} ${className}`}
      {...rest}
    >
      {icon && (
        <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 ${iconBg} shadow-sm`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0 pr-2">
        <div className={`text-[15px] font-medium truncate ${destructive ? "text-red-500" : ""}`}>
          {label}
        </div>
        {sublabel && (
          <div className={`text-[13px] leading-snug mt-0.5 hidden sm:block ${destructive ? "text-red-500/60" : "text-muted"}`}>
            {sublabel}
          </div>
        )}
      </div>
      {right && <div className="shrink-0 flex items-center">{right}</div>}
    </Component>
  );
};
