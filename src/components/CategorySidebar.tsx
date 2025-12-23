/**
 * Category filter sidebar with selection highlighting.
 * Displays available extension categories and highlights the currently selected one.
 */

import { MouseButton, t, bold, dim, cyan } from "@opentui/core";
import { ocTheme } from "../theme";
import { CATEGORIES, type Category } from "../constants/categories";

interface CategorySidebarProps {
  selectedCategory: Category;
  onSelectCategory?: (category: Category) => void;
  isInteractive?: boolean;
}

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  isInteractive = true,
}: CategorySidebarProps) {
  return (
    <box
      flexDirection="row"
      height={3}
      padding={0}
      columnGap={1}
      backgroundColor={ocTheme.panel}
      borderStyle="single"
      borderColor={ocTheme.border}
      title="Categories"
    >
      {CATEGORIES.map((label) => {
        const isSelected = selectedCategory === label;
        const bg = isSelected ? ocTheme.element : ocTheme.panel;
        const content = isSelected ? t`${bold(cyan(label))}` : t`${dim(label)}`;

        return (
          <box
            key={label}
            backgroundColor={bg}
            padding={0}
            paddingLeft={1}
            paddingRight={1}
            onMouseDown={(event) => {
              if (!isInteractive) return;
              if (event.button !== MouseButton.LEFT) return;
              if (onSelectCategory) onSelectCategory(label);
            }}
          >
            <text content={content} />
          </box>
        );
      })}
    </box>
  );
}
