#!/bin/bash
# Quick converter script for VS Code extension icon
# VS Code 扩展图标快速转换脚本

echo "🎨 Converting SVG to PNG for VS Code Extension..."

# Activate virtual environment and run converter
source .venv/bin/activate
python scripts/svg_to_png.py

echo "✅ Icon conversion complete!"
