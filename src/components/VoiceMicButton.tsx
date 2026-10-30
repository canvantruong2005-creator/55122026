import React from 'react';

export interface VoiceMicButtonProps {
  onTranscript?: (deltaText: string, fullSessionText?: string) => void;
  onLiveText?: (liveText: string, isFinal: boolean) => void;
  onListeningChange?: (listening: boolean) => void;
  className?: string;
  buttonTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = () => {
  return null;
};

