/**
 * Reusable button for modal actions with consistent styling and mouse handling.
 * It centralizes click behavior so modal footers stay clean and predictable.
 */

import type { StyledText, TextChunk } from "@opentui/core";
import { MouseButton, t } from "@opentui/core";
import { ocTheme } from "../../theme";

interface ModalActionButtonProps {
  content: StyledText | TextChunk | string;
  onPress: () => void;
  borderColor?: string;
  backgroundColor?: string;
  isDisabled?: boolean;
  showBorder?: boolean;
}

export function ModalActionButton({
  content,
  onPress,
  borderColor = ocTheme.border,
  backgroundColor,
  isDisabled = false,
  showBorder = true,
}: ModalActionButtonProps) {
  const normalizedContent =
    typeof content === "string"
      ? t`${content}`
      : content && typeof content === "object" && "chunks" in content
        ? content
        : content && typeof content === "object" && "__isChunk" in content
          ? t`${content}`
          : t`${String(content)}`;

  return (
    <box
      paddingLeft={1}
      paddingRight={1}
      borderStyle={showBorder ? "single" : undefined}
      borderColor={showBorder ? borderColor : undefined}
      backgroundColor={backgroundColor}
      opacity={isDisabled ? 0.6 : 1}
      onMouseDown={(event) => {
        if (event.button !== MouseButton.LEFT) return;
        if (isDisabled) return;
        onPress();
      }}
    >
      <text content={normalizedContent} />
    </box>
  );
}
