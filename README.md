# Download Sorter for Firefox

> **Automatically organize your downloads into folders based on file types**

[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange?logo=firefox)](https://addons.mozilla.org/firefox/addon/DownloadSorter4Firefox/)
[![Version](https://img.shields.io/badge/version-1.0-blue)](https://github.com/willharrys/DownloadSorter4Firefox/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Download Sorter is a Firefox extension that automatically organizes your downloads into folders based on customizable file extension rules. Keep your Downloads folder clean and organized without any manual effort.

## ✨ Features

- **🚀 Automatic Organization**: Downloads are sorted into folders instantly
- **⚙️ Customizable Rules**: Create your own rules to match file extensions with folders
- **🎯 Smart Patterns**: Support for wildcards and multiple extensions (e.g., `*.zip`, `jpg,png,gif`)
- **📁 Default Folder**: Set a fallback folder for unmatched files
- **🎨 Modern Interface**: Clean, intuitive options page with drag-and-drop support
- **🔒 Secure**: Input validation and sanitization for enhanced security
- **⚡ Performance Optimized**: Lightweight with minimal resource usage

## 📦 Installation

### From Firefox Add-ons Store (Recommended)
1. Visit the [Firefox Add-ons page](https://addons.mozilla.org/en-GB/firefox/addon/downloadsorter4firefox/)
2. Click "Add to Firefox"
3. Configure your rules by clicking the extension icon

### Manual Installation (Development)
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select the `manifest.json` file

## 🎯 How It Works

### Basic Usage
1. **Install** the extension
2. **Click** the Download Sorter icon in your toolbar
3. **Configure** your sorting rules
4. **Save** your settings
5. **Download** files and watch them get organized automatically!

### Example Rules
| Extension Pattern | Folder Name | What It Matches |
|-------------------|-------------|-----------------|
| `pdf,doc,docx` | `documents` | PDF and Word files |
| `jpg,jpeg,png,gif` | `images` | Common image formats |
| `mp4,avi,mkv` | `videos` | Video files |
| `zip,rar,7z` | `archives` | Compressed files |
| `exe,msi` | `programs` | Executable files |

### Organized Folder Structure
```
📁 Downloads/
├── 📁 documents/
│   ├── 📄 report.pdf
│   └── 📄 presentation.pptx
├── 📁 images/
│   ├── 🖼️ photo.jpg
│   └── 🖼️ screenshot.png
├── 📁 videos/
│   └── 🎬 movie.mp4
└── 📁 downloads/
    └── 📄 other-file.xyz
```

## 🎨 Interface Features

### Quick File Type Presets
Click any preset to instantly add a rule:
- **Documents**: PDF, Word, Excel, PowerPoint, Text
- **Images**: JPEG, PNG, GIF, SVG, WebP
- **Media**: Video and Audio files
- **Archives**: ZIP, RAR, 7Z, TAR/GZ
- **Programs**: EXE, MSI, DMG, DEB

### Drag & Drop Support
- Drag any preset to an existing rule's extension field
- Visual feedback with hover effects
- Smart merging - won't duplicate existing extensions

### Custom Extensions
- Type your own extension patterns
- Auto-suggests appropriate folder names
- Supports complex patterns with commas and wildcards

## 🔧 Technical Details

### Browser Compatibility
- **Firefox 60+** (uses WebExtensions API)
- **Secure**: Follows Firefox security best practices
- **Privacy-focused**: No data collection or external connections

### Architecture
- **Event-driven**: Efficient background script that only runs when needed
- **Secure storage**: Uses browser.storage.sync with localStorage fallback
- **Input validation**: All user inputs are sanitized and validated
- **Performance optimized**: Minimal memory footprint and CPU usage

### Permissions Explained
- `downloads` - Required to organize downloads
- `storage` - Required to save your custom rules
- `webRequest` - Required to detect download events
- `<all_urls>` - Required to intercept downloads from any website

## 🛠️ Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/willharrys/download-sorter-firefox.git
cd download-sorter-firefox

# No build process required - pure WebExtensions
# Load the extension directory in Firefox for testing
```

### Project Structure
```
download-sorter-firefox/
├── manifest.json          # Extension configuration
├── bg.js                  # Background script
├── options.html           # Options page UI
├── options.js             # Options page logic
└── README.md              # This file
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security & Privacy

- **No data collection**: Extension works entirely locally
- **Input sanitization**: All user inputs are validated and sanitized
- **Secure CSP**: Content Security Policy prevents code injection
- **Minimal permissions**: Only requests necessary permissions
- **Open source**: Code is transparent and auditable

## 📋 Changelog

### Version 1.0 (Latest)
- ✨ Initial release with automatic download organization
- 🎨 Modern, responsive options page with drag-and-drop support
- 🔒 Secure input validation and sanitization
- ⚡ Performance optimized for minimal resource usage
- 🎯 Smart file type presets and custom extension support

## 🤝 Support

### Getting Help
- 📖 Check this README for common questions
- 🐛 [Report bugs](https://github.com/willharrys/DownloadSorter4Firefox/issues) on GitHub
- 💡 [Request features](https://github.com/willharrys/DownloadSorter4Firefox/issues) on GitHub

### Known Limitations
- Downloads initiated via "Save As" dialog cannot be automatically organized (Firefox limitation)
- Some download methods may bypass automatic detection
- Requires manual save of settings (no auto-save)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Acknowledgments

- Built with ❤️ for the Firefox community

---

**Made with ❤️ for Firefox users who love organized downloads!**
