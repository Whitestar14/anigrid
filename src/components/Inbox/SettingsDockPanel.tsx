import React, { useRef } from "react";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";
import { Toggle } from "@/components/ui/Toggle";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Save, Upload, ShieldAlert, Palette, Layers, Minimize2 } from "lucide-react";
import { exportStateToJson } from "@/utils/storage";
import { SettingButtonGroup, SettingRow } from "@/components/ui/SettingCard";

export const SettingsDockPanel: React.FC<{ requestConfirm?: (title: string, message: string, onConfirm: () => void) => void }> = ({ requestConfirm }) => {
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

  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => exportStateToJson(useStore.getState());

  const handleImportJson = async (file: File) => {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (json) useStore.getState().importState(json);
    } catch (e) {
      console.error("Failed to import JSON", e);
      alert("Invalid JSON file");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">

      <div className="flex flex-col gap-2 relative">
        <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-2">
          Appearance
        </span>
        <SettingButtonGroup>
          <SettingRow
            asLabel
            icon={<Palette size={16} />}
            iconBg="bg-blue-500/20 text-blue-400"
            label="Accent color"
            right={
              <div className="relative h-7 w-12 rounded-md overflow-hidden border border-white/10 bg-transparent flex items-center justify-center cursor-pointer">
                <div className="absolute inset-0" style={{ backgroundColor: accent }} />
                <ColorPicker
                  value={accent}
                  onChange={(v) => updateTheme({ accentColor: v })}
                />
              </div>
            }
          />
          <SettingRow
            asLabel
            icon={<Layers size={16} />}
            iconBg="bg-indigo-500/20 text-indigo-400"
            label="Reduce glass effects"
            sublabel="Improves scrolling performance, but disables blurs."
            right={
              <Toggle
                checked={reduceGlass}
                onCheckedChange={(v) => updatePreferences({ reduceGlassEffects: v })}
              />
            }
          />
          <SettingRow
            asLabel
            icon={<Minimize2 size={16} />}
            iconBg="bg-purple-500/20 text-purple-400"
            label="Auto-close dock"
            sublabel="Hides the dock while dragging items out."
            right={
              <Toggle
                checked={autoCloseDesktop}
                onCheckedChange={(v) => updatePreferences({ autoCloseDockOnDragDesktop: v })}
              />
            }
          />
        </SettingButtonGroup>
      </div>

      <div className="flex flex-col gap-2 relative">
        <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-2">
          Data Actions
        </span>
        <SettingButtonGroup>
          <SettingRow
            icon={<Save size={16} />}
            iconBg="bg-green-500/20 text-green-400"
            label="Backup Data"
            sublabel="Export all your ranks, images, and settings to a JSON file."
            onClick={handleExportJson}
          />
          <SettingRow
            icon={<Upload size={16} />}
            iconBg="bg-orange-500/20 text-orange-400"
            label="Restore Data"
            sublabel="Import a previously exported JSON backup file."
            onClick={() => {
              if (requestConfirm) {
                requestConfirm(
                  "Restore Backup?",
                  "This will overwrite all current ranks, images, and collections with the data from your backup file. This cannot be undone.",
                  () => jsonInputRef.current?.click()
                );
              } else {
                jsonInputRef.current?.click();
              }
            }}
          />
          <SettingRow
            icon={<ShieldAlert size={16} />}
            iconBg="bg-red-500/20 text-red-500"
            label="Wipe All App Data"
            sublabel="Deletes all local storage. Cannot be reversed."
            destructive
            onClick={() => {
              if (requestConfirm) {
                requestConfirm(
                  "Wipe All App Data?",
                  "This will delete everything including all ranks, collections, and preferences. It cannot be undone.",
                  () => {
                    localStorage.removeItem("anime-ranker-state");
                    indexedDB.deleteDatabase("keyval-store");
                    window.location.reload();
                  }
                );
              }
            }}
          />
        </SettingButtonGroup>
      </div>

      <input
        type="file"
        ref={jsonInputRef}
        className="hidden"
        accept="application/json"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImportJson(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      <div className="h-4" />
    </div>
  );
};

