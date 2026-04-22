import React from "react";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";
import { Toggle } from "@/components/ui/Toggle";
import { ColorPicker } from "@/components/ui/ColorPicker";

export const SettingsDockPanel: React.FC = () => {
  const { accent, reduceGlass, autoCloseDesktop, updateTheme, updatePreferences } =
    useStore(
      useShallow((s) => ({
        accent: s.theme?.accentColor ?? "#3b82f6",
        reduceGlass: s.preferences.reduceGlassEffects ?? false,
        autoCloseDesktop: s.preferences.autoCloseDockOnDragDesktop ?? false,
        updateTheme: s.updateGlobalTheme,
        updatePreferences: s.updatePreferences,
      })),
    );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
      <div className="flex flex-col bg-[#2c2c2e] rounded-2xl overflow-hidden">
        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[15px] font-normal text-white">Accent color</span>
          <div className="relative h-8 w-14 rounded-md overflow-hidden border border-white/10 bg-transparent flex items-center justify-center">
            <div className="absolute inset-0" style={{ backgroundColor: accent }} />
            <ColorPicker
              value={accent}
              onChange={(v) => updateTheme({ accentColor: v })}
            />
          </div>
        </label>
        
        <div className="h-px bg-[#38383a] ml-4" />
        
        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 pr-2">
            <div className="text-[15px] font-normal text-white">Reduce glass effects</div>
            <div className="text-[13px] text-white/50 leading-snug mt-0.5">
              Turns off backdrop blur for smoother frames on weak GPUs.
            </div>
          </div>
          <Toggle
            checked={reduceGlass}
            onCheckedChange={(v) => updatePreferences({ reduceGlassEffects: v })}
          />
        </label>
        
        <div className="h-px bg-[#38383a] ml-4" />
        
        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 pr-2">
            <div className="text-[15px] font-normal text-white">Auto-close dock on drag</div>
            <div className="text-[13px] text-white/50 leading-snug mt-0.5">
              Hides the dock while dragging items out.
            </div>
          </div>
          <Toggle
            checked={autoCloseDesktop}
            onCheckedChange={(v) =>
              updatePreferences({ autoCloseDockOnDragDesktop: v })
            }
          />
        </label>
      </div>
    </div>
  );
};
