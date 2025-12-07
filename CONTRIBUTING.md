# Contributing to OpenCode Extensions TUI

**Current Stage: Peer Review & Community Feedback**

This TUI is at the **peer review stage** and community suggestions are welcome! We're focusing on UX consistency, performance, and creating a seamless extension management experience.

---

## How to Contribute

### Report Issues & Suggestions
Found something that could be improved? **Please open an issue!** We welcome feedback on:

**UX/UI Consistency:**
- "This modal should look the same as other ones"
- "Keyboard shortcuts should match OpenCode standards"
- "Navigation feels inconsistent between views"

**Workflow Improvements:**
- Installation experience friction points
- Search and filtering suggestions  
- Extension organization ideas

**Technical Enhancements:**
- Performance optimization opportunities
- New installation method support
- Database schema improvements

### Code Contributions
**Pull requests are welcome** for:
- Bug fixes and performance improvements
- New installation method integrations
- Enhanced error handling and user feedback
- Documentation and testing improvements

---

## Current Focus Areas

**UI/UX Polish:**
- Plugin uninstallation via opencode.json editor modal
- Modal consistency and responsive design
- Keyboard shortcut standardization (match OpenCode patterns)
- Loading states and error messaging

**Performance:**
- Search and filtering optimization
- Large README rendering performance
- Database query efficiency

**Extension Management:**
- Better dependency resolution for npm packages
- Improved error recovery during installations
- Extension update workflows

---

## Database Management

**Current State: Manual Curation**
- Extension submissions are manually reviewed and processed
- Database is updated by maintainers after validation
- See [FAQ.md](FAQ.md) for detailed submission workflow

**Future Roadmap:**
- Semi-automated submission processing
- AI-assisted extension validation
- Automated database updates and deployment

---

## Development Guidelines

**Quick Setup:**
```bash
git clone https://github.com/IgorWarzocha/Opencode-Extensions-TUI.git
cd Opencode-Extensions-TUI
bun install
bun dev
```

**Code Style:** See [AGENTS.md](AGENTS.md) for detailed development guidelines
**Architecture:** See [FAQ.md](FAQ.md) for system overview and workflows
**Testing:** `bun test` (single file: `bun test path/to.test.ts`)

---

## Contribution Examples

**Good Issue Examples:**
- "Modal X should use same padding as Modal Y for consistency"
- "Keyboard shortcut Z should follow OpenCode pattern: [Ctrl/Cmd] + Z"
- "Search results should highlight matched text like in OpenCode"

**Good PR Examples:**
- Fix keyboard navigation inconsistency in detail view
- Add loading spinner during extension installation
- Improve error messages to be more actionable

---

## Getting Started

1. **Browse existing issues** for inspiration
2. **Fork the repository** and create a feature branch
3. **Follow development guidelines** in [AGENTS.md](AGENTS.md)
4. **Test thoroughly** with various extension types
5. **Submit PR** with clear description of changes

**Questions?** Check the [FAQ.md](FAQ.md) first, then open an issue for anything not covered.

---

*This is a community project and is not an official SST/Opencode initiative.*