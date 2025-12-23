/**
 * Main application component that orchestrates the extension browser interface.
 * Manages the overall application state including extensions, search, categories, and modal interactions.
 * Coordinates between various UI components and handles keyboard navigation and installation flows.
 */

import { useEffect, useState } from "react";
import type { Extension } from "./types/extension";
import { SearchHeader } from "./components/SearchHeader";
import { CategorySidebar } from "./components/CategorySidebar";
import { ExtensionDetails } from "./detail/ExtensionDetails";
import { StatusBar } from "./components/StatusBar";
import { ScriptModal } from "./components/ScriptModal";
import { NpmInstallModal } from "./components/NpmInstallModal";
import { ConfigEditorModal } from "./components/ConfigEditorModal";
import { AppLayout } from "./components/AppLayout";
import { ExtensionList } from "./components/ExtensionList";
import { AppKeyboardHandler } from "./components/AppKeyboardHandler";
import { useTerminalSize } from "./hooks/useTerminalSize";
import { useExtensionsState } from "./hooks/useExtensionsState";
import { useExtensionData } from "./hooks/useExtensionData";
import { calculateLayout } from "./utils/layout";
import { useInstallFlow } from "./hooks/useInstallFlow";

export default function App() {
  const { extensions: loadedExtensions, reloadExtensions: reloadExtensionData } = useExtensionData();

  const {
    extensions,
    setExtensions,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    view,
    setView,
    selectedIndex,
    setSelectedIndex,
    filteredExtensions,
    currentExtension,
  } = useExtensionsState(loadedExtensions);

  const { height: terminalHeight, dimensions } = useTerminalSize();
  const [detailsExtension, setDetailsExtension] = useState<Extension | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const { availableWidth, maxLine } = dimensions;
  const { mode, windowSize } = calculateLayout({
    width: availableWidth,
    height: terminalHeight,
    availableWidth,
    maxLine,
  });

  const {
    showScriptModal,
    showNpmModal,
    pendingInstallExtension,
    handleInstall,
    handleUninstall,
    handleScriptModalClose,
    handleScriptModalConfirm,
    handleNpmModalClose,
    handleNpmModalConfirm,
  } = useInstallFlow(setExtensions);

  // Sync details view cleanup
  const onUninstall = async (extension: Extension) => {
    await handleUninstall(extension);
    if (detailsExtension?.id === extension.id) {
      setDetailsExtension(null);
    }
  };

  useEffect(() => {
    if (selectedIndex >= filteredExtensions.length) {
      setSelectedIndex(Math.max(0, filteredExtensions.length - 1));
    }
  }, [filteredExtensions.length, selectedIndex]);

  return (
    <>
      <AppKeyboardHandler
        view={view}
        setView={setView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        filteredExtensions={filteredExtensions}
        currentExtension={currentExtension}
        detailsExtension={detailsExtension}
        setDetailsExtension={setDetailsExtension}
        onInstall={handleInstall}
        onUninstall={onUninstall}
        reloadExtensions={async () => {
          const next = await reloadExtensionData();
          setExtensions(next);
        }}
        onOpenConfig={() => setShowConfigModal(true)}
        isBlocked={showScriptModal || showNpmModal || showConfigModal}
      />
      <AppLayout
        sidebar={<CategorySidebar selectedCategory={selectedCategory} />}
        header={
          view !== 'details' ? (
            <SearchHeader
              searchQuery={searchQuery}
              totalCount={extensions.length}
              installedCount={extensions.filter((e) => e.status === 'installed').length}
              isSearching={view === 'search'}
            />
          ) : null
        }
        body={
          view === 'details' && detailsExtension ? (
            <ExtensionDetails
              extension={detailsExtension}
              isActive={view === 'details' && !showScriptModal && !showNpmModal}
              onClose={() => setView('list')}
            />
          ) : (
            <ExtensionList
              extensions={filteredExtensions}
              selectedIndex={selectedIndex}
              windowSize={windowSize}
              mode={mode}
              maxLine={maxLine}
            />
          )
        }
        footer={<StatusBar view={showScriptModal || showNpmModal ? 'modal' : view} />}
      />
      {/* Floating modal overlay */}
      <ScriptModal
        extension={pendingInstallExtension}
        isVisible={showScriptModal}
        onClose={handleScriptModalClose}
        onConfirm={handleScriptModalConfirm}
      />
      <NpmInstallModal
        extension={pendingInstallExtension}
        isVisible={showNpmModal}
        onClose={handleNpmModalClose}
        onConfirm={handleNpmModalConfirm}
      />
      <ConfigEditorModal
        isVisible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </>
  );
}
