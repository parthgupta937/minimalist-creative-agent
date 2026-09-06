#!/usr/bin/env python3
"""
Rembg HTTP server for background removal.
Run this script to start the background removal server on http://localhost:5000
"""

import os
import sys
import traceback

try:
    from flask import Flask, request, send_file
    from rembg import remove
    from PIL import Image
    import io
    import requests
except ImportError as e:
    print(f"ERROR: Missing required package: {e}")
    print("\nInstall missing dependencies with:")
    print("  pip install rembg[cpu] flask requests pillow")
    sys.exit(1)

app = Flask(__name__)

# Loaded at import time (not inside `if __name__ == "__main__"`) so it also runs
# under a WSGI server like gunicorn, which imports this module and uses `app`
# directly without ever executing the __main__ block.
print("Loading Rembg model (this may take a moment on first run)...")
_ = remove(Image.new('RGB', (100, 100)))
print("Model loaded successfully!")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return {'status': 'ok'}, 200

@app.route('/remove-bg', methods=['POST'])
def remove_background():
    """
    Remove background from an image.

    Expects:
    - 'image_url': URL of the image to process (as form data or JSON)
    - OR: 'file': uploaded file

    Returns:
    - PNG image with transparent background
    """
    try:
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return {'error': 'No selected file'}, 400
            image_data = file.read()
            input_image = Image.open(io.BytesIO(image_data))
        # Handle URL-based input
        elif 'image_url' in request.form or 'image_url' in request.json or request.json:
            image_url = request.form.get('image_url') or (request.json.get('image_url') if request.json else None)
            if not image_url:
                return {'error': 'Missing image_url parameter'}, 400

            try:
                response = requests.get(image_url, timeout=10)
                if response.status_code != 200:
                    return {'error': f'Failed to fetch image: HTTP {response.status_code}'}, 400
                input_image = Image.open(io.BytesIO(response.content))
            except requests.RequestException as e:
                return {'error': f'Failed to fetch image from URL: {str(e)}'}, 400
        else:
            return {'error': 'No image provided (use "file" or "image_url")'}, 400

        # Remove background
        print(f"Processing image removal...")
        output_image = remove(input_image)
        print(f"Background removal complete")

        # Save to bytes
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format='PNG')
        output_buffer.seek(0)

        return send_file(
            output_buffer,
            mimetype='image/png',
            as_attachment=True,
            download_name='image-no-bg.png'
        )

    except Exception as e:
        error_msg = f'Processing failed: {str(e)}'
        print(f"ERROR: {error_msg}")
        traceback.print_exc()
        return {'error': error_msg}, 500

if __name__ == '__main__':
    try:
        # PORT is set by hosting platforms (e.g. Render); local dev has no PORT env
        # var and falls back to 5000. Bind 0.0.0.0 in that case since a hosting
        # platform's load balancer connects from outside the container; locally we
        # still bind 127.0.0.1 explicitly (not 'localhost') to avoid colliding with
        # macOS's AirPlay Receiver, which also listens on port 5000.
        port = int(os.environ.get('PORT', 5000))
        host = '0.0.0.0' if 'PORT' in os.environ else '127.0.0.1'
        print(f"Starting Rembg server on http://{host}:{port}")
        print("POST to /remove-bg with 'image_url' or 'file' parameter")
        print("GET /health to check server status")
        app.run(host=host, port=port, debug=False)
    except Exception as e:
        print(f"\nERROR during startup: {e}")
        traceback.print_exc()
        print("\nTroubleshooting:")
        print("1. Make sure you have installed: pip install rembg[cpu] flask requests pillow")
        print("2. Check your internet connection (models download on first run)")
        print("3. Try deleting ~/.rembg/models and running again")
        sys.exit(1)
