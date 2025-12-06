import { t, bold, dim, cyan } from '@opentui/core';
import { ocTheme } from '../theme';
import { CATEGORIES } from '../constants/categories';

interface CategorySidebarProps {
  selectedCategory: string;
}



export function CategorySidebar({ selectedCategory }: CategorySidebarProps) {
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
          >
            <text content={content} />
          </box>
        );
      })}
    </box>
  );
}

