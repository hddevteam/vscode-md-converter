#!/usr/bin/env python3
"""
SVG to PNG Converter for VS Code Extension Icon
将 SVG 图标转换为 PNG 格式，用于 VS Code 扩展
"""

import os
import sys
from pathlib import Path
import cairosvg
from PIL import Image
import io

def svg_to_png(svg_path: str, png_path: str, size: int = 512):
    """
    Convert SVG file to PNG with specified size
    将 SVG 文件转换为指定尺寸的 PNG 文件
    
    Args:
        svg_path: Path to the input SVG file
        png_path: Path to the output PNG file  
        size: Output size in pixels (default: 512x512)
    """
    try:
        # Read SVG file
        with open(svg_path, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        
        # Convert SVG to PNG bytes
        png_bytes = cairosvg.svg2png(
            bytestring=svg_content.encode('utf-8'),
            output_width=size,
            output_height=size
        )
        
        # Ensure we have valid bytes
        if png_bytes is None:
            raise ValueError("Failed to convert SVG to PNG bytes")
        
        # Open with PIL for any additional processing
        image = Image.open(io.BytesIO(png_bytes))
        
        # Ensure RGBA mode for transparency support
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Save as PNG
        image.save(png_path, 'PNG', optimize=True)
        
        print(f"✅ Successfully converted {svg_path} to {png_path}")
        print(f"📏 Output size: {size}x{size} pixels")
        
        # Get file size
        file_size = os.path.getsize(png_path)
        print(f"📦 File size: {file_size / 1024:.1f} KB")
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting {svg_path}: {str(e)}")
        return False

def main():
    """Main function to convert the extension icon"""
    
    # Get project root directory
    project_root = Path(__file__).parent.parent
    svg_path = project_root / "images" / "icon.svg"
    png_path = project_root / "images" / "icon.png"
    
    # Check if SVG file exists
    if not svg_path.exists():
        print(f"❌ SVG file not found: {svg_path}")
        sys.exit(1)
    
    print("🎨 VS Code Extension Icon Converter")
    print("=" * 40)
    print(f"📂 Input:  {svg_path}")
    print(f"📂 Output: {png_path}")
    print()
    
    # Convert with VS Code recommended size (512x512)
    success = svg_to_png(str(svg_path), str(png_path), 512)
    
    if success:
        print()
        print("🎉 Conversion completed successfully!")
        print("💡 You can now use the PNG icon in your VS Code extension.")
        print(f"💡 The icon is ready for package.json: \"icon\": \"images/icon.png\"")
    else:
        print("💥 Conversion failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
