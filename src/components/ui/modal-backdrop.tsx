/**
 * Full-screen modal backdrop that captures mouse clicks outside dialogs.
 * It dims the background slightly and triggers close on click for better UX.
 */

import { MouseButton } from "@opentui/core";
import { ocTheme } from "../../theme";

interface ModalBackdropProps {
  onClose: () => void;
  zIndex?: number;
}

export function ModalBackdrop({ onClose, zIndex = 80 }: ModalBackdropProps) {
  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width="100%"
      height="100%"
      zIndex={zIndex}
      backgroundColor={ocTheme.background}
      opacity={0.6}
      onMouseDown={(event) => {
        if (event.button !== MouseButton.LEFT) return;
        onClose();
      }}
    />
  );
}
