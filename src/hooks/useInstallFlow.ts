/**
 * Hook for managing the installation and uninstallation flow of extensions.
 * Handles modal states, installation options, and coordinates with the installation service.
 */
import { useState } from "react";
import type { Extension } from "../types/extension";
import type { InstallationOptions } from "../services/installation/types";
import { InstallationService } from "../services/installation/InstallationService";
import { getErrorMessage } from "../services/installation/InstallationError";
import { OpencodeConfigService } from "../services/config/OpencodeConfigService";
import type { InstallSelection } from "../components/NpmInstallModal";

function derivePackageName(extension: Extension): string {
  // Prefer explicit install command when it is a package name; otherwise fall back to name
  // With the current schema we do not store package_name separately
  if (extension.install_command && extension.install_method === 'npm') {
    return extension.install_command;
  }
  return extension.name;
}

export function useInstallFlow(
  setExtensions: React.Dispatch<React.SetStateAction<Extension[]>>
) {
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showNpmModal, setShowNpmModal] = useState(false);
  const [pendingInstallExtension, setPendingInstallExtension] = useState<Extension | null>(null);

  const installationService = new InstallationService();

  const handleInstall = async (extension: Extension, options: InstallationOptions = {}) => {
    // NPM extension or Agent extension -> Options Modal for global/local choice
    if (
      extension.install_method === 'npm' ||
      extension.install_method === 'bash' ||
      extension.install_method === 'agents'
    ) {
      setPendingInstallExtension(extension);
      setShowNpmModal(true);
      return;
    }

    // Direct install (e.g. drop)
    await installationService.install(extension, options, (extensionId, status) => {
      setExtensions((prev) =>
        prev.map((ext) => (String(ext.id) === String(extensionId) ? { ...ext, status } : ext))
      );
    });
  };

  const handleUninstall = async (extension: Extension) => {
    await installationService.uninstall(extension, (extensionId, status) => {
      setExtensions((prev) =>
        prev.map((ext) => (String(ext.id) === String(extensionId) ? { ...ext, status } : ext))
      );
    });
  };

  // --- Bash Script Modal Handlers ---

  const handleScriptModalClose = () => {
    setShowScriptModal(false);
    setPendingInstallExtension(null);
  };

  const handleScriptModalConfirm = async (): Promise<{ success: boolean; error?: string }> => {
    if (!pendingInstallExtension?.install_command) {
      return { success: false, error: 'No install command' };
    }

    const result = await installationService.install(pendingInstallExtension);

    if (result.success) {
      setExtensions((prev) =>
        prev.map((ext) =>
          ext.id === pendingInstallExtension!.id ? { ...ext, status: 'installed' } : ext
        )
      );
      return { success: true };
    } else {
      return { success: false, error: getErrorMessage(result.error) };
    }
  };

  // --- NPM Modal Handlers ---

  const handleNpmModalClose = () => {
    setShowNpmModal(false);
    setPendingInstallExtension(null);
  };

  const handleNpmModalConfirm = async (selection: InstallSelection): Promise<{ success: boolean; message?: string }> => {
    if (!pendingInstallExtension) return { success: false, message: "No extension selected" };

    const isGlobal = selection.scope === 'global';

    if (pendingInstallExtension.install_method === 'npm') {
      const configService = new OpencodeConfigService();
      const packageName = derivePackageName(pendingInstallExtension);
      
      const result = await configService.addPlugin(packageName, selection.scope);

      if (result.success) {
        setExtensions((prev) =>
          prev.map((ext) =>
            ext.id === pendingInstallExtension!.id ? { ...ext, status: 'installed' } : ext
          )
        );
        return { success: true, message: result.message };
      } else {
        console.error("Failed to add plugin:", result.message);
        return { success: false, message: result.message };
      }
    }

    if (pendingInstallExtension.install_method === 'bash' || pendingInstallExtension.install_method === 'agents') {
      const result = await installationService.install(pendingInstallExtension, { global: isGlobal });

      if (result.success) {
        setExtensions((prev) =>
          prev.map((ext) =>
            ext.id === pendingInstallExtension!.id ? { ...ext, status: 'installed' } : ext
          )
        );
        return { success: true, message: `Agent installed ${isGlobal ? 'globally' : 'locally'}.` };
      } else {
        return { success: false, message: getErrorMessage(result.error) };
      }
    }

    return { success: false, message: "Unsupported install method" };
  };

  return {
    showScriptModal,
    showNpmModal,
    pendingInstallExtension,
    handleInstall,
    handleUninstall,
    handleScriptModalClose,
    handleScriptModalConfirm,
    handleNpmModalClose,
    handleNpmModalConfirm,
  };
}
