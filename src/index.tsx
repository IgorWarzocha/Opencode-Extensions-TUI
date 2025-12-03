import { createCliRenderer, getTreeSitterClient } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import type { Extension } from "./types/extension";
import { SearchHeader } from "./components/SearchHeader";
import { CategorySidebar, CATEGORIES } from "./components/CategorySidebar";
import { ExtensionCard } from "./components/ExtensionCard";
import { ExtensionDetails } from "./detail/ExtensionDetails";
import { StatusBar } from "./components/StatusBar";
import { ocTheme } from "./theme";
import { loadExtensions } from "./data/loadExtensions";
const initialExtensions = await loadExtensions();

// Initialize tree-sitter client to ensure parsers are loaded
const tsClient = getTreeSitterClient();
await tsClient.initialize();

function App() {
  const [extensions, setExtensions] = useState<Extension[]>(initialExtensions);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'details' | 'search'>('list');
  const [terminalWidth, setTerminalWidth] = useState<number>(process.stdout.columns || 120);
  const [terminalHeight, setTerminalHeight] = useState<number>(process.stdout.rows || 30);

  useEffect(() => {
    const handler = () => {
      setTerminalWidth(process.stdout.columns || 120);
      setTerminalHeight(process.stdout.rows || 30);
    };
    process.stdout.on('resize', handler);
    return () => {
      process.stdout.off('resize', handler);
    };
  }, []);

  const sidebarWidth = 0;
  const availableWidth = Math.max(30, terminalWidth - 10);
  const maxLine = Math.max(20, availableWidth - 4);

  let mode = 'narrow';
  if (maxLine >= 100) mode = 'wide';
  else if (maxLine >= 50) mode = 'medium';

  const cardHeight = (mode === 'wide' ? 3 : mode === 'medium' ? 4 : 5);

  const listHeight = Math.max(4, terminalHeight - 14);
  const windowSize = Math.floor(listHeight / cardHeight);

  const filteredExtensions = extensions.filter((ext) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      ext.category === selectedCategory ||
      (selectedCategory === 'Featured' && ext.featured);
    const desc = ext.description?.toLowerCase() ?? '';
    const matchesSearch =
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentExtension = filteredExtensions[selectedIndex];

  const visibleWindow = Math.max(1, Math.min(windowSize, filteredExtensions.length));
  const half = Math.floor(visibleWindow / 2);
  const listStart = Math.max(
    0,
    Math.min(selectedIndex - half, filteredExtensions.length - visibleWindow)
  );
  const visibleExtensions = filteredExtensions.slice(listStart, listStart + visibleWindow);

  useEffect(() => {
    if (selectedIndex >= filteredExtensions.length) {
      setSelectedIndex(Math.max(0, filteredExtensions.length - 1));
    }
  }, [filteredExtensions.length, selectedIndex]);


  useKeyboard((key) => {
    if (view === 'search') {
      if (key.name === 'enter') {
        setView('list');
      } else if (key.name === 'backspace') {
        setSearchQuery((prev) => prev.slice(0, -1));
      } else if (key.sequence && key.sequence.length === 1) {
        setSearchQuery((prev) => prev + key.sequence);
      } else if (key.name === 'escape') {
        setView('list');
      }
      return;
    }

    if (view === 'details') {
      if (key.name === 'q') {
        process.exit(0);
        return;
      }
      if (key.name === 'i' || key.name === 'escape') {
        setView('list');
      }
      // Ignore list navigation while in details; ExtensionDetails handles scroll.
      return;
    }

    // Category Navigation: a/d or j/k (Left/Right)
    if (key.name === 'a' || key.name === 'j' || key.name === 'left') {
      const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
      const prevCatIndex = (currentCatIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
      const prevCat = CATEGORIES[prevCatIndex] ?? 'All';
      setSelectedCategory(prevCat);
      setSelectedIndex(0);
      return;
    }
    if (key.name === 'd' || key.name === 'k' || key.name === 'right') {
      const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
      const nextCatIndex = (currentCatIndex + 1) % CATEGORIES.length;
      const nextCat = CATEGORIES[nextCatIndex] ?? 'All';
      setSelectedCategory(nextCat);
      setSelectedIndex(0);
      return;
    }

    switch (key.name) {
      case 'q':
        process.exit(0);
        return;
      case 's':
      case 'l':
      case 'down':
        setSelectedIndex((prev) => Math.min(prev + 1, filteredExtensions.length - 1));
        break;
      case 'w':
      case 'o':
      case 'up':
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'tab': {
        // Keep tab cycling as backup
        const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
        const nextCatIndex = (currentCatIndex + 1) % CATEGORIES.length;
        const nextCat = CATEGORIES[nextCatIndex] ?? 'All';
        setSelectedCategory(nextCat);
        setSelectedIndex(0);
        break;
      }
      case 'i':
        setView((prev) => (prev === 'details' ? 'list' : 'details'));
        break;
      case 'enter':
        if (currentExtension && currentExtension.status === 'available') {
          setExtensions((prev) =>
            prev.map((ext) =>
              ext.id === currentExtension.id ? { ...ext, status: 'installed' } : ext
            )
          );
        }
        break;
      case 'u':
        if (currentExtension && currentExtension.status === 'installed') {
          setExtensions((prev) =>
            prev.map((ext) =>
              ext.id === currentExtension.id ? { ...ext, status: 'available' } : ext
            )
          );
        }
        break;
      case 'r':
        loadExtensions().then(setExtensions);
        break;
      case '/':
        setView('search');
        break;
    }
  });

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      flexShrink={1}
      padding={1}
      minHeight={0}
      backgroundColor={ocTheme.background}
    >
      <CategorySidebar selectedCategory={selectedCategory} />

      {view !== 'details' && (
        <box flexShrink={0} marginTop={1}>
          <SearchHeader
            searchQuery={searchQuery}
            totalCount={extensions.length}
            installedCount={extensions.filter((e) => e.status === 'installed').length}
            isSearching={view === 'search'}
          />
        </box>
      )}

      <box
        flexDirection="column"
        flexGrow={1}
        flexShrink={1}
        marginTop={1}
        backgroundColor={ocTheme.panel}
        borderStyle="single"
        borderColor={ocTheme.border}
        padding={0}
        paddingLeft={1}
        paddingRight={1}
      >
        {view === 'details' && currentExtension ? (
          <ExtensionDetails
            extension={currentExtension}
            isActive={view === 'details'}
            onClose={() => setView('list')}
          />
        ) : (
          <box flexDirection="column" flexGrow={1} flexShrink={1}>
            {filteredExtensions.length === 0 ? (
              <text>No extensions found.</text>
            ) : (
              visibleExtensions.map((ext, idx) => {
                const absoluteIndex = listStart + idx;
                return (
                  <ExtensionCard
                    key={ext.id}
                    extension={ext}
                    isSelected={absoluteIndex === selectedIndex}
                    availableWidth={availableWidth}
                  />
                );
              })
            )}
          </box>
        )}
      </box>

      <box marginTop={1} flexShrink={0}>
        <StatusBar />
      </box>
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
