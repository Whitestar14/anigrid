import React from 'react';
import { Modal } from './ui/Modal';
import { SettingButtonGroup, SettingRow } from './ui/SettingCard';
import { ExternalLink } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[310px]"
      contentClassName="p-0 overflow-hidden"
    >
      <div className="flex flex-col items-center pt-8 pb-0">
        {/* App Icon */}
        <div className="relative w-20 h-20 bg-primary rounded-[22px] flex items-center justify-center shadow-md mb-4 mt-2 overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
          <span className="text-5xl font-bold tracking-tighter text-white drop-shadow-sm select-none z-10 leading-none pb-1">
            R
          </span>
        </div>

        <h2 className="text-[22px] font-bold text-text tracking-tight mb-1">Ranku</h2>
        <p className="text-[13px] text-muted mb-6">Version 0.9.1</p>

        <div className="w-full px-6 mb-6">
          <p className="text-[14px] text-text text-center leading-relaxed md:leading-normal mb-8 opacity-90">
            A local-first ranking board and tier list editor. Drag, drop, and organize your favorite items with fluid, responsive animations.
          </p>

          <SettingButtonGroup className="bg-surface-secondary border border-border rounded-xl w-full">
            <SettingRow
              as="div"
              label={<span className="text-[13.5px] font-medium text-text">Developer</span>}
              right={<span className="text-[13.5px] text-muted font-medium">Stud.io</span>}
              className="min-h-[42px] py-2"
            />
            <SettingRow
              as="div"
              label={<span className="text-[13.5px] font-medium text-text">License</span>}
              right={<span className="text-[13.5px] text-muted font-medium">MIT</span>}
              className="min-h-[42px] py-2"
            />
            <SettingRow
              as="a"
              // @ts-ignore
              href="https://github.com/Whitestar14/anigrid"
              target="_blank"
              label={<span className="text-[13.5px] font-medium text-text">GitHub</span>}
              right={
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-muted font-medium">Whitestar14</span>
                  <ExternalLink size={14} className="text-muted/60" />
                </div>
              }
              className="min-h-[42px] py-2 hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors"
            />
          </SettingButtonGroup>
        </div>

        {/* Done Button with standard iOS border divider */}
        <div className="w-full border-t border-border/40">
          <button
            onClick={onClose}
            className="w-full py-3.5 text-[17px] text-primary font-semibold hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer select-none"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
