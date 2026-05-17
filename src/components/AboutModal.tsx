import React from 'react';
import { Modal } from './ui/Modal';
import { SettingButtonGroup, SettingRow } from './ui/SettingCard';
import { Github, ExternalLink } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[280px] max-h-[500px]"
      contentClassName="p-0 overflow-hidden rounded-[22px]"
    >
      <div className="flex flex-col items-center pt-12 pb-2">

        <h2 className="text-[22px] font-bold text-text tracking-tight mb-1">Ranku</h2>
        <p className="text-[13px] font-medium text-muted/60">ランクウ</p>
        <p className="text-[13px] font-medium text-muted/60 mb-6">Version 0.9.3</p>

        <div className="w-full px-4 mb-4">
          <SettingButtonGroup className="bg-surface-elevated/40 rounded-[14px] overflow-hidden">
            <SettingRow
              as="div"
              label={<span className="text-[14px]">Developer</span>}
              right={<span className="text-[14px] text-muted font-medium">Stud.io</span>}
              className="min-h-[44px] py-0"
            />
            <SettingRow
              as="div"
              label={<span className="text-[14px]">License</span>}
              right={<span className="text-[14px] text-muted font-medium">MIT</span>}
              className="min-h-[44px] py-0"
            />
            <SettingRow
              as="a"
              // @ts-ignore
              href="https://github.com/Whitestar14/anigrid"
              target="_blank"
              label={<span className="text-[14px]">Source Code</span>}
              right={<ExternalLink size={14} className="text-muted/50" />}
              className="min-h-[44px] py-0"
            />
          </SettingButtonGroup>
        </div>

        <p className="text-[11px] text-muted/40 text-center px-8 mb-6 leading-tight font-medium">
          Ranku is an anime ranking board and tier list editor. Drag, drop, and organize your favorite shows with fluid, responsive animations.
        </p>

        <div className="w-full border-t border-border/60">
          <button
            onClick={onClose}
            className="w-full py-3.5 text-[17px] text-primary font-semibold hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
