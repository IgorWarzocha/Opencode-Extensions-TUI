/**
 * Application entry point that initializes and renders the OpenTUI interface.
 * Creates the CLI renderer and mounts the main App component to the terminal interface.
 * Serves as the bootstrap file that connects the React application to the OpenTUI rendering system.
 */

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import App from "./App";

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
