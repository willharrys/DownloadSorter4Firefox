# Changelog

All notable changes to the Download Sorter Firefox Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0] - 2025-01-23

### 🎉 Initial Release
- **Automatic Organization**: Downloads are automatically sorted into folders based on file extensions
- **Customizable Rules**: Create your own rules to match file extensions with folder destinations
- **Smart Patterns**: Support for wildcards and multiple extensions (e.g., `*.zip`, `jpg,png,gif`)
- **Default Folder**: Set a fallback folder for files that don't match any rules
- **Modern Interface**: Clean, intuitive options page with drag-and-drop support
- **Quick File Type Presets**: Pre-configured presets for common file types
- **Custom Extensions**: Add your own file type patterns with auto-folder suggestions
- **Secure**: Input validation and sanitization for enhanced security
- **Performance Optimized**: Lightweight with minimal resource usage
- **Firefox Optimized**: Specifically designed for Firefox using WebExtensions API

### 🔧 Technical Features
- **WebRequest Integration**: Uses webRequest API for download detection
- **Content-Disposition Support**: Detects downloads via HTTP headers
- **Secure Storage**: Uses browser.storage.sync with localStorage fallback
- **Error Handling**: Robust error handling and recovery
- **Security**: Enhanced Content Security Policy and input validation

---

## Legend

- 🎉 **Major Features**: Significant new functionality
- 🔒 **Security**: Security-related improvements
- ⚡ **Performance**: Performance optimizations
- 🎨 **UI/UX**: User interface and experience improvements
- 🔧 **Technical**: Technical improvements and developer experience
- 🐛 **Bug Fixes**: Bug fixes and stability improvements
- ⚠️ **Breaking Changes**: Changes that break backwards compatibility
- 📝 **Documentation**: Documentation improvements 