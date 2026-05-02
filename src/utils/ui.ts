export const ASPECT_MAP: Record<string, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]'
};

export const LIST_ASPECT_MAP: Record<string, string> = {
  '1:1': 'aspect-square w-20',
  '3:4': 'aspect-[3/4] w-16 sm:w-20',
  '4:3': 'aspect-[4/3] w-24 sm:w-28',
  '16:9': 'aspect-video w-28 sm:w-32',
  '9:16': 'aspect-[9/16] w-14 sm:w-16'
};

export const TIER_ASPECT_MAP: Record<string, string> = {
  "1:1": "w-24 h-24",
  "3:4": "w-24 h-32",
  "4:3": "w-32 h-24",
  "16:9": "w-[136px] h-20",
  "9:16": "w-20 h-32",
};
